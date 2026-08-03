# CS0502 · 建议提示词 / Suggested prompts

每次只完成一个任务。把整个项目资料文件夹交给你的 AI coding agent，再使用下面相应的提示词。不要改动 `data/` 中的地图数据；其余项目文件可按需要迭代。

Complete one task at a time. Give the whole project-materials folder to your AI coding agent, then use the relevant prompt below. Never change map data under `data/`; iterate on other project files when needed.

## 1. 地点查找 / Place search

```text
阅读 data/campus_pois.json、web/app.js 和 web/student-tasks.js。完成 findPlaces(query, pois, options) 的基础部分：根据 options.algorithm 实现数组顺序查找、单链表顺序查找、名称前缀二分查找和精确名称 BST。保留返回结构 { matches, comparisons, structure }，并在完成后用真实地点名和不存在的关键字测试，解释每种结构的时间与空间复杂度。
```

```text
Read data/campus_pois.json, web/app.js, and web/student-tasks.js. Complete the core part of findPlaces(query, pois, options): according to options.algorithm, implement linear array search, singly linked-list search, prefix binary search, and exact-name BST search. Preserve { matches, comparisons, structure }; test with a real place and a missing query, then explain time and space complexity for each structure.
```

## 2. 图、BFS 与 Dijkstra / Graph, BFS, and Dijkstra

```text
完成 findPath(graphPayload, startNodeId, endNodeId, options)。从 graphPayload.nodes 和 graphPayload.edges 建立可用的图表示，实现 BFS（最少边数）以及以 edge.length_m 为权重的 Dijkstra（最短距离）。你可以让 agent 自行实现，也可以选择合适的图算法库；请在报告中解释这一选择。返回 { path, distance_m, visited_count, algorithm }，让网页自动画出路线。完成后解释 BFS 为什么不保证步行距离最短。
```

```text
Complete findPath(graphPayload, startNodeId, endNodeId, options). Build a usable graph representation from graphPayload.nodes and graphPayload.edges, then implement BFS (fewest edges) and Dijkstra (shortest distance using edge.length_m). Your agent may implement these directly or choose an appropriate graph-algorithm library; explain that choice in the report. Return { path, distance_m, visited_count, algorithm } so the web app draws the route. Explain why BFS does not guarantee the shortest walking distance.
```

## 3. 高级算法加分 / Advanced-algorithm bonus

### 哈希表 / Hash table

```text
扩展 findPlaces(query, pois, options)，为 options.algorithm === 'hash' 实现精确名称哈希表查找。说明哈希表的原理、冲突处理策略、优势和局限，并与 BST 在相同地点查询上的比较次数或运行表现进行对比。保留现有返回格式。
```

```text
Extend findPlaces(query, pois, options) by implementing exact-name hash-table search for options.algorithm === 'hash'. Explain the hash-table principle, collision-handling strategy, strengths, and limitations; compare it with the BST using comparisons or observed performance on the same place queries. Preserve the existing return format.
```

### A* / A*

```text
在现有 Dijkstra 的基础上实现 A*。启发函数 h(n) 使用节点 x_m、y_m 到终点的欧氏距离，f(n)=g(n)+h(n)。保持地图数据不变；可自行实现或使用合适的图算法库，并在报告中说明技术选择。分别运行 Dijkstra 与 A*，记录路径距离和访问节点数，并写出为什么该启发函数不会高估实际道路距离的理论解释。
```

```text
Implement A* on top of the existing Dijkstra solution. Use the Euclidean distance from node x_m, y_m to the destination as h(n), with f(n)=g(n)+h(n). Keep map data unchanged; implement it directly or use an appropriate graph-algorithm library, then explain the technical choice in the report. Run both Dijkstra and A*, record route distance and visited-node counts, and explain theoretically why this heuristic does not overestimate the actual road distance.
```

## 4. Web 优化加分 / Web-app improvement bonus

```text
在不破坏现有功能的前提下，审视这个校园寻路网页的可视化、交互、反馈和可访问性。提出三项有价值的改进，先说明取舍，再实现其中最重要的一项。保持地图数据与算法接口兼容；完成后用截图或录屏验证改进。
```

```text
Without breaking existing functionality, review the campus-pathfinding web app for visualization, interaction, feedback, and accessibility. Propose three worthwhile improvements, explain the trade-offs first, then implement the most important one. Keep map data and algorithm interfaces compatible; verify the improvement with screenshots or a recording.
```
