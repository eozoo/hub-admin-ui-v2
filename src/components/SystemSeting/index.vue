<template>
  <el-tooltip content="系统管理" placement="bottom">
    <div
      class="system-setting-trigger"
      :class="{ 'is-active': sidebarMode === 'system' }"
      @click.stop="toggleMode"
    >
      <svg-icon class-name="size-icon" icon-class="system" />
    </div>
  </el-tooltip>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'sidebarMode',
      'sidebar',
      'systemRoutes'
    ])
  },
  methods: {
    toggleMode() {
      // 已在系统模式，不操作
      if (this.sidebarMode === 'system') return

      this.$store.commit('app/SET_SIDEBAR_MODE', 'system')

      // 展开侧边栏
      if (!this.sidebar.opened) {
        this.$store.dispatch('app/toggleSideBar')
      }
      // 当前不在系统页面时，自动跳转到第一个系统菜单
      const currentPath = this.$route.path
      if (!currentPath || !currentPath.startsWith('/system')) {
        const firstPath = this.findFirstLeafPath(this.systemRoutes)
        if (firstPath) {
          this.$router.push(firstPath)
        }
      }
    },
    // 递归找到第一个叶子节点的路径
    findFirstLeafPath(routes) {
      if (!routes || routes.length === 0) return null
      const first = routes[0]
      if (first.children && first.children.length > 0) {
        return this.findFirstLeafPath(first.children)
      }
      return first.path || null
    }
  }
}
</script>

<style lang="scss" scoped>
.system-setting-trigger {
  display: inline-flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
  font-size: 18px;
  color: #5a5e66;
  vertical-align: text-bottom;
  transition: color 0.2s;

  &:hover {
    color: #409EFF;
  }

  &.is-active {
    color: #409EFF;
  }
}
</style>
