const zones = [
  { id: "A", label: "图书馆", x: 65, y: 55 },
  { id: "B", label: "教学楼", x: 250, y: 48 },
  { id: "C", label: "实验楼", x: 460, y: 58 },
  { id: "D", label: "创新中心", x: 710, y: 64 },
  { id: "E", label: "食堂", x: 80, y: 270 },
  { id: "F", label: "体育馆", x: 270, y: 290 },
  { id: "G", label: "学生活动中心", x: 540, y: 280 },
  { id: "H", label: "宿舍区", x: 790, y: 280 },
  { id: "I", label: "校门", x: 75, y: 485 },
  { id: "J", label: "实验基地", x: 330, y: 480 },
  { id: "K", label: "体育场", x: 600, y: 485 },
  { id: "L", label: "停车场", x: 835, y: 465 },
];

const routers = [
  { id: "R1", zones: ["A", "B", "C", "D"], cost: 5, color: "#087f8c", x: 160, y: 180 },
  { id: "R2", zones: ["A", "B", "E", "F", "I", "J"], cost: 13, color: "#3478c6", x: 620, y: 215 },
  { id: "R3", zones: ["E", "F", "G", "H"], cost: 3, color: "#d58a17", x: 430, y: 390 },
  { id: "R4", zones: ["A", "C", "E", "G", "I"], cost: 6, color: "#805bb7", x: 185, y: 365 },
  { id: "R5", zones: ["B", "D", "F", "H", "J"], cost: 11, color: "#d65562", x: 745, y: 200 },
  { id: "R6", zones: ["I", "J", "K", "L"], cost: 4, color: "#36835d", x: 520, y: 555 },
  { id: "R7", zones: ["A", "B", "C", "G"], cost: 7, color: "#a77620", x: 465, y: 185 },
  { id: "R8", zones: ["D", "E", "I", "K"], cost: 9, color: "#687a43", x: 820, y: 190 },
];

const $ = (selector) => document.querySelector(selector);
const selected = new Set();
let greedySteps = [];
let cursor = 0;

function isCostObjective() {
  return $("#objective").value === "cost";
}

function findOptimalSolution(costObjective = isCostObjective()) {
  let best = null;
  for (let mask = 1; mask < (1 << routers.length); mask += 1) {
    const chosen = routers.filter((_, index) => mask & (1 << index));
    const covered = new Set(chosen.flatMap((router) => router.zones));
    if (covered.size !== zones.length) continue;
    const cost = chosen.reduce((sum, router) => sum + router.cost, 0);
    const candidate = { chosen, cost };
    const improves = !best || (costObjective
      ? cost < best.cost || (cost === best.cost && chosen.length < best.chosen.length)
      : chosen.length < best.chosen.length || (chosen.length === best.chosen.length && cost < best.cost));
    if (improves) best = candidate;
  }
  return best;
}

function renderOptimalSolution() {
  const optimum = findOptimalSolution();
  $("#optimal-routers").textContent = optimum.chosen.map((router) => router.id).join("、");
  $("#optimal-covered").textContent = `${zones.length} / ${zones.length}`;
  $("#optimal-count").textContent = String(optimum.chosen.length);
  $("#optimal-cost").textContent = String(optimum.cost);
  $("#optimal-summary").textContent = isCostObjective()
    ? `穷举验证：最低总成本为 ${optimum.cost} 点。`
    : `穷举验证：最少需要 ${optimum.chosen.length} 台。`;
}

