/* Algorithm model: usable offline in the browser and directly in Node. */
(function (root) {
  'use strict';
  const clone = value => structuredClone(value);
  function createTopology() {
    return {
      routers: [
        { id: 'R1', x: 270, y: 155, up: true, network: '192.168.1.0/24' },
        { id: 'R2', x: 510, y: 90, up: true, network: '192.168.2.0/24' },
        { id: 'R3', x: 755, y: 185, up: true, network: '192.168.3.0/24' },
        { id: 'R4', x: 325, y: 380, up: true, network: '192.168.4.0/24' },
        { id: 'R5', x: 755, y: 405, up: true, network: '192.168.5.0/24' }
      ],
      hosts: [
        { id: 'H1', router: 'R1', x: 75, y: 95, ip: '192.168.1.10' },
        { id: 'H2', router: 'R1', x: 75, y: 270, ip: '192.168.1.20' },
        { id: 'H3', router: 'R4', x: 75, y: 445, ip: '192.168.4.10' },
        { id: 'H4', router: 'R3', x: 960, y: 95, ip: '192.168.3.10' },
        { id: 'H5', router: 'R3', x: 960, y: 270, ip: '192.168.3.20' },
        { id: 'H6', router: 'R5', x: 960, y: 445, ip: '192.168.5.10' }
      ],
      links: [
        ['R1', 'R2', 1], ['R1', 'R4', 1], ['R2', 'R3', 1],
        ['R2', 'R4', 2], ['R3', 'R4', 3], ['R3', 'R5', 1], ['R4', 'R5', 4]
      ].map(([a, b, cost]) => ({ id: a + '-' + b, a, b, cost, up: true }))
    };
  }
  class RoutingSimulation {
    static converged(topology = createTopology()) {
      const sim = new RoutingSimulation(topology);
      let rounds = 0;
      while (!sim.stable && rounds < 80) { sim.step(); rounds++; }
      if (!sim.stable) throw new Error('Fault baseline did not converge');
      sim.round = 0;
      sim.last = {changes: [], hostChanges: [], messages: [], knowledge: 0, stable: true, phase: 'baseline'};
      return sim;
    }
    constructor(topology = createTopology()) {
      Object.assign(this, clone(topology));
      this.infinity = Infinity;
      this.round = 0; this.stable = false; this.sequence = 0;
      this.tables = {}; this.lsdb = {};
      this.discovered = Object.fromEntries(this.routers.map(r => [r.id, false]));
      for (const r of this.routers) {
        this.tables[r.id] = this.emptyTable();
        if (r.up) this.tables[r.id][r.id] = { cost: 0, next: r.id };
        this.lsdb[r.id] = {};
      }
      this.last = { changes: [], hostChanges: [], messages: [], stable: false, knowledge: 0, phase: 'initial' };
    }
    emptyTable() {
      return Object.fromEntries(this.routers.map(r => [r.id, { cost: this.infinity, next: null }]));
    }
    hostRoutes(id) {
      // Teaching expansion: hosts inherit their subnet's learned route. These
      // rows are not additional /32 advertisements or new SPF destinations.
      return this.hosts.map(h => ({
        id: h.id, ip: h.ip, router: h.router,
        network: this.routers.find(r => r.id === h.router).network,
        cost: this.discovered[id] && this.lsdb[id][h.router] ? this.tables[id][h.router].cost : Infinity,
        next: this.discovered[id] && this.lsdb[id][h.router] ? this.tables[id][h.router].next : null
      }));
    }
    hostSnapshot() {
      return Object.fromEntries(this.routers.map(r => [r.id, this.hostRoutes(r.id)]));
    }
    hostDiff(before) {
      const changes = [];
      for (const r of this.routers) for (const h of this.hostRoutes(r.id)) {
        const previous = before[r.id].find(v => v.id === h.id);
        if (previous.cost !== h.cost || previous.next !== h.next)
          changes.push({router: r.id, destination: h.id, before: clone(previous), after: clone(h)});
      }
      return changes;
    }
    isUp(id) { return !!this.routers.find(r => r.id === id)?.up; }
    linkUp(e) { return e.up && this.isUp(e.a) && this.isUp(e.b); }
    neighbors(id) {
      return this.links.filter(e => this.linkUp(e) && (e.a === id || e.b === id))
        .map(e => ({ id: e.a === id ? e.b : e.a, cost: e.cost, link: e.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    originate(id) {
      if (!this.isUp(id) || !this.discovered[id]) return;
      const adjacent = this.links.filter(e => e.up && (e.a === id || e.b === id))
        .map(e => e.a === id ? e.b : e.a);
      // In this teaching model, explicit device failure/recovery is observed
      // locally. These observations travel with LSAs, never via global SPF reads.
      const routerStates = [id, ...adjacent].map(peer => ({id: peer, up: this.isUp(peer)}));
      this.lsdb[id][id] = { origin: id, seq: ++this.sequence, routerStates, links: this.neighbors(id).map(({id, cost}) => ({ id, cost })) };
    }
    computeDijkstra(id, database) {
      const table = this.emptyTable();
      if (!this.isUp(id)) return table;
      table[id] = {cost: 0, next: id};
      const observed = new Map();
      for (const lsa of Object.values(database)) for (const state of lsa.routerStates || []) {
        if (!observed.has(state.id) || observed.get(state.id).seq < lsa.seq)
          observed.set(state.id, {up: state.up, seq: lsa.seq});
      }
      const unavailable = peer => observed.get(peer)?.up === false;
      const done = new Set();
      for (let i = 0; i < this.routers.length; i++) {
        const u = this.routers.filter(r => !done.has(r.id)).sort((a, b) => table[a.id].cost - table[b.id].cost || a.id.localeCompare(b.id))[0]?.id;
        if (!u || table[u].cost === Infinity) break;
        done.add(u);
        // Only the local database is consulted; no global topology shortcut.
        for (const e of database[u]?.links || []) {
          if (!table[e.id] || done.has(e.id) || unavailable(e.id)) continue;
          const cost = table[u].cost + e.cost;
          const next = u === id ? e.id : table[u].next;
          if (cost < table[e.id].cost) table[e.id] = {cost, next};
        }
      }
      return table;
    }
    diff(before, after) {
      const changes = [];
      for (const r of this.routers) for (const d of this.routers) {
        const a = before[r.id][d.id], b = after[r.id][d.id];
        if (a.cost !== b.cost || a.next !== b.next)
          changes.push({router: r.id, destination: d.id, before: clone(a), after: clone(b)});
      }
      return changes;
    }
    discoverDirect(pending) {
      const before = clone(this.tables), messages = [];
      const hostBefore = this.hostSnapshot();
      for (const r of pending) {
        this.discovered[r.id] = true;
        this.originate(r.id);
        this.tables[r.id] = this.computeDijkstra(r.id, this.lsdb[r.id]);
        for (const n of this.neighbors(r.id)) messages.push({from: r.id, to: n.id, kind: 'HELLO'});
        for (const h of this.hosts.filter(h => h.router === r.id)) messages.push({from: r.id, to: h.id, kind: 'HELLO'});
      }
      this.round++; this.stable = false;
      this.last = {changes: this.diff(before, this.tables), hostChanges: this.hostDiff(hostBefore), messages, knowledge: 0, stable: false, phase: 'discovery', discoveredRouters: pending.map(r => r.id)};
      return this.last;
    }
    step() {
      const pending = this.routers.filter(r => r.up && !this.discovered[r.id]);
      if (pending.length) return this.discoverDirect(pending);
      const before = clone(this.tables), messages = []; let knowledge = 0;
      const hostBefore = this.hostSnapshot();
      const previous = clone(this.lsdb), next = clone(previous);
      for (const r of this.routers) for (const n of this.neighbors(r.id)) {
        const records = Object.values(previous[r.id]);
        messages.push({from: r.id, to: n.id, kind: 'LSA', origins: records.map(v => v.origin)});
        for (const lsa of records) {
          if (!next[n.id][lsa.origin] || next[n.id][lsa.origin].seq < lsa.seq) {
            next[n.id][lsa.origin] = clone(lsa); knowledge++;
          }
        }
      }
      this.lsdb = next;
      for (const r of this.routers) this.tables[r.id] = this.computeDijkstra(r.id, next[r.id]);
      this.round++;
      const changes = this.diff(before, this.tables);
      this.stable = changes.length === 0 && knowledge === 0;
      this.last = {changes, hostChanges: this.hostDiff(hostBefore), messages, knowledge, stable: this.stable, phase: 'flood'};
      return this.last;
    }
    stageEvent(action, event) {
      const before = this.snapshot(), hostBefore = this.hostSnapshot();
      try {
        // One teaching round includes the event and the adjacent routers' SPF.
        // Only later steps flood this new knowledge to other routers.
        action(this);
      } catch (error) {
        this.restore(before);
        throw error;
      }
      this.round = before.round + 1; this.stable = false;
      this.last = {changes: this.diff(before.tables, this.tables), hostChanges: this.hostDiff(hostBefore), messages: [], knowledge: 0, stable: false, phase: 'event', event};
      return this.last;
    }
    topologyChanged(affected, hostBefore = this.hostSnapshot()) {
      const before = clone(this.tables);
      this.stable = false;
      for (const id of new Set(affected)) {
        this.originate(id);
        this.tables[id] = this.computeDijkstra(id, this.lsdb[id]);
      }
      this.last = {changes: this.diff(before, this.tables), hostChanges: this.hostDiff(hostBefore), messages: [], knowledge: 0, stable: false, phase: 'change'};
      return this.last;
    }
    setRouter(id, up) {
      const r = this.routers.find(r => r.id === id);
      if (!r) throw new Error('Unknown router');
      if (r.up === up) return this.last;
      const affected = [id, ...this.links.filter(e => e.a === id || e.b === id).map(e => e.a === id ? e.b : e.a)];
      const before = clone(this.tables);
      const hostBefore = this.hostSnapshot();
      r.up = up;
      this.discovered[id] = false;
      if (up) {
        // A restarted router begins with its own knowledge, not its old memory.
        this.tables[id] = this.emptyTable(); this.tables[id][id] = {cost: 0, next: id};
        this.lsdb[id] = {};
      }
      // A restarted node waits for LSA exchange to learn remote topology.
      this.topologyChanged(up ? affected.filter(v => v !== id) : affected, hostBefore);
      this.last.changes = this.diff(before, this.tables);
      return this.last;
    }
    setLink(id, up) {
      const e = this.links.find(e => e.id === id);
      if (!e) throw new Error('Unknown link');
      e.up = up;
      return this.topologyChanged([e.a, e.b]);
    }
    setCost(id, cost) {
      if (!Number.isInteger(cost) || cost < 1 || cost > 9) throw new Error('Cost must be an integer from 1 to 9');
      const e = this.links.find(e => e.id === id);
      if (!e) throw new Error('Unknown link');
      e.cost = cost; return this.topologyChanged([e.a, e.b]);
    }
    snapshot() {
      return clone({routers: this.routers, hosts: this.hosts, links: this.links,
        infinity: this.infinity, tables: this.tables, lsdb: this.lsdb, discovered: this.discovered, round: this.round, stable: this.stable,
        sequence: this.sequence, last: this.last});
    }
    restore(state) { Object.assign(this, clone(state)); }
  }
  class Packet {
    constructor(sim, source, destination, ttl = 16) {
      this.source = sim.hosts.find(h => h.id === source);
      this.destination = sim.hosts.find(h => h.id === destination);
      if (!this.source || !this.destination || source === destination) throw new Error('请选择两个不同的终端');
      this.path = [source]; this.current = source; this.ttl = ttl; this.status = 'moving';
      this.reason = '数据包已创建，等待从源终端出发。'; this.lastHop = null;
    }
    drop(reason) { this.status = 'dropped'; this.reason = reason; this.lastHop = null; return this; }
    step(sim) {
      if (this.status !== 'moving') return this;
      const from = this.current; let next;
      if (from === this.source.id) {
        if (this.source.router === this.destination.router) {
          this.current = this.destination.id; this.path.push(this.current);
          this.lastHop = {from, to: this.current}; this.status = 'delivered';
          this.reason = `${this.source.id} 与 ${this.destination.id} 在同一 /24 网络，通过局域网直接交付，不经过路由器，TTL 保持不变。`;
          return this;
        }
        next = this.source.router;
        if (!sim.isUp(next)) return this.drop(`默认网关 ${next} 离线，数据包无法进入网络。`);
        this.reason = `${this.source.id} 将数据交给默认网关 ${next}。`;
      } else {
        if (!sim.isUp(from)) return this.drop(`${from} 已离线，无法继续转发。`);
        if (this.ttl <= 1) { this.ttl = 0; return this.drop(`TTL 已耗尽：${from} 丢弃数据包，避免无限循环。`); }
        this.ttl--;
        if (from === this.destination.router) {
          if (!sim.discovered[from]) return this.drop(`${from} 尚未发现直连终端，暂时无法交付给 ${this.destination.id}。`);
          next = this.destination.id; this.status = 'delivered';
          this.reason = `${from} 发现目的地址在直连网络，将数据交付给 ${next}。`;
        } else {
          const route = sim.hostRoutes(from).find(h => h.id === this.destination.id);
          if (!route?.next || route.cost >= sim.infinity) return this.drop(`${from} 的路由表没有可达的目的网络，数据包被丢弃。`);
          next = route.next;
          const e = sim.links.find(e => (e.a === from && e.b === next) || (e.b === from && e.a === next));
          if (!e || !sim.linkUp(e)) return this.drop(`${from} 的旧路由指向 ${next}，但链路不可用，转发失败。`);
          this.reason = `${from} 查询路由表：目的终端 ${this.destination.id}（${this.destination.ip}），下一跳 ${next}，代价 ${route.cost}；TTL 减 1。`;
        }
      }
      this.lastHop = {from, to: next}; this.current = next; this.path.push(next);
      return this;
    }
  }
  class RoundTimeline {
    constructor(sim) {
      this.sim = sim;
      this.frames = new Map();
      this.update();
    }
    update() {
      // Forecast on a separate model so showing the available rounds never
      // advances the live network. An edit replaces only the current future.
      for (const round of this.frames.keys()) if (round >= this.sim.round) this.frames.delete(round);
      this.frames.set(this.sim.round, this.sim.snapshot());
      const forecast = new RoutingSimulation();
      forecast.restore(this.sim.snapshot());
      let steps = 0;
      while (!forecast.stable && steps < 80) {
        forecast.step(); steps++;
        this.frames.set(forecast.round, forecast.snapshot());
      }
      if (!forecast.stable) throw new Error('Routing timeline did not converge');
    }
    select(round) {
      if (!Number.isInteger(round) || !this.frames.has(round)) throw new Error('Unknown round');
      this.sim.restore(this.frames.get(round));
      return this.sim.last;
    }
    applyEvent(action, event) {
      this.sim.stageEvent(action, event);
      this.update();
      return this.sim.last;
    }
    list() {
      return [...this.frames.entries()].sort((a, b) => a[0] - b[0])
        .map(([round, state]) => ({round, phase: state.last.phase, stable: state.stable, event: state.last.event}));
    }
  }
  const api = { RoutingSimulation, createTopology, Packet, RoundTimeline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RoutingLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
