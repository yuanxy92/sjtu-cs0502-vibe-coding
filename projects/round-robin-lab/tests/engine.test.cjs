const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the very same embedded engine that the standalone HTML uses.
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = html.match(/<script id="rr-engine">([\s\S]*?)<\/script>/)?.[1] || '';
const context = vm.createContext({});
vm.runInContext(source, context);
const RR = context.RR || {};
const plain = value => JSON.parse(JSON.stringify(value));
const job = (id, arrival, burst) => ({ id, arrival, burst });
function run(jobs, quantum) {
  const state = RR.createSimulation(jobs, quantum);
  while (!state.done && state.time < 1000) RR.stepSimulation(state);
  assert.equal(state.done, true, 'simulation should complete');
  return state;
}

test('embedded engine provides real scheduling operations', () => {
  assert.equal(typeof RR.createSimulation, 'function');
  assert.equal(typeof RR.stepSimulation, 'function');
});

test('course example matches all 20 intervals and completion times', () => {
  const state = run([job('A', 0, 3), job('B', 2, 6), job('C', 4, 4), job('D', 6, 5), job('E', 8, 2)], 1);
  assert.equal(state.history.join(' '), 'A A B A B C B D C B E D C B E D C B D D');
  assert.equal(state.time, 20);
  assert.deepEqual(plain(state.jobs.map(p => [p.id, p.remaining, p.finishedAt])), [
    ['A', 0, 4], ['B', 0, 18], ['C', 0, 17], ['D', 0, 20], ['E', 0, 15]
  ]);
  assert.equal(state.running, null);
  assert.deepEqual(plain(state.queue), []);
});

test('initial t=0 dispatch does not consume CPU time', () => {
  const state = RR.createSimulation([job('A', 0, 2), job('B', 0, 1)], 1);
  assert.equal(state.time, 0);
  assert.equal(state.running, 'A');
  assert.deepEqual(plain(state.queue), ['B']);
  assert.equal(state.jobs[0].remaining, 2);
  assert.deepEqual(plain(state.history), []);
});

test('arrival at quantum boundary enters queue before expired process', () => {
  const state = run([job('A', 0, 2), job('B', 1, 1)], 1);
  assert.deepEqual(plain(state.history), ['A', 'B', 'A']);
});

test('arrival does not preempt an unfinished quantum', () => {
  const state = RR.createSimulation([job('A', 0, 3), job('B', 1, 1)], 2);
  RR.stepSimulation(state);
  assert.equal(state.running, 'A');
  assert.equal(state.quantumUsed, 1);
  assert.deepEqual(plain(state.queue), ['B']);
  RR.stepSimulation(state);
  assert.equal(state.running, 'B');
  assert.deepEqual(plain(run([job('A', 0, 3), job('B', 1, 1)], 2).history), ['A', 'A', 'B', 'A']);
});

test('existing queue order and input order of simultaneous arrivals are preserved', () => {
  const state = RR.createSimulation([job('A', 0, 3), job('B', 0, 2), job('D', 1, 1), job('C', 1, 1)], 1);
  RR.stepSimulation(state);
  assert.equal(state.running, 'B');
  assert.deepEqual(plain(state.queue), ['D', 'C', 'A']);
});

test('completion exactly at boundary wins over requeue', () => {
  const state = RR.createSimulation([job('A', 0, 1), job('B', 1, 1)], 1);
  RR.stepSimulation(state);
  assert.equal(state.jobs[0].status, 'completed');
  assert.equal(state.running, 'B');
  assert.deepEqual(plain(state.queue), []);
  assert.equal(state.quantumUsed, 0);
});

test('idle time appears on timeline, including gaps between jobs', () => {
  assert.deepEqual(plain(run([job('A', 2, 1)], 1).history), [null, null, 'A']);
  assert.deepEqual(plain(run([job('A', 0, 1), job('B', 3, 1)], 1).history), ['A', null, null, 'B']);
});

test('large quantum completes short process without wasting remaining slice', () => {
  assert.deepEqual(plain(run([job('A', 0, 1), job('B', 0, 2)], 10).history), ['A', 'B', 'B']);
});

test('a sole process can receive consecutive slices and completion is stable', () => {
  const state = run([job('only', 0, 3)], 1);
  assert.deepEqual(plain(state.history), ['only', 'only', 'only']);
  const before = JSON.stringify(state);
  RR.stepSimulation(state);
  assert.equal(JSON.stringify(state), before);
});

test('rejects empty input and blank or duplicate names', () => {
  for (const jobs of [[], [job('', 0, 1)], [job('   ', 0, 1)], [job('A', 0, 1), job(' A ', 1, 1)]]) {
    assert.ok(RR.validateConfig(jobs, 1).length > 0);
    assert.throws(() => RR.createSimulation(jobs, 1));
  }
});

