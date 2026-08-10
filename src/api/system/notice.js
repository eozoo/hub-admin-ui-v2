import request from '@/utils/request'

/**
 * 公告列表
 */
export function getNoticeList(params) {
  return request({
    url: '/admin/api/v1/notice',
    method: 'get',
    params: params
  })
}

/**
 * 公告详情
 */
export function getNoticeInfo(noticeId) {
  return request({
    url: '/admin/api/v1/notice/' + noticeId,
    method: 'get'
  })
}

/**
 * 新增公告
 */
export function addNotice(data) {
  return request({
    url: '/admin/api/v1/notice',
    method: 'post',
    data: data
  })
}

/**
 * 删除公告
 */
export function delNotice(noticeIds) {
  return request({
    url: '/admin/api/v1/notice/' + noticeIds,
    method: 'delete'
  })
}

/**
 * 修改公告
 */
export function updateNotice(data) {
  return request({
    url: '/admin/api/v1/notice',
    method: 'patch',
    data: data
  })
}

/**
 * 发布公告
 */
export function publishNotice(noticeId) {
  return request({
    url: '/admin/api/v1/notice/publish/' + noticeId,
    method: 'patch'
  })
}

/**
 * 已读情况
 */
export function getReads(params) {
  return request({
    url: '/admin/api/v1/notice/readers',
    method: 'get',
    params: params
  })
}

/**
 * 消息列表
 */
export function getNoticeMsg(params) {
  return request({
    url: '/admin/api/v1/notice/msg',
    method: 'get',
    params: params
  })
}

/**
 * 阅读消息
 */
export function readNoticeMsg(noticeId) {
  return request({
    url: '/admin/api/v1/notice/msg/read/' + noticeId,
    method: 'patch'
  })
}

/**
 * 未读统计
 */
export function countUnReadMsg() {
  return request({
    url: '/admin/api/v1/notice/msg/unread',
    method: 'get'
  })
}

/**
 * 好评差评（likeStatus: 1好评 2差评 0取消）
 */
export function msgLike(noticeId, likeStatus) {
  return request({
    url: `/admin/api/v1/notice/msg/like/${noticeId}`,
    method: 'patch',
    params: { likeStatus }
  })
}

/**
 * 评论列表
 */
export function getCommentList(noticeId) {
  return request({
    url: `/admin/api/v1/notice/msg/comment/${noticeId}`,
    method: 'get',
    headers: { noRepeat: false }
  })
}

/**
 * 新增评论/回复
 */
export function addComment(data) {
  return request({
    url: '/admin/api/v1/notice/msg/comment',
    method: 'post',
    data
  })
}

/**
 * 删除评论
 */
export function deleteComment(commentId) {
  return request({
    url: `/admin/api/v1/notice/msg/comment/${commentId}`,
    method: 'delete'
  })
}

/**
 * 评论点赞/取消
 */
export function toggleCommentLike(commentId) {
  return request({
    url: `/admin/api/v1/notice/msg/comment/like/${commentId}`,
    method: 'post'
  })
}

/**
 * 点赞人列表
 */
export function getNoticeLikers(targetType, targetId) {
  return request({
    url: '/admin/api/v1/notice/msg/likers',
    method: 'get',
    params: { targetType, targetId },
    headers: { noRepeat: false }
  })
}
