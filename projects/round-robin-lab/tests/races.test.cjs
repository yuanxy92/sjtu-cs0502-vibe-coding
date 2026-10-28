const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '..', 'race-examples.html');
const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const script = html.match(/<script id="races-engine">([\s\S]*?)<\/script>/)?.[1] || '';
const context = vm.createContext({});
vm.runInContext(script, context);
const R = context.Races || {};
const plain = value => JSON.parse(JSON.stringify(value));

test('the standalone page exposes its actual teaching engine', () => {
  assert.equal(typeof R.create, 'function');
  assert.equal(typeof R.step, 'function');
});

test('q=1 counter loses one increment through the literal A B A B A B interleaving', () => {
  const s = R.run('counter', 1, false);
  assert.deepEqual(plain(s.trace.map(t => t.process)), ['A','B','A','B','A','B']);
  assert.equal(s.shared.counter, 1);
  assert.equal(s.result.ok, false);
  assert.equal(s.hazard, true);
});

test('both buyers confirm the last ticket even though the final stock is zero', () => {
  const s = R.run('ticket', 1, false);
  assert.equal(s.shared.stock, 0);
  assert.deepEqual(plain(s.processes.map(p => p.confirmed)), [true, true]);
  assert.equal(s.result.ok, false);
});

test('transfer keeps the erroneous observer snapshot after the accounts recover', () => {
  const s = R.run('transfer', 1, false);
  assert.deepEqual(plain(s.trace.map(t => t.process)), ['A','B','A']);
  assert.equal(s.shared.left, 50);
  assert.equal(s.shared.right, 150);
  assert.equal(s.observed, 150);
  assert.equal(s.hazard, true);
  assert.equal(s.result.ok, false);
});

test('mutex repairs all scenarios across every offered quantum', () => {
  for (const scenario of ['counter','ticket','transfer']) {
    for (let q = 1; q <= 4; q++) {
      const s = R.run(scenario, q, true);
      assert.equal(s.done, true, `${scenario} q=${q}`);
      assert.equal(s.result.ok, true, `${scenario} q=${q}`);
      assert.equal(s.lock.owner, null);
      assert.equal(s.lock.waiting.length, 0);
      assert.equal(s.processes.every(p => p.status === 'done'), true);
      assert.equal(s.time < 30, true);
      if (scenario === 'counter') assert.equal(s.shared.counter, 2);
      if (scenario === 'ticket') assert.equal(s.processes.filter(p => p.confirmed).length, 1);
      if (scenario === 'transfer') assert.equal(s.observed, 200);
    }
  }
});

test('failed mutex acquire blocks B without advancing B past the acquire', () => {
  let s = R.step(R.create('counter', 1, true));
  assert.equal(s.lock.owner, 'A');
  s = R.step(s);
  assert.equal(s.processes[1].pc, 0);
  assert.equal(s.processes[1].status, 'blocked');
  assert.deepEqual(plain(s.lock.waiting), ['B']);
  assert.equal(s.queue.includes('B'), false);
  assert.equal(s.running, 'A');
  while (s.lock.owner === 'A') s = R.step(s);
  assert.equal(s.lock.waiting.length, 0);
  assert.equal(s.processes[1].status, 'running');
  assert.equal(s.processes[1].pc, 0);
});

test('instruction reads preserve process-local values across context switches', () => {
  let s = R.create('counter', 1, false);
  for (let i=0; i<5; i++) s = R.step(s);
  assert.equal(s.shared.counter, 1);
  assert.equal(s.processes[1].temp, 1);
  assert.equal(s.running, 'B');
  const final = R.step(s);
  assert.equal(final.shared.counter, 1);
});

test('larger quantum can mask unsafe code in this run without constituting a repair', () => {
  assert.equal(R.run('counter', 3, false).result.ok, true);
  assert.equal(R.run('ticket', 3, false).result.ok, true);
  assert.equal(R.run('transfer', 2, false).result.ok, true);
  for (const id of ['counter','ticket','transfer']) {
    const rows = R.compare(id);
    assert.deepEqual(plain(rows.map(r => r.quantum)), [1,2,3,4]);
    assert.equal(rows[0].unsafe.ok, false);
    assert.equal(rows.every(r => r.locked.ok), true);
  }
});

test('step never mutates an earlier snapshot and stepping completion is stable', () => {
  for (const id of ['counter','ticket','transfer']) {
    let s = R.create(id, 1, true);
    while (!s.done) {
      const before = JSON.stringify(s);
      const next = R.step(s);
      assert.equal(JSON.stringify(s), before);
      assert.notEqual(s, next);
      assert.equal(next.time, s.time + 1);
      s = next;
    }
    assert.deepEqual(plain(R.step(s)), plain(s));
  }
});

test('all ready/running/blocked processes stay in the correct disjoint scheduling sets', () => {
  for (const id of ['counter','ticket','transfer']) for (let q=1;q<=4;q++) for (const locked of [false,true]) {
    let s = R.create(id,q,locked);
    while (!s.done) {
      const active = [s.running, ...s.queue, ...s.lock.waiting].filter(Boolean);
      assert.equal(new Set(active).size, active.length);
      for (const p of s.processes) {
        assert.equal(active.includes(p.id), p.status !== 'done');
        assert.equal(s.queue.includes(p.id), p.status === 'ready');
        assert.equal(s.lock.waiting.includes(p.id), p.status === 'blocked');
        assert.equal(s.running === p.id, p.status === 'running');
      }
      s = R.step(s);
      assert.equal(s.time < 30, true);
    }
  }
});

test('invalid scenario, quantum and mode are rejected', () => {
  assert.throws(() => R.create('missing', 1, false));
  for (const q of [0,-1,1.5,5,'1',null,NaN]) assert.throws(() => R.create('counter', q, false));
  assert.throws(() => R.create('counter', 1, 'false'));
});
