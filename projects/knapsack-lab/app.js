const CAPACITY = 10;
const items = [
  { id: "vase", name: "国王的古董", weight: 5, value: 100, icon: "vase" },
  { id: "palette", name: "皇后的妆盒", weight: 2, value: 40, icon: "palette" },
  { id: "crown", name: "教皇的皇冠", weight: 3, value: 51, icon: "crown" },
  { id: "necklace", name: "公主的项链", weight: 2, value: 35, icon: "necklace" },
];

const iconMarkup = {
  vase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v3L7.5 9.5 9 20h6l1.5-10.5L14 6V3M8.2 11h7.6M9 17h6"/><path d="M8.2 10h7.6"/></svg>',
  palette: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5z"/><circle cx="9" cy="8" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/><circle cx="9" cy="13" r="1.2"/><path d="M14 13h3v4h-3z"/></svg>',
  crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 4 3 4-6 4 6 4-3-2 10H6z"/><path d="M7 21h10"/><circle cx="4" cy="7" r="1"/><circle cx="12" cy="4" r="1"/><circle cx="20" cy="7" r="1"/></svg>',
  necklace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c2.5 7 4.8 10 8 10s5.5-3 8-10"/><circle cx="12" cy="17" r="2.2"/><circle cx="4" cy="5" r="1"/><circle cx="20" cy="5" r="1"/></svg>',
};

const greedyOrder = items
  .map((item, index) => ({ index, ratio: item.value / item.weight }))
  .sort((a, b) => b.ratio - a.ratio || a.index - b.index)
  .map(({ index }) => index);
const greedyEvents = [];
let weightSoFar = 0;
let valueSoFar = 0;
for (const itemIndex of greedyOrder) {
  const item = items[itemIndex];
  const picked = weightSoFar + item.weight <= CAPACITY;
  if (picked) {
    weightSoFar += item.weight;
    valueSoFar += item.value;
  }
  greedyEvents.push({ itemIndex, picked, totalWeight: weightSoFar, totalValue: valueSoFar });
}

const dp = Array.from({ length: items.length + 1 }, () => Array(CAPACITY + 1).fill(0));
for (let i = 1; i <= items.length; i += 1) {
  const item = items[i - 1];
  for (let capacity = 0; capacity <= CAPACITY; capacity += 1) {
    const exclude = dp[i - 1][capacity];
    const include = item.weight <= capacity ? item.value + dp[i - 1][capacity - item.weight] : Number.NEGATIVE_INFINITY;
    dp[i][capacity] = Math.max(exclude, include);
  }
}

function recoverOptimalItems() {
  let capacity = CAPACITY;
  const selected = [];
  for (let i = items.length; i > 0; i -= 1) {
    if (dp[i][capacity] > dp[i - 1][capacity]) {
      selected.push(i - 1);
      capacity -= items[i - 1].weight;
    }
  }
  return selected.reverse();
}

const optimalItems = recoverOptimalItems();
let mode = "greedy";
let greedyCursor = 0;
let dpCursor = 0;
let autoplayTimer = null;

const $ = (selector) => document.querySelector(selector);
const itemIcon = (item, extraClass = "") => `<span class="item-icon ${extraClass}" aria-hidden="true">${iconMarkup[item.icon]}</span>`;

function currentGreedySelection() {
  return greedyEvents.slice(0, greedyCursor).filter((event) => event.picked).map((event) => event.itemIndex);
}

function renderItems() {
  const activeIndex = greedyCursor < greedyOrder.length ? greedyOrder[greedyCursor] : -1;
  const selected = new Set(currentGreedySelection());
  $("#item-rows").innerHTML = items.map((item, index) => {
    const ratio = item.value / item.weight;
    const rank = greedyOrder.indexOf(index) + 1;
    const currentClass = mode === "greedy" && activeIndex === index ? "is-current" : "";
    const pickedClass = mode === "greedy" && selected.has(index) ? "is-picked" : "";
    return `<tr class="${currentClass} ${pickedClass}">
      <td><span class="item-name">${itemIcon(item)}<span>${item.name}</span><span class="item-rank" aria-label="贪心顺序第 ${rank} 位">${rank}</span></span></td>
      <td>${item.weight} kg</td><td>${item.value}</td><td>${ratio.toFixed(1)}</td>
    </tr>`;
  }).join("");
  $(".items-panel").classList.toggle("is-greedy", mode === "greedy");
}

