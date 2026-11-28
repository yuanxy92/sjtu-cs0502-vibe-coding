# 循环网络讲解器（RNN Dynamics Visualizer）

课程主页卡片「神经网络游乐场与讲解器」里的第 04 个入口。

- **线上地址**：`http://pi.xiaoyunyuan.net/sjtu-cs0502-vibe-coding/projects/rnn-explainer/index.html`
- **本目录内容**：`index.html` + `assets/`（构建产物）、`src-upstream/`（上游原始源码）、`LICENSE`、`NOTICE.md`

## 这是什么

一个把 RNN 的时间展开与 BPTT 摊开看的交互工具，六个页签：

| 页签 | 内容 |
|---|---|
| Unrolled Sequence | 展开后的计算图：每个时间步的输入、隐藏状态（内嵌迷你条形图）、输出与损失；共享权重 `W_xh / W_hh / W_hy` 标在连线上 |
| **BPTT & Gradients** | **梯度范数剖面 \|\|∂L/∂h_t\|\|（从右往左）**，自动诊断"梯度消失 / 爆炸 / 健康"，并给出链式法则逐步拆解 |
| Folded Architecture | 折叠视图与展开视图对照，讲参数共享 |
| Phase Space Trajectory | 隐藏状态在相平面上的轨迹 + 向量场 |
| Matrix Math Deep Dive | `W_xh·x_t`、`W_hh·h_{t-1}` 的逐行逐列点积 |
| Explain ρ | 复平面上 W_hh 的特征值与单位圆，直观解释谱半径 ρ 与梯度消失/爆炸的因果 |

七个预设场景：Balanced Working Memory、Vanishing Gradient Trap、Exploding Gradient Risk、
Memory Latch（恒等 W_hh）、State Space Oscillator、NLP Sentiment Stream、Sine Wave Forecaster、
Binary Bit Parity Counter。

## 课堂可用的教学点

- **梯度消失不是玄学**：把 ρ(W_hh) 拖到单位圆内侧，梯度就一路衰减到 0；拖到外侧，就一路爆炸。
- **BPTT 到底在算什么**：`||∂L/∂h_t||` 的剖面图 + 链式法则拆解，把"反向传播穿过时间"变成可视的。
- **为什么 LSTM 需要门**：对照 ρ ≈ 1 的"记忆锁定"预设，看信号如何被原样带过很多步。

## 我们改了什么

只有部署必需的三处，**没动任何数学逻辑与界面功能**：加课程横幅与署名条、换 CS 图标、
构建时用 `--base=./` 让资源走相对路径。完整清单见 `NOTICE.md`。

## 从源码重建

```bash
git clone --depth 1 https://github.com/snerur/RNN-Visualization.git
cd RNN-Visualization
npm install --legacy-peer-deps        # 上游 package.json 的 peer 依赖有冲突，必须加这个
npm run build -- --base=./            # 相对路径，便于放在子目录
# 然后把 dist/ 的内容拷到本目录，并把本目录 index.html 跑一遍补丁：
#   node ../../../labs/rnn-explainer/patch.cjs index.html
```

> 上游仓库的 `npm install` 默认会因 peer 依赖冲突失败（vite 8 + @vitejs/plugin-react 6 + esbuild 0.25/0.28），
> `--legacy-peer-deps` 可绕过。

## 许可

上游 README 声明 Apache-2.0，但仓库未附 `LICENSE` 文件；本目录 `LICENSE` 为 Apache-2.0 全文，
`src-upstream/` 是未经修改的上游源码。我们已向作者发出许可确认询问。