function renderMap() {
  const isGreedy = cursor > 0;
  const active = isGreedy ? new Set(greedySteps.slice(0, cursor).map((step) => step.router.id)) : selected;
  const coveredBy = new Map();
  for (const router of routers) {
    if (!active.has(router.id)) continue;
    for (const zone of router.zones) {
      if (!coveredBy.has(zone)) coveredBy.set(zone, []);
      coveredBy.get(zone).push(router);
    }
  }
  const coveredCount = coveredBy.size;
  const roads = `
    <rect width="1000" height="620" fill="#dcebdc"/>
    <path d="M-25 235 C175 215 295 245 468 230 S797 220 1025 253" fill="none" stroke="#f7f5e9" stroke-width="78"/>
    <path d="M-25 235 C175 215 295 245 468 230 S797 220 1025 253" fill="none" stroke="#d0d5c9" stroke-width="2" stroke-dasharray="13 12"/>
    <path d="M405 -20 C394 90 422 154 407 242 S430 447 405 645" fill="none" stroke="#f7f5e9" stroke-width="60"/>
    <path d="M405 -20 C394 90 422 154 407 242 S430 447 405 645" fill="none" stroke="#d0d5c9" stroke-width="2" stroke-dasharray="13 12"/>
    <path d="M-20 430 C174 409 298 439 488 420 S802 406 1025 442" fill="none" stroke="#f7f5e9" stroke-width="49"/>
    <path d="M-20 430 C174 409 298 439 488 420 S802 406 1025 442" fill="none" stroke="#d0d5c9" stroke-width="2" stroke-dasharray="12 11"/>
    <path d="M74 260 C168 235 213 250 289 274 L258 304 C183 283 151 286 81 303Z" fill="#a9c992"/>
    <path d="M636 250 C708 235 769 247 824 275 L806 300 C742 282 694 281 647 297Z" fill="#b5ce98"/>
    <path d="M472 445 C526 425 576 448 582 478 C586 506 552 523 510 512 C471 502 445 471 472 445Z" fill="#93c9d1" stroke="#f7f5e9" stroke-width="8"/>
    <path d="M42 36h920v548H42z" fill="none" stroke="#b7ccba" stroke-width="2" stroke-dasharray="7 8"/>
    <text x="500" y="27" class="map-caption">北 · 校园主路</text>
    <text x="55" y="458" class="map-caption">南区</text>`;
  const links = [...active].flatMap((id) => {
    const router = routers.find((item) => item.id === id);
    return router.zones.map((zoneId) => {
      const zone = zones.find((item) => item.id === zoneId);
      const dx = zone.x + 64 - router.x;
      const dy = zone.y + 46 - router.y;
      const controlX = router.x + dx * 0.52 + (dy > 0 ? 12 : -12);
      const controlY = router.y + dy * 0.52;
      return `<path class="coverage-link" d="M${router.x} ${router.y} Q${controlX} ${controlY} ${zone.x + 64} ${zone.y + 46}" stroke="${router.color}"/>`;
    });
  }).join("");
  const buildings = zones.map((zone) => {
    const sources = coveredBy.get(zone.id) || [];
    const router = sources.at(-1);
    const color = router?.color || "#eef2e8";
    const opacity = router ? "0.88" : "1";
    const windows = Array.from({length: 6}, (_, index) => `<rect x="${zone.x + 14 + (index % 3) * 25}" y="${zone.y + 13 + Math.floor(index / 3) * 18}" width="14" height="10" rx="2" fill="${router ? "#ffffff" : "#c9d8d0"}" opacity="0.82"/>`).join("");
    return `<g class="map-zone ${router ? "is-covered" : ""}" aria-label="区域 ${zone.id} ${zone.label}${sources.length ? `，由 ${sources.map((item) => item.id).join("、")} 覆盖` : "，尚未覆盖"}">
      <rect class="building-shadow" x="${zone.x + 4}" y="${zone.y + 7}" width="128" height="85" rx="9"/>
      <rect class="building-body" x="${zone.x}" y="${zone.y}" width="128" height="85" rx="8" fill="${color}" opacity="${opacity}" stroke="${router?.color || "#b9c8bd"}"/>
      ${windows}
      <rect x="${zone.x + 49}" y="${zone.y + 39}" width="30" height="26" rx="3" fill="${router ? "#ffffff" : "#baccc0"}" opacity="0.92"/>
      <rect x="${zone.x + 55}" y="${zone.y + 54}" width="18" height="31" rx="2" fill="${router ? router.color : "#91a79a"}"/>
      <circle class="zone-pin" cx="${zone.x + 14}" cy="${zone.y + 76}" r="14" fill="${router?.color || "#5b7184"}"/>
      <text x="${zone.x + 14}" y="${zone.y + 81}" class="zone-letter">${zone.id}</text>
      <text x="${zone.x + 70}" y="${zone.y + 104}" class="zone-label">${zone.label}</text>
    </g>`;
  }).join("");
  const routerPins = routers.map((router) => {
    const activeRouter = active.has(router.id);
    return `<g class="router-pin ${activeRouter ? "is-active" : ""}" transform="translate(${router.x} ${router.y})" aria-label="路由器 ${router.id}${activeRouter ? "，已选择" : ""}">
      <circle class="router-halo" r="25" fill="${router.color}"/>
      <circle class="router-core" r="16" fill="${router.color}"/>
      <path d="M-7 1a10 10 0 0 1 14 0M-4 4a6 6 0 0 1 8 0M-1 7a2 2 0 0 1 2 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="-19" y="19" width="38" height="18" rx="5" fill="#fff" stroke="${router.color}"/>
      <text x="0" y="32" class="router-label" fill="${router.color}">${router.id}</text>
    </g>`;
  }).join("");
  $("#campus-map").innerHTML = `${roads}<g class="coverage-links">${links}</g><g class="campus-buildings">${buildings}</g><g class="router-pins">${routerPins}</g>`;
  $("#coverage-count").textContent = `${coveredCount} / ${zones.length}`;
  $("#map-status").textContent = isGreedy
    ? `贪心步骤 ${cursor}：已选 ${greedySteps.slice(0, cursor).map((step) => step.router.id).join("、")}`
    : selected.size
      ? `你的方案覆盖 ${coveredCount} 个区域。`
      : "选择路由器，看看它们能覆盖哪些区域。";
}