function renderGreedySequence() {
  $("#greedy-sequence").innerHTML = greedyEvents.map((event, position) => {
    const item = items[event.itemIndex];
    const ratio = item.value / item.weight;
    let state = "待检查";
    let stateClass = "";
    if (position < greedyCursor) {
      state = event.picked ? "放入背包" : "容量不足，跳过";
      stateClass = event.picked ? "is-picked" : "is-skipped";
    }
    if (position === greedyCursor && greedyCursor < greedyEvents.length) stateClass += " is-current";
    return `<li class="greedy-step ${stateClass}" aria-current="${position === greedyCursor && greedyCursor < greedyEvents.length ? "step" : "false"}">
      <div class="greedy-step-top"><span>第 ${position + 1} 件</span><span class="greedy-state">${state}</span></div>
      <strong title="${item.name}">${item.name}</strong>
      <small>${item.weight} kg · ${item.value} 点 · ${ratio.toFixed(1)} 点/kg</small>
    </li>`;
  }).join("");
  $("#step-counter").textContent = `${greedyCursor} / ${greedyEvents.length} 步`;

  const explanation = $("#step-explanation");
  if (greedyCursor === 0) {
    const first = items[greedyOrder[0]];
    explanation.textContent = `准备开始：先检查性价比最高的${first.name}，每 kg 价值 ${ (first.value / first.weight).toFixed(1)} 点。`;
  } else if (greedyCursor < greedyEvents.length) {
    const previous = greedyEvents[greedyCursor - 1];
    const handledItem = items[previous.itemIndex];
    const nextItem = items[greedyEvents[greedyCursor].itemIndex];
    const remaining = CAPACITY - previous.totalWeight;
    const decision = previous.picked
      ? `放入${handledItem.name}后已装 ${previous.totalWeight} kg；`
      : `剩余容量 ${remaining} kg，${handledItem.name}重 ${handledItem.weight} kg，放不下，跳过；`;
    explanation.textContent = `${decision}下一件按性价比顺序检查${nextItem.name}。`;
  } else {
    explanation.textContent = `性价比顺序已检查完。背包装了 ${weightSoFar} kg、价值 ${valueSoFar} 点；还剩 ${CAPACITY - weightSoFar} kg，皇冠重 3 kg，无法再放入。`;
  }
}

