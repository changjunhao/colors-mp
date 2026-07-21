# colors-mp

🇨🇳 中国传统颜色小程序 —— 收录数百种国风色卡，配以拼音、RGB / CMYK / HEX 色值，并随机匹配今日诗词，可一键生成分享卡片与壁纸。

## ✨ 功能特性

- 🎨 **国风色卡**：按色系浏览中国传统颜色，展示颜色名称、拼音与释义
- 🔢 **多色值**：同时提供 HEX / RGB / CMYK 色值，点击 HEX 可一键复制
- 📜 **今日诗词**：为当前颜色随机匹配一句古诗词（数据来自「今日诗词」）
- 🖼️ **生成分享图**：一键生成配色卡片，保存到相册
- 🌇 **生成壁纸**：结合诗词与配图生成手机壁纸并保存
- 🔗 **原生分享**：支持将当前色卡转发给好友
- 🔤 **自定义字体**：全局加载国风字体，提升分享图与壁纸质感

## 🗂️ 目录结构

```
colors-mp
├── data/colors.js        # 传统颜色数据集
├── pages/
│   ├── index/            # 首页：色卡浏览与色值展示
│   ├── share/            # 分享卡片生成
│   └── download/         # 壁纸生成与下载
├── utils/
│   ├── canvas.js         # canvas / 相册保存 / 隐私授权 共用工具
│   ├── jinrishici.js     # 今日诗词 SDK
│   └── util.js           # 通用工具（对比色计算等）
├── app.js / app.json     # 小程序入口与全局配置
└── project.config.json   # 项目配置
```

## 🚀 本地开发

1. 使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 导入本项目
2. 在 `project.config.json` 中填入自己的 `appid`（或使用测试号）
3. 基础库版本建议 `3.x` 及以上
4. 在小程序管理后台的 `request` 合法域名中配置：
   - `https://colors.ichuantong.cn`（颜色配图与字体）
   - `https://v2.jinrishici.com`（今日诗词接口）

> ⚠️ 小程序使用了 `wx.saveImageToPhotosAlbum`（保存到相册）等隐私接口，需先在微信公众平台「设置 → 服务内容声明 → 用户隐私保护指引」中声明相应用途并通过审核，否则保存操作会被拦截。

## 灵感来源 
[GitHub: github.com/zerosoul/chinese-colors](https://github.com/zerosoul/chinese-colors)

[Site: colors.ichuantong.cn](https://colors.ichuantong.cn)

## 小程序码

<img src="https://oss-materials.ifable.cn/gh_8f5416601c1b_860.jpg" alt="小程序码" title="小程序码" width="240">
