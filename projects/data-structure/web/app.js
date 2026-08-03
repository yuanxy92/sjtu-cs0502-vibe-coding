const canvas = document.querySelector("#map-canvas");
const ctx = canvas.getContext("2d");
const loading = document.querySelector("#loading");
const hoverLabel = document.querySelector("#hover-label");
const startSelect = document.querySelector("#start-select");
const endSelect = document.querySelector("#end-select");
const placeQuery = document.querySelector("#place-query");
const queryStatus = document.querySelector("#query-status");
const searchResults = document.querySelector("#search-results");
const searchPlacesButton = document.querySelector("#search-places");
const runRouteButton = document.querySelector("#run-route");
const algorithmSelect = document.querySelector("#algorithm-select");
const searchAlgorithmSelect = document.querySelector("#search-algorithm");
const resetViewButton = document.querySelector("#reset-view");
const clearSelectionButton = document.querySelector("#clear-selection");

// The road network's two dominant directions are 20.5° / 110.5° from east.
// Rotating clockwise by 20.5° snaps them to horizontal / vertical.
const MAP_ROTATION_DEG = -20.5;
const MAP_ROTATION_RAD = MAP_ROTATION_DEG * Math.PI / 180;

const state = {
  graph: null,
  pois: [],
  poiById: new Map(),
  nodeById: new Map(),
  startPoiId: "",
  endPoiId: "",
  view: { scale: 1, offsetX: 0, offsetY: 0 },
  fitView: null,
  dragging: false,
  dragStart: null,
  hoveredPoi: null,
  route: [],
  routeDistanceM: null,
  routeMessage: "",
};

function canvasSize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return rect;
}