function renderDpTable() {
  const headers = Array.from({ length: CAPACITY + 1 }, (_, capacity) => `<th scope="col">${capacity}</th>`).join("");
  const rowLabels = ["0 · 不选任何宝物", ...items.map((item, index) => `${index + 1} · ${item.name} (${item.weight} kg, ${item.value} 点)` )];
  const body = rowLabels.map((label, rowIndex) => {
    const cells = Array.from({ length: CAPACITY + 1 }, (_, capacity) => {
      if (rowIndex === 0) return `<td class="is-base" aria-label="基础状态：价值 0">0</td>`;
      const cellIndex = (rowIndex - 1) * (CAPACITY + 1) + capacity;
      const revealed = cellIndex < dpCursor;
      const active = dpCursor > 0 && cellIndex === dpCursor - 1;
      const value = revealed ? dp[rowIndex][capacity] : "·";
      return `<td class="${active ? "is-active" : revealed ? "is-decision" : "is-empty"}" ${active ? 'aria-current="step"' : ""} aria-label="${label}，容量 ${capacity} kg：${revealed ? `最大价值 ${value}` : "尚未计算"}">${value}</td>`;
    }).join("");
    return `<tr><th class="row-label" scope="row">${label}</th>${cells}</tr>`;
  }).join("");
  $("#dp-table").innerHTML = `<caption class="sr-only">0/1 背包动态规划表。行表示考虑的宝物，列表示容量，单元格为最大价值。</caption><thead><tr><th class="row-label" scope="col">i \ 容量 (kg)</th>${headers}</tr></thead><tbody>${body}</tbody>`;
  $("#dp-counter").textContent = `${dpCursor} / ${items.length * (CAPACITY + 1)} 格`;

  const explanation = $("#dp-explanation");
  if (dpCursor === 0) {
    explanation.textContent = "先从第 1 件宝物开始，逐格填写容量 0 到 10 对应的最大价值。";
  } else {
    const stateIndex = dpCursor - 1;
    const itemIndex = Math.floor(stateIndex / (CAPACITY + 1));
    const capacity = stateIndex % (CAPACITY + 1);
    const item = items[itemIndex];
    const previousBest = dp[itemIndex][capacity];
    if (item.weight > capacity) {
      explanation.textContent = `容量 ${capacity} kg 放不下${item.name}（${item.weight} kg），所以继承上一行的价值 ${previousBest}。`;
    } else {
      const without = dp[itemIndex][capacity];
      const withItem = item.value + dp[itemIndex][capacity - item.weight];
      const chosen = withItem > without ? `选它：${item.value} + ${dp[itemIndex][capacity - item.weight]} = ${withItem}` : `不选：已有价值 ${without} 不低于选它的 ${item.value} + ${dp[itemIndex][capacity - item.weight]} = ${withItem}`;
      explanation.textContent = `考虑${item.name}、容量 ${capacity} kg：不选时是 ${without}；${chosen}。`;
    }
  }

  const result = $("#dp-result");
  if (dpCursor === items.length * (CAPACITY + 1)) {
    const names = optimalItems.map((index) => items[index].name).join(" + ");
    const totalWeight = optimalItems.reduce((sum, index) => sum + items[index].weight, 0);
    result.innerHTML = `填表完成：容量 10 kg 时最大价值为 <strong>${dp[items.length][CAPACITY]}</strong>。回溯得到：${names}（${totalWeight} kg）。`;
    result.hidden = false;
  } else {
    result.hidden = true;
  }
}

function renderBag() {
  let selected = [];
  let subtitle = "算法选择的宝物会显示在这里。";
  let explanation = "先比较单位重量的价值，再观察剩余容量如何影响选择。";
  let warning = false;
  if (mode === "greedy") {
    selected = currentGreedySelection();
    subtitle = greedyCursor ? "按性价比贪心的当前选择" : "贪心演示开始后，这里会显示放入背包的宝物。";
    if (greedyCursor === 0) explanation = "优先考虑每 kg 价值更高的宝物；每件都必须整件放入。";
    else if (greedyCursor < greedyEvents.length) {
      const latest = greedyEvents[greedyCursor - 1];
      const current = items[latest.itemIndex];
      explanation = latest.picked
        ? `放入${current.name}后，背包还剩 ${CAPACITY - latest.totalWeight} kg。`
        : `${current.name}放不下，因此跳过并继续检查后续宝物。`;
      warning = !latest.picked;
    } else {
      explanation = `还剩 ${CAPACITY - weightSoFar} kg，装不下 3 kg 的皇冠；贪心结果停在 ${valueSoFar} 点。`;
      warning = true;
    }
  } else if (dpCursor === items.length * (CAPACITY + 1)) {
    selected = optimalItems;
    subtitle = "动态规划回溯出的最优组合";
    explanation = "回溯表格最后一格：选择价值更高的组合，恰好装满 10 kg。";
  } else {
    subtitle = "填完动态规划表后回溯最优组合。";
    explanation = "表格计算过程中先不锁定具体宝物；完成后从右下角沿选择记录回溯。";
  }
  const totalWeight = selected.reduce((sum, index) => sum + items[index].weight, 0);
  const totalValue = selected.reduce((sum, index) => sum + items[index].value, 0);
  $("#bag-subtitle").textContent = subtitle;
  $("#bag-contents").innerHTML = selected.length
    ? selected.map((index) => {
      const item = items[index];
      return `<div class="bag-item">${itemIcon(item)}<strong>${item.name}</strong><span>${item.weight} kg</span><span>${item.value} 点</span></div>`;
    }).join("")
    : `<p class="bag-empty">${mode === "dp" && dpCursor > 0 ? "动态规划正在计算；完成后会显示回溯得到的宝物。" : "尚未放入宝物。点击「下一步」开始演示。"}</p>`;
  $("#bag-explanation").textContent = explanation;
  $("#bag-explanation").classList.toggle("is-warning", warning);
  $("#weight-total").textContent = totalWeight;
  $("#value-total").textContent = totalValue;
  $(".capacity-meter > span").style.width = `${(totalWeight / CAPACITY) * 100}%`;
  $(".capacity-meter").setAttribute("aria-valuenow", String(totalWeight));
}

