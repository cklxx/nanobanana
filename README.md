# AIHubMix 4K Image Studio

一个面向 GitHub Pages 的静态工具页，支持在浏览器内直接调用 AIHubMix / Gemini 图片生成 API：

- 输入 API Key 后自动查询额度（返回值按千倍展示，保留三位小数）：`https://aihubmix.com/dashboard/billing/remain`
- 直接调用图片生成接口（默认 4K 无水印示例请求），支持文生图 / 图生图 / 多图参考三种模式：Gemini 走 `https://aihubmix.com/gemini/v1beta/models/{model}:generateContent`，Doubao 走 `https://aihubmix.com/v1/models/doubao/doubao-seedream-4-5-251128/predictions`
- 提供 PPT 与电商常用 Prompt 模板，可一键复制
- 生成后自动刷新额度并展示本次 usage（nanobanana 单次生成约消耗 2000）
- GitHub Actions 自动部署到 Pages，推送到 `work` 分支即可发布
- 生成结果卡片下的提示词自动截断，避免过长内容占满页面

## 本地开发

```bash
npm install
npm run dev
# 浏览器访问 http://localhost:5173
```

## 构建与预览

```bash
npm run build
npm run preview
```

## 自定义
- 修改 React 入口 `src/main.jsx` 或页面组件里的文案与提示词。
- 若官方 API 体积或参数更新，可在 `src/App.jsx`（或相关调用处）调整接口与请求体。
- 默认把 API Key 存在浏览器 `localStorage`，不会上传到服务器。

## 部署与 CI
- GitHub Actions 会在推送到 `work` 或 `main` 时自动执行 `npm run build` 并部署 `dist` 到 GitHub Pages，对应访问路径为 `https://cklxx.github.io/nanobanana/`。
- 额外的 `CI` 工作流会在 Push/PR 时跑一次 `npm run build`，保证同样的构建流程在本地与线上保持一致。
