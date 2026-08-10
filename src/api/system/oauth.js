import request from '@/utils/request'

/**
 * 获取配置
 */
export function getConfig(serverType) {
  return request({
    url: '/admin/api/v1/oauth/config/' + serverType,
    method: 'get'
  })
}

/**
 * 保存配置
 */
export function saveConfig(data) {
  return request({
    url: '/admin/api/v1/oauth/config',
    method: 'patch',
    data: data
  })
}

/**
 * 用户列表
 */
export function listUser(params) {
  return request({
    url: '/admin/api/v1/oauth/user',
    method: 'get',
    params: params
  })
}

/**
 * 授权应用列表
 */
export function getOAuthApp(params) {
  return request({
    url: '/admin/api/v1/oauth/app',
    method: 'get',
    params: params
  })
}

/**
 * 新增应用
 */
export function addOAuthApp(data) {
  return request({
    url: '/admin/api/v1/oauth/app',
    method: 'post',
    data: data
  })
}

/**
 * 删除应用
 */
export function delOAuthApp(ids) {
  return request({
    url: '/admin/api/v1/oauth/app/' + ids,
    method: 'delete'
  })
}

/**
 * 授权应用选项
 */
export function getOAuthAppOptions() {
  return request({
    url: '/admin/api/v1/oauth/app/options',
    method: 'get'
  })
}

/**
 * 给角色授权应用
 */
export function grantRoleOAuthApp(data) {
  return request({
    url: '/admin/api/v1/oauth/app/role',
    method: 'post',
    data: data
  })
}

/**
 * 获取角色授权应用
 */
export function getRoleOAuthApp(roleId) {
  return request({
    url: '/admin/api/v1/oauth/app/role/' + roleId,
    method: 'get'
  })
}

/**
 * 应用菜单列表
 */
export function listOAuthAppMenus(appId, params) {
  return request({
    url: '/admin/api/v1/oauth/app/menu/' + appId,
    method: 'get',
    params: params
  })
}

/**
 * 新增应用菜单
 */
export function addOAuthAppMenus(data) {
  return request({
    url: '/admin/api/v1/oauth/app/menu',
    method: 'post',
    data: data
  })
}
