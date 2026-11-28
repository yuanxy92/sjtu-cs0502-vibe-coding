# NOTICE

## 改编来源

- **上游项目**：RNN Dynamics Visualizer — https://github.com/snerur/RNN-Visualization
- **原作者**：Sridhar Nerur（GitHub: `snerur`）
- **许可**：上游 README 声明为 **Apache License 2.0**；上游仓库在部署时（2026-11-28 核对）
  **尚未包含 `LICENSE` 文件**，本目录的 `LICENSE` 为标准 Apache-2.0 全文。
  我们已就此向作者发出许可确认询问（见下方"许可确认"），在收到回复前按 README 声明的
  Apache-2.0 处理。
- **上游提交**：部署时使用上游 `main` 分支提交 `6957c47`（"feat: scaffold RNN interactive visualizer project"）。

## 我们做了什么改动

改动**仅限部署需要**，不触碰任何数学逻辑、可视化行为与界面功能：

1. `vite.config.ts` **未修改**，改为在构建时传 `--base=./`，让资源以相对路径引用
   （原构建产物用绝对路径 `/assets/...`，放进子目录会 404）。
2. 构建产物 `index.html` 加了三样东西（见 `../../labs/rnn-explainer/patch.cjs`）：
   - 课程统一的 CS 图标（tab 页图标）；
   - 顶部课程横幅（浅色，与「神经网络游乐场」「数据可视化实验室」同一套样式）；
   - 底部固定署名条（原作者、许可、上游链接、返回课程主页）。
3. `html lang` 由 `en` 改为 `zh-CN`。

**没有**做的事：没有翻译界面文字、没有修改 React 源码、没有改动任何数学计算、
没有删减任何一个视图或控件。

## 对应源码

本目录 `src-upstream/` 是**未经修改**的上游源码（`src/`、`index.html`、
`package.json`、`vite.config.ts`、`tsconfig.json`），随发布物一并提供，
满足 Apache-2.0 §4 对"对应源码"的要求。

重建方式见 `README.md`。

## 许可确认

已向上游仓库开 issue 询问许可确认（走 GitHub Issues，作者未公开邮箱）：
https://github.com/snerur/RNN-Visualization/issues
草稿见 `../../outputs/RNN讲解器-许可询问-GitHub-Issue草稿.md`。

## 第三方组件

构建产物中包含以下开源组件（均由上游引入，我们未改动）：

- React 19、React DOM（MIT）
- Vite 8（MIT）、esbuild（MIT）
- Tailwind CSS v4（MIT）、@tailwindcss/vite（MIT）
- lucide-react（ISC）
- motion（MIT）
- Google Fonts：Outfit / Plus Jakarta Sans / JetBrains Mono（SIL Open Font License 1.1，运行时从 CDN 加载）
