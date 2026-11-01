const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RoutingSimulation, Packet, RoundTimeline } = require('./routing.js');

function converge(sim, max = 80) {
  for (let i = 0; i < max; i++) if (sim.step().stable) return;
  assert.fail('routing did not converge');
}
function reference(sim, source) {
  const dist = Object.fromEntries(sim.routers.map(r => [r.id, Infinity]));
  if (!sim.isUp(source)) return dist;
  dist[source] = 0;
  for (let i = 0; i < sim.routers.length; i++) for (const e of sim.links) {
    if (!sim.linkUp(e)) continue;
    dist[e.b] = Math.min(dist[e.b], dist[e.a] + e.cost);
    dist[e.a] = Math.min(dist[e.a], dist[e.b] + e.cost);
  }
  return dist;
}
function checkAll(sim) {
  for (const r of sim.routers) {
    const expected = reference(sim, r.id);
    for (const d of sim.routers) {
      const actual = sim.tables[r.id][d.id].cost;
      const wanted = expected[d.id];
      assert.equal(actual, wanted, `${r.id} to ${d.id}`);
    }
  }
}

test('default model only uses LSA flooding and uncapped Dijkstra distances', () => {
  const s = new RoutingSimulation();
  assert.equal(s.infinity, Infinity);
  s.step();
  assert.equal(s.last.phase, 'discovery');
  assert.ok(s.last.messages.length > 0);
  assert.ok(s.last.messages.every(m => m.kind === 'HELLO'));
  s.step();
  assert.ok(s.last.messages.every(m => m.kind === 'LSA'));
  assert.equal(s.computeDV, undefined);
  for (const e of s.links) s.setCost(e.id, 9);
  converge(s); checkAll(s);
  assert.equal(s.tables.R1.R5.cost, 18);
});

