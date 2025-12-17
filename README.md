# AIHubMix 4K Image Studio

一个面向 GitHub Pages 的静态工具页，支持在浏览器内直接调用 AIHubMix / Gemini 图片生成 API：

- 输入 API Key 后自动查询额度：`https://aihubmix.com/dashboard/billing/remain`
- 直接调用图片生成接口（默认 4K 无水印示例请求），支持文生图 / 图生图 / 多图参考三种模式：`https://aihubmix.com/v1/images/generate`
- 提供 PPT 与电商常用 Prompt 模板，可一键复制
- 生成后自动刷新额度并展示本次 usage
- GitHub Actions 自动部署到 Pages，推送到 `work` 分支即可发布

## 本地预览

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 自定义
- 修改 `index.html` 里的文案或提示词。
- 若官方 API 体积或参数更新，可在 `script.js` 中调整 `IMAGE_URL` 与请求体。
- 默认把 API Key 存在浏览器 `localStorage`，不会上传到服务器。

## 部署
仓库已经包含 `.github/workflows/deploy.yml`，推送到 `work` 分支后工作流会自动构建并发布到 GitHub Pages。
