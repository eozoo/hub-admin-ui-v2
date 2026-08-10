import cache from "@/plugins/cache";

const getters = {
  sidebar: state => state.app.sidebar,
  size: state => state.app.size,
  device: state => state.app.device,

  visitedViews: state => state.tagsView.visitedViews,
  cachedViews: state => state.tagsView.cachedViews,

  accessToken: state => state.user.accessToken,
  refreshToken: state => state.user.refreshToken,

  tenantId: state => state.user.tenantId,
  tenantTitle: state => state.user.tenantTitle,
  tenantIndex: state => state.user.tenantIndex || cache.local.getTenantIndex(),

  userId: state => state.user.userId,
  name: state => state.user.name,
  avatar: state => state.user.avatar,
  roles: state => state.user.roles,
  permissions: state => state.user.permissions,

  permission_routes: state => state.permission.routes,
  topbarRouters:state => state.permission.topbarRouters,
  defaultRoutes:state => state.permission.defaultRoutes,
  sidebarRouters:state => state.permission.sidebarRouters,
  systemRoutes: state => state.permission.systemRoutes,
  sidebarMode: state => state.app.sidebarMode,

  noticeCount: state => state.noticeSocket.noticeCount,
}
export default getters
