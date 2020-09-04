//index.js
//获取应用实例
// const app = getApp()
const COLORS = require('../../data/colors')
const jinrishici = require('../../utils/jinrishici.js')
const { getCorrectTextColor } = require('../../utils/util')

Page({
  data: {
    currentColorSet: {},
    currentColor:{},
    poetry: {},
    topHeight: 0,
    figureHeight: 'auto'
  },
  onLoad: function () {
    this._fetchPoetry()
    this.initState()
  },
  initState () {
    const { bottom } = wx.getMenuButtonBoundingClientRect()
    const currentColorSet = COLORS[2]
    const currentColor = currentColorSet.colors[0]
    this.setData({
      topHeight: bottom,
      currentColorSet,
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB)
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
  },
  handleFigureLoad: function (event) {
    const { height, width } = event.detail
    this.setData({
      figureHeight: `${162 * height / width}rpx`
    })
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
