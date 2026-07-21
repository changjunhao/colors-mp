/**
 * 生成图片 / 保存相册相关的共用工具
 * 仅抽取 share 与 download 两页逻辑一致的样板，各自差异化的绘制逻辑仍保留在各页
 */

// 获取设备像素比：优先读取 app 启动时缓存的值，兜底调用 wx.getWindowInfo
function getDpr() {
  const app = getApp()
  if (app && app.globalData && app.globalData.pixelRatio) {
    return app.globalData.pixelRatio
  }
  return wx.getWindowInfo().pixelRatio
}

// 通过选择器获取 canvas 节点及尺寸
function getCanvasNode(selector) {
  return new Promise((resolve) => {
    wx.createSelectorQuery()
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        resolve(res[0])
      })
  })
}

// canvas 转临时文件路径
function canvasToTempFilePath(canvas) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      success: resolve,
      fail: reject
    })
  })
}

// 隐私授权前置（保存相册属隐私接口）；低基础库无该能力时直接放行
function ensurePrivacyAuthorize() {
  return new Promise((resolve, reject) => {
    if (!wx.canIUse('getPrivacySetting')) {
      resolve()
      return
    }
    wx.getPrivacySetting({
      success: (res) => {
        if (res.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success: () => resolve(),
            fail: () => reject(new Error('privacy authorize deny'))
          })
        } else {
          resolve()
        }
      },
      fail: () => resolve()
    })
  })
}

// 相册权限检查：未授权时引导去设置页开启
function ensureAlbumScope() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.showModal({
            content: '未授权相册，请先授权相册',
            success(r) {
              if (r.confirm) {
                wx.openSetting()
              }
            }
          })
          reject(new Error('album scope deny'))
        } else {
          resolve()
        }
      },
      fail() {
        resolve()
      }
    })
  })
}

// 保存图片到相册，统一处理取消 / 拒绝授权 / 其它失败
function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success() {
        wx.showToast({ title: '图片已保存', icon: 'success' })
        resolve()
      },
      fail: (error) => {
        const errMsg = (error && error.errMsg) || ''
        if (errMsg.includes('cancel')) {
          resolve()
          return
        }
        if (errMsg.includes('fail auth deny')) {
          wx.showModal({
            title: '保存失败',
            content: '请允许保存到相册',
            success(r) {
              if (r.confirm) {
                wx.openSetting()
              }
            }
          })
          reject(new Error('save auth deny'))
          return
        }
        wx.showToast({ title: errMsg || '图片保存失败', icon: 'none' })
        reject(error)
      }
    })
  })
}

module.exports = {
  getDpr,
  getCanvasNode,
  canvasToTempFilePath,
  ensurePrivacyAuthorize,
  ensureAlbumScope,
  saveToAlbum
}
