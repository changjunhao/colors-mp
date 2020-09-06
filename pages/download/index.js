const COLORS = require('../../data/colors')
const { getCorrectTextColor } = require('../../utils/util')

Page({
  data: {
    currentColor: {
      RGB: []
    },
    oppositeColor: '',
    canvasImage: '',
  },
  onLoad (options) {
    const id = options.id.split('-')
    const currentColorSet = COLORS.find(item => item.id === Number(id[0]))
    const currentColor = currentColorSet.colors[id[1]]
    this.setData({
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB)
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
  },
  getCanvas() {
    return new Promise((resolve) => {
      const query = wx.createSelectorQuery()
      query.select('#PREVIEW_CANVAS')
        .fields({ node: true, size: true })
        .exec((res) => {
          resolve(res[0])
        })
    })
  },
})