test(`Dijkstra: initial knowledge and convergence match shortest paths`, () => {
  const s = new RoutingSimulation();
  assert.equal(s.tables.R1.R1.cost, 0);
  assert.equal(s.tables.R1.R2.cost, s.infinity);
  assert.equal(s.tables.R1.R3.cost, s.infinity);
  assert.equal(s.tables.R1.R5.cost, s.infinity);
  s.step();
  assert.equal(s.tables.R1.R2.cost, 1);
  assert.equal(s.tables.R1.R3.cost, s.infinity);
  s.step();
  assert.equal(s.tables.R1.R3.cost, 2);
  converge(s); checkAll(s);
  assert.equal(s.tables.R1.R5.next, 'R2');
});
test(`Dijkstra: remote state remains stale until fault propagates; alternate path is used`, () => {
  const s = new RoutingSimulation(); converge(s);
  s.setRouter('R3', false);
  assert.equal(s.tables.R1.R5.cost, 3, 'R1 must not know a remote failure instantly');
  converge(s); checkAll(s);
  assert.equal(s.tables.R1.R5.next, 'R4');
  assert.equal(s.tables.R1.R5.cost, 5);
  s.setRouter('R3', true); converge(s); checkAll(s);
  assert.equal(s.tables.R1.R5.cost, 3);
});
test(`Dijkstra: link failure, isolation, restore, and cost changes`, () => {
  const s = new RoutingSimulation(); converge(s);
  s.setLink('R1-R2', false); converge(s); checkAll(s);
  s.setLink('R1-R4', false); converge(s); checkAll(s);
  assert.equal(s.tables.R1.R5.cost, s.infinity);
  s.setLink('R1-R2', true); converge(s); checkAll(s);
  s.setCost('R2-R3', 8); converge(s); checkAll(s);
  assert.throws(() => s.setCost('R2-R3', 0));
  assert.throws(() => s.setCost('R2-R3', 2.5));
});
test(`Dijkstra: snapshot restore reproduces the next round`, () => {
  const s = new RoutingSimulation(); s.step();
  const state = s.snapshot(); s.step(); const expected = s.snapshot();
  s.restore(state); s.step();
  assert.deepEqual(s.snapshot(), expected);
});
test(`Dijkstra: restarted router waits for direct discovery before learning remote paths`, () => {
  const s = new RoutingSimulation(); converge(s);
  s.setRouter('R1', false); converge(s); s.setRouter('R1', true);
  assert.equal(s.tables.R1.R5.cost, s.infinity);
  assert.equal(s.tables.R1.R2.cost, Infinity);
  assert.deepEqual(Object.keys(s.lsdb.R1), []);
  s.step();
  assert.equal(s.tables.R1.R2.cost, 1);
  assert.deepEqual(Object.keys(s.lsdb.R1), ['R1']);
  converge(s); checkAll(s);
});
test(`Dijkstra: reinitialization preserves topology without preserving learned routes`, () => {
  const s = new RoutingSimulation(); converge(s); s.setRouter('R3', false);
  const fresh = new RoutingSimulation({routers:s.routers, hosts:s.hosts, links:s.links});
  assert.equal(fresh.tables.R3.R3.cost, fresh.infinity);
  assert.equal(fresh.tables.R1.R5.cost, fresh.infinity);
  converge(fresh); checkAll(fresh);
});
test(`Dijkstra: packets follow actual next-hop tables and report delivery or failure`, () => {
  const s = new RoutingSimulation();
  let p = new Packet(s, 'H1', 'H6');
  p.step(s); p.step(s);
  assert.equal(p.status, 'dropped', 'unknown destination must not be routed by global shortest path');
  converge(s); p = new Packet(s, 'H1', 'H6');
  while (p.status === 'moving') p.step(s);
  assert.equal(p.status, 'delivered');
  assert.deepEqual(p.path, ['H1', 'R1', 'R2', 'R3', 'R5', 'H6']);
  p = new Packet(s, 'H1', 'H6'); p.step(s); p.step(s); p.step(s);
  s.setRouter('R3', false); p.step(s);
  assert.equal(p.status, 'dropped');
  converge(s); p = new Packet(s, 'H1', 'H6');
  while (p.status === 'moving') p.step(s);
  assert.equal(p.status, 'delivered');
  assert.deepEqual(p.path, ['H1', 'R1', 'R4', 'R5', 'H6']);
});

