const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaults = {
  explore: {
    title: "图探索：从 A 出发", subtitle: "沿一条路径不断深入，遇到尽头再回溯", directed: false, weighted: false, start: "A", goal: "F",
    nodes: [{ id: "A", x: 140, y: 72 }, { id: "C", x: 360, y: 72 }, { id: "E", x: 580, y: 72 }, { id: "B", x: 140, y: 254 }, { id: "D", x: 360, y: 254 }, { id: "F", x: 580, y: 254 }],
    edges: [{ from: "A", to: "B", w: 1 }, { from: "A", to: "C", w: 1 }, { from: "B", to: "D", w: 1 }, { from: "D", to: "E", w: 1 }, { from: "D", to: "F", w: 1 }],
  },
  shortest: {
    title: "最短路径：从 S 到 t", subtitle: "每轮确定当前距离最小的未访问顶点，再松弛出边", directed: true, weighted: true, start: "s", goal: "t",
    nodes: [{ id: "s", x: 80, y: 158 }, { id: "b", x: 235, y: 70 }, { id: "c", x: 235, y: 246 }, { id: "d", x: 405, y: 246 }, { id: "e", x: 575, y: 70 }, { id: "t", x: 735, y: 158 }],
    edges: [{ from: "s", to: "b", w: 5 }, { from: "s", to: "c", w: 6 }, { from: "b", to: "c", w: 4 }, { from: "b", to: "d", w: 7 }, { from: "c", to: "d", w: 1 }, { from: "d", to: "e", w: 2 }, { from: "d", to: "t", w: 9 }, { from: "e", to: "t", w: 3 }],
  },
};
const edgeKey = (a, b) => `${a}>${b}`;
const copy = (obj) => JSON.parse(JSON.stringify(obj));
const state = { graphKey: "explore", graph: copy(defaults.explore), algorithm: "dfs", steps: [], cursor: 0, timer: null };

function adjacency(graph) {
  const adj = Object.fromEntries(graph.nodes.map(n => [n.id, []]));
  for (const edge of graph.edges) {
    if (!adj[edge.from] || !adj[edge.to]) continue;
    adj[edge.from].push({ node: edge.to, edge });
    if (!graph.directed) adj[edge.to].push({ node: edge.from, edge });
  }
  for (const id of Object.keys(adj)) adj[id].sort((a, b) => a.node.localeCompare(b.node));
  return adj;
}
function getEdge(graph, a, b) { return graph.edges.find(e => (e.from === a && e.to === b) || (!graph.directed && e.from === b && e.to === a)); }

