# Transformer Explainer（本地部署版）

本目录是 [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer)
的**构建产物**，部署在课程主页下作为课程材料。

- 上游项目：**Transformer Explainer: LLM Transformer Model Visually Explained**
  — Alex Chelbling, Michael S. Rybkin, Andrej Karpathy, Karthik Narasimhan
  （Georgia Tech / Stanford / Facebook AI）
- 论文：[*Transformer Explainer: LLM Transformer Model Visually Explained*,
  arXiv 2212.09748](https://arxiv.org/abs/2212.09748)
- 许可：**MIT**（上游 LICENSE 全文见 `LICENSE`）
- 上游地址：https://poloclub.github.io/transformer-explainer/

## 我们改了什么

1. **模型地址指向上游 CDN**：模型是完整 GPT-2 导出的 ONNX，共 63 个 10MB 分片
   （约 630MB），不放进本仓库，改为从上游 GitHub Pages 拉取
   （`https://poloclub.github.io/transformer-explainer/model-v2/gpt2.onnx.partN`）。
   分片下载后写入浏览器 Cache API，之后再打开直接命中缓存。
2. **取分片改成限流 + 重试**：上游一次并发 63 个请求，首波几个会被丢弃
   （实测 part0/1/2 丢失），导致模型永远拼不齐、页面一直停在空白。
   改为 6 路并发，每个分片最多重试 4 次、失败后递增退避。
3. **换成我们自己的页头**：藏掉上游的黑色 logo 与右上角 arXiv / YouTube / GitHub
   图标，改用与「神经网络游乐场」「数据可视化实验室」同一套的浅色课程横幅
   （中文标题 + 一行说明 + 返回课程主页）。
4. **只保留可交互的部分**：隐藏上游的讲解段落与配图（`p / ol / ul / .figure /
   .figure-caption`），保留标题层级与所有交互组件（顶部的输入框 + Generate +
   Temperature 滑块，以及正文的 206 个 SVG / Canvas 图形：注意力矩阵、Q/K/V、
   位置编码、残差连接等）。
5. **居中**：`.article` 限宽 1180px 水平居中。
6. **加中文署名条**：页面底部固定一条中文说明，写明改编自 Transformer Explainer、
   原作者姓名、论文链接与「返回课程主页」入口（MIT 许可要求保留版权声明）。
7. **未翻译**：交互界面与提示仍是英文。

## 文件构成

```
index.html              页面外壳（含我们的横幅、署名条与隐藏讲解文字的 CSS）
_app/immutable/         上游 SvelteKit 构建产物
  nodes/2.*.js          主包（内含 onnxruntime-web 与分片下载逻辑，我们改过）
  chunks/ *.js          组件与依赖
  assets/               字体、图片
consent-form.pdf        上游原样保留
robots.txt / favicon.png
```

未收录：`model-v2/`（630MB 模型，改为运行时从上游拉取）、
`ort-wasm-*.wasm`（约 23MB，运行时从 jsdelivr 取 onnxruntime-web@1.23.0）。

## 已知限制

- **首次打开要下约 630MB**。课堂大屏或机房网络下可能明显慢，甚至失败；
  失败时刷新页面即可（已下载的分片在缓存里，不会重下）。
- 打开后能做什么：顶部输入框写一句话 → Generate → 逐词看生成过程；
  正文各节点开可看注意力权重、Q/K/V 数值、位置编码等。
