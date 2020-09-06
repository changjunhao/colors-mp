const COLORS = require('../../data/colors')
const { getCorrectTextColor } = require('../../utils/util')

Page({
  data: {
    currentColor: {
      RGB: []
    },
    poetry: {},
    oppositeColor: '',
    canvasImage: '',
    figureHeight: 'auto',
    figureW: 'auto',
    figureO: 1,
    pos: '',
  },
  onLoad (options) {
    const id = options.id.split('-')
    const currentColorSet = COLORS.find(item => item.id === Number(id[0]))
    const currentColor = currentColorSet.colors[id[1]]
    this.setData({
      poetry: JSON.parse(options.poetry),
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB),
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
  },
  handleFigureLoad: function (event) {
    const { height, width } = event.detail
    const { figure } = this.data.currentColor
    const params = (function (){
      const search = {}
      const index = figure.indexOf('?')
      if (index === -1) return search
      figure.slice(index + 1).split('&').forEach((item) => {
        const kv =  item.split('=')
        if (kv) {
          search[kv[0]] = kv[1]
        }
      })
      return search
    })()
    console.log(params)
    const figureW = params['width'] ? params['width'] === '100%' ? '750rpx' : `${params['width'] * 28}rpx` : '644rpx'
    const figureO = +(params['o'] || 1);
    const pos = params['position'] || 'bottom';
    this.setData({
      figureHeight: `${644 * height / width}rpx`,
      figureW,
      figureO,
      pos
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
