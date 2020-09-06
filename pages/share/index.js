const COLORS = require('../../data/colors')
const { getCorrectTextColor } = require('../../utils/util')

Page({
  data: {
    colorSetName: '',
    currentColor: {
      RGB: []
    },
    oppositeColor: '',
    canvasImage: '',
  },
  onLoad: function (options) {
    const id = options.id.split('-')
    const currentColorSet = COLORS.find(item => item.id === Number(id[0]))
    const currentColor = currentColorSet.colors[id[1]]
    this.setData({
      colorSetName: currentColorSet.name,
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
      query.select('#SHARE_CARD_CANVAS')
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
    const dpr = wx.getSystemInfoSync().pixelRatio
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const { oppositeColor, currentColor, colorSetName } = this.data

    ctx.fillStyle = oppositeColor
    ctx.fillRect(0, 0, width, height)

    ctx.arc(156.5, 156.5, 129.5, 0, 2 * Math.PI)
    const grd = ctx.createLinearGradient(156.5, 27, 156.5, 286)
    grd.addColorStop(0, currentColor.hex)
    grd.addColorStop(1, `rgba(${currentColor.RGB.join(',')}, 0.6)`)
    ctx.fillStyle = grd
    ctx.fill()
    ctx.strokeStyle = 'rgb(238, 238, 238)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.font = 'normal bold 14px cursive'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = `rgba(${currentColor.RGB.join(',')}, 0.8)`
    const metrics = ctx.measureText(`${colorSetName} · ${currentColor.name}`)
    ctx.fillText(`${colorSetName} · ${currentColor.name}`, 304.6 - metrics.width, 300)
    await this.drawImage(canvas, ctx)
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
      const { currentColor } = this.data
      const figureImg = canvas.createImage();
      figureImg.src = `https://colors.ichuantong.cn/figure/${currentColor.figure || 'default.png'}`;//微信请求返回头像
      figureImg.onload = () => {
        const { width, height } = figureImg
        let dWidth = 257
        let dHeight = 257
        if (width > height) {
          dHeight = 257 * height / width
        }
        if (width < height) {
          dWidth = 257 * width / height
        }
        ctx.save();
        ctx.beginPath()//开始创建一个路径
        ctx.globalAlpha = 0.8
        ctx.arc(156.5, 156.5, 128.5, 0, 2 * Math.PI)
        ctx.clip() //裁剪
        ctx.drawImage(figureImg, (313 - dWidth) / 2, (313 - dHeight) / 2, dWidth, dHeight)
        ctx.closePath()
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
  async handleGenerateImage() {
    // scope.writePhotosAlbum: true
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
  }
})
