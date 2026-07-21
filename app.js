//app.js
App({
  onLaunch: function () {
    this.initWindowInfo()
    this.loadFont()
    this.checkUpdate()
  },
  onError: function (err) {
    // 统一捕获运行时错误，便于线上排查
    console.error('[App onError]', err)
  },
  onUnhandledRejection: function (res) {
    console.error('[App onUnhandledRejection]', res && res.reason)
  },
  initWindowInfo: function () {
    // 使用 wx.getWindowInfo 替代已废弃的 wx.getSystemInfoSync，并缓存 pixelRatio
    try {
      const { pixelRatio } = wx.getWindowInfo()
      this.globalData.pixelRatio = pixelRatio
    } catch (e) {
      this.globalData.pixelRatio = 1
    }
  },
  loadFont: function () {
    wx.loadFontFace({
      global: true,
      family: 'TChinese',
      source: 'url("https://colors.ichuantong.cn/font/chinese.font.woff")',
      scopes: ['webview', 'native'],
      fail: (err) => {
        // 字体加载失败不阻塞主流程
        console.error('[loadFontFace fail]', err)
      }
    })
  },
  checkUpdate: function () {
    if (!wx.getUpdateManager) return
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
  },
  globalData: {
    pixelRatio: 1
  }
})