test('packet: same-subnet hosts communicate directly even if the gateway is down', () => {
  const s = new RoutingSimulation(); s.setRouter('R1', false);
  const p = new Packet(s, 'H1', 'H2'); p.step(s);
  assert.equal(p.status, 'delivered');
  assert.deepEqual(p.path, ['H1', 'H2']);
  assert.equal(p.ttl, 16);
});
test('host rows expand the learned network routes without creating extra routing entries', () => {
  const s = new RoutingSimulation();
  let rows = s.hostRoutes('R1');
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.find(h => h.id === 'H1'), {
    id: 'H1', ip: '192.168.1.10', router: 'R1', network: '192.168.1.0/24', cost: Infinity, next: null
  });
  assert.equal(rows.find(h => h.id === 'H2').cost, Infinity);
  assert.equal(rows.find(h => h.id === 'H3').cost, Infinity);
  assert.equal(rows.find(h => h.id === 'H6').cost, Infinity);
  assert.equal(Object.keys(s.tables.R1).length, 5);
  s.step();
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H1').cost, 0);
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H3').cost, Infinity);
  assert.ok(s.last.hostChanges.some(c => c.router === 'R1' && c.destination === 'H1'));
  assert.ok(!s.last.hostChanges.some(c => c.router === 'R1' && c.destination === 'H3'));
  s.step();
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H3').cost, 1);
  assert.ok(s.last.hostChanges.some(c => c.router === 'R1' && c.destination === 'H3' && c.before.cost === Infinity && c.after.cost === 1));
  converge(s);
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H6').next, 'R2');
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H6').cost, 3);
  s.setRouter('R3', false);
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H6').cost, 3);
  converge(s);
  rows = s.hostRoutes('R1');
  assert.equal(rows.find(h => h.id === 'H6').next, 'R4');
  assert.equal(rows.find(h => h.id === 'H6').cost, 5);
  assert.equal(rows.find(h => h.id === 'H4').cost, Infinity);
  s.setRouter('R1', false);
  assert.ok(s.hostRoutes('R1').every(h => h.cost === Infinity));
});
test('ls: knowledge floods across neighbors with sequence numbers', () => {
  const s = new RoutingSimulation();
  assert.equal(Object.keys(s.lsdb.R1).length, 0);
  s.step(); assert.deepEqual(Object.keys(s.lsdb.R1), ['R1']);
  s.step(); assert.ok(s.lsdb.R1.R2); assert.equal(s.lsdb.R1.R3, undefined);
  s.step(); assert.ok(s.lsdb.R1.R3);
  converge(s); const seq = s.lsdb.R2.R2.seq;
  s.setLink('R1-R2', false);
  assert.ok(s.lsdb.R2.R2.seq > seq);
});
test('packet: TTL expires in a transient routing loop', () => {
  const s = new RoutingSimulation(); converge(s);
  s.tables.R1.R5 = {cost: 3, next: 'R2'};
  s.tables.R2.R5 = {cost: 3, next: 'R1'};
  const p = new Packet(s, 'H1', 'H6', 3);
  for (let i = 0; i < 10 && p.status === 'moving'; i++) p.step(s);
  assert.equal(p.status, 'dropped'); assert.match(p.reason, /TTL/);
});
test('Dijkstra retains shortest-path correctness across deterministic topology mutations', () => {
  let seed = 20261030;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  {
    const s = new RoutingSimulation();
    for (let i = 0; i < 100; i++) {
      if (i % 3 === 0) { const r = s.routers[random(s.routers.length)]; s.setRouter(r.id, !r.up); }
      else { const e = s.links[random(s.links.length)]; if (i % 3 === 1) s.setLink(e.id, !e.up); else s.setCost(e.id, random(9) + 1); }
      converge(s); checkAll(s);
    }
  }
});

test('topology changes cannot discover direct connections before the discovery step', () => {
  const s = new RoutingSimulation();
  s.setCost('R1-R2', 2); s.setLink('R1-R4', false); s.setRouter('R3', false);
  assert.equal(s.tables.R1.R1.cost, 0);
  assert.equal(s.tables.R1.R2.cost, Infinity);
  assert.deepEqual(s.lsdb.R1, {});
  assert.ok(s.hostRoutes('R1').every(h => h.cost === Infinity));
  const initial = s.snapshot();
  s.step();
  assert.equal(s.tables.R1.R2.cost, 2);
  assert.equal(s.tables.R1.R4.cost, Infinity);
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H1').cost, 0);
  s.restore(initial);
  assert.equal(s.tables.R1.R2.cost, Infinity);
  assert.ok(s.hostRoutes('R1').every(h => h.cost === Infinity));
  converge(s); checkAll(s);
});

test('round selection ends at the last changing round without advancing the initial state', () => {
  const s = new RoutingSimulation(), initial = s.snapshot();
  const timeline = new RoundTimeline(s);
  assert.deepEqual(s.snapshot(), initial);
  assert.deepEqual(timeline.list().map(f => f.round), [0, 1, 2, 3]);
  const reference = new RoutingSimulation(), expected = [reference.snapshot()];
  while (!reference.stable) { reference.step(); expected.push(reference.snapshot()); }
  timeline.select(3);
  assert.equal(s.stable, true);
  assert.deepEqual(s.tables, reference.tables);
  assert.deepEqual(s.lsdb, reference.lsdb);
  assert.deepEqual(s.last.changes, expected[3].last.changes);
  for (const round of [0, 2, 1, 0]) {
    timeline.select(round); assert.deepEqual(s.snapshot(), expected[round]);
  }
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H1').cost, Infinity);
  timeline.select(1);
  assert.equal(s.hostRoutes('R1').find(h => h.id === 'H1').cost, 0);
  assert.equal(s.tables.R1.R3.cost, Infinity);
  assert.throws(() => timeline.select(-1));
  assert.throws(() => timeline.select(99));
  assert.throws(() => timeline.select(1.5));
});

