# SJTU CS0502 · Vibe Coding

Course website and open teaching materials for **CS0502: Introduction to AI and Computer Science** at Shanghai Jiao Tong University.

Students learn computer science by directing AI coding agents to build, test, inspect, and improve working systems. The projects intentionally increase in freedom: the first provides a detailed starter prompt; later projects expect students to develop their own prompts and iteration strategy.

**Course site:** https://yuanxy92.github.io/sjtu-cs0502-vibe-coding/

## What's here

- `index.html` — the standalone course website, including bilingual project briefs and tutorial links.
- `assets/` — course-only CSS, JavaScript, images, and icon runtime; these have no dependency on the OpticAI Lab homepage.
- `projects/turing-machine/` — three independently generated Turing Machine examples.
- `projects/data-structure/` — Campus Path Lab starter materials and an intentionally incomplete visualization.
- `projects/algorithm-exploration-lab/` — classroom visualizer for DFS, BFS, Dijkstra, and A*.
- `projects/round-robin-lab/` — offline CPU Round Robin simulator with animated queue transitions, the complete Chinese requirements document, and acceptance checks.
- `projects/deadlock-lab/` — offline locks and deadlock simulator with a simple animated print-room example, atomic-operation comparison, two-lock deadlock, teacher guide, and model checks.
- `projects/routing-lab/` — offline Dijkstra and link-state routing simulator with selectable rounds, five side-by-side host and router tables, router-failure recovery, packet forwarding, an offline download, and model checks.
- `projects/rsa-lab/` — offline textbook-RSA classroom demo with selectable p and q, five-step key generation, public-key encryption and private-key decryption, plus a timed trial-division cracking ladder that recovers D and decrypts the ciphertext.
- `projects/signature-lab/` — companion offline MD5 and digital-signature lab: hash text or a file, sign with the sender's private key, encrypt with the receiver's public key, decrypt, recompute the digest, and verify; tampering with one byte makes verification fail.
- `projects/association-lab/` — offline frequent-itemset and association-rule lab for Slide13 p26–38 (entry ① of homepage card 10, Data Mining Lab): courseware 4-basket TDB and 20-basket constructed example on a full 32-node lattice, MovieLens 330 baskets and Groceries 600 receipts through Apriori join/prune/count/select with a candidate ledger, rule generation at minconf with hand-computed confidence monotonicity.
- `projects/clustering-lab/` — offline clustering lab for Slide13 p42–73 (entry ② of homepage card 10): a K-Means beat-by-beat step player on the courseware 50-neighbourhood breakfast supply points (Euclidean/Manhattan/cosine selection, per-metric substitution inspectors, playback, per-beat loss ledger), plus a combined data-and-algorithm playground where sixteen typical datasets run under either K-Means or DBSCAN via an algorithm dropdown on the same data and seed — adjustable K, separate data/init seeds, random or manual initials, good/bad-init presets reproducing p62, distance-contrast examples (document word frequencies: Euclidean splits by length, cosine by topic; diagonal-init grid: Euclidean straight boundary vs Manhattan staircase), DBSCAN core/border/noise classification with per-point cluster-growth beats, Eps/MinPts sliders, a full neighbourhood-distance inspector, a live two-way K-Means/DBSCAN contrast on the hand-calc example with two stray points, adjustable playback speed, and noise drawn in black so it never clashes with the courseware red cluster.
- `projects/clustering-quiz/` — offline clustering class quiz (entry ③ of homepage card 10, Data Mining Lab; also linked from a prominent button in the clustering lab's tab bar): four hand-computable questions with integer coordinates written out directly — two K-Means (fixed initial centers, Euclidean; full d² substitution tables, mean-update formula cards, reassignment highlight, convergence check, per-point loss ledger; all arithmetic integer with no distance ties: question 1 converges in 2 rounds with loss 16, question 2 in 3 rounds with one point changing cluster, loss 46) and two DBSCAN (Eps/MinPts given, neighbourhood includes self and d=Eps counts; full d² matrix with neighbourhood cells highlighted, per-point core/border/noise verdicts, cluster expansion, black dashed noise: question 3 yields clusters {A,B,C,G}/{D,E,F} plus noise H with a border point that does not expand, question 4 contrasts Eps=5 — six cores plus border point C absorbed through core A (A–C d²=25 exactly at the radius), one bridged cluster of seven — against Eps=3 — cluster {A,B,G,D,E} plus noise C,F — demonstrating parameter sensitivity). Answers stay collapsed until the teacher reveals them step by step.
- `projects/decision-tree-lab/` — offline decision-tree lab for Slide13 p78–94 (entry ④ of homepage card 10): a 13-beat step player replaying the courseware donation example exactly (11 records, error-rate tie 2/11 broken by Gini 0.260 vs 0.297, the p88 blackboard tree with its three stop conditions, Cindy(27, 37000) → 不捐赠 with a green path), plus a live experiment tab — four datasets (donation, play-tennis weather, card approval, noisy 2-D blobs) × three split criteria (Gini, error rate, information gain labelled as extension) × slide-given or auto-scanned midpoint thresholds, depth and min-samples sliders, a node inspector with full impurity substitutions and the complete candidate table, a along-the-tree prediction tracer with stale-sample detection, and an overfitting showcase (min-samples 4 leaves noise in majority leaves, min-samples 2 memorises it). All numbers regression-tested; single-file offline build.
- `projects/peer-drop/` — PeerDrop starter materials, interface reference, and local-network setup guide.
- `projects/ai-project/` — choose-one-of-three AI project brief and student materials.

## Course projects

1. **Turing Machine** — build and explain an inspectable machine with an AI coding agent.
2. **Campus Path Lab** — improve a campus graph visualization and implement pathfinding algorithms.
3. **PeerDrop** — build a trusted-LAN file-transfer prototype that demonstrates encryption, authentication, and integrity checks.
4. **Foundations of Artificial Intelligence** — choose one project in data mining, deep learning, or small language models.

See the course site for current requirements, downloadable materials, and tutorial videos.

## Classroom projection readability

Course pages are designed for students viewing a classroom projector from a distance. Keep primary instructions and explanations at 20px or larger, and labels, tables, controls, and other supporting text at 18px or larger. Use wrapping, scrolling, or taller panels to fit content; never shrink text to fit more on screen.

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
