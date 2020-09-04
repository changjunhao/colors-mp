//index.js
//获取应用实例
// const app = getApp()
const COLORS = require('../../data/colors')
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
      currentColorSet: COLORS[2],
      currentColor: COLORS[2].colors[1]
    }, () => {
      wx.setBackgroundColor({
        backgroundColor: this.data.currentColor.hex,
      })
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
      this.setData({ poetry: obj })
    })
  }
})