function renderComparison() {
  const shown = greedyCursor === greedyEvents.length || dpCursor === items.length * (CAPACITY + 1);
  $("#result-comparison").hidden = !shown;
  if (!shown) return;
  $("#greedy-result-value").textContent = String(greedyEvents.at(-1).totalValue);
  $("#dp-result-value").textContent = String(dp[items.length][CAPACITY]);
  $("#comparison-explanation").textContent = "贪心先选单位价值最高的宝物，最后留下 1 kg，皇冠放不进去；动态规划比较所有可行组合，找到了价值更高的解。";
  $("#optimal-composition").textContent = `最优组合：${optimalItems.map((index) => items[index].name).join(" + ")}（10 kg）`;
}

function renderControls() {
  const cursor = mode === "greedy" ? greedyCursor : dpCursor;
  const total = mode === "greedy" ? greedyEvents.length : items.length * (CAPACITY + 1);
  $("#step-prev").disabled = cursor === 0 || Boolean(autoplayTimer);
  $("#step-next").disabled = cursor >= total || Boolean(autoplayTimer);
  $("#step-play").disabled = cursor >= total;
  $("#step-play").innerHTML = autoplayTimer ? '<span class="play-icon" aria-hidden="true">Ⅱ</span> 暂停' : '<span class="play-icon" aria-hidden="true">▶</span> 自动播放';
  $("#step-play").setAttribute("aria-pressed", String(Boolean(autoplayTimer)));
}

function render() {
  renderItems();
  renderGreedySequence();
  renderDpTable();
  renderBag();
  renderComparison();
  renderControls();
}

function advance() {
  if (mode === "greedy") {
    if (greedyCursor < greedyEvents.length) greedyCursor += 1;
  } else if (dpCursor < items.length * (CAPACITY + 1)) {
    dpCursor += 1;
  }
  render();
}

function stepBack() {
  if (mode === "greedy" && greedyCursor > 0) greedyCursor -= 1;
  if (mode === "dp" && dpCursor > 0) dpCursor -= 1;
  render();
}

function stopAutoplay() {
  if (!autoplayTimer) return;
  window.clearInterval(autoplayTimer);
  autoplayTimer = null;
}

function toggleAutoplay() {
  if (autoplayTimer) {
    stopAutoplay();
    renderControls();
    return;
  }
  const cursor = mode === "greedy" ? greedyCursor : dpCursor;
  const total = mode === "greedy" ? greedyEvents.length : items.length * (CAPACITY + 1);
  if (cursor >= total) return;
  autoplayTimer = window.setInterval(() => {
    advance();
    const current = mode === "greedy" ? greedyCursor : dpCursor;
    const limit = mode === "greedy" ? greedyEvents.length : items.length * (CAPACITY + 1);
    if (current >= limit) {
      stopAutoplay();
      renderControls();
    }
  }, mode === "greedy" ? 900 : 260);
  renderControls();
}

function reset() {
  stopAutoplay();
  greedyCursor = 0;
  dpCursor = 0;
  render();
}

function selectMode(nextMode) {
  if (nextMode === mode) return;
  stopAutoplay();
  mode = nextMode;
  $("#greedy-panel").hidden = mode !== "greedy";
  $("#dp-panel").hidden = mode !== "dp";
  document.querySelectorAll(".algorithm-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  render();
}

document.querySelectorAll(".algorithm-tab").forEach((tab) => {
  tab.addEventListener("click", () => selectMode(tab.dataset.mode));
});

$(".algorithm-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const nextMode = mode === "greedy" ? "dp" : "greedy";
  selectMode(nextMode);
  $(`.algorithm-tab[data-mode="${nextMode}"]`).focus();
});

$("#step-next").addEventListener("click", advance);
$("#step-prev").addEventListener("click", stepBack);
$("#step-play").addEventListener("click", toggleAutoplay);
$("#step-reset").addEventListener("click", reset);
window.addEventListener("pagehide", stopAutoplay);

render();
