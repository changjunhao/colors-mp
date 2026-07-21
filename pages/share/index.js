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
  async drawCanvas () {
    const { width, height, node } = await getCanvasNode('#SHARE_CARD_CANVAS')
    const canvas = node
    const ctx = canvas.getContext('2d')
    const dpr = getDpr()
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

    ctx.font = 'normal bold 14px TChinese'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = `rgba(${currentColor.RGB.join(',')}, 0.8)`
    const metrics = ctx.measureText(`${colorSetName} · ${currentColor.name}`)
    ctx.fillText(`${colorSetName} · ${currentColor.name}`, 304.6 - metrics.width, 300)
    await this.drawImage(canvas, ctx)
    return canvas
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
  }
})