function graphBounds() {
  const coordinates = state.graph.nodes.map(toMapCoordinates);
  const xs = coordinates.map((point) => point.x);
  const ys = coordinates.map((point) => point.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}

function toMapCoordinates(point) {
  const origin = state.graph.metadata.origin;
  const longitudeScale = Math.cos(origin.lat * Math.PI / 180);
  const east = (point.lon - origin.lon) * longitudeScale;
  const north = point.lat - origin.lat;
  return {
    x: east * Math.cos(MAP_ROTATION_RAD) - north * Math.sin(MAP_ROTATION_RAD),
    y: east * Math.sin(MAP_ROTATION_RAD) + north * Math.cos(MAP_ROTATION_RAD),
  };
}

function resetView() {
  if (!state.graph) return;
  const { width, height } = canvasSize();
  const bounds = graphBounds();
  const padding = 56;
  // Geographic coordinates are measured in degrees, so a one-degree minimum
  // would shrink a campus-sized map into a corner.
  const graphWidth = Math.max(bounds.maxX - bounds.minX, Number.EPSILON);
  const graphHeight = Math.max(bounds.maxY - bounds.minY, Number.EPSILON);
  const scale = Math.min((width - padding * 2) / graphWidth, (height - padding * 2) / graphHeight);
  const offsetX = (width - graphWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (height - graphHeight * scale) / 2 + bounds.maxY * scale;
  state.fitView = { scale, offsetX, offsetY };
  state.view = { ...state.fitView };
  draw();
}

function toScreen(point) {
  const mapPoint = toMapCoordinates(point);
  return {
    x: mapPoint.x * state.view.scale + state.view.offsetX,
    y: -mapPoint.y * state.view.scale + state.view.offsetY,
  };
}

function toWorld(screenX, screenY) {
  const origin = state.graph.metadata.origin;
  const longitudeScale = Math.cos(origin.lat * Math.PI / 180);
  const x = (screenX - state.view.offsetX) / state.view.scale;
  const y = -(screenY - state.view.offsetY) / state.view.scale;
  const east = x * Math.cos(MAP_ROTATION_RAD) + y * Math.sin(MAP_ROTATION_RAD);
  const north = -x * Math.sin(MAP_ROTATION_RAD) + y * Math.cos(MAP_ROTATION_RAD);
  return {
    lon: origin.lon + east / longitudeScale,
    lat: origin.lat + north,
  };
}

function drawRoads() {
  ctx.save();
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = "#a9a9a9";
  ctx.beginPath();
  for (const edge of state.graph.edges) {
    const source = state.nodeById.get(edge.source);
    const target = state.nodeById.get(edge.target);
    const a = toScreen(source);
    const b = toScreen(target);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRoute() {
  if (state.route.length < 2) return;
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#a51c30";
  ctx.beginPath();
  state.route.forEach((nodeId, index) => {
    const point = toScreen(state.nodeById.get(nodeId));
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawAnchorLabels() {
  const anchorNames = ["图书信息楼", "东大门", "船建学院", "机动学院", "学生服务中心", "校医院"];
  ctx.save();
  ctx.font = "12px PingFang SC, Microsoft YaHei, sans-serif";
  for (const name of anchorNames) {
    const poi = state.pois.find((item) => item.name === name);
    if (!poi) continue;
    const point = toScreen(poi);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#4e4e4e";
    ctx.stroke();
    ctx.fillStyle = "#3d3d3d";
    ctx.fillText(name, point.x + 8, point.y - 8);
  }
  ctx.restore();
}

function drawPoi(poi, role) {
  const point = toScreen(poi);
  const isSelected = role === "start" || role === "end";
  const radius = isSelected ? 6.5 : 3.8;
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = role === "start" ? "#a51c30" : "#ffffff";
  ctx.fill();
  ctx.lineWidth = role === "end" ? 3 : 1.4;
  ctx.strokeStyle = role === "start" || role === "end" ? "#a51c30" : "#626262";
  ctx.stroke();
  if (isSelected || poi === state.hoveredPoi) {
    ctx.font = "12px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#2a2a2a";
    ctx.fillText(poi.name, point.x + 9, point.y - 8);
  }
  ctx.restore();
}

function draw() {
  if (!state.graph) return;
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfbfb";
  ctx.fillRect(0, 0, width, height);
  drawRoads();
  drawRoute();
  drawAnchorLabels();
  const start = state.poiById.get(state.startPoiId);
  const end = state.poiById.get(state.endPoiId);
  for (const poi of state.pois) {
    const role = poi === start ? "start" : poi === end ? "end" : "poi";
    drawPoi(poi, role);
  }
}

function populateSelect(select, placeholder) {
  select.replaceChildren(new Option(placeholder, ""));
  for (const poi of state.pois) {
    select.add(new Option(poi.name, poi.id));
  }
}

function renderSearchResults(matches) {
  searchResults.replaceChildren();
  for (const poi of matches.slice(0, 6)) {
    const row = document.createElement("div");
    row.className = "search-result";
    const name = document.createElement("span");
    name.className = "search-result-name";
    name.textContent = poi.name;
    const meta = document.createElement("span");
    meta.className = "search-result-meta";
    meta.textContent = poi.category;
    const actions = document.createElement("div");
    actions.className = "search-result-actions";
    for (const [label, kind] of [["设为起点", "start"], ["设为终点", "end"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => setSelection(kind, poi.id));
      actions.append(button);
    }
    row.append(name, meta, actions);
    searchResults.append(row);
  }
}

function updateMetrics() {
  document.querySelector("#node-count").textContent = state.graph.nodes.length.toLocaleString("zh-CN");
  document.querySelector("#edge-count").textContent = state.graph.edges.length.toLocaleString("zh-CN");
  document.querySelector("#poi-count").textContent = state.pois.length.toLocaleString("zh-CN");
  const start = state.poiById.get(state.startPoiId)?.name;
  const end = state.poiById.get(state.endPoiId)?.name;
  document.querySelector("#selection-status").textContent = start && end ? `${start} → ${end}` : start || end || "未选择";
  document.querySelector("#route-status").textContent = state.routeMessage
    ? state.routeMessage
    : state.routeDistanceM === null
    ? "未计算"
    : `${Math.round(state.routeDistanceM).toLocaleString("zh-CN")} 米（${state.routeAlgorithm}，访问 ${state.routeVisitedCount ?? "?"} 节点）`;
}

function updateRoute() {
  const start = state.poiById.get(state.startPoiId);
  const end = state.poiById.get(state.endPoiId);
  if (!start || !end) {
    state.route = [];
    state.routeDistanceM = null;
    state.routeMessage = "请选择起点和终点";
    return;
  }
  const result = window.CampusTasks.findPath(state.graph, start.graph_node_id, end.graph_node_id, {
    algorithm: algorithmSelect.value,
  });
  state.route = result.path ?? [];
  state.routeDistanceM = result.distance_m ?? null;
  state.routeVisitedCount = result.visited_count ?? 0;
  state.routeAlgorithm = result.algorithm ?? "学生实现";
  state.routeMessage = result.message ?? "";
}

function setSelection(kind, poiId) {
  if (kind === "start") {
    state.startPoiId = poiId;
    startSelect.value = poiId;
  } else {
    state.endPoiId = poiId;
    endSelect.value = poiId;
  }
  updateMetrics();
  draw();
}

function nearestPoi(screenX, screenY, threshold = 13) {
  let nearest = null;
  let smallestDistance = threshold;
  for (const poi of state.pois) {
    const point = toScreen(poi);
    const distance = Math.hypot(point.x - screenX, point.y - screenY);
    if (distance < smallestDistance) {
      nearest = poi;
      smallestDistance = distance;
    }
  }
  return nearest;
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function bindInteractions() {
  const runPlaceSearch = () => {
    const result = window.CampusTasks.findPlaces(placeQuery.value.trim(), state.pois, {
      algorithm: searchAlgorithmSelect.value,
    });
    // The distributed project deliberately starts without search algorithms.
    // Once an AI agent has replaced the stub in student-tasks.js, its result
    // will omit `message` and the normal result renderer below will be used.
    if (result.message) {
      queryStatus.textContent = result.message;
      renderSearchResults([]);
      return;
    }
    const names = (result.matches ?? []).slice(0, 4).map((poi) => poi.name).join("、");
    queryStatus.textContent = placeQuery.value
      ? `${result.structure}；比较 ${result.comparisons ?? 0} 次${names ? `；结果：${names}` : ""}`
      : "待实现地点查找";
    renderSearchResults(result.matches ?? []);
  };
  searchPlacesButton.addEventListener("click", runPlaceSearch);
  placeQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runPlaceSearch();
  });
  runRouteButton.addEventListener("click", () => {
    updateRoute();
    updateMetrics();
    draw();
  });
  startSelect.addEventListener("change", () => setSelection("start", startSelect.value));
  endSelect.addEventListener("change", () => setSelection("end", endSelect.value));
  resetViewButton.addEventListener("click", resetView);
  clearSelectionButton.addEventListener("click", () => {
    state.startPoiId = "";
    state.endPoiId = "";
    state.route = [];
    state.routeDistanceM = null;
    state.routeMessage = "";
    startSelect.value = "";
    endSelect.value = "";
    updateMetrics();
    draw();
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const { x, y } = pointerPosition(event);
    const world = toWorld(x, y);
    const multiplier = event.deltaY < 0 ? 1.14 : 0.88;
    const minScale = state.fitView.scale * 0.7;
    const maxScale = state.fitView.scale * 14;
    const nextScale = Math.min(maxScale, Math.max(minScale, state.view.scale * multiplier));
    state.view.scale = nextScale;
    const mapPoint = toMapCoordinates(world);
    state.view.offsetX = x - mapPoint.x * nextScale;
    state.view.offsetY = y + mapPoint.y * nextScale;
    draw();
  }, { passive: false });

  canvas.addEventListener("pointerdown", (event) => {
    const point = pointerPosition(event);
    state.dragging = true;
    state.dragStart = { point, offsetX: state.view.offsetX, offsetY: state.view.offsetY, moved: false };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    const point = pointerPosition(event);
    if (state.dragging) {
      const dx = point.x - state.dragStart.point.x;
      const dy = point.y - state.dragStart.point.y;
      if (Math.hypot(dx, dy) > 3) state.dragStart.moved = true;
      state.view.offsetX = state.dragStart.offsetX + dx;
      state.view.offsetY = state.dragStart.offsetY + dy;
      draw();
      return;
    }
    state.hoveredPoi = nearestPoi(point.x, point.y);
    hoverLabel.hidden = !state.hoveredPoi;
    if (state.hoveredPoi) {
      hoverLabel.textContent = state.hoveredPoi.name;
      hoverLabel.style.left = `${point.x}px`;
      hoverLabel.style.top = `${point.y}px`;
    }
    draw();
  });

  canvas.addEventListener("pointerup", (event) => {
    const point = pointerPosition(event);
    const wasMoved = state.dragStart?.moved;
    state.dragging = false;
    canvas.classList.remove("dragging");
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!wasMoved) {
      const poi = nearestPoi(point.x, point.y);
      if (poi) setSelection(state.startPoiId ? "end" : "start", poi.id);
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (!state.dragging) {
      state.hoveredPoi = null;
      hoverLabel.hidden = true;
      draw();
    }
  });

  window.addEventListener("resize", resetView);
}

async function load() {
  // Prefer the generated bundle: it works on localhost and when index.html is
  // opened directly with file://, where browsers forbid fetching local JSON.
  if (window.CAMPUS_MAP_DATA) {
    state.graph = window.CAMPUS_MAP_DATA.graph;
    state.pois = window.CAMPUS_MAP_DATA.pois.pois;
  } else {
    const [graphResponse, poiResponse] = await Promise.all([
      fetch("../data/campus_graph.json"),
      fetch("../data/campus_pois.json"),
    ]);
    if (!graphResponse.ok || !poiResponse.ok) {
      throw new Error("无法读取本地地图数据。");
    }
    state.graph = await graphResponse.json();
    const poiPayload = await poiResponse.json();
    state.pois = poiPayload.pois;
  }
  state.nodeById = new Map(state.graph.nodes.map((node) => [node.id, node]));
  state.poiById = new Map(state.pois.map((poi) => [poi.id, poi]));
  populateSelect(startSelect, "请选择起点");
  populateSelect(endSelect, "请选择终点");
  updateMetrics();
  bindInteractions();
  loading.hidden = true;
  resetView();
}

load().catch((error) => {
  loading.textContent = error.message;
  console.error(error);
});
