import request from '@/utils/request'

/** 评分统计 */
export function getFeedbackStat() {
  return request({ url: '/admin/api/v1/feedback/stat', method: 'get' })
}

/** 留言列表 */
export function getFeedbackList(params) {
  return request({ url: '/admin/api/v1/feedback', method: 'get', params })
}

/** 新增留言 */
export function addFeedback(data) {
  return request({ url: '/admin/api/v1/feedback', method: 'post', data })
}

/** 删除留言 */
export function delFeedback(id) {
  return request({ url: '/admin/api/v1/feedback/' + id, method: 'delete' })
}

/** 留言点赞 / 取消 */
export function toggleFeedbackLike(id) {
  return request({ url: '/admin/api/v1/feedback/like/feedback/' + id, method: 'patch' })
}

/** 评论点赞 / 取消 */
export function toggleCommentLike(id) {
  return request({ url: '/admin/api/v1/feedback/like/comment/' + id, method: 'patch' })
}

/** 查询点赞用户列表 targetType: 1-留言 2-评论 */
export function getLikers(targetType, targetId) {
  return request({ url: '/admin/api/v1/feedback/like', method: 'get', params: { targetType, targetId } })
}

/** 新增评论/回复 */
export function addComment(data) {
  return request({ url: '/admin/api/v1/feedback/comment', method: 'post', data })
}

/** 评论列表 */
export function getComments(feedbackId) {
  return request({ url: '/admin/api/v1/feedback/comment', method: 'get', params: { feedbackId } })
}

/** 删除评论 */
export function delComment(commentId) {
  return request({ url: '/admin/api/v1/feedback/comment/' + commentId, method: 'delete' })
}