test('rejects invalid arrival, burst, and quantum, including blank form fields', () => {
  for (const arrival of [-1, 0.5, '', null, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(RR.validateConfig([job('A', arrival, 1)], 1).length > 0);
  }
  for (const value of [0, -1, 0.5, '', null, Infinity, 'abc']) {
    assert.ok(RR.validateConfig([job('A', 0, value)], 1).length > 0);
    assert.ok(RR.validateConfig([job('A', 0, 1)], value).length > 0);
  }
});

test('accepts numeric form strings and does not mutate input configuration', () => {
  const jobs = [job(' A ', '0', '2')];
  const original = JSON.stringify(jobs);
  const state = run(jobs, '1');
  assert.deepEqual(plain(state.history), ['A', 'A']);
  assert.equal(JSON.stringify(jobs), original);
});

test('every snapshot conserves service time and has a consistent queue and CPU', () => {
  const state = RR.createSimulation(RR.DEFAULT_JOBS, 2);
  while (!state.done) {
    const executed = state.history.filter(id => id !== null).length;
    assert.equal(state.jobs.reduce((n, p) => n + p.burst - p.remaining, 0), executed);
    assert.equal(new Set(state.queue).size, state.queue.length);
    for (const id of state.queue) assert.equal(state.jobs.find(p => p.id === id).status, 'ready');
    if (state.running) {
      assert.equal(state.jobs.find(p => p.id === state.running).status, 'running');
      assert.equal(state.queue.includes(state.running), false);
    }
    RR.stepSimulation(state);
  }
});

test('boundary moves show arrival before requeue and head dispatch', () => {
  const state = RR.createSimulation([job('A', 0, 2), job('B', 1, 1)], 1);
  const before = plain(state);
  RR.stepSimulation(state);
  assert.ok(Array.isArray(state.events.at(-1).moves), 'boundary should expose ordered movement events');
  assert.deepEqual(plain(state.events.at(-1).moves), [
    {type:'arrival',id:'B'}, {type:'requeue',id:'A'}, {type:'dispatch',id:'B'}
  ]);
  const plan = RR.transitionFrames(before, state);
  assert.deepEqual(plain(plan.initial.queue), []);
  assert.equal(plan.initial.running, 'A');
  assert.deepEqual(plain(plan.steps.map(s => [s.move.type, s.view.queue, s.view.running])), [
    ['arrival', ['B'], 'A'], ['requeue', ['B', 'A'], null], ['dispatch', ['A'], 'B']
  ]);
  assert.equal(plan.initial.jobs[0].remaining, 1);
  assert.deepEqual(plain(plan.steps.at(-1).view.jobs), plain(state.jobs));
});

test('completed process never gets requeue frames', () => {
  const state = RR.createSimulation([job('A', 0, 1), job('B', 1, 1)], 1);
  const before = plain(state); RR.stepSimulation(state);
  const plan = RR.transitionFrames(before,state);
  assert.equal(plan.initial.running,'A');
  assert.equal(plan.initial.jobs[0].status,'finishing');
  assert.deepEqual(plain(plan.steps.map(s=>s.move.type)),['complete','arrival','dispatch']);
  assert.equal(plan.steps[0].view.running,null);
  assert.equal(plan.steps[0].view.jobs[0].status,'completed');
});

test('presentation frames preserve a running process with unused quantum', () => {
  const state = RR.createSimulation([job('A',0,3),job('B',1,1)],2);
  const before = plain(state); RR.stepSimulation(state);
  const plan = RR.transitionFrames(before,state);
  assert.deepEqual(plain(plan.steps.map(s=>s.move.type)),['arrival']);
  assert.equal(plan.steps[0].view.running,'A');
  assert.equal(plan.steps[0].view.quantumUsed,1);
});

test('movement planning preserves input states and existing queue order', () => {
  const state = RR.createSimulation([job('A',0,2),job('B',0,1),job('D',1,1),job('C',1,1)],1);
  const before = plain(state); RR.stepSimulation(state);
  const beforeJson = JSON.stringify(before), afterJson = JSON.stringify(state);
  const plan = RR.transitionFrames(before,state);
  assert.deepEqual(plain(plan.steps.map(s=>s.view.queue)),[['B','D'],['B','D','C'],['B','D','C','A'],['D','C','A']]);
  assert.equal(JSON.stringify(before),beforeJson);
  assert.equal(JSON.stringify(state),afterJson);
});

test('last completion exits CPU before presentation declares all jobs complete', () => {
  const state = RR.createSimulation([job('A',0,1)],1);
  const before = plain(state); RR.stepSimulation(state);
  assert.deepEqual(plain(state.events.at(-1).moves),[{type:'complete',id:'A'}]);
  const plan = RR.transitionFrames(before,state);
  assert.equal(plan.initial.done,false);
  assert.equal(plan.initial.running,'A');
  assert.equal(plan.initial.jobs[0].remaining,0);
  assert.equal(plan.steps.length,1);
  assert.equal(plan.steps[0].view.done,true);
  assert.equal(plan.steps[0].view.running,null);
  assert.equal(plan.steps[0].view.jobs[0].status,'completed');
  assert.deepEqual(plain(plan.steps[0].view.queue),[]);
});

test('completion animation precedes simultaneous arrival and dispatch animations', () => {
  const state = RR.createSimulation([job('A',0,1),job('C',1,1),job('B',1,1)],2);
  const before = plain(state); RR.stepSimulation(state);
  assert.deepEqual(plain(state.events.at(-1).moves),[
    {type:'complete',id:'A'}, {type:'arrival',id:'C'}, {type:'arrival',id:'B'}, {type:'dispatch',id:'C'}
  ]);
  const plan = RR.transitionFrames(before,state);
  assert.deepEqual(plain(plan.steps.map(step=>step.view.queue)),[[],['C'],['C','B'],['B']]);
  assert.deepEqual(plain(plan.steps.at(-1).view.jobs),plain(state.jobs));
});