test('round selection rebuilds future frames after faults and preserves earlier rounds', () => {
  const s = new RoutingSimulation(), timeline = new RoundTimeline(s);
  const baselineRound = timeline.list().at(-1).round;
  timeline.select(baselineRound); s.setRouter('R3', false); timeline.update();
  assert.equal(s.round, baselineRound);
  assert.equal(s.tables.R1.R5.cost, 3);
  const last = timeline.list().at(-1);
  assert.ok(last.round > baselineRound && last.stable);
  timeline.select(last.round);
  assert.equal(s.tables.R1.R5.cost, 5);
  assert.equal(s.tables.R1.R5.next, 'R4');
  timeline.select(0); assert.equal(s.isUp('R3'), true);
  timeline.select(baselineRound); assert.equal(s.isUp('R3'), false);
  timeline.select(1); s.setCost('R1-R2', 9); timeline.update();
  timeline.select(timeline.list().at(-1).round); checkAll(s);
  assert.equal(s.isUp('R3'), true, 'discarded future fault must not reappear');
});

for (const scenario of ['R2 offline', 'R1-R2 delay spike']) {
  test(`${scenario}: every host remains reachable after reconvergence`, () => {
    const s = new RoutingSimulation(); converge(s);
    assert.equal(s.tables.R1.R5.next, 'R2');
    if (scenario === 'R2 offline') s.setRouter('R2', false);
    else s.setCost('R1-R2', 8);
    converge(s); checkAll(s);
    assert.equal(s.tables.R1.R5.next, 'R4');
    assert.equal(s.tables.R1.R5.cost, 5);
    assert.ok(s.hostRoutes('R1').every(h => h.cost < Infinity));
    for (const source of s.hosts) for (const destination of s.hosts) {
      if (source.id === destination.id) continue;
      const packet = new Packet(s, source.id, destination.id);
      while (packet.status === 'moving') packet.step(s);
      assert.equal(packet.status, 'delivered', `${source.id} to ${destination.id}`);
      assert.ok(!packet.path.includes('R2') || scenario !== 'R2 offline');
    }
    if (scenario === 'R2 offline') s.setRouter('R2', true);
    else s.setCost('R1-R2', 1);
    converge(s); checkAll(s);
    assert.equal(s.tables.R1.R5.next, 'R2');
    assert.equal(s.tables.R1.R5.cost, 3);
  });
}

test('fault demonstration starts with a converged round-zero baseline', () => {
  const s = RoutingSimulation.converged();
  assert.equal(s.round, 0);
  assert.equal(s.stable, true);
  assert.equal(s.last.phase, 'baseline');
  assert.equal(s.tables.R1.R5.next, 'R2');
  assert.equal(s.tables.R1.R5.cost, 3);
  assert.ok(s.hostRoutes('R1').every(h => h.cost < Infinity));
  assert.ok(s.routers.every(r => r.up));
  const timeline = new RoundTimeline(s);
  assert.deepEqual(timeline.list().map(f => f.round), [0]);
});

test('fault and repair events append rounds while preserving the healthy baseline', () => {
  const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s);
  const baseline = s.snapshot();
  timeline.applyEvent(() => s.setRouter('R2', false), 'R2 故障');
  assert.equal(s.round, 1);
  assert.equal(timeline.list().find(f => f.round === 1).event, 'R2 故障');
  const faultRound = timeline.list().at(-1).round;
  timeline.select(faultRound);
  assert.equal(s.tables.R1.R5.next, 'R4');
  assert.ok(s.hostRoutes('R1').every(h => h.cost < Infinity));
  timeline.applyEvent(() => s.setRouter('R2', true), 'R2 恢复');
  timeline.select(timeline.list().at(-1).round);
  assert.equal(s.tables.R1.R5.next, 'R2');
  timeline.select(0); assert.deepEqual(s.snapshot(), baseline);
  timeline.select(1); assert.equal(s.isUp('R2'), false);
});

