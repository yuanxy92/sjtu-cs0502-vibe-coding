# CNN Explainer（本地部署版）

本目录是 [poloclub/cnn-explainer](https://github.com/poloclub/cnn-explainer) 的**构建产物**，
部署在课程主页下作为课程材料。

- 上游项目：**CNN Explainer** — Zijie J. Wang, Robert Turko, Omar Shaikh, Haekyu Park,
  Nilaksh Das, Fred Hohman, Minsuk Kahng, Duen Horng Chau（Georgia Tech / Oregon State）
- 论文：[*CNN Explainer: Learning Convolutional Neural Networks with Interactive Visualization*,
  IEEE TVCG 2020](https://arxiv.org/abs/2004.15004)
- 许可：**MIT**（上游 LICENSE 全文见 `LICENSE`）
- 上游地址：https://poloclub.github.io/cnn-explainer/

## 我们改了什么

1. **路径相对化**：上游构建产物里写死了 `/cnn-explainer/...` 的绝对路径，改成相对路径，
   使其能在课程站点的 `projects/cnn-explainer/` 下正常工作。
2. **换成我们自己的页头**：藏掉上游那条黑色标题栏（角上的 arXiv / YouTube / GitHub 外链
   也在里面）与推荐位组件，改用与「神经网络游乐场」「数据可视化实验室」同一套的
   浅色课程横幅（中文标题 + 一行说明 + 返回课程主页）。
3. **去掉统计**：移除 Google Analytics（`googletagmanager`）。
4. **只保留可交互的部分**：隐藏标题、段落、图注、示意图与视频区块，只留
   `div.overview`（网络总览图）与 `#detailview-container`（逐层讲解器）；
   因此也没有随页面发布 `assets/figures/*.gif` 那 10MB 的演示动画。
5. **居中**：交互部分统一水平居中（`.svelte-1avhf6` 限宽 1180px 居中，
   总览图与讲解器各自 `margin: 0 auto`）。
6. **加中文署名条**：页面底部固定一条中文说明，写明改编自 CNN Explainer、原作者姓名、
   论文链接与「返回课程主页」入口（MIT 许可要求保留版权声明）。
7. **未翻译**：交互界面与提示仍是英文。

## 文件构成

```
index.html              页面外壳（含我们的署名条与隐藏讲解的 CSS）
bundle.js / bundle.css  上游构建产物（Rollup + Svelte）
global.css
assets/data/            模型权重（model.json + group1-shard1of1.bin + nn_10.json）
assets/img/             交互用到的图片与图标
assets/figures/         讲解配图（小 PNG 保留；10MB 的 GIF 动画未收录）
assets/font/            字体
```

## 依赖

页面会从 CDN 加载 d3 v5、TensorFlow.js 1.0、MathJax、Bulma、Font Awesome 与
smooth-scroll —— **需要联网**（与上游行为一致）。

## 重新拉取 / 更新

```bash
cd labs/playground-mlp
node tmp/fetch-cnn-explainer.cjs   # 从上游 gh-pages 分支拉构建产物
node tmp/patch-cnn-explainer.cjs   # 改路径、去统计、加署名条
```

## 换模型

上游支持替换权重与类别名（架构固定为 Tiny-VGG）：
用 `tiny-vgg/tiny-vgg.py` 训练 → `tensorflowjs_converter --input_format keras …`
→ 把 `group1-shard1of1.bin` 与 `model.json` 放进 `assets/data/` → 改
`src/config.js` 的 `classLists`（在 `assets/data/nn_10.json` 里对应类别名）。
详见上游 [issue #8](https://github.com/poloclub/cnn-explainer/issues/8)。
