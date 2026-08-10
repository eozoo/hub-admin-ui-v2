# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Cowave 管理系统 — 基于 RuoYi-Vue（若依）框架重构的多租户企业管理系统前端。Vue 2 + Element UI 技术栈，涵盖系统管理、流程管理（Flowable/BPMN）、计量仪表盘（meter）等业务模块。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 80）
npm run dev

# ESLint 检查
npm run lint

# 构建测试环境
npm run build:stage

# 构建生产环境
npm run build:prod
```

## 技术栈

| 类别 | 库 |
|---|---|
| 框架 | Vue 2.6 + Vuex 3 + Vue Router 3 (history 模式) |
| UI | Element UI 2.15, element-variables 主题定制 |
| HTTP | Axios 0.24, 多微服务代理 |
| 流程设计 | AntV X6 2.x (~10 个 plugin), Flowable BPMN designer |
| 图表 | ECharts 4.9 |
| 编辑器 | Quill, CodeMirror, Monaco Editor, Cherry Markdown |
| 国际化 | vue-i18n 8.x (中/英) |
| 构建 | Vue CLI 4, webpack, babel |

## 环境与代理

- **开发环境**: `VUE_APP_BASE_API = /dev-api`，多后端服务通过 vue.config.js devServer.proxy 代理：
  - `/admin` → `localhost:19010`（管理后台）
  - `/dev-api/flow` → `localhost:19020`（流程引擎）
  - `/dev-api/meter` → `localhost:19030`（计量模块）
  - `/dev-api/job` → `localhost:19040`（定时任务）
  - `/prod-api` → `localhost:81`（生产代理）
- **测试环境**: `VUE_APP_BASE_API = /stage-api`
- **生产环境**: `VUE_APP_BASE_API = /prod-api`
- 本地开发时，`designer/` 目录下的 BPMN 设计器静态资源通过 express 中间件映射到 `/designer` 和 `/admin/designer` 路径。

## 架构核心

### 启动与初始化 (`src/main.js`)

全局注册顺序：Element UI → 全局样式 → router → store → directives → plugins → 图标 → 权限路由守卫 → 全局组件 → i18n → 第三方插件（ElSelectTree, Contextmenu, OrgTree）。

注意：`new Vue()` 实例化在 `main.js` 底部，el 挂载到 `#app`。

### 路由与权限 (`src/permission.js`, `src/router/`, `src/store/modules/permission.js`)

- **白名单路由**：`/login`, `/cowave/login`, `/cowave/register`, `/cowave/ldap`, `/oauth/gitlab`, `/bind` 等无需认证即可访问。
- **鉴权流程**：router.beforeEach → 检查 accessToken → 无 token 则跳登录 → 有 token 则检查用户信息缓存 → 缓存为空则 `GetInfo` + `GenerateRoutes` → `router.addRoutes()` 动态注册路由。
- **动态路由生成**：`GenerateRoutes` action 从后端 `/admin/api/v1/auth/menus` 拉取菜单树，通过 `filterAsyncRouter()` 递归转换：将后端返回的组件路径字符串（如 `"system/user/index"`）映射为实际的 Vue 组件懒加载。`Layout`、`ParentView`、`InnerLink` 三个组件名会特殊处理。
- **权限指令**：`v-hasRole`、`v-hasPermi` 用于模板中的权限控制；`$auth` 插件（`@/plugins/auth`）用于 JS 逻辑中的权限判断，支持 `hasPermi`、`hasPermiOr`、`hasPermiAnd`、`hasRole` 等。

### 状态管理 (`src/store/`)

Vuex 模块：

| 模块 | 文件 | 职责 |
|---|---|---|
| `app` | `modules/app.js` | 侧边栏状态、设备类型、尺寸、侧边栏模式（normal/system） |
| `user` | `modules/user.js` | token、用户信息、角色、权限、登录/登出/获取信息 actions |
| `permission` | `modules/permission.js` | 动态路由生成、侧边栏/顶栏路由过滤 |
| `settings` | `modules/settings.js` | 主题色、布局配置（topNav、tagsView、fixedHeader 等），持久化到 localStorage `layout-setting` |
| `tagsView` | `modules/tagsView.js` | 页签视图管理 |
| `noticeSocket` | `modules/noticeSocket.js` | WebSocket 通知（socket.io-client） |

### HTTP 请求层 (`src/utils/request.js`)

- 通过 Axios interceptor 实现：自动带 `Authorization: Bearer <token>` 头、国际化 `Accept-Language` 头、GET 参数序列化。
- **防重复提交**：对 POST/PUT/DELETE 请求默认开启 `noRepeat`，通过 `pendingRequests` Set 判断，可在调用时设置 `headers: { noRepeat: false }` 关闭。
- **Token 无感刷新**：收到 498 状态码时，自动调用 `/admin/api/v1/auth/public/refresh` 刷新 token，并发请求排队等待刷新完成后重放。
- **401 处理**：清除 token 跳转到租户登录页（`localStorage.getItem('tenant_login_route')`）。
- **多租户登录路由**：通过 `tenant_login_route` 存储不同租户的登录页面路径，默认 `/cowave/login`。

### 认证缓存 (`src/plugins/cache.js`)

- sessionStorage（会话级缓存）和 localStorage（本地持久化）两层封装。
- Token 存储时通过 `jsonwebtoken` 解码，分离出 tenantId、userId、userCode、userName 到独立 key。
- 支持 MFA 二次认证的临时 token 存储。

### 布局系统 (`src/layout/`)

- `Layout` 组件（`index.vue`）由 Sidebar、Navbar、TagsView、AppMain、Settings（RightPanel）五部分构成。
- 支持顶栏+侧边栏混合布局（`topNav: true`），`sidebarMode` 支持 `normal` 和 `system`（系统管理菜单独立切换）。

### API 层 (`src/api/`)

- `auth.js`：认证相关（登录、注册、OAuth、LDAP、MFA、菜单获取）
- `system/`：系统管理（用户、角色、部门、菜单、租户、配置、字典等）
- `flow/`：流程管理（请假、会议、采购、任务等业务流）
- `meter/`：计量模块（数据源、模型、字段、应用等）

### 全局组件 (`src/components/`)

部分重要全局组件（在 `main.js` 中已全局注册）：
- `Pagination`：分页组件
- `RightToolbar`：表格工具栏（搜索/刷新/列配置）
- `Editor`：富文本编辑器
- `FileUpload` / `ImageUpload` / `ImagePreview`：文件/图片上传与预览
- `DictTag` / `DictData`：字典标签与数据

### 流程设计器

- AntV X6 图形库用于自定义流程设计（`src/module/x6/`）
- 集成 Flowable BPMN 设计器（`designer/` 目录），通过 iframe 嵌入在流程管理的设计页中使用
- `src/views/flow/`：流程定义（modeler.vue）、实例管理（instance.vue）、部署（deploy.vue）、审批工作台（workbench/）

## 关键约定

- **缩进**：2 空格，无分号，单引号，LF 换行
- **组件样式**：Sass/SCSS，Element UI 主题变量在 `src/assets/styles/element-variables.scss`
- **SVG 图标**：`src/assets/icons/svg/` 下的 SVG 通过 svg-sprite-loader 转为 symbol，使用方式：`<svg-icon icon-class="图标名" />`
- **路由懒加载**：开发环境使用 `require([...], resolve)`，生产环境使用 `() => import(...)`
- **国际化的 key**：使用点号分隔的路径形式，如 `commons.menu.dashboard`、`user.button.grant`
- **版本管理**：使用 `standard-version`，commit 遵循 conventional commits 规范
