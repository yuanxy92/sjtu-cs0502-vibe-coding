# 上海交大闵行校园寻路：Vibe Coding 项目 / SJTU Minhang Campus Pathfinding: Vibe Coding Project

请保持 `data/` 中的地图数据不变。你可以与 AI coding agent 一起修改项目文件，也可以选择合适的图算法库；在报告中说明你的技术选择及其影响。

## 已提供

- `campus_graph.json`：道路节点和边；每条边有 `length_m`。
- `campus_pois.json`：命名地点及其对应的 `graph_node_id`。
- `web/index.html`：可直接双击打开的地图界面。
- `web/app.js`：渲染器；它调用 `CampusTasks.findPlaces()` 与 `CampusTasks.findPath()`，并把所选算法通过 `options.algorithm` 传入。

## 任务顺序

1. **数组地点查找**：选择“数组顺序查找”，线性扫描地点数组，支持包含匹配并报告比较次数。
2. **链表地点查找**：选择“链表顺序查找”，自己建立单链表后完成同样的包含匹配。
3. **二分查找**：选择“二分查找”，先按名称排序，再实现名称前缀匹配。
4. **二叉搜索树**：选择“二叉搜索树”，按名称建 BST 并实现精确名称查找。
5. **哈希表（加分）**：选择“哈希表”，实现精确名称查找，并与 BST 比较次数。
6. **图的邻接表与 BFS / DFS**：由 `graphPayload.nodes`、`graphPayload.edges` 构造无向邻接表并找路径。
7. **Dijkstra**：用 `length_m` 求最短步行距离。
8. **高级算法（加分）**：例如 A*，可使用节点 `x_m`、`y_m` 的直线距离作启发函数；与 Dijkstra 比较访问节点数、路径距离和实际运行表现。

网页会把 `findPath` 返回的 `path` 画成红线，并显示路径长度；“运行寻路”按钮才会调用算法。

---

## English

Keep the map data under `data/` unchanged. You may work with an AI coding agent on the project files and may choose an appropriate graph-algorithm library; explain the technical choice and its effects in your report.

### Provided

- `campus_graph.json`: road nodes and edges; each edge has `length_m`.
- `campus_pois.json`: named places and their `graph_node_id`.
- `web/index.html`: a map interface that can be opened by double-clicking.
- `web/app.js`: the renderer. It calls `CampusTasks.findPlaces()` and `CampusTasks.findPath()` and passes the selected algorithm through `options.algorithm`.

### Task sequence

1. **Array place search**: implement a linear scan with substring matching and report comparisons.
2. **Linked-list place search**: build a singly linked list and implement the same substring match.
3. **Binary search**: sort by name and implement prefix matching with binary search.
4. **Binary search tree**: build a BST by name and implement exact-name search.
5. **Hash table (bonus)**: implement exact-name search and compare it with the BST.
6. **Adjacency list and BFS / DFS**: construct an undirected adjacency list from `graphPayload.nodes` and `graphPayload.edges`, then find a path.
7. **Dijkstra**: use `length_m` to find the shortest walking distance.
8. **Advanced algorithms (bonus)**: for example, use A* with straight-line distance from `x_m`, `y_m` as the heuristic; compare visited-node counts, route distances, and observed behavior with Dijkstra.

The page draws the `path` returned from `findPath` in red and shows its length. Algorithms run only after clicking “Run pathfinding.”
