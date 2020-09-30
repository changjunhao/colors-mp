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
    await this.getSetting()
    wx.showLoading({
      title: '图片生成中',
      mask: true,
    })
    if (this.data.canvasImage) {
      this.extraImage()
      return
    }
    try {
      const canvas = await this.drawCanvas()
      const res = await this.canvasToTempFilePath(canvas)
      this.setData({
        canvasImage: res.tempFilePath
      }, () => {
        this.extraImage()
      })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({
        title: '图片生成失败',
        icon: 'none',
      })
    }
  },
  extraImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.canvasImage,
      success(res) {
        wx.showToast({
          title: '图片已保存',
          icon: 'success',
        })
      },
      fail: (error) => {
        if (error.errMsg && error.errMsg.includes('cancel')) return
        if (error.errMsg.includes('fail auth deny')) {
          wx.showModal({
            title: '保存失败',
            content: '请允许保存到相册',
            success (res) {
              if (res.confirm) {
                wx.openSetting()
              }
            },
            complete: () => {
              this.setData({
                canvasImage: ''
              })
            }
          })
          return
        }
        wx.showToast({
          title: error.errMsg || '图片保存失败',
          icon: 'none',
        })
      },
      complete() {
        wx.hideLoading()
      }
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
  async drawCanvas () {
    const { width, height, node } = await this.getCanvas()
    const canvas = node
    const ctx = canvas.getContext('2d')
    const systemInfo = wx.getSystemInfoSync()
    const dpr = systemInfo.pixelRatio
    console.log(systemInfo)
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
    return canvas
  },
  canvasToTempFilePath(canvas) {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          resolve(res)
        },
        fail(error) {
          reject(error)
        }
      })
    })
  },
  drawImage(canvas, ctx) {
    return new Promise((resolve, reject) => {
      const { currentColor, pos, figureO } = this.data
      const figureImg = canvas.createImage();
      figureImg.src = `https://colors.ichuantong.cn/figure/${currentColor.figure || 'default.png'}`;//微信请求返回头像
      const params = this.getParams(currentColor.figure || 'default.png?width=8')
      const dpr = wx.getSystemInfoSync().pixelRatio
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
        console.log(dx, dy, figureW, dHeight)
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
  getSetting() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success (res) {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            wx.showModal({
              content: '未授权相册，请先授权相册',
              success (res) {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
            reject()
          } else {
            resolve()
          }
        },
        fail() {
          resolve()
        }
      })
    })
  },
})
