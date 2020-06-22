//app.js
App({
  onLaunch: function () {
    wx.loadFontFace({
      global: true,
      family: 'TChinese',
      source: 'url("https://colors.ichuantong.cn/font/chinese.font.woff")',
      success: console.log
    })
  },
  globalData: {
  }
})
