//index.js
//获取应用实例
// const app = getApp()
const colors = require('../../data/colors')
const jinrishici = require('../../utils/jinrishici.js')

Page({
  data: {
    currentColorSet: {},
    currentColor:{},
    poetry: {},
    topHeight: 0
  },
  onLoad: function () {
    const { bottom } = wx.getMenuButtonBoundingClientRect()
    this.setData({
      topHeight: bottom,
      currentColorSet: colors[2],
      currentColor: colors[2].colors[0]
    })
    this._fetchPoetry()
  },
  _fetchPoetry: function () {
    jinrishici.load(result => {
      let obj = {
        content: result.data.content,
        author: result.data.origin.author,
        title: result.data.origin.title
      };
      obj.content = obj.content
        .replace(/[，|。|！|？|、]/g, ' ')
        .trim()
        .split(' ');
      this.setData({poetry: obj})
    })
  }
})