function renderRouterList() {
  const activeSteps = cursor > 0 ? greedySteps.slice(0, cursor) : [];
  const greedySelection = cursor > 0 ? new Set(activeSteps.map((step) => step.router.id)) : null;
  const activeSelection = greedySelection || selected;
  const coveredBefore = new Set(routers.filter((router) => activeSelection.has(router.id)).flatMap((router) => router.zones));
  const manualMode = cursor === 0 && selected.size > 0;
  $("#router-list").innerHTML = routers.map((router) => {
    const isSelected = greedySelection ? greedySelection.has(router.id) : selected.has(router.id);
    const action = greedySelection ? `点选后切回手动方案` : (isSelected ? "从手动方案移除" : "加入手动方案");
    const newlyCovered = router.zones.filter((zone) => !coveredBefore.has(zone));
    const costPerNewZone = (gain) => gain ? `${(router.cost / gain).toFixed(2)} 点/区` : "— 点/区";
    const chosenStep = activeSteps.find((step) => step.router.id === router.id);
    let roundLabel;
    if (chosenStep) {
      roundLabel = `已选 · 新增 ${chosenStep.newlyCovered.length} 区${isCostObjective() ? ` · ${costPerNewZone(chosenStep.newlyCovered.length)}` : ""}`;
    } else if (cursor > 0 && cursor >= greedySteps.length) {
      roundLabel = "算法已完成";
    } else if (manualMode) {
      roundLabel = isSelected ? "手动已选" : `加入后 +${newlyCovered.length} 区${isCostObjective() ? ` · ${costPerNewZone(newlyCovered.length)}` : ""}`;
    } else {
      roundLabel = `本轮 +${newlyCovered.length} 区${isCostObjective() ? ` · ${costPerNewZone(newlyCovered.length)}` : ""}`;
    }
    const accessibleGain = chosenStep ? chosenStep.newlyCovered.length : newlyCovered.length;
    const accessibleRoundLabel = `${chosenStep ? "本次" : "本轮"}新增 ${accessibleGain} 个区域${isCostObjective() ? `，平均成本 ${costPerNewZone(accessibleGain)}` : ""}`;
    return `<button class="router-option ${isSelected ? "is-selected" : ""}" type="button" data-router="${router.id}" aria-pressed="${isSelected}" style="--router-color:${router.color}" aria-label="${action}：${router.id}，成本 ${router.cost} 点，覆盖 ${router.zones.length} 个区域，每区域 ${(router.cost / router.zones.length).toFixed(2)} 点；${accessibleRoundLabel}">
      <span class="router-check" aria-hidden="true">${isSelected ? "✓" : ""}</span><svg class="router-glyph" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15"/><path d="M8 14a12 12 0 0 1 16 0M11 18a7.5 7.5 0 0 1 10 0M14.5 21.5a2.5 2.5 0 0 1 3 0M16 24v.1"/></svg><span class="router-id">${router.id}</span><span class="router-cost">${router.cost} 点</span><span class="router-zones">${router.zones.join(" · ")}</span><span class="router-efficiency">${router.cost} ÷ ${router.zones.length} = ${(router.cost / router.zones.length).toFixed(2)} 点/区</span><span class="router-round">${roundLabel}</span>
    </button>`;
  }).join("");
  const labels = [...selected];
  const totalCost = routers.filter((router) => selected.has(router.id)).reduce((sum, router) => sum + router.cost, 0);
  const summaryLabels = greedySelection ? [...greedySelection] : labels;
  $("#selection-summary-label").textContent = greedySelection ? "贪心已选" : "你的方案";
  $("#selection-summary").textContent = summaryLabels.length ? summaryLabels.join("、") : "尚未选择";
  $("#student-count").textContent = String(labels.length);
  $("#student-cost").textContent = String(totalCost);
  const coverage = new Set(routers.filter((router) => selected.has(router.id)).flatMap((router) => router.zones));
  $("#student-covered").textContent = `${coverage.size} / ${zones.length}`;
  const badge = $("#student-badge");
  const message = $("#student-result");
  if (coverage.size === zones.length) {
    const optimum = findOptimalSolution();
    const optimal = isCostObjective() ? totalCost === optimum.cost : labels.length === optimum.chosen.length;
    badge.textContent = optimal ? "覆盖全部 · 最优" : "覆盖全部";
    badge.className = `result-tag ${optimal ? "result-tag-good" : ""}`;
    message.textContent = `覆盖全部区域：${labels.length} 台，成本 ${totalCost} 点。${optimal ? "达到当前目标的最优值。" : "还能再优化吗？"}`;
  } else if (!labels.length) {
    badge.textContent = "待选择";
    badge.className = "result-tag";
    message.textContent = "点击右侧路由器，组成你的覆盖方案。";
  } else {
    badge.textContent = `还差 ${zones.length - coverage.size} 个`;
    badge.className = "result-tag";
    const missing = zones.filter((zone) => !coverage.has(zone.id)).map((zone) => zone.id);
    message.textContent = `还没有覆盖：${missing.join("、")}。试着再选一台。`;
  }
}

