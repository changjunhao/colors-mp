//index.js
//获取应用实例
// const app = getApp()
const COLORS = require('../../data/colors')
const jinrishici = require('../../utils/jinrishici.js')
const { getCorrectTextColor } = require('../../utils/util')

Page({
  data: {
    colorsList: COLORS.map(item => {
      const { colors, ...info } = item
      return info
    }),
    currentColorSet: {},
    currentColor:{},
    poetry: {},
    topHeight: 0,
    figureHeight: 'auto',
    expand: false,
  },
  onLoad: function () {
    this.fetchPoetry()
    this.initState()
  },
  initState () {
    const { bottom } = wx.getMenuButtonBoundingClientRect()
    const currentColorSet = COLORS[2]
    const currentColor = currentColorSet.colors[16]
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
  handleColorChange (event) {
    this.fetchPoetry()
    const { id } = event.currentTarget.dataset
    const currentColor = this.data.currentColorSet.colors.find(item => item.id === id)
    this.setData({
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB)
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
  },
  handleChangeColorSet (event) {
    this.fetchPoetry()
    const { id } = event.currentTarget.dataset
    const currentColorSet = COLORS[id]
    const currentColor = currentColorSet.colors[0]
    this.setData({
      currentColorSet,
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB)
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
  },
  handleExpand () {
    this.setData({
      expand: !this.data.expand,
    })
  },
  handleFigureLoad: function (event) {
    const { height, width } = event.detail
    this.setData({
      figureHeight: `${162 * height / width}rpx`
    })
  },
  handleCopyHex: function () {
    wx.setClipboardData({ data: this.data.currentColor.hex })
  },
  handleDownload: function () {
    const { currentColor, poetry } = this.data
    // 通过 eventChannel 传递诗词，避免超长 URL query 与编码问题
    wx.navigateTo({
      url: `/pages/download/index?id=${currentColor.id}`,
      success: (res) => {
        res.eventChannel.emit('poetry', poetry)
      }
    })
  },
  onShareAppMessage: function () {
    const { currentColorSet, currentColor } = this.data
    return {
      title: `${currentColorSet.name} · ${currentColor.name}`,
      path: `/pages/share/index?id=${currentColor.id}`
    }
  },
  fetchPoetry: function () {
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
