const COLORS = require('../../data/colors')
const { getCorrectTextColor } = require('../../utils/util')
const {
  getDpr,
  getCanvasNode,
  canvasToTempFilePath,
  ensurePrivacyAuthorize,
  ensureAlbumScope,
  saveToAlbum
} = require('../../utils/canvas')

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
      currentColor,
      oppositeColor: getCorrectTextColor(currentColor.RGB),
    })
    wx.setBackgroundColor({
      backgroundColor: currentColor.hex,
    })
    this.initPoetry(options)
  },
  initPoetry (options) {
    // 优先通过 eventChannel 接收诗词，规避 URL 长度与编码问题
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (eventChannel && typeof eventChannel.on === 'function') {
      eventChannel.on('poetry', (poetry) => {
        if (poetry) this.setData({ poetry })
      })
    }
    // 兜底：兼容旧的 URL query 传参，解析失败时保持空诗词容错渲染
    if (options.poetry) {
      try {
        this.setData({ poetry: JSON.parse(options.poetry) })
      } catch (e) {
        // ignore parse error
      }
    }
  },
  getParams(figure) {
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
  },
  handleFigureLoad: function (event) {
    const { height, width } = event.detail
    const { figure } = this.data.currentColor
    const params = this.getParams(figure)
    const figureW = params['width'] ? params['width'] === '100%' ? '750' : params['width'] * 28 : '644'
    const figureO = +(params['o'] || 1);
    const pos = params['position'] || 'bottom';
    this.setData({
      figureHeight: `${figureW * height / width}rpx`,
      figureW: figureW + 'rpx',
      figureO,
      pos
    })
  },
  async handleGenerateImage() {
    // 保存相册前先完成隐私授权与相册权限检查
    try {
      await ensurePrivacyAuthorize()
      await ensureAlbumScope()
    } catch (e) {
      return
    }
    wx.showLoading({
      title: '图片生成中',
      mask: true,
    })
    try {
      if (!this.data.canvasImage) {
        const canvas = await this.drawCanvas()
        const res = await canvasToTempFilePath(canvas)
        this.setData({ canvasImage: res.tempFilePath })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({
        title: '图片生成失败',
        icon: 'none',
      })
      return
    }
    try {
      await saveToAlbum(this.data.canvasImage)
    } catch (e) {
      // 拒绝授权等失败时清空缓存图片，下次重新生成
      this.setData({ canvasImage: '' })
    } finally {
      wx.hideLoading()
    }
  },
  async drawCanvas () {
    const { width, height, node } = await getCanvasNode('#PREVIEW_CANVAS')
    const canvas = node
    const ctx = canvas.getContext('2d')
    const dpr = getDpr()
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const { oppositeColor, currentColor, poetry } = this.data

    ctx.fillStyle = currentColor.hex
    ctx.fillRect(0, 0, width, height)

    await this.drawImage(canvas, ctx)

    ctx.font = 'normal bold 16px TChinese'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = oppositeColor
    ctx.fillText(currentColor.name, 10, height - 20)

    // 诗词可能缺失（eventChannel 未送达或解析失败），缺失时跳过绘制
    if (poetry && poetry.content && poetry.content.length) {
      ctx.font = 'normal bold 22.4px cursive'
      const metrics1 = ctx.measureText(poetry.content[0])
      const metrics2 = ctx.measureText(poetry.content[1])
      ctx.font = 'normal 11.2px cursive'
      const metrics3 = ctx.measureText(`${poetry.author} · ${poetry.title}`)
      const minWidth = 84 * width / 375
      const maxWidth = Math.max(metrics1.width, metrics2.width, metrics3.width, minWidth)
      ctx.font = 'normal bold 22.4px cursive'
      ctx.fillText(poetry.content[0], (width - maxWidth) / 2, 146 * width / 375)
      ctx.fillText(poetry.content[1], (width - maxWidth) / 2, 146 * width / 375 + 35.84)
      ctx.font = 'normal 11.2px cursive'
      ctx.fillText(`${poetry.author} · ${poetry.title}`, (width - maxWidth) / 2, 146 * width / 375 + 71.68)
    }
    return canvas
  },
  drawImage(canvas, ctx) {
    return new Promise((resolve, reject) => {
      const { currentColor, pos, figureO } = this.data
      const figureImg = canvas.createImage();
      figureImg.src = `https://colors.ichuantong.cn/figure/${currentColor.figure || 'default.png'}`;//微信请求返回头像
      const params = this.getParams(currentColor.figure || 'default.png?width=8')
      const dpr = getDpr()
      const figureW = params['width'] ? (params['width'] === '100%' ?  canvas.width / dpr : params['width'] * 14 * canvas.width / dpr / 375) : 322 * canvas.width / dpr / 375
      figureImg.onload = () => {
        const { width, height } = figureImg
        let dHeight = figureW * height / width
        let dy = pos === 'top' ? 0 : canvas.height / dpr - dHeight
        let dx = canvas.width / dpr - figureW
        if (pos === 'left') {
          dx = 0
          dy = 0
        }
        ctx.save();
        ctx.globalAlpha = 0.8
        ctx.drawImage(figureImg, dx, dy, figureW, dHeight)
        ctx.restore()
        resolve()
      }
      figureImg.onerror = (error) => {
        reject(error)
      }
    })
  },
})