function buildGreedySteps() {
  let remaining = new Set(zones.map((zone) => zone.id));
  const chosen = new Set();
  const steps = [];
  while (remaining.size) {
    const scored = routers
      .filter((router) => !chosen.has(router.id))
      .map((router) => ({ router, newlyCovered: router.zones.filter((zone) => remaining.has(zone)) }))
      .map((item) => ({ ...item, score: isCostObjective() ? item.newlyCovered.length / item.router.cost : item.newlyCovered.length }));
    const bestScore = Math.max(...scored.map((item) => item.score));
    const tied = scored.filter((item) => Math.abs(item.score - bestScore) < 1e-9);
    const best = tied.sort((a, b) => a.router.cost - b.router.cost || routers.indexOf(a.router) - routers.indexOf(b.router))[0];
    if (!best || best.newlyCovered.length === 0) break;
    const before = new Set(remaining);
    best.newlyCovered.forEach((zone) => remaining.delete(zone));
    chosen.add(best.router.id);
    steps.push({ router: best.router, newlyCovered: best.newlyCovered, remaining: [...remaining], before: [...before], score: best.score, totalCost: steps.reduce((sum, step) => sum + step.router.cost, best.router.cost) });
  }
  greedySteps = steps;
}

function renderGreedy() {
  buildGreedySteps();
  const chosen = greedySteps.slice(0, cursor);
  const coverage = new Set(chosen.flatMap((step) => step.router.zones));
  const totalCost = chosen.reduce((sum, step) => sum + step.router.cost, 0);
  const costObjective = isCostObjective();
  const activeStep = chosen.at(-1);
  const rule = costObjective
    ? "每轮重算本轮新增区域的平均成本，选择点/区最低的路由器"
    : "先剔除已覆盖区域，再选新增覆盖最多的路由器";
  $("#greedy-rule").textContent = rule;
  $("#trace-rule").textContent = costObjective ? "固定设备成本 ÷ 本轮新增区域数（越低越优）" : "本轮新增覆盖数（已覆盖区域不重复计）";
  $("#efficiency-heading").textContent = costObjective ? "成本 / 新增区数" : "新增覆盖数";
  $("#comparison-hint").textContent = costObjective
    ? "每轮比较成本摊到新增区域后的点/区，并与穷举得到的最低总成本比较。"
    : "平局选择会影响最终设备数；最优基准由全部组合穷举验证。";
  renderOptimalSolution();
  const current = $("#greedy-current");
  current.classList.toggle("has-step", Boolean(activeStep));
  if (!activeStep) {
    current.innerHTML = '<span class="current-number">—</span><span><strong>准备开始</strong><small>先猜猜贪心会怎么选</small></span>';
  } else {
    const message = activeStep.remaining.length
      ? `新增覆盖 ${activeStep.newlyCovered.join("、")}；还剩 ${activeStep.remaining.join("、")}`
      : `新增覆盖 ${activeStep.newlyCovered.join("、")}；所有区域都已覆盖`;
    const costPerZone = costObjective ? `；本轮 ${activeStep.router.cost} 点 ÷ ${activeStep.newlyCovered.length} 区 = ${(activeStep.router.cost / activeStep.newlyCovered.length).toFixed(2)} 点/区` : "";
    current.innerHTML = `<span class="current-number">${cursor}</span><span><strong>选择 ${activeStep.router.id} · ${activeStep.newlyCovered.length} 个新区域</strong><small>${message}；成本 ${activeStep.router.cost} 点${costPerZone}</small></span>`;
  }
  $("#greedy-prev").disabled = cursor === 0;
  $("#greedy-next").disabled = cursor >= greedySteps.length;
  $("#greedy-next").innerHTML = cursor >= greedySteps.length ? "已完成 <span aria-hidden=\"true\">✓</span>" : '下一步 <span aria-hidden="true">→</span>';
  $("#step-progress").style.width = `${greedySteps.length ? (cursor / greedySteps.length) * 100 : 0}%`;
  $("#greedy-covered").textContent = `${coverage.size} / ${zones.length}`;
  $("#greedy-count").textContent = String(chosen.length);
  $("#greedy-cost").textContent = String(totalCost);
  const badge = $("#greedy-badge");
  const result = $("#greedy-result");
  if (!cursor) {
    badge.textContent = "待演示";
    badge.className = "result-tag";
    result.textContent = `按“${costObjective ? "本轮成本 / 新增区域最低" : "新增覆盖最多"}”逐步选择；选择条件并列时优先选成本较低的设备。`;
  } else if (coverage.size === zones.length) {
    const optimum = findOptimalSolution();
    const isOptimal = costObjective ? totalCost === optimum.cost : chosen.length === optimum.chosen.length;
    badge.textContent = isOptimal ? (costObjective ? "成本最优" : "台数最优") : "可再优化";
    badge.className = `result-tag ${isOptimal ? "result-tag-good" : ""}`;
    result.textContent = `${chosen.map((step) => step.router.id).join(" → ")}，共 ${chosen.length} 台、成本 ${totalCost} 点；${costObjective ? `最低成本为 ${optimum.cost} 点` : `最少需要 ${optimum.chosen.length} 台`}。`;
  } else {
    badge.textContent = `进行中 ${cursor} / ${greedySteps.length}`;
    badge.className = "result-tag";
    result.textContent = costObjective ? "每轮重算固定成本摊到新增区域上的点/区；已覆盖区域不再计入。" : "每轮重新计算未覆盖区域中的新增覆盖数；设备台数是累计选择数。";
  }

  $("#trace-body").innerHTML = chosen.length
    ? chosen.map((step, index) => `<tr><td>${index + 1}</td><td class="trace-router">${step.router.id}</td><td>${step.newlyCovered.join("、")}</td><td>${costObjective ? `${(step.router.cost / step.newlyCovered.length).toFixed(2)} 点/区` : step.newlyCovered.length}</td><td>${step.totalCost} 点</td><td>${step.remaining.length ? step.remaining.join("、") : "无 · 覆盖完成"}</td></tr>`).join("")
    : '<tr class="empty-row"><td colspan="6">点击“下一步”开始演示。</td></tr>';
  renderRouterList();
  renderMap();
}

$("#router-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-router]");
  if (!button) return;
  const id = button.dataset.router;
  if (cursor > 0) {
    cursor = 0;
    renderGreedy();
  }
  selected.has(id) ? selected.delete(id) : selected.add(id);
  renderRouterList();
  renderMap();
});

$("#greedy-next").addEventListener("click", () => {
  if (cursor < greedySteps.length) cursor += 1;
  renderGreedy();
});
$("#greedy-prev").addEventListener("click", () => {
  if (cursor > 0) cursor -= 1;
  renderGreedy();
});
$("#greedy-reset").addEventListener("click", () => {
  cursor = 0;
  renderGreedy();
  renderRouterList();
});
$("#objective").addEventListener("change", () => {
  cursor = 0;
  renderGreedy();
  renderRouterList();
});

renderRouterList();
renderGreedy();