function makeStep(data) { return { visited: [], frontier: [], stack: [], settled: [], distances: {}, previous: {}, treeEdges: [], consideredEdge: null, pathNodes: [], log: "等待开始", operation: "状态准备", operationNode: null, stackAction: null, frontierAction: null, ...data }; }
function buildDfs(graph) {
  const adj = adjacency(graph), visited = new Set(), stack = [], tree = [], steps = [];
  steps.push(makeStep({ type: "ready", node: null, action: "初始化：所有顶点都未访问", operation: "初始化递归栈", explain: "从起点开始。DFS 沿一条路深入；遇到尽头后，沿递归调用栈返回。", line: 1, stack: [], log: "准备开始" }));
  const walk = (node, parent = null) => {
    visited.add(node); stack.push(node);
    if (parent) tree.push(edgeKey(parent, node));
    steps.push(makeStep({ type: "visit", node, action: `${parent ? `沿 ${parent}—${node} 到达 ${node}` : `从起点进入 ${node}`}，标记并压栈`, operation: `压栈 · push(${node})`, operationNode: node, stackAction: "push", explain: `进入 DFS(${node})：先把 ${node} 标记为已访问，再压入递归栈。栈顶表示当前正在探索的节点。`, line: 1, stack: [...stack], visited: [...visited], treeEdges: [...tree], consideredEdge: parent ? edgeKey(parent, node) : null, log: `压入 ${node}` }));
    for (const { node: next, edge } of adj[node]) {
      if (visited.has(next)) {
        steps.push(makeStep({ type: "skip", node, action: `检查边 ${node}—${next}：${next} 已访问，跳过`, operation: "检查边 · 已访问", operationNode: next, explain: `沿高亮边查看邻居 ${next}。它已经在访问集合中，因此不重复压栈，当前栈保持不变。`, line: 3, stack: [...stack], visited: [...visited], treeEdges: [...tree], consideredEdge: edgeKey(node, next), log: `检查 ${node}—${next}：跳过` }));
        continue;
      }
      walk(next, node);
    }
    const popped = stack.at(-1);
    stack.pop();
    steps.push(makeStep({ type: "backtrack", node, action: stack.length ? `${node} 的邻居已检查完，弹出并返回 ${stack.at(-1)}` : `${node} 的探索完成，弹出递归栈`, operation: `回溯 · pop(${popped})`, operationNode: popped, stackAction: "pop", explain: stack.length ? `弹出栈顶 ${popped}，表示 DFS(${popped}) 返回；现在栈顶 ${stack.at(-1)} 恢复执行，继续检查它的其他邻居。` : `弹出最后一个调用 ${popped}。递归栈为空，起点可达的节点已经全部探索完成。`, line: 6, stack: [...stack], visited: [...visited], treeEdges: [...tree], log: stack.length ? `弹出 ${popped}，返回 ${stack.at(-1)}` : "栈清空，搜索完成" }));
  };
  walk(graph.start);
  return steps;
}
function buildBfs(graph) {
  const adj = adjacency(graph), visited = new Set([graph.start]), queue = [graph.start], dist = Object.fromEntries(graph.nodes.map(n => [n.id, Infinity]));
  const prev = {}, tree = [], steps = [];
  dist[graph.start] = 0;
  const snapshot = (overrides) => makeStep({ distances: { ...dist }, previous: { ...prev }, visited: [...visited], frontier: [...queue], treeEdges: [...tree], ...overrides });
  steps.push(snapshot({ type: "ready", node: null, action: `将起点 ${graph.start} 标记为 0 并加入队列`, operation: `入队 · enqueue(${graph.start})`, operationNode: graph.start, frontierAction: "enqueue", explain: `把起点 ${graph.start} 放到队尾并标记距离为 0。BFS 每次从队头取出节点，所以会按层向外扩展。`, line: 3, log: `队列 ← [${graph.start}]` }));
  while (queue.length) {
    const current = queue.shift();
    steps.push(snapshot({ type: "visit", node: current, action: `从队头取出 ${current}，开始检查邻居`, operation: `出队 · dequeue(${current})`, operationNode: current, frontierAction: "dequeue", explain: `移除队头 ${current}。它现在成为当前节点，接下来依次检查相邻节点。`, line: 6, log: `取出 ${current}` }));
    for (const { node: next, edge } of adj[current]) {
      if (dist[next] !== Infinity) {
        steps.push(snapshot({ type: "skip", node: current, action: `检查 ${current}—${next}：${next} 已发现，不重复入队`, operation: "检查边 · 已发现", operationNode: next, explain: `${next} 已经发现过，不再入队。BFS 在第一次发现时就得到它的最少边数距离。`, line: 8, consideredEdge: edgeKey(current, next), log: `检查 ${current}—${next}：已发现` }));
      } else {
        visited.add(next); dist[next] = dist[current] + 1; prev[next] = current; queue.push(next); tree.push(edgeKey(current, next));
        steps.push(snapshot({ type: "discover", node: current, action: `发现 ${next}：距离 ${dist[next]}，加入队尾`, operation: `入队 · enqueue(${next})`, operationNode: next, frontierAction: "enqueue", explain: `沿高亮边首次到达 ${next}，距离更新为 ${dist[current]} + 1 = ${dist[next]}。记录前驱 ${current}，再把 ${next} 放到队尾。`, line: 10, consideredEdge: edgeKey(current, next), log: `发现 ${next}，距离 ${dist[next]}` }));
      }
    }
  }
  steps.push(snapshot({ type: "done", node: graph.start, action: "队列为空，所有可达顶点都已处理", operation: "队列清空 · 搜索完成", explain: "队列现在为空。沿前驱指针反向追踪，就能还原起点到任一顶点的最少边数路径。", line: 10, log: "搜索完成" }));
  return steps;
}
function buildShortest(graph, algorithm) {
  const adj = adjacency(graph), dist = Object.fromEntries(graph.nodes.map(n => [n.id, Infinity])), prev = {}, settled = new Set(), queue = new Set(graph.nodes.map(n => n.id)), tree = [], steps = [];
  const target = graph.nodes.find(n => n.id === graph.goal);
  const scale = graph.weighted ? Math.min(...graph.edges.map(edge => { const from=graph.nodes.find(n=>n.id===edge.from),to=graph.nodes.find(n=>n.id===edge.to);const length=Math.hypot(from.x-to.x,from.y-to.y);return length?edge.w/length:Infinity; })) : 0;
  const heuristic = id => { const node=graph.nodes.find(n=>n.id===id);return algorithm==="astar"&&target?Math.hypot(node.x-target.x,node.y-target.y)*(Number.isFinite(scale)?scale:0):0; };
  const score = id => dist[id] + heuristic(id);
  dist[graph.start] = 0;
  const snapshot = (overrides) => makeStep({ distances: { ...dist }, scores:Object.fromEntries(graph.nodes.map(n=>[n.id,score(n.id)])), previous: { ...prev }, visited: [...settled], settled: [...settled], frontier: [...queue].sort((a, b) => score(a) - score(b) || a.localeCompare(b)), treeEdges: [...tree], ...overrides });
  steps.push(snapshot({ type: "ready", node: null, action: `初始化：d(${graph.start}) = 0，其余距离为 ∞`, operation: "初始化优先队列", explain: algorithm==="astar"?"A* 按 f(n)=g(n)+h(n) 排序。起点代价为 0，其余点暂不可达。":"把所有顶点放入优先队列。每轮取出暂定距离最小的顶点；边权必须非负。", line: 1, log: "初始化距离与优先队列" }));
  while (queue.size) {
    const current = [...queue].sort((a, b) => score(a) - score(b) || a.localeCompare(b))[0];
    queue.delete(current); settled.add(current);
    steps.push(snapshot({ type: "settle", node: current, action: `取出当前最小值 ${current}（${algorithm === "astar" ? `f = ${score(current)}` : `d = ${dist[current]}`}），确定该点`, operation: `取最小 · extract-min(${current})`, operationNode: current, frontierAction: "extract-min", explain: `从优先队列移除代价最小的 ${current}，将它移入已确定集合。Dijkstra 的非负边权保证该距离不会再变小。`, line: 5, log: `确定 ${current}，距离 ${dist[current]}` }));
    if (current === graph.goal) { steps.push(snapshot({ type: "done", node: current, action: `到达终点 ${current}，最短距离为 ${dist[current]}`, explain: `终点已从优先队列中取出并确定。前驱链还原路径，最短总代价为 ${dist[current]}。`, line: 5, log: `最短路：${reconstruct(prev, graph.start, current).join(" → ")}（${dist[current]}）` })); break; }
    for (const { node: next, edge } of adj[current]) {
      if (settled.has(next)) {
        steps.push(snapshot({ type: "skip", node: current, action: `检查 ${current} → ${next}：${next} 已确定`, operation: "检查边 · 目标已确定", operationNode: next, explain: `${next} 已经从优先队列取出并确定，不能再通过这条边改写它的最短距离。`, line: 8, consideredEdge: edgeKey(current, next), log: `跳过已确定顶点 ${next}` }));
        continue;
      }
      const candidate = dist[current] + edge.w, old = dist[next];
      if (candidate < old) { dist[next] = candidate; prev[next] = current; for (let i = tree.length - 1; i >= 0; i--) if (tree[i].endsWith(`>${next}`)) tree.splice(i, 1); tree.push(edgeKey(current, next)); }
      steps.push(snapshot({ type: candidate < old ? "relax" : "skip", node: current, action: candidate < old ? `松弛 ${current} → ${next}：${old === Infinity ? "∞" : old} → ${candidate}` : `检查 ${current} → ${next}：距离 ${old} 保持不变`, operation: candidate < old ? `更新距离 · d(${next}) = ${candidate}` : "保留距离 · 候选值较大", operationNode: next, explain: candidate < old ? `沿高亮边计算 ${dist[current]} + ${edge.w} = ${candidate}。新值更小，于是 ${next} 的距离标记和前驱边立即更新。` : `沿高亮边得到候选值 ${candidate}，没有小于当前距离 ${old}，距离标记和前驱边保持不变。`, line: candidate < old ? 9 : 8, consideredEdge: edgeKey(current, next), log: candidate < old ? `${next} 的距离更新为 ${candidate}` : `${next} 无须更新` }));
    }
  }
  return steps;
}
function reconstruct(previous, start, goal) { const path = [goal]; let node = goal; while (node !== start && previous[node]) { node = previous[node]; path.push(node); } return node === start ? path.reverse() : []; }
function generateSteps() {
  stopPlayback();
  const g = state.graph;
  state.steps = state.algorithm === "dfs" ? buildDfs(g) : state.algorithm === "bfs" ? buildBfs(g) : buildShortest(g, state.algorithm);
  state.cursor = 0; renderAll();
}

