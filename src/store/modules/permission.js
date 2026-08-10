import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'
import {getAuthMenus} from "@/api/auth";

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: [],
    systemRoutes: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes)
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      state.topbarRouters = routes
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes
    },
    SET_SYSTEM_ROUTES: (state, routes) => {
      state.systemRoutes = routes
    },
  },
  actions: {
    // 生成路由
    GenerateRoutes({ commit }) {
      return new Promise(resolve => {
        // 向后端请求路由数据
        getAuthMenus().then(res => {
          const sdata = JSON.parse(JSON.stringify(res.data))
          const rdata = JSON.parse(JSON.stringify(res.data))
          const sidebarRoutes = filterAsyncRouter(sdata)
          const rewriteRoutes = filterAsyncRouter(rdata, false, true)
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
          rewriteRoutes.push({ path: '*', redirect: '/404', hidden: true })
          router.addRoutes(asyncRoutes);
          commit('SET_ROUTES', rewriteRoutes)
          // 提取系统管理菜单组
          const systemRoute = sidebarRoutes.find(route => {
            const p = route.path || ''
            return p === 'system' || p === '/system'
          })
          // 将系统子菜单的路径转为绝对路径（相对路径 → /system/xxx）
          const systemParentPath = systemRoute && systemRoute.path
            ? (systemRoute.path.startsWith('/') ? systemRoute.path : '/' + systemRoute.path)
            : '/system'
          const resolveSystemPaths = (routes, parentPath) => {
            if (!routes || !Array.isArray(routes)) return []
            return routes
              .filter(r => !r.hidden)
              .map(r => {
                const absPath = r.path && r.path.startsWith('/') ? r.path : parentPath + '/' + (r.path || '')
                return {
                  ...r,
                  path: absPath,
                  children: r.children ? resolveSystemPaths(r.children, absPath) : undefined
                }
              })
          }
          const systemMenus = systemRoute
            ? resolveSystemPaths(systemRoute.children || [], systemParentPath)
            : []
          commit('SET_SYSTEM_ROUTES', systemMenus)
          // 过滤掉系统管理菜单组（通过 system-seting 按钮切换显示）
          const filteredSidebarRoutes = sidebarRoutes.filter(route => {
            const p = route.path || ''
            return p !== 'system' && p !== '/system'
          })
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(filteredSidebarRoutes))
          commit('SET_DEFAULT_ROUTES', filteredSidebarRoutes)
          commit('SET_TOPBAR_ROUTES', filteredSidebarRoutes)
          resolve(rewriteRoutes)
        })
      })
    }
  }
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + '/' + el.path
    }
    children = children.concat(el)
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view) => {
  if (process.env.NODE_ENV === 'development') {
    return (resolve) => require([`@/views/${view}`], resolve)
  } else {
    return () => import(`@/views/${view}`)
  }
}

export default permission
