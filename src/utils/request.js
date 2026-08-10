import axios from 'axios'
import store from '@/store'
import router from '@/router';
import cache from '@/plugins/cache'
import {i18n} from '@/main'
import responseCode from '@/utils/responseCode'
import {Notification, Message, Loading, MessageBox} from 'element-ui'
import { tansParams, blobValidate } from "@/utils/ruoyi";
import { saveAs } from 'file-saver'
import {refresh} from "@/api/auth";

let downloadLoadingInstance;

// 正在进行中的请求集合（key = method:url）
const pendingRequests = new Set()

function getPendingKey(config) {
  return `${config.method}:${config.url}`
}

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
})

service.interceptors.request.use(config => {
  // 鉴权Token
  const notRequireToken = (config.headers || {}).requireToken === false
  if (!notRequireToken && cache.local.getAccessToken()) {
    config.headers['Authorization'] = 'Bearer ' + cache.local.getAccessToken()
  }

  // 国际化
  config.headers['Accept-Language'] = i18n.locale;

  // Get参数
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.url = url;
    config.params = {};
  }

  // 防重复提交：noRepeat 默认对写操作开启，查询接口可在调用时设 headers: { noRepeat: false }
  const isWriteMethod = config.method === 'post' || config.method === 'put' || config.method === 'delete'
  const noRepeat = (config.headers || {}).noRepeat !== false
  if (isWriteMethod && noRepeat) {
    const key = getPendingKey(config)
    if (pendingRequests.has(key)) {
      console.warn(`[${key}] 请求正在处理，请勿重复提交`)
      return Promise.reject(new Error('请求正在处理，请勿重复提交'))
    }
    pendingRequests.add(key)
    config._pendingKey = key
  }

  return config
}, error => {
    console.log(error)
    Promise.reject(error)
})

let isRefreshing = false; // 是否正在刷新Token
let requestsQueue = [];     // 等待Token刷新的请求

service.interceptors.response.use(response => {
    if (response.config._pendingKey) {
      pendingRequests.delete(response.config._pendingKey)
    }
    return response.data
  }, error => {
    if (error.config && error.config._pendingKey) {
      pendingRequests.delete(error.config._pendingKey)
    }
    const response = error.response;
    if (response) {
      const status = response.status;
      if (status === 498) {
        if (!isRefreshing) {
          isRefreshing = true;
          return refresh(cache.local.getRefreshToken()).then(resp => {
            isRefreshing = false;
            store.commit('SET_TOKEN', resp.data);
            requestsQueue.forEach(cb => cb(resp.data.accessToken));
            store.dispatch('RefreshNoticeSocket');
            requestsQueue = [];
            return service(response.config); // 重新发送当前请求
          }).catch(err => {
            isRefreshing = false;
            return Promise.reject(err);
          });
        } else {
          return new Promise(resolve => {
            requestsQueue.push(token => {
              response.config.headers['Authorization'] = `Bearer ${token}`;
              resolve(service(response.config));
            });
          });
        }
      } else if (status === 401) {
        cache.local.removeAccessToken()
        let msg = response.data.msg;
        if (router.currentRoute.path !== '/cowave/login'
            && router.currentRoute.path !== '/cowave/ldap'
            && router.currentRoute.path !== '/login') {
          MessageBox.alert(msg, {type: 'warning'}).then(() => {
            const loginRoute = localStorage.getItem('tenant_login_route') || '/cowave/login';
            router.push(loginRoute);
          })
        } else {
          Notification.error({ title: msg, duration: 3000 })
        }
        return Promise.reject('认证失败')
      } else {
        let msg = response.data.msg || "服务请求失败";
        Notification.error({ title: msg, duration: 3000 })
        return Promise.reject(new Error(msg))
      }
    } else {
      Message({message: '服务请求失败', type: 'error', duration: 5 * 1000});
      return Promise.reject(error);
    }
  }
)

// 下载
export function download(url, params, filename) {
  downloadLoadingInstance = Loading.service({ text: "正在下载数据，请稍候", spinner: "el-icon-loading", background: "rgba(0, 0, 0, 0.7)", })
  return service.post(url, params, {
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  }).then(async (data) => {
    const isLogin = await blobValidate(data);
    if (isLogin) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    } else {
      const resText = await data.text();
      const rspObj = JSON.parse(resText);
      const errMsg = responseCode[rspObj.code] || rspObj.msg || responseCode['default']
      Message.error(errMsg);
    }
    downloadLoadingInstance.close();
  }).catch((r) => {
    console.error(r)
    Message.error('下载文件出现错误，请联系管理员！')
    downloadLoadingInstance.close();
  })
}

export default service
