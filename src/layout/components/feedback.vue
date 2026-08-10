<template>
  <el-dialog title="评分留言" :visible.sync="innerVisible" width="740px" append-to-body
             @open="handleOpen" @close="handleClose">

    <!-- 顶部评分统计 -->
    <div class="stat-bar" v-if="stat">
      <div class="stat-avg">
        <span class="avg-score">{{ stat.avgScore || '0.0' }}</span>
        <el-rate :value="Number(stat.avgScore || 0)" disabled text-color="#ff9900" style="display:inline-block;margin-left:6px;"/>
        <span class="avg-total">共 {{ stat.total || 0 }} 条评价</span>
      </div>
      <div class="stat-bars">
        <div v-for="s in [5,4,3,2,1]" :key="s" class="stat-bar-row">
          <span class="star-label">{{ s }}星</span>
          <el-progress
            :percentage="stat.total > 0 ? Math.round((stat.scoreCount[s] || 0) / stat.total * 100) : 0"
            :show-text="false" style="width:120px;display:inline-block;margin:0 8px;"/>
          <span class="star-count">{{ stat.scoreCount ? (stat.scoreCount[s] || 0) : 0 }}</span>
        </div>
      </div>
    </div>

    <el-divider/>

    <!-- 新增留言 -->
    <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="60px" size="small">
      <el-form-item label="评分" prop="score">
        <el-rate v-model="addForm.score" :colors="rateColors"/>
      </el-form-item>
      <el-form-item label="留言" prop="content">
        <el-input v-model="addForm.content" type="textarea" :rows="3" maxlength="500"
                  show-word-limit placeholder="请写下您的使用体验或建议..."/>
      </el-form-item>
      <!-- 图片上传 -->
      <el-form-item label="图片">
        <div class="upload-area">
          <div v-for="(img, idx) in addForm.images" :key="img" class="upload-thumb">
            <img :src="img" @click="previewImage(img)"/>
            <span class="thumb-del" @click="removeImage(idx)"><i class="el-icon-close"/></span>
          </div>
          <div v-if="addForm.images.length < 9" class="upload-btn" @click="$refs.imgInput.click()">
            <i class="el-icon-plus"/>
            <span>{{ addForm.images.length }}/9</span>
          </div>
        </div>
        <input ref="imgInput" type="file" accept="image/*" multiple style="display:none" @change="handleImageSelect"/>
        <div class="upload-tip">支持 jpg/png/gif，单张不超过 5MB，最多 9 张</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" :loading="submitting" @click="handleSubmit">提交留言</el-button>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">全部留言</el-divider>

    <!-- 筛选 -->
    <div style="margin-bottom:10px;">
      <span style="margin-right:8px;font-size:13px;color:#606266;">按评分筛选：</span>
      <el-radio-group v-model="filterScore" size="mini" @change="handleFilterChange">
        <el-radio-button :label="null">全部</el-radio-button>
        <el-radio-button v-for="s in [5,4,3,2,1]" :key="s" :label="s">{{ s }}星</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 留言列表 -->
    <div v-loading="loading" class="feedback-list">
      <div v-if="list.length === 0 && !loading" class="empty-tip">暂无留言</div>

      <div v-for="item in list" :key="item.id" class="feedback-item">
        <!-- 留言头部 -->
        <div class="item-header">
          <span class="fb-user">{{ item.userName }}</span>
          <el-rate :value="item.score" disabled size="mini" style="display:inline-block;margin-left:8px;"/>
          <span class="fb-time">{{ item.createTime }}</span>
          <div class="fb-actions">
            <span class="action-btn" :class="{ liked: item.liked }" @click="handleFeedbackLike(item)">
              <i class="el-icon-thumb"/> {{ item.likeCount }}
            </span>
            <span v-if="item.likeCount > 0" class="action-link" @click="toggleLikers(item, 1)">
              {{ item._likersOpen ? '收起' : '查看' }}
            </span>
            <span class="action-btn" @click="toggleComments(item)">
              <i class="el-icon-chat-dot-round"/> {{ item.replyCount }}
            </span>
            <el-button v-if="canDelete(item)" type="text" size="mini" class="del-btn"
                       @click="handleDeleteFeedback(item)">删除</el-button>
          </div>
        </div>

        <!-- 留言内容 -->
        <div class="fb-content">{{ item.content }}</div>

        <!-- 留言图片 -->
        <div v-if="item._imageList && item._imageList.length > 0" class="fb-images">
          <img v-for="(img, idx) in item._imageList" :key="idx" :src="img"
               class="fb-img-thumb" @click="previewImage(img)"/>
        </div>

        <!-- 留言点赞人列表 -->
        <div v-if="item._likersOpen" class="likers-bar">
          <span v-for="u in item._likers" :key="u.userCode" class="liker-tag">
            <i class="el-icon-thumb" style="color:#409EFF;margin-right:2px;"/>{{ u.userName }}
          </span>
        </div>

        <!-- 评论区 -->
        <div v-if="item._commentOpen" class="comment-area">
          <div v-for="c in item._comments" :key="c.id" class="comment-item">
            <div class="c-header">
              <span class="c-user">{{ c.userName }}</span>
              <template v-if="c.replyToName">
                <span class="c-reply-arrow"> 回复 </span>
                <span class="c-reply-to">{{ c.replyToName }}</span>
              </template>
              <span class="c-time">{{ c.createTime }}</span>
              <div class="c-actions">
                <span class="action-btn" :class="{ liked: c.liked }" @click="handleCommentLike(item, c)">
                  <i class="el-icon-thumb"/> {{ c.likeCount || 0 }}
                </span>
                <span v-if="c.likeCount > 0" class="action-link" @click="toggleCommentLikers(c)">
                  {{ c._likersOpen ? '收起' : '查看' }}
                </span>
                <span class="action-link" @click="setReplyTarget(item, c)">回复</span>
                <el-button v-if="c.isMine || isAdmin" type="text" size="mini" class="del-btn"
                           @click="handleDeleteComment(item, c)">删除</el-button>
              </div>
            </div>
            <div class="c-content">{{ c.content }}</div>
            <div v-if="c._likersOpen" class="likers-bar">
              <span v-for="u in c._likers" :key="u.userCode" class="liker-tag">
                <i class="el-icon-thumb" style="color:#409EFF;margin-right:2px;"/>{{ u.userName }}
              </span>
            </div>
          </div>

          <!-- 回复/评论输入框 -->
          <div class="comment-input-wrap">
            <span v-if="item._replyTarget" class="reply-hint">
              回复 <b>{{ item._replyTarget.userName }}</b>：
              <i class="el-icon-close" style="cursor:pointer;margin-left:4px;" @click="clearReplyTarget(item)"/>
            </span>
            <div class="comment-input-row">
              <el-input v-model="item._commentInput" size="mini"
                        :placeholder="item._replyTarget ? '写回复...' : '写评论...'"
                        style="flex:1;" @keyup.enter.native="handleAddComment(item)"/>
              <el-button size="mini" type="primary" style="margin-left:8px;" @click="handleAddComment(item)">
                {{ item._replyTarget ? '回复' : '评论' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.page"
                :limit.sync="queryParams.pageSize" @pagination="getList"/>

    <!-- 图片大图预览 -->
    <el-dialog :visible.sync="previewVisible" append-to-body width="auto" class="preview-dialog"
               :show-close="true" @click.native.self="previewVisible=false">
      <img :src="previewUrl" style="max-width:80vw;max-height:80vh;display:block;margin:auto;border-radius:4px;"/>
    </el-dialog>
  </el-dialog>
</template>

<script>
import {
  getFeedbackStat, getFeedbackList, addFeedback, delFeedback,
  toggleFeedbackLike, toggleCommentLike, getLikers,
  addComment, getComments, delComment
} from '@/api/system/feedback'
import { uploadAttach } from '@/api/system/attach'
import { mapGetters } from 'vuex'
import cache from '@/plugins/cache'

export default {
  name: 'FeedbackDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  computed: {
    ...mapGetters(['roles']),
    innerVisible: {
      get() { return this.visible },
      set(val) { this.$emit('update:visible', val) }
    },
    isAdmin() {
      return this.roles && (this.roles.includes('sysAdmin') || this.roles.includes('admin'))
    },
    currentUserCode() {
      return cache.local.getUserCode()
    }
  },
  data() {
    return {
      loading: false,
      submitting: false,
      uploading: false,
      stat: null,
      list: [],
      total: 0,
      filterScore: null,
      queryParams: { page: 1, pageSize: 10, score: null },
      addForm: { score: 5, content: '', images: [] },
      addRules: {
        score: [{ required: true, message: '请选择评分', trigger: 'change' }],
        content: [
          { required: true, message: '请填写留言内容', trigger: 'blur' },
          { min: 2, max: 500, message: '留言内容2-500字', trigger: 'blur' }
        ]
      },
      rateColors: ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A', '#67C23A'],
      previewVisible: false,
      previewUrl: ''
    }
  },
  methods: {
    handleOpen() {
      this.queryParams.page = 1
      this.loadStat()
      this.getList()
    },
    handleClose() {
      this.$emit('update:visible', false)
      this.$refs.addForm && this.$refs.addForm.resetFields()
      this.addForm.images = []
      this.list = []
      this.stat = null
    },
    loadStat() {
      getFeedbackStat().then(res => {
        this.stat = res.data
      }).catch(() => {
        this.stat = { total: 0, avgScore: 0, scoreCount: [0, 0, 0, 0, 0, 0] }
      })
    },
    getList() {
      this.loading = true
      getFeedbackList(this.queryParams).then(res => {
        this.list = (res.data.list || []).map(item => ({
          ...item,
          _commentOpen: false,
          _commentInput: '',
          _comments: [],
          _replyTarget: null,
          _likersOpen: false,
          _likers: [],
          _imageList: item.images ? item.images.split(',').filter(Boolean) : []
        }))
        this.total = res.data.total
      }).catch(() => {
        this.list = []
        this.total = 0
      }).finally(() => { this.loading = false })
    },
    handleFilterChange(val) {
      this.queryParams.score = val
      this.queryParams.page = 1
      this.getList()
    },

    // -------- 图片上传 --------
    handleImageSelect(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      const remain = 9 - this.addForm.images.length
      if (files.length > remain) {
        this.$message.warning(`最多还能上传 ${remain} 张图片`)
      }
      const toUpload = files.slice(0, remain)
      const oversized = toUpload.filter(f => f.size > 5 * 1024 * 1024)
      if (oversized.length > 0) {
        this.$message.warning(`${oversized.length} 张图片超过 5MB 已跳过`)
      }
      const valid = toUpload.filter(f => f.size <= 5 * 1024 * 1024)
      if (valid.length === 0) return
      this.uploading = true
      const tasks = valid.map(file => {
        const fd = new FormData()
        fd.append('file', file)
        return uploadAttach(fd).then(res => res.data && (res.data.url || res.data.attachUrl || res.data))
      })
      Promise.all(tasks).then(urls => {
        urls.filter(Boolean).forEach(url => {
          if (this.addForm.images.length < 9) this.addForm.images.push(url)
        })
      }).catch(() => {
        this.$message.error('图片上传失败，请重试')
      }).finally(() => { this.uploading = false })
    },
    removeImage(idx) {
      this.addForm.images.splice(idx, 1)
    },
    previewImage(url) {
      this.previewUrl = url
      this.previewVisible = true
    },

    // -------- 提交留言 --------
    handleSubmit() {
      this.$refs.addForm.validate(valid => {
        if (!valid) return
        this.submitting = true
        addFeedback(this.addForm).then(() => {
          this.$message.success('留言成功')
          this.$refs.addForm.resetFields()
          this.addForm.score = 5
          this.addForm.images = []
          this.queryParams.page = 1
          this.getList()
          this.loadStat()
        }).finally(() => { this.submitting = false })
      })
    },
    canDelete(item) {
      return this.isAdmin || (this.currentUserCode === item.userCode)
    },

    // -------- 留言操作 --------
    handleDeleteFeedback(item) {
      this.$confirm('确定删除该留言？', '提示', { type: 'warning' }).then(() => {
        delFeedback(item.id).then(() => {
          this.$message.success('删除成功')
          this.getList()
          this.loadStat()
        })
      }).catch(() => {})
    },
    handleFeedbackLike(item) {
      toggleFeedbackLike(item.id).then(res => {
        const liked = res.data
        item.liked = liked
        item.likeCount = liked ? item.likeCount + 1 : Math.max(item.likeCount - 1, 0)
        if (item._likersOpen) this.loadLikers(item, 1)
      })
    },

    // -------- 点赞人列表 --------
    toggleLikers(item, targetType) {
      if (item._likersOpen) {
        item._likersOpen = false
      } else {
        this.loadLikers(item, targetType)
      }
    },
    loadLikers(item, targetType) {
      getLikers(targetType, item.id).then(res => {
        item._likers = res.data || []
        item._likersOpen = true
      })
    },
    toggleCommentLikers(c) {
      if (c._likersOpen) {
        this.$set(c, '_likersOpen', false)
      } else {
        getLikers(2, c.id).then(res => {
          this.$set(c, '_likers', res.data || [])
          this.$set(c, '_likersOpen', true)
        })
      }
    },

    // -------- 评论区 --------
    toggleComments(item) {
      if (item._commentOpen) {
        item._commentOpen = false
      } else {
        this.loadComments(item)
      }
    },
    loadComments(item) {
      getComments(item.id).then(res => {
        item._comments = (res.data || []).map(c => ({
          ...c,
          _likersOpen: false,
          _likers: []
        }))
        item._commentOpen = true
      })
    },
    setReplyTarget(item, c) {
      item._replyTarget = c
      item._commentOpen = true
    },
    clearReplyTarget(item) {
      item._replyTarget = null
      item._commentInput = ''
    },
    handleAddComment(item) {
      const content = (item._commentInput || '').trim()
      if (!content) { this.$message.warning('请输入内容'); return }
      const payload = {
        feedbackId: item.id,
        content,
        parentId: item._replyTarget ? item._replyTarget.id : null,
        replyToCode: item._replyTarget ? item._replyTarget.userCode : null,
        replyToName: item._replyTarget ? item._replyTarget.userName : null
      }
      addComment(payload).then(() => {
        item._commentInput = ''
        item._replyTarget = null
        item.replyCount = (item.replyCount || 0) + 1
        this.loadComments(item)
      })
    },
    handleCommentLike(item, c) {
      toggleCommentLike(c.id).then(res => {
        const liked = res.data
        this.$set(c, 'liked', liked)
        this.$set(c, 'likeCount', liked ? (c.likeCount || 0) + 1 : Math.max((c.likeCount || 1) - 1, 0))
        if (c._likersOpen) getLikers(2, c.id).then(r => { this.$set(c, '_likers', r.data || []) })
      })
    },
    handleDeleteComment(item, c) {
      this.$confirm('确定删除该评论？', '提示', { type: 'warning' }).then(() => {
        delComment(c.id).then(() => {
          this.$message.success('删除成功')
          item.replyCount = Math.max((item.replyCount || 1) - 1, 0)
          this.loadComments(item)
        })
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.stat-bar {
  display: flex;
  align-items: center;
  padding: 4px 0;

  .stat-avg {
    text-align: center;
    min-width: 120px;
    .avg-score { font-size: 36px; font-weight: bold; color: #ff9900; }
    .avg-total { display: block; font-size: 12px; color: #909399; margin-top: 4px; }
  }
  .stat-bars {
    flex: 1; margin-left: 24px;
    .stat-bar-row {
      display: flex; align-items: center; margin-bottom: 4px;
      .star-label { width: 28px; font-size: 12px; color: #606266; }
      .star-count { font-size: 12px; color: #909399; min-width: 24px; }
    }
  }
}

/* 上传区域 */
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .upload-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #dcdfe6;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumb-del {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 18px;
      height: 18px;
      background: rgba(0,0,0,.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      i { color: #fff; font-size: 10px; }
      &:hover { background: rgba(0,0,0,.7); }
    }
  }

  .upload-btn {
    width: 72px;
    height: 72px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #909399;
    font-size: 12px;
    gap: 4px;
    i { font-size: 22px; }
    &:hover { border-color: #409EFF; color: #409EFF; }
  }
}
.upload-tip { font-size: 11px; color: #c0c4cc; margin-top: 4px; }

/* 留言列表 */
.feedback-list { min-height: 60px; }
.empty-tip { text-align: center; color: #999; padding: 20px 0; }

.feedback-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 0;
  &:last-child { border-bottom: none; }

  .item-header {
    display: flex; align-items: center; flex-wrap: wrap;
    .fb-user { font-weight: bold; font-size: 13px; color: #303133; }
    .fb-time { font-size: 12px; color: #909399; margin-left: 12px; }
    .fb-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  }
  .fb-content {
    margin-top: 6px; font-size: 13px; color: #606266;
    line-height: 1.6; word-break: break-all;
  }
  .fb-images {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;

    .fb-img-thumb {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      cursor: pointer;
      transition: opacity .2s;
      &:hover { opacity: .85; }
    }
  }
}

.action-btn {
  cursor: pointer; font-size: 13px; color: #909399; user-select: none;
  &:hover { color: #409EFF; }
  &.liked { color: #409EFF; }
}
.action-link {
  cursor: pointer; font-size: 12px; color: #409EFF; user-select: none;
  &:hover { text-decoration: underline; }
}
.del-btn { color: #F56C6C !important; padding: 0 !important; }

.likers-bar {
  margin-top: 6px; padding: 4px 8px;
  background: #f5f7fa; border-radius: 4px;
  display: flex; flex-wrap: wrap; gap: 6px;
  .liker-tag {
    font-size: 12px; color: #606266;
    background: #fff; border: 1px solid #e4e7ed;
    border-radius: 10px; padding: 1px 8px;
  }
}

.comment-area {
  background: #f9f9f9; border-radius: 4px;
  padding: 8px 12px; margin-top: 8px;

  .comment-item {
    padding: 6px 0;
    border-bottom: 1px dashed #ebebeb;
    &:last-of-type { border-bottom: none; }

    .c-header {
      display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
      .c-user { font-weight: bold; font-size: 12px; color: #409EFF; }
      .c-reply-arrow { font-size: 12px; color: #909399; }
      .c-reply-to { font-size: 12px; color: #67C23A; font-weight: bold; }
      .c-time { font-size: 11px; color: #c0c4cc; margin-left: 6px; }
      .c-actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
    }
    .c-content {
      margin-top: 3px; font-size: 12px; color: #606266;
      line-height: 1.5; word-break: break-all; padding-left: 2px;
    }
  }

  .comment-input-wrap {
    margin-top: 8px;
    .reply-hint {
      display: inline-block; margin-bottom: 4px;
      font-size: 12px; color: #909399;
      b { color: #409EFF; }
    }
    .comment-input-row { display: flex; align-items: center; }
  }
}

/* 大图预览弹窗去掉内边距 */
::v-deep .preview-dialog .el-dialog__body {
  padding: 10px;
}
</style>