function renderGraph() {
  const graph = state.graph, step = state.steps[state.cursor] || makeStep({});
  $("#graph-title").textContent = graph.title;
  $("#graph-subtitle").textContent = state.algorithm === "dfs" ? "沿一条路径不断深入，遇到尽头再回溯" : state.algorithm === "bfs" ? "使用先进先出队列，按离起点的边数逐层访问" : state.algorithm === "astar" ? "综合已走代价 g(n) 与到终点的估计 h(n)" : "每次确定当前距离最小的顶点，再更新相邻点距离";
  const svgWidth = 820, svgHeight = 320;
  const defs = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#a7b8c7"/></marker></defs>`;
  const pathNodes = step.type === "done" && graph.goal ? reconstruct(step.previous || {}, graph.start, graph.goal) : [];
  const pathKeys = new Set(pathNodes.slice(1).map((n, i) => edgeKey(pathNodes[i], n)));
  const edges = graph.edges.map(e => {
    const a = graph.nodes.find(n => n.id === e.from), b = graph.nodes.find(n => n.id === e.to);
    if (!a || !b) return "";
    const key = edgeKey(e.from, e.to), reverse = edgeKey(e.to, e.from);
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,pad=graph.directed?24:0;
    const x1=(a.x+dx/length*pad)*svgWidth/820,y1=(a.y+dy/length*pad)*svgHeight/320,x2=(b.x-dx/length*pad)*svgWidth/820,y2=(b.y-dy/length*pad)*svgHeight/320;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const className = pathKeys.has(key) || pathKeys.has(reverse) ? "is-path" : step.consideredEdge === key || step.consideredEdge === reverse ? "is-considered" : step.treeEdges?.includes(key) || step.treeEdges?.includes(reverse) ? "is-tree" : "";
    return `<g><line class="edge-line ${className}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${graph.directed ? 'marker-end="url(#arrowhead)"' : ""}/>${graph.weighted ? `<text class="edge-weight" x="${mx}" y="${my - 7}" text-anchor="middle">${e.w}</text>` : ""}</g>`;
  }).join("");
  const nodeMarkup = graph.nodes.map(n => {
    const isCurrent = step.node === n.id && ["visit", "settle", "relax", "skip", "discover", "backtrack", "done"].includes(step.type);
    let cls = "graph-node";
    if (step.settled?.includes(n.id)) cls += " is-settled";
    else if (step.visited?.includes(n.id)) cls += " is-visited";
    if (isCurrent) cls += " is-current";
    if (step.frontier?.includes(n.id)) cls += " is-frontier";
    if (step.operationNode === n.id && step.operationNode !== step.node) cls += " is-operation-target";
    if (pathNodes.includes(n.id)) cls += " is-path";
    const d = step.distances?.[n.id];
    const value = d === undefined ? "" : d === Infinity ? "∞" : `${d}${state.algorithm === "astar" ? ` · f${Number(step.scores?.[n.id] ?? d).toFixed(1)}` : ""}`;
    return `<g class="${cls}" transform="translate(${n.x},${n.y})"><circle class="node-circle" r="22"/><text class="node-label" y="1">${n.id}</text>${graph.weighted || state.algorithm === "bfs" ? `<text class="node-distance" y="40">${value}</text>` : ""}</g>`;
  }).join("");
  $("#graph-canvas").innerHTML = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="${graph.title}">${defs}${edges}${nodeMarkup}</svg>`;
  renderTrace(step); renderFrontier(step); renderDistanceTable(step); renderPlayer(); renderCode(step);
  const supported = availableAlgorithms(state.graphKey);
  $$("#algorithm-picker button").forEach(button => { button.hidden = !supported.includes(button.dataset.algorithm); button.classList.toggle("is-selected", button.dataset.algorithm === state.algorithm); });
}
function renderTrace(step) {
  const list = $("#trace-list"), items = state.steps.filter(s => s.node && ["visit", "settle", "backtrack", "discover", "done"].includes(s.type));
  list.innerHTML = items.map((item, i) => `<li class="trace-item ${item === step ? "is-current" : ""}"><span class="trace-index">${i + 1}</span>${item.type === "backtrack" ? `↩${item.node}` : item.node}</li>`).join("") || `<li class="trace-item is-current">▶ 点击“下一步”开始</li>`;
  const currentIx = items.indexOf(step); if (currentIx > -1) { const el = list.children[currentIx]; el?.scrollIntoView({ block: "nearest", inline: "nearest" }); }
  $("#trace-caption").textContent = state.algorithm === "dfs" ? "包含递归返回过程" : "逐步记录节点访问";
  const stepNumber = Math.max(0, state.cursor); $("#current-step-label").textContent = `${stepNumber} / ${Math.max(0, state.steps.length - 1)}`;
  $("#current-node").innerHTML = step.node ? `<span class="node-pill">${step.node}</span>` : "—";
  $("#current-action").textContent = step.action || "选择起点，点击下一步开始";
  $("#explanation").textContent = step.explain || "选择一个起点，点击“下一步”观察算法如何展开。";
  const spotlight = $("#step-spotlight");
  const operation = $("#step-operation");
  const spotlightAction = $("#spotlight-action");
  const spotlightExplain = $("#spotlight-explain");
  if (spotlight && operation && spotlightAction && spotlightExplain) {
    operation.textContent = step.operation || ({ ready: "初始化", visit: "访问节点", discover: "发现节点", settle: "确定节点", relax: "更新距离", skip: "检查并跳过", backtrack: "回溯", done: "完成" }[step.type] || "当前操作");
    spotlightAction.textContent = step.action || "选择起点，点击下一步开始";
    spotlightExplain.textContent = step.explain || "观察图、伪代码和数据结构的同步变化。";
    spotlight.classList.remove("is-changing");
    void spotlight.offsetWidth;
    spotlight.classList.add("is-changing");
  }
  $("#line-number").textContent = step.line ? `伪代码 ${step.line}` : "伪代码";
}
function renderFrontier(step) {
  const stackMode = state.algorithm === "dfs", vals = stackMode ? step.stack || [] : step.frontier || [];
  $("#data-title").textContent = stackMode ? "递归栈" : state.algorithm === "bfs" ? "队列" : "优先队列";
  $("#data-caption").textContent = stackMode ? "栈顶在右侧" : state.algorithm === "bfs" ? "队头在左侧" : state.algorithm === "astar" ? "按 f = g + h 排序" : "按暂定距离排序";
  const actionClass = step.stackAction === "push" ? "is-pushing" : step.stackAction === "pop" ? "is-popping" : "";
  const markedNode = step.operationNode;
  const chips = vals.map((v, i) => {
    const isTop = stackMode ? i === vals.length - 1 : i === 0;
    const isMarked = v === markedNode && (step.stackAction === "push" || step.frontierAction === "enqueue");
    const isReturningTop = stackMode && step.stackAction === "pop" && isTop;
    const isAdvancing = !stackMode && (step.frontierAction === "dequeue" || step.frontierAction === "extract-min") && isTop;
    const isUpdated = !stackMode && ["relax", "skip"].includes(step.type) && v === step.operationNode;
    return `<span class="frontier-chip ${isTop ? "is-top" : ""} ${isMarked ? actionClass : ""} ${isReturningTop ? "is-returning" : ""} ${isAdvancing ? "is-advancing" : ""} ${isUpdated ? "is-updated" : ""}">${v}</span>`;
  }).join("") || `<span class="empty-state">${state.cursor === 0 ? "尚未开始" : "当前为空"}</span>`;
  $("#frontier-view").innerHTML = chips;
  $("#inspector-frontier").innerHTML = chips;
  const op = $("#stack-operation");
  if (op) {
    const active = stackMode && step.stackAction;
    op.hidden = !active;
    op.className = `stack-operation ${step.stackAction === "push" ? "is-push" : step.stackAction === "pop" ? "is-pop" : ""}`;
    op.innerHTML = active ? `<span class="stack-operation-symbol">${step.stackAction === "push" ? "↑" : "↓"}</span><span><strong>${step.stackAction === "push" ? `push(${step.operationNode}) · 压入栈顶` : `pop(${step.operationNode}) · 弹出栈顶`}</strong><small>${step.stackAction === "push" ? "递归进入这个节点，等待它完成后再返回" : vals.length ? `函数返回，恢复执行新的栈顶 ${vals.at(-1)}` : "递归调用全部返回，栈已清空"}</small></span>` : "";
  }
  $("#frontier-title").textContent = `数据结构 · ${stackMode ? "栈" : state.algorithm === "bfs" ? "队列" : "优先队列"}`;
  $("#frontier-order").textContent = stackMode ? "后进先出" : state.algorithm === "bfs" ? "先进先出" : "最小值优先";
}
function renderDistanceTable(step) {
  const has = state.algorithm === "bfs" || ["dijkstra", "astar"].includes(state.algorithm);
  $("#distance-head").innerHTML = has ? `<tr>${state.graph.nodes.map(n => `<th>${n.id}</th>`).join("")}</tr>` : "";
  $("#distance-body").innerHTML = has ? `<tr>${state.graph.nodes.map(n => { const d = step.distances?.[n.id]; return `<td class="${step.settled?.includes(n.id) ? "is-settled" : step.node === n.id ? "is-current" : ""}">${d === undefined || d === Infinity ? "∞" : d}</td>`; }).join("")}</tr>` : `<tr><td colspan="${state.graph.nodes.length}">DFS 通过递归栈记录待返回的路径</td></tr>`;
}
function renderPlayer() {
  const total = Math.max(1, state.steps.length - 1);
  $("#step-count").textContent = `步骤 ${state.cursor} / ${Math.max(0, state.steps.length - 1)}`;
  $("#step-track").innerHTML = Array.from({ length: Math.min(total + 1, 24) }, (_, i) => { const ix = Math.round(i * total / (Math.min(total + 1, 24) - 1 || 1)); return `<button class="track-point ${ix < state.cursor ? "is-done" : ""} ${ix === state.cursor ? "is-current" : ""}" data-jump="${ix}" type="button" aria-label="跳到第 ${ix} 步"></button>`; }).join("");
  $("#prev-step").disabled = state.cursor === 0; $("#next-step").disabled = state.cursor >= state.steps.length - 1;
}
function renderCode(step) {
  const code = state.algorithm === "dfs" ? [[1,"visited(v) = true"],[2,"for each neighbor u of v"],[3,"if visited(u) = false"],[4,"    DFS(G, u)"],[6,"return / backtrack"]] : state.algorithm === "bfs" ? [[3,"dist[s] = 0; Q ← [s]"],[5,"while Q is not empty"],[6,"    u ← dequeue(Q)"],[8,"    if dist[v] = ∞"],[9,"        enqueue(Q, v)"],[10,"        dist[v] ← dist[u] + 1"]] : state.algorithm === "astar" ? [[1,"g[s] = 0; open ← {s}"],[5,"u ← argmin(g[u] + h[u])"],[7,"for each edge (u, v)"],[8,"    if g[v] > g[u] + w(u,v)"],[9,"        update g[v], f[v], parent[v]"]] : [[1,"d[s] = 0; Q ← V"],[5,"u ← EXTRACT-MIN(Q)"],[6,"S ← S ∪ {u}"],[7,"for each edge (u, v)"],[8,"    if d[v] > d[u] + w(u,v)"],[9,"        d[v] ← d[u] + w(u,v)"]];
  $("#code-snippet").innerHTML = code.map(([line, text]) => `<span class="code-line ${step.line === line ? "is-active" : ""}">${line}. ${text}</span>`).join("");
}
function comparisonData(graph) {
  if (graph.directed && graph.weighted) {
    return ["dijkstra", "astar"].map(id => {
      const last = buildShortest(graph, id).at(-1);
      const path = last?.previous ? reconstruct(last.previous, graph.start, graph.goal) : [];
      const name = id === "astar" ? "A*" : "Dijkstra";
      const order = path.length ? `${path.join(" → ")} · ${last.distances?.[graph.goal] ?? ""}` : "按累计权重更新距离";
      return {
        id,
        title: name,
        subtitle: id === "astar" ? "启发式最短路径" : "单源最短路径",
        order,
        note: id === "astar" ? "按 g(n)+h(n) 选择顶点；启发值不高估剩余代价时可保证最优。" : "每轮确定暂定距离最小的顶点；要求边权非负。",
      };
    });
  }
  const dfs = buildDfs(graph).filter(s => s.type === "visit").map(s => s.node);
  const bfs = buildBfs(graph).filter(s => s.type === "visit").map(s => s.node);
  const d = buildShortest(graph, "dijkstra").at(-1), shortest = d?.previous ? reconstruct(d.previous, graph.start, graph.goal) : [];
  return [
    { id:"dfs", title:"DFS", subtitle:"深度优先搜索", order:dfs.join(" → "), note:"优先深入；可能先走较长的路线。" },
    { id:"bfs", title:"BFS", subtitle:"广度优先搜索", order:bfs.join(" → "), note:graph.weighted ? "按边数找最短路，不一定按总权重最短。" : `最少边数到 ${graph.goal}：${reconstruct(buildBfs(graph).at(-1).previous || {},graph.start,graph.goal).join(" → ") || "无路可达"}` },
    { id:"dijkstra", title:"Dijkstra", subtitle:"单源最短路径", order:shortest.length ? `${shortest.join(" → ")} · ${d.distances?.[graph.goal] ?? ""}` : "按累计权重更新距离", note:"每次确定暂定距离最小的顶点；要求边权非负。" },
  ];
}
function renderComparison() { $("#comparison-row").innerHTML = comparisonData(state.graph).map(item => `<article class="comparison-card ${item.id === state.algorithm ? "is-active" : ""}"><h3>${item.title} <span class="comparison-subtitle">${item.subtitle}</span></h3><p><strong>${item.order}</strong></p><p>${item.note}</p></article>`).join(""); }
function renderAll() { renderGraph(); renderComparison(); }
function stopPlayback() { clearInterval(state.timer); state.timer = null; $("#play-button").innerHTML = "▶ <span>播放</span>"; }
function availableAlgorithms(graphKey) { return graphKey === "shortest" ? ["dijkstra", "astar"] : ["dfs", "bfs", "dijkstra"]; }
function selectGraph(key) {
  state.graphKey = key; state.graph = copy(defaults[key]); state.algorithm = key === "explore" ? "dfs" : "dijkstra";
  $$(".example-tab").forEach(b => { const selected = b.dataset.graph === key; b.classList.toggle("is-selected", selected); b.setAttribute("aria-selected", String(selected)); });
  generateSteps();
}
function selectAlgorithm(algorithm) { if (!availableAlgorithms(state.graphKey).includes(algorithm)) return; state.algorithm = algorithm; generateSteps(); }

function showDialog(title, html) { $("#dialog-title").textContent=title;$("#dialog-body").innerHTML=html;const dialog=$("#info-dialog");if(!dialog.open)dialog.showModal(); }
function renderRepresentation(mode="list") {
  const graph=state.graph, adj=adjacency(graph), nodes=graph.nodes.map(n=>n.id);
  const headings=`<div class="representation-switch"><button class="small-button ${mode==="list"?"is-primary":""}" data-representation="list" type="button">邻接表</button><button class="small-button ${mode==="matrix"?"is-primary":""}" data-representation="matrix" type="button">邻接矩阵</button></div>`;
  const table=mode==="list"
    ? `<table class="adjacency-table"><thead><tr><th>顶点</th><th>邻居</th></tr></thead><tbody>${Object.entries(adj).map(([id,items])=>`<tr><th>${id}</th><td>${items.map(x=>`${x.node}${graph.weighted?` (${x.edge.w})`:""}`).join(", ")||"—"}</td></tr>`).join("")}</tbody></table>`
    : `<div class="matrix-scroll"><table class="adjacency-table matrix-table"><thead><tr><th></th>${nodes.map(id=>`<th>${id}</th>`).join("")}</tr></thead><tbody>${nodes.map(from=>`<tr><th>${from}</th>${nodes.map(to=>{const edge=getEdge(graph,from,to);return `<td>${from===to?"0":edge?(graph.weighted?edge.w:"1"):"·"}</td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
  $("#representation-view").innerHTML=headings+table;
}
function showAdjacency() {
  showDialog("图的两种表示",`<p>当前是${state.graph.directed?"有向":"无向"}图${state.graph.weighted?"；矩阵中的数字表示边权":"；1 表示有边"}。邻接表只存相邻顶点，邻接矩阵为每对顶点保留一个单元格。</p><div id="representation-view"></div>`);
  renderRepresentation();
}
function showEditGraph() {
  const list=state.graph.edges.map(e=>`${e.from} ${e.to}${state.graph.weighted?` ${e.w}`:""}`).join("\n");
  showDialog("编辑边列表",`<p>每行输入一条边${state.graph.weighted?"（起点 终点 权重）":"（起点 终点）"}。顶点名称与布局保持不变。</p><textarea id="edge-editor" class="edge-editor" spellcheck="false">${list}</textarea><div class="dialog-actions"><button class="small-button" id="restore-example" type="button">恢复课件示例</button><button class="small-button is-primary" id="apply-edges" type="button">应用边列表</button></div>`);
}
function applyEdges() {
  const editor=$("#edge-editor"),lines=editor.value.split(/\n/).map(x=>x.trim()).filter(Boolean),edges=[];
  for(const line of lines){const parts=line.split(/[\s,，]+/),from=parts[0],to=parts[1],w=Number(parts[2]||1);if(!state.graph.nodes.some(n=>n.id===from)||!state.graph.nodes.some(n=>n.id===to)||!Number.isFinite(w)||w<0){editor.setCustomValidity(`请检查这一行：${line}`);editor.reportValidity();return;}edges.push({from,to,w});}
  if(!edges.length){editor.setCustomValidity("至少需要一条有效边");editor.reportValidity();return;}
  state.graph.edges=edges;$("#info-dialog").close();generateSteps();
}
function onClick(e) {
  const button=e.target.closest("button");if(!button)return;
  if(button.dataset.graph){selectGraph(button.dataset.graph);return;}
  if(button.dataset.algorithm){selectAlgorithm(button.dataset.algorithm);return;}
  if(button.dataset.jump!==undefined){state.cursor=Number(button.dataset.jump);renderAll();return;}
  if(button.id==="next-step"){state.cursor=Math.min(state.cursor+1,state.steps.length-1);renderAll();return;}
  if(button.id==="prev-step"){state.cursor=Math.max(0,state.cursor-1);renderAll();return;}
  if(button.id==="reset-steps"){stopPlayback();state.cursor=0;renderAll();return;}
  if(button.id==="play-button"){if(state.timer){stopPlayback();return;}if(state.cursor>=state.steps.length-1)state.cursor=0;button.innerHTML="Ⅱ <span>暂停</span>";state.timer=setInterval(()=>{if(state.cursor>=state.steps.length-1){stopPlayback();return;}state.cursor++;renderAll();$("#play-button").innerHTML="Ⅱ <span>暂停</span>";},850);renderAll();$("#play-button").innerHTML="Ⅱ <span>暂停</span>";return;}
  if(button.id==="compare-button"){showDialog("算法比较",`<p>同一张图用不同规则，会产生不同的搜索树和访问顺序。</p><table class="adjacency-table"><thead><tr><th>算法</th><th>选择规则</th><th>能保证什么？</th></tr></thead><tbody><tr><th>DFS</th><td>沿一条分支深入，必要时回溯</td><td>遍历可达顶点；不保证最短路径</td></tr><tr><th>BFS</th><td>按边数逐层扩展队列</td><td>无权图中的最少边数路径</td></tr><tr><th>Dijkstra</th><td>每次确定暂定总代价最小的点</td><td>非负权图中的最小总代价路径</td></tr><tr><th>A*</th><td>按 g(n)+h(n) 排序</td><td>可采纳启发函数下仍保证最优路径</td></tr></tbody></table>`);return;}
  if(button.id==="show-adjacency"){showAdjacency();return;}
  if(button.dataset.representation){renderRepresentation(button.dataset.representation);return;}
  if(button.id==="edit-graph"){showEditGraph();return;}
  if(button.id==="close-dialog"){ $("#info-dialog").close(); return; }
  if(button.id==="apply-edges"){applyEdges();return;}
  if(button.id==="restore-example"){const list=defaults[state.graphKey].edges.map(ed=>`${ed.from} ${ed.to}${state.graph.weighted?` ${ed.w}`:""}`).join("\n");$("#edge-editor").value=list;return;}
}

document.addEventListener("click",onClick);
$("#info-dialog").addEventListener("click",e=>{if(e.target===$("#info-dialog"))$("#info-dialog").close();});
generateSteps();