for (const event of ['router failure', 'delay increase']) {
  test(`${event}: event round includes local recomputation; next round propagates it`, () => {
    const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s);
    const before = s.snapshot();
    timeline.applyEvent(() => event === 'router failure' ? s.setRouter('R2', false) : s.setCost('R1-R2', 8), event);
    assert.equal(s.round, 1);
    assert.equal(s.last.phase, 'event');
    assert.deepEqual(s.tables.R1.R5, {cost: 5, next: 'R4'});
    assert.deepEqual(s.tables.R5, before.tables.R5, 'remote R5 must wait for propagation');
    assert.deepEqual(s.lsdb.R5, before.lsdb.R5);
    assert.ok(s.lsdb.R1.R1.seq > before.lsdb.R1.R1.seq);
    assert.ok(s.sequence > before.sequence);
    assert.ok(s.last.changes.some(c => c.router === 'R1' && c.destination === 'R5'));
    assert.deepEqual(s.last.messages, []);
    assert.equal(s.hostRoutes('R1').find(h => h.id === 'H6').next, 'R4');
    assert.equal(s.hostRoutes('R1').find(h => h.id === 'H6').cost, 5);
    if (event === 'router failure') {
      assert.equal(s.isUp('R2'), false);
      for (const id of ['R1', 'R3', 'R4']) assert.equal(s.tables[id].R2.cost, Infinity);
    } else {
      assert.equal(s.links.find(e => e.id === 'R1-R2').cost, 8);
      assert.deepEqual(s.tables.R1.R2, {cost: 3, next: 'R4'});
    }
    const packet = new Packet(s, 'H1', 'H6');
    while (packet.status === 'moving') packet.step(s);
    assert.equal(packet.status, 'delivered');
    assert.deepEqual(packet.path, ['H1', 'R1', 'R4', 'R5', 'H6']);
    const eventFrame = s.snapshot();
    timeline.select(2);
    assert.equal(s.last.phase, 'flood');
    assert.ok(s.last.messages.length > 0);
    if (event === 'router failure') assert.equal(s.tables.R5.R2.cost, Infinity);
    assert.ok(timeline.list().every(f => f.phase !== 'detection'));
    assert.deepEqual(timeline.list().map(f => f.round), event === 'router failure' ? [0, 1, 2] : [0, 1, 2, 3]);
    assert.equal(s.stable, event === 'router failure');
    timeline.select(timeline.list().at(-1).round); checkAll(s);
    assert.ok(s.hostRoutes('R1').every(h => h.cost < Infinity));
    timeline.select(1); assert.deepEqual(s.snapshot(), eventFrame);
    timeline.select(0); assert.deepEqual(s.snapshot(), before);
  });
}

test('invalid staged event leaves the original state intact', () => {
  const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s), before = s.snapshot();
  assert.throws(() => timeline.applyEvent(() => s.setCost('R1-R2', 0), 'invalid'));
  assert.deepEqual(s.snapshot(), before);
  assert.deepEqual(timeline.list().map(f => f.round), [0]);
  assert.throws(() => timeline.applyEvent(() => { s.setCost('R1-R2', 8); s.setCost('R1-R2', 0); }, 'partial invalid'));
  assert.deepEqual(s.snapshot(), before);
  assert.deepEqual(timeline.list().map(f => f.round), [0]);
});


test('a broken link reroutes locally in its event round without marking the live peer offline', () => {
  const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s);
  const before = s.snapshot();
  timeline.applyEvent(() => s.setLink('R1-R2', false), '链路断开');
  assert.equal(s.round, 1);
  assert.equal(s.isUp('R2'), true);
  assert.deepEqual(s.tables.R1.R2, {cost: 3, next: 'R4'});
  assert.deepEqual(s.tables.R2.R1, {cost: 3, next: 'R4'});
  assert.deepEqual(s.tables.R1.R5, {cost: 5, next: 'R4'});
  assert.deepEqual(s.tables.R5, before.tables.R5);
  timeline.select(timeline.list().at(-1).round); checkAll(s);
});

