<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav"/>
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav"/>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <search id="header-search" class="right-menu-item"/>
        <size-select id="size-select" class="right-menu-item hover-effect"/>
        <screenfull id="screenfull" class="right-menu-item hover-effect"/>
        <ruo-yi-git id="ruo-yi-git" class="right-menu-item hover-effect"/>
        <language-select id="language-select" class="right-menu-item hover-effect"/>
        <el-tooltip :content="'留言评分 ' + (avgScore ? avgScore.toFixed(1) + '分' : '暂无')" placement="top">
          <div class="right-menu-item hover-effect feedback-star" @click="showFeedback">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient :id="'starGrad'" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#909399"/>
                  <stop :offset="starFillPercent + '%'" stop-color="#909399"/>
                  <stop :offset="starFillPercent + '%'" stop-color="transparent"/>
                  <stop offset="100%" stop-color="transparent"/>
                </linearGradient>
              </defs>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                :fill="avgScore > 0 ? 'url(#starGrad)' : 'none'" stroke="#909399" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
          </div>
        </el-tooltip>
        <notification id="notification" @click.native="showNotification()" class="right-menu-item hover-effect"/>
        <system-seting id="system-seting" class="right-menu-item hover-effect"/>
      </template>
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar" :alt="name" :title="name"><i class="el-icon-caret-boRttom"/>
        </div>
        <el-dropdown-menu slot="dropdown">
          <template v-if="topNav">
            <router-link to="/user/profile">
              <el-dropdown-item>{{ name }}</el-dropdown-item>
            </router-link>
          </template>
          <template v-else>
            <router-link to="/user/profile">
              <el-dropdown-item>{{ name }}</el-dropdown-item>
            </router-link>
          </template>
          <el-dropdown-item divided  @click.native="setting = true">
            <span>{{$t('commons.theme.preference')}}</span>
          </el-dropdown-item>
          <el-dropdown-item @click.native="logout">
            <span>{{$t('commons.button.logout')}}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 系统消息弹窗 -->
    <el-dialog title="系统消息" :visible.sync="notifyOpen" width="1060px" append-to-body
               :before-close="handleNotifyClose" class="notice-dialog">
      <el-tabs v-model="noticeTab" class="notice-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="通知消息" name="inbox">
          <div class="notice-layout">
            <!-- 左侧消息列表 -->
            <div class="notice-list-panel">
              <div v-for="row in msgList" :key="row.noticeId"
                   class="notice-list-item" :class="{ active: activeNotice && activeNotice.noticeId === row.noticeId }"
                   @click="selectNotice(row)">
                <span v-if="row.readStatus === 0" class="unread-dot"/>
                <div class="notice-item-title">{{ row.noticeTitle }}</div>
                <div class="notice-item-meta">
                  <span>{{ row.createBy }}</span>
                  <span style="margin-left:8px;">{{ formatDate(row.publishTime) }}</span>
                </div>
                <div class="notice-item-tags">
                  <el-tag size="mini" type="info" style="margin-right:4px;">
                    <template v-for="item in notice_type">
                      <span v-if="row.noticeType === item.value" :key="item.value">{{ $t(item.label) }}</span>
                    </template>
                  </el-tag>
                  <el-tag size="mini" :type="row.noticeLevel === 'HIGH' ? 'danger' : row.noticeLevel === 'MEDIUM' ? 'warning' : 'info'">
                    <template v-for="item in notice_level">
                      <span v-if="row.noticeLevel === item.value" :key="item.value">{{ $t(item.label) }}</span>
                    </template>
                  </el-tag>
                </div>
              </div>
              <div v-if="msgList.length === 0" class="notice-empty">暂无消息</div>
              <pagination v-show="total > 0" :total="total" :page.sync="queryParams.page"
                          :limit.sync="queryParams.pageSize" @pagination="getList"
                          style="padding:4px 0;"/>
            </div>

            <!-- 右侧详情 -->
            <div class="notice-detail-panel" v-if="activeNotice">
              <div class="detail-header">
                <h3 class="detail-title">{{ activeNotice.noticeTitle }}</h3>
                <div class="detail-meta">
                  <span>{{ activeNotice.createBy }}</span>
                  <span style="margin:0 12px;">{{ formatDate(activeNotice.publishTime) }}</span>
                  <!-- 好评差评 -->
                  <el-tooltip content="好评" placement="top">
                    <span class="like-btn" :class="{ active: activeNotice.likeStatus === 1 }"
                          @click="handleMsgLike(activeNotice, 1)">
                      <i class="el-icon-thumb"/> 好评
                    </span>
                  </el-tooltip>
                  <el-tooltip content="差评" placement="top">
                    <span class="like-btn dislike" :class="{ active: activeNotice.likeStatus === 2 }"
                          @click="handleMsgLike(activeNotice, 2)" style="margin-left:8px;">
                      <i class="el-icon-thumb" style="transform:rotate(180deg);display:inline-block;"/> 差评
                    </span>
                  </el-tooltip>
                </div>
              </div>

              <div class="detail-content" v-html="activeNoticeDetail.content || '加载中...'"/>

              <!-- 评论区 -->
              <div class="detail-comments">
                <div class="comment-section-title">
                  <i class="el-icon-chat-dot-round"/> 评论 {{ activeNotice.commentCount || 0 }}
                </div>

                <div v-for="c in commentList" :key="c.id" class="comment-item">
                  <div class="c-header">
                    <span class="c-user">{{ c.userName }}</span>
                    <template v-if="c.replyToName">
                      <span class="c-arrow"> 回复 </span>
                      <span class="c-reply-to">{{ c.replyToName }}</span>
                    </template>
                    <span class="c-time">{{ formatDate(c.createTime) }}</span>
                    <div class="c-actions">
                      <span class="c-action-btn" :class="{ liked: c.liked }" @click="handleCommentLike(c)">
                        <i class="el-icon-thumb"/> {{ c.likeCount || 0 }}
                      </span>
                      <span class="c-action-link" @click="setReplyTarget(c)">回复</span>
                      <el-button v-if="c.isMine || isAdmin" type="text" size="mini"
                                 style="color:#F56C6C;padding:0;" @click="handleDeleteComment(c)">删除</el-button>
                    </div>
                  </div>
                  <div class="c-content">{{ c.content }}</div>
                </div>

                <!-- 评论输入 -->
                <div class="comment-input-wrap">
                  <div v-if="replyTarget" class="reply-hint">
                    回复 <b>{{ replyTarget.userName }}</b>
                    <i class="el-icon-close" style="cursor:pointer;margin-left:6px;" @click="replyTarget=null"/>
                  </div>
                  <div class="comment-input-row">
                    <el-input v-model="commentInput" size="small"
                              :placeholder="replyTarget ? '写回复...' : '写评论...'"
                              style="flex:1;" @keyup.enter.native="handleAddComment"/>
                    <el-button size="small" type="primary" style="margin-left:8px;" @click="handleAddComment">
                      {{ replyTarget ? '回复' : '评论' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="notice-detail-panel notice-detail-empty">
              <i class="el-icon-chat-line-round" style="font-size:48px;color:#dcdfe6;"/>
              <p style="color:#c0c4cc;margin-top:12px;">点击左侧消息查看详情</p>
            </div>
          </div>
        </el-tab-pane>

        <!-- 发布消息 Tab -->
        <el-tab-pane label="发布消息" name="publish">
          <div class="publish-panel">
            <!-- 筛选栏 -->
            <el-form ref="pubQueryForm" :model="pubQueryParams" size="small" :inline="true" style="margin-bottom:8px;">
              <el-form-item label="标题" prop="noticeTitle">
                <el-input v-model="pubQueryParams.noticeTitle" placeholder="请输入标题" clearable style="width:140px;"/>
              </el-form-item>
              <el-form-item label="类型" prop="noticeType">
                <el-select v-model="pubQueryParams.noticeType" placeholder="类型" clearable style="width:100px;">
                  <el-option v-for="item in notice_type" :key="item.value" :value="item.value" :label="$t(item.label)"/>
                </el-select>
              </el-form-item>
              <el-form-item label="状态" prop="noticeStatus">
                <el-select v-model="pubQueryParams.noticeStatus" placeholder="状态" clearable style="width:100px;">
                  <el-option v-for="item in notice_status" :key="item.value" :value="item.value" :label="$t(item.label)"/>
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="pubHandleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="pubResetQuery">重置</el-button>
                <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="pubHandleAdd" style="margin-left:10px;">新建消息</el-button>
              </el-form-item>
            </el-form>

            <!-- 列表 -->
            <el-table :data="pubList" size="small" v-loading="pubLoading" style="width:100%;"
                      @selection-change="pubHandleSelectionChange">
              <el-table-column type="selection" width="40" align="center"/>
              <el-table-column label="#" type="index" width="45" align="center">
                <template slot-scope="scope">
                  <span>{{(pubQueryParams.page - 1) * pubQueryParams.pageSize + scope.$index + 1}}</span>
                </template>
              </el-table-column>
              <el-table-column label="标题" prop="noticeTitle" min-width="180" show-overflow-tooltip/>
              <el-table-column label="类型" align="center" width="80">
                <template slot-scope="{row}">
                  <template v-for="item in notice_type">
                    <span v-if="row.noticeType === item.value" :key="item.value">{{ $t(item.label) }}</span>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="级别" align="center" width="70">
                <template slot-scope="{row}">
                  <template v-for="item in notice_level">
                    <span v-if="row.noticeLevel === item.value" :key="item.value">{{ $t(item.label) }}</span>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="状态" align="center" width="70">
                <template slot-scope="{row}">
                  <template v-for="item in notice_status">
                    <span v-if="row.noticeStatus === item.value" :key="item.value">{{ $t(item.label) }}</span>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="创建人" align="center" width="80">
                <template slot-scope="scope">
                  <span v-if="scope.row.isSystem === 1">系统</span>
                  <span v-else>{{ scope.row.createUserName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="发布时间" align="center" width="130" prop="publishTime"/>
              <el-table-column label="已读" align="center" width="70">
                <template slot-scope="scope">
                  <span v-if="scope.row.statTotal > 0">{{ scope.row.statRead }}/{{ scope.row.statTotal }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="200">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" icon="el-icon-document" @click="pubHandleInfo(scope.row)">详情</el-button>
                  <el-button size="mini" type="text" icon="el-icon-edit" @click="pubHandleUpdate(scope.row)"
                             :disabled="scope.row.noticeStatus !== 0">编辑</el-button>
                  <el-button size="mini" type="text" icon="el-icon-s-promotion" @click="pubHandlePublish(scope.row)"
                             :disabled="scope.row.noticeStatus !== 0">发布</el-button>
                  <el-button size="mini" type="text" icon="el-icon-delete"
                             :style="scope.row.noticeStatus === 1 ? 'color:#E6A23C' : 'color:#F56C6C'"
                             @click="pubHandleDelete(scope.row)">
                    {{ scope.row.noticeStatus === 1 ? '撤回' : '删除' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <pagination v-show="pubTotal > 0" :total="pubTotal" :page.sync="pubQueryParams.page"
                        :limit.sync="pubQueryParams.pageSize" @pagination="pubGetList" style="padding:4px 0;"/>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 新建/编辑消息弹窗（独立，避免被 notice-dialog 遮盖） -->
    <el-dialog v-drag :title="pubFormTitle" :visible.sync="pubFormOpen" width="900px" append-to-body>
      <el-form ref="pubForm" :model="pubForm" :rules="pubRules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="公告标题" prop="noticeTitle">
              <el-input v-model="pubForm.noticeTitle" placeholder="请输入公告标题" style="width:300px;"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公告类型" prop="noticeType">
              <el-select v-model="pubForm.noticeType" placeholder="请选择公告类型" style="width:230px;">
                <el-option v-for="item in notice_type" :key="item.value" :value="item.value" :label="$t(item.label)"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公告级别">
              <el-select v-model="pubForm.noticeLevel" placeholder="请选择公告级别" style="width:230px;">
                <el-option v-for="item in notice_level" :key="item.value" :value="item.value" :label="$t(item.label)"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="全员发送">
              <el-radio-group v-model="pubForm.goalsAll">
                <el-radio v-for="item in yes_no" :key="item.value" :label="item.value">{{$t(item.label)}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择部门">
              <el-tree-select v-model="pubForm.goalsDept" :selectParams="pubDeptSelectParams" :treeParams="pubDeptTreeParams"
                              :treeRenderFun="pubTreeRender" @searchFun="pubDeptTreeSearch"
                              :styles="pubTreeStyles" ref="pubDeptTreeSelect"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择角色">
              <el-select v-model="pubForm.goalsRole" multiple placeholder="请选择角色" style="width:85%;">
                <el-option v-for="item in pubRoleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择用户">
              <el-tree-select v-model="pubForm.goalsUser" :selectParams="pubUserSelectParams" :treeParams="pubUserTreeParams"
                              :treeRenderFun="pubTreeRender" @searchFun="pubUserTreeSearch"
                              :styles="pubTreeStyles" ref="pubUserTreeSelect"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容">
              <editor v-model="pubForm.content" :min-height="200"
                      @notice="pubRecordAttach" ownerModule="module_notice" attachType="image"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="pubSubmitForm">确定</el-button>
        <el-button @click="pubFormOpen = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 消息详情弹窗 -->
    <el-dialog :title="pubInfoNotice.noticeTitle" :visible.sync="pubInfoOpen" width="900px" top="5vh" append-to-body>
      <div style="color:#9b9595;font-size:small;margin-bottom:10px;">
        <template v-for="item in notice_type">
          <span v-if="pubInfoNotice.noticeType === item.value" :key="item.value">{{ $t(item.label) }}</span>
        </template>
        /
        <template v-for="item in notice_level">
          <span v-if="pubInfoNotice.noticeLevel === item.value" :key="item.value">{{ $t(item.label) }}</span>
        </template>
        <span style="padding-left:40px;">创建人：{{ pubInfoNotice.createUserName }}</span>
        <span style="padding-left:40px;">发布时间：{{ pubInfoNotice.publishTime }}</span>
        <span v-if="pubInfoNotice.noticeStatus > 0" style="padding-left:40px;">
          已读统计：{{ pubInfoNotice.statRead }}/{{ pubInfoNotice.statTotal }}
        </span>
      </div>
      <editor v-if="pubInfoOpen" v-model="pubInfoNotice.content" :min-height="80" :readOnly="true"/>
      <el-table v-if="pubInfoNotice.noticeStatus > 0" :data="pubInfoReads" :show-header="false" style="margin-top:15px;" size="small">
        <el-table-column prop="userName" align="left" width="160"/>
        <el-table-column prop="readStatus" align="left" width="60">
          <template slot-scope="{row}">
            <span v-if="row.readStatus < 10">未读</span>
            <span v-else>已读</span>
          </template>
        </el-table-column>
        <el-table-column prop="readTime" align="left" width="160"/>
        <el-table-column prop="readBack" align="left"/>
      </el-table>
      <pagination v-show="pubInfoTotal > 0" :total="pubInfoTotal" :page.sync="pubInfoQuery.page"
                  :limit.sync="pubInfoQuery.pageSize" @pagination="pubInfoGetReads"/>
    </el-dialog>

    <feedback-dialog :visible.sync="feedbackVisible"/>
  </div>
</template>

<script>
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import SystemSeting from '@/components/SystemSeting'
import LanguageSelect from '@/components/LanguageSelect'
import Notification from '@/components/notification'
import Messages from '@/components/messages'
import Search from '@/components/HeaderSearch'
import RuoYiGit from '@/components/RuoYi/Git'
import RuoYiDoc from '@/components/RuoYi/Doc'
import { getNoticeMsg, readNoticeMsg, getNoticeInfo, msgLike, getCommentList, addComment, deleteComment, toggleCommentLike,
         getNoticeList, addNotice, updateNotice, delNotice, publishNotice, getReads } from '@/api/system/notice'
import { getDeptDiagramById, getDeptUserDiagram } from '@/api/system/dept'
import { getRoleList } from '@/api/system/role'
import { notice_level, notice_type, notice_status, yes_no } from '@/utils/constants';
import { getFeedbackStat } from '@/api/system/feedback'
import FeedbackDialog from './feedback.vue'
import { mapGetters } from 'vuex'
export default {
  components: {
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    SizeSelect,
    SystemSeting,
    LanguageSelect,
    Notification,
    Messages,
    Search,
    RuoYiGit,
    RuoYiDoc,
    FeedbackDialog
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device',
      'name',
      'roles'
    ]),
    isAdmin() {
      return this.roles && (this.roles.includes('sysAdmin') || this.roles.includes('admin'))
    },
    setting: {
      get() {
        return this.$store.state.settings.showSettings
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          value: val
        })
      }
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      }
    },
    starFillPercent() {
      return Math.round((this.avgScore / 5) * 100)
    }
  },
  dicts: [],
  data() {
    return {
      notice_level: notice_level,
      notice_type: notice_type,
      notice_status: notice_status,
      yes_no: yes_no,
      notifyOpen: false,
      noticeTab: 'inbox',
      feedbackVisible: false,
      avgScore: 0,
      // 通知消息
      msgList: [],
      total: 0,
      queryParams: { page: 1, pageSize: 10 },
      activeNotice: null,
      activeNoticeDetail: {},
      commentList: [],
      commentInput: '',
      replyTarget: null,
      // 发布消息
      pubLoading: false,
      pubList: [],
      pubTotal: 0,
      pubQueryParams: { page: 1, pageSize: 10, noticeTitle: undefined, noticeType: undefined, noticeStatus: undefined },
      pubIds: [],
      pubFormOpen: false,
      pubFormTitle: '',
      pubForm: {},
      pubRules: {
        noticeTitle: [{ required: true, message: '公告标题不能为空', trigger: 'blur' }],
        noticeType: [{ required: true, message: '公告类型不能为空', trigger: 'change' }]
      },
      pubRoleOptions: [],
      pubDeptSelectParams: { multiple: true, clearable: true, placeholder: '请选择部门' },
      pubDeptTreeParams: {
        clickParent: false, filterable: true, 'check-strictly': true,
        'default-expand-all': false, 'expand-on-click-node': false, data: [],
        props: { children: 'children', label: 'label', disabled: 'isDept', value: 'id' }
      },
      pubUserSelectParams: { multiple: true, clearable: true, placeholder: '请选择用户' },
      pubUserTreeParams: {
        clickParent: false, filterable: true, 'check-strictly': true,
        'default-expand-all': false, 'expand-on-click-node': false, data: [],
        props: { children: 'children', label: 'label', disabled: 'isDept', value: 'id' }
      },
      pubTreeStyles: { width: '85%' },
      // 详情弹窗
      pubInfoOpen: false,
      pubInfoNotice: {},
      pubInfoReads: [],
      pubInfoTotal: 0,
      pubInfoQuery: { page: 1, pageSize: 10, noticeId: undefined },
    }
  },
  mounted() {
    getFeedbackStat().then(res => {
      this.avgScore = res.data && res.data.avgScore ? res.data.avgScore : 0
    }).catch(() => {})
  },
  methods: {
    showNotification() {
      this.notifyOpen = true;
      this.noticeTab = 'inbox';
      this.getList();
    },
    handleNotifyClose() {
      this.notifyOpen = false;
      this.activeNotice = null;
      this.activeNoticeDetail = {};
      this.commentList = [];
      this.commentInput = '';
      this.replyTarget = null;
    },
    handleTabClick(tab) {
      if (tab.name === 'publish' && this.pubList.length === 0) {
        this.pubGetList();
        this.pubGetRoleOptions();
      }
    },
    getList() {
      getNoticeMsg(this.queryParams).then(response => {
        this.msgList = response.data.list;
        this.total = response.data.total;
      });
    },
    formatDate(val) {
      if (!val) return '';
      const d = new Date(val);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    selectNotice(row) {
      if (row.readStatus === 0) {
        readNoticeMsg(row.noticeId).then(() => {
          row.readStatus = 10;
          this.$store.dispatch('refreshNoticeCount');
        });
      }
      this.activeNotice = row;
      this.activeNoticeDetail = {};
      this.commentInput = '';
      this.replyTarget = null;
      // 加载详情
      getNoticeInfo(row.noticeId).then(res => {
        this.activeNoticeDetail = res.data || {};
      });
      // 加载评论
      this.loadComments(row.noticeId);
    },
    loadComments(noticeId) {
      getCommentList(noticeId).then(res => {
        this.commentList = res.data || [];
      });
    },
    handleMsgLike(row, likeStatus) {
      // 再次点击已选项 => 取消
      const newStatus = row.likeStatus === likeStatus ? 0 : likeStatus;
      msgLike(row.noticeId, newStatus).then(() => {
        this.$set(row, 'likeStatus', newStatus);
      });
    },
    handleCommentLike(c) {
      toggleCommentLike(c.id).then(res => {
        const liked = res.data;
        this.$set(c, 'liked', liked);
        this.$set(c, 'likeCount', liked ? (c.likeCount || 0) + 1 : Math.max((c.likeCount || 1) - 1, 0));
      });
    },
    setReplyTarget(c) {
      this.replyTarget = c;
    },
    handleAddComment() {
      const content = (this.commentInput || '').trim();
      if (!content) { this.$message.warning('请输入内容'); return; }
      const payload = {
        noticeId: this.activeNotice.noticeId,
        content,
        parentId: this.replyTarget ? this.replyTarget.id : null,
        replyToCode: this.replyTarget ? this.replyTarget.userCode : null,
        replyToName: this.replyTarget ? this.replyTarget.userName : null,
      };
      addComment(payload).then(() => {
        this.commentInput = '';
        this.replyTarget = null;
        this.$set(this.activeNotice, 'commentCount', (this.activeNotice.commentCount || 0) + 1);
        this.loadComments(this.activeNotice.noticeId);
      });
    },
    handleDeleteComment(c) {
      this.$confirm('确定删除该评论？', '提示', { type: 'warning' }).then(() => {
        deleteComment(c.id).then(() => {
          this.$message.success('删除成功');
          this.$set(this.activeNotice, 'commentCount', Math.max((this.activeNotice.commentCount || 1) - 1, 0));
          this.loadComments(this.activeNotice.noticeId);
        });
      }).catch(() => {});
    },
    // ===== 发布消息相关 =====
    pubGetList() {
      this.pubLoading = true;
      getNoticeList(this.pubQueryParams).then(res => {
        this.pubList = res.data.list;
        this.pubTotal = res.data.total;
        this.pubLoading = false;
      }).catch(() => { this.pubLoading = false; });
    },
    pubHandleQuery() {
      this.pubQueryParams.page = 1;
      this.pubGetList();
    },
    pubResetQuery() {
      this.pubQueryParams = { page: 1, pageSize: 10, noticeTitle: undefined, noticeType: undefined, noticeStatus: undefined };
      this.pubGetList();
    },
    pubHandleSelectionChange(selection) {
      this.pubIds = selection.map(item => item.noticeId);
    },
    pubGetRoleOptions() {
      getRoleList().then(resp => {
        this.pubRoleOptions = resp.data.list;
      });
    },
    pubResetForm() {
      this.pubForm = {
        noticeId: undefined, noticeTitle: undefined, noticeType: undefined,
        noticeLevel: undefined, content: undefined,
        goalsAll: 0, goalsDept: [], goalsRole: [], goalsUser: [], attaches: []
      };
      this.$nextTick(() => { this.$refs.pubForm && this.$refs.pubForm.clearValidate(); });
    },
    pubHandleAdd() {
      this.pubResetForm();
      getDeptDiagramById(1).then(res => {
        this.pubDeptTreeParams.data = res.data;
        getDeptUserDiagram().then(resp => {
          this.pubUserTreeParams.data = resp.data;
          this.pubFormTitle = '新建消息';
          this.pubFormOpen = true;
        });
      });
    },
    pubHandleUpdate(row) {
      this.pubResetForm();
      getDeptDiagramById(1).then(res => {
        this.pubDeptTreeParams.data = res.data;
        getDeptUserDiagram().then(resp => {
          this.pubUserTreeParams.data = resp.data;
          getNoticeInfo(row.noticeId).then(rsp => {
            this.pubForm = rsp.data;
            if (!rsp.data.goalsDept) this.pubForm.goalsDept = [];
            if (!rsp.data.goalsUser) this.pubForm.goalsUser = [];
            this.pubFormTitle = '编辑消息';
            this.pubFormOpen = true;
          });
        });
      });
    },
    pubSubmitForm() {
      this.$refs.pubForm.validate(valid => {
        if (!valid) return;
        const action = this.pubForm.noticeId ? updateNotice(this.pubForm) : addNotice(this.pubForm);
        action.then(() => {
          this.$message.success(this.pubForm.noticeId ? '修改成功' : '新增成功');
          this.pubFormOpen = false;
          this.pubGetList();
        });
      });
    },
    pubRecordAttach(attach) {
      this.pubForm.attaches.push({ attachId: attach.attachId, attachPath: attach.attachPath });
    },
    pubHandlePublish(row) {
      this.$confirm('确认发布公告[' + row.noticeTitle + ']?', '提示', { type: 'warning' }).then(() => {
        publishNotice(row.noticeId).then(() => {
          this.$message.success('发布成功');
          this.pubGetList();
        });
      }).catch(() => {});
    },
    pubHandleDelete(row) {
      const action = row.noticeStatus === 1 ? '撤回' : '删除';
      this.$confirm('确认' + action + '公告[' + row.noticeTitle + ']?', '提示', { type: 'warning' }).then(() => {
        delNotice(row.noticeId).then(() => {
          this.$message.success(action + '成功');
          this.pubGetList();
        });
      }).catch(() => {});
    },
    pubHandleInfo(row) {
      getNoticeInfo(row.noticeId).then(rsp => {
        this.pubInfoNotice = rsp.data;
        this.pubInfoReads = [];
        this.pubInfoTotal = 0;
        this.pubInfoQuery = { page: 1, pageSize: 10, noticeId: row.noticeId };
        this.pubInfoOpen = true;
        if (rsp.data.noticeStatus > 0) {
          this.pubInfoGetReads();
        }
      });
    },
    pubInfoGetReads() {
      getReads(this.pubInfoQuery).then(resp => {
        this.pubInfoReads = resp.data.list;
        this.pubInfoTotal = resp.data.total;
      });
    },
    pubTreeRender(h, { node }) {
      return (<span class='custom-tree-node'><span>{node.label}</span></span>);
    },
    pubDeptTreeSearch(value) {
      this.$refs.pubDeptTreeSelect.$refs.tree.filter(value);
    },
    pubUserTreeSearch(value) {
      this.$refs.pubUserTreeSelect.$refs.tree.filter(value);
    },
    // ===== 反馈 =====
    showFeedback() {
      this.feedbackVisible = true
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      this.$confirm(this.$t('commons.confirm.logout'),  {
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('LogOut').then(() => {
          location.href = '/index';
        })
      }).catch(() => {});
    },
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .feedback-star {
      display: inline-flex !important;
      align-items: center;
      padding: 0 8px;
      svg {
        display: block;
      }
    }

    .right-menu-item2 {
      display: inline-block;
      padding: 0 0px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;
        font-size: small;

        .user-avatar {
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}

/* 消息弹窗布局 */
::v-deep .notice-dialog .el-dialog__body {
  padding: 0;
}

::v-deep .notice-dialog .el-tabs__header {
  margin: 0;
  padding: 0 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

::v-deep .notice-dialog .el-tabs__content {
  padding: 0;
}

.notice-tabs {
  display: flex;
  flex-direction: column;
  height: 620px;
}

::v-deep .notice-tabs > .el-tabs__content {
  flex: 1;
  overflow: hidden;
}

::v-deep .notice-tabs > .el-tabs__content .el-tab-pane {
  height: 100%;
}

.notice-layout {
  display: flex;
  height: 580px;
}

/* 发布消息面板 */
.publish-panel {
  height: 580px;
  overflow-y: auto;
  padding: 12px 16px;
}

.notice-list-panel {
  width: 280px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.notice-list-item {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
  transition: background .2s;

  &:hover { background: #f5f7fa; }
  &.active { background: #ecf5ff; }

  .unread-dot {
    position: absolute;
    left: 6px;
    top: 16px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #409EFF;
  }

  .notice-item-title {
    font-size: 13px;
    color: #303133;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 12px;
  }

  .notice-item-meta {
    font-size: 11px;
    color: #909399;
    margin-top: 4px;
    padding-left: 12px;
  }

  .notice-item-tags {
    margin-top: 4px;
    padding-left: 12px;
  }
}

.notice-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 13px;
}

.notice-detail-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;

  &.notice-detail-empty {
    justify-content: center;
    align-items: center;
  }
}

.detail-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  margin-bottom: 12px;

  .detail-title {
    font-size: 15px;
    font-weight: bold;
    color: #303133;
    margin: 0 0 8px 0;
  }

  .detail-meta {
    font-size: 12px;
    color: #909399;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.like-btn {
  cursor: pointer;
  font-size: 12px;
  color: #909399;
  padding: 2px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  user-select: none;
  transition: all .2s;

  &:hover { color: #409EFF; border-color: #409EFF; }
  &.active { color: #fff; background: #409EFF; border-color: #409EFF; }
  &.dislike {
    &:hover { color: #F56C6C; border-color: #F56C6C; }
    &.active { background: #F56C6C; border-color: #F56C6C; color: #fff; }
  }
}

.detail-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
  min-height: 80px;
}

.detail-comments {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;

  .comment-section-title {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    margin-bottom: 10px;
  }
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
  &:last-of-type { border-bottom: none; }

  .c-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    .c-user { font-weight: bold; font-size: 12px; color: #409EFF; }
    .c-arrow { font-size: 12px; color: #909399; }
    .c-reply-to { font-size: 12px; color: #67C23A; font-weight: bold; }
    .c-time { font-size: 11px; color: #c0c4cc; margin-left: 6px; }
    .c-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
  }
  .c-content {
    margin-top: 3px;
    font-size: 12px;
    color: #606266;
    line-height: 1.5;
    word-break: break-all;
    padding-left: 2px;
  }
}

.c-action-btn {
  cursor: pointer; font-size: 12px; color: #909399; user-select: none;
  &:hover { color: #409EFF; }
  &.liked { color: #409EFF; }
}
.c-action-link {
  cursor: pointer; font-size: 12px; color: #409EFF; user-select: none;
  &:hover { text-decoration: underline; }
}

.comment-input-wrap {
  margin-top: 10px;
  .reply-hint {
    font-size: 12px; color: #909399; margin-bottom: 4px; display: block;
    b { color: #409EFF; }
  }
  .comment-input-row { display: flex; align-items: center; }
}

.el-table {
  cursor: pointer;
}

.red-point{
  position: relative;
}

.red-point::before{
  content: " ";
  border: 4px solid #1890ff;
  border-radius:3px;
  position: absolute;
  z-index: 1000;
  left: 0;
  top: 1px;
  margin-left: -10px;
}
</style>
