# SJTU CS0502 · Vibe Coding

Course website and open teaching materials for **CS0502: Introduction to AI and Computer Science** at Shanghai Jiao Tong University.

Students learn computer science by directing AI coding agents to build, test, inspect, and improve working systems. The projects intentionally increase in freedom: the first provides a detailed starter prompt; later projects expect students to develop their own prompts and iteration strategy.

**Course site:** https://yuanxy92.github.io/sjtu-cs0502-vibe-coding/

## What's here

- `index.html` — the standalone course website, including bilingual project briefs and tutorial links.
- `assets/` — course-only CSS, JavaScript, images, and icon runtime; these have no dependency on the OpticAI Lab homepage.
- `projects/turing-machine/` — three independently generated Turing Machine examples.
- `projects/data-structure/` — Campus Path Lab starter materials and an intentionally incomplete visualization.
- `projects/peer-drop/` — PeerDrop starter materials, interface reference, and local-network setup guide.
- `projects/ai-project/` — choose-one-of-three AI project brief and student materials.

## Course projects

1. **Turing Machine** — build and explain an inspectable machine with an AI coding agent.
2. **Campus Path Lab** — improve a campus graph visualization and implement pathfinding algorithms.
3. **PeerDrop** — build a trusted-LAN file-transfer prototype that demonstrates encryption, authentication, and integrity checks.
4. **Foundations of Artificial Intelligence** — choose one project in data mining, deep learning, or small language models.

See the course site for current requirements, downloadable materials, and tutorial videos.

## Run locally

This repository is a static site. Clone it and open `index.html` in a browser, or serve it with any local static-file server. No build process or package installation is required.

```bash
git clone https://github.com/yuanxy92/sjtu-cs0502-vibe-coding.git
cd sjtu-cs0502-vibe-coding
open index.html
```

## Publish with GitHub Pages

In the repository's **Settings → Pages**, select **Deploy from a branch**, then choose the `main` branch and the repository root (`/`). GitHub Pages can serve this site directly because the entry point is a static `index.html` file.

## Contributing

Issues and pull requests are welcome for typos, broken links, accessibility fixes, and improvements to the course website or starter materials. Please do not publish student submissions, private data, API keys, access tokens, or other sensitive information.

The project briefs are course materials: changes to assignment requirements should be discussed in an issue before submitting a pull request.

## Attribution and license

Unless a nested file specifies otherwise, the code and website are released under the [MIT License](LICENSE). Datasets and third-party projects remain subject to their respective licenses and attribution notices.

Course design and materials: Xiaoyun Yuan / OpticAI Lab, Shanghai Jiao Tong University.