test('offline router never becomes reachable again after its failure is learned', () => {
  const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s);
  timeline.applyEvent(() => s.setRouter('R2', false), 'R2 故障');
  const learned = new Set(['R1', 'R3', 'R4']);
  for (const frame of timeline.list().filter(f => f.round > 0)) {
    timeline.select(frame.round);
    if (frame.round >= 2) learned.add('R5');
    for (const id of learned) {
      assert.deepEqual(s.tables[id].R2, {cost: Infinity, next: null}, `${id}, round ${frame.round}`);
      if (frame.round >= 1) for (const [destination, route] of Object.entries(s.tables[id]))
        assert.notEqual(route.next, 'R2', `${id} to ${destination} must not transit failed R2 in round ${frame.round}`);
    }
  }
  assert.ok(s.hostRoutes('R1').every(h => h.cost < Infinity));
  const faultFinalRound = timeline.list().at(-1).round;
  timeline.applyEvent(() => s.setRouter('R2', true), 'R2 恢复');
  timeline.select(timeline.list().at(-1).round); checkAll(s);
  assert.equal(s.tables.R1.R2.cost, 1);
  assert.equal(s.tables.R5.R2.cost, 2);
  timeline.select(faultFinalRound); assert.equal(s.tables.R1.R2.cost, Infinity);
});

test('direct API failure knowledge prevents stale LSAs from resurrecting a failed node', () => {
  const s = RoutingSimulation.converged(); s.setRouter('R2', false);
  for (let i = 0; i < 8; i++) {
    for (const id of ['R1', 'R3', 'R4']) assert.equal(s.tables[id].R2.cost, Infinity, id);
    s.step();
  }
  checkAll(s);
});


test('R4 failure ends in its first round and retains fully synchronized state for later events', () => {
  const s = RoutingSimulation.converged(), timeline = new RoundTimeline(s);
  timeline.applyEvent(() => s.setRouter('R4', false), 'R4 故障');
  assert.deepEqual(timeline.list().map(f => f.round), [0, 1]);
  assert.equal(s.round, 1); assert.equal(s.stable, true);
  assert.equal(s.last.event, 'R4 故障'); assert.ok(s.last.changes.length > 0);
  checkAll(s);
  for (const id of ['R1','R2','R3','R5']) assert.equal(s.hostRoutes(id).find(h => h.id === 'H3').cost, Infinity);
  const settled = new RoutingSimulation(); settled.restore(s.snapshot());
  assert.equal(settled.step().knowledge, 0);
  timeline.select(0); assert.equal(s.isUp('R4'), true);
  timeline.select(1); assert.equal(s.isUp('R4'), false); assert.equal(s.stable, true);
  timeline.applyEvent(() => s.setRouter('R4', true), 'R4 恢复');
  timeline.select(timeline.list().at(-1).round); checkAll(s);
});

test('a host-only route change remains visible even when router distances no longer change', () => {
  const s = new RoutingSimulation({
    routers: [{id:'R1',up:true,network:'192.168.1.0/24'},{id:'R2',up:true,network:'192.168.2.0/24'}],
    hosts: [{id:'H1',router:'R2',ip:'192.168.2.10'}],
    links: [{id:'R1-R2',a:'R1',b:'R2',cost:1,up:true}]
  });
  const timeline = new RoundTimeline(s);
  assert.deepEqual(timeline.list().map(f => f.round), [0,1,2]);
  timeline.select(1); assert.equal(s.hostRoutes('R1')[0].cost, Infinity);
  timeline.select(2); assert.equal(s.last.changes.length,0);
  assert.ok(s.last.hostChanges.length > 0); assert.equal(s.hostRoutes('R1')[0].cost,1);
  assert.equal(s.stable,true);
});
