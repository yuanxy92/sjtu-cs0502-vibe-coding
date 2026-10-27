const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const box=vm.createContext({});vm.runInContext(html.match(/<script id="lab-engine">([\s\S]*?)<\/script>/)[1],box);
const L=box.LockLab,plain=x=>JSON.parse(JSON.stringify(x));
const advance=(s,actors)=>{for(const id of actors)L.step(s,id);return s};
function finish(s){for(let i=0;i<60&&!s.deadlocked&&!s.hadViolation&&!s.done;i++)L.next(s);return s;}
function reachable(scene,mode){
 const stack=[L.create(scene,mode)], seen=new Set();let count=0;
 while(stack.length){
  const s=stack.pop();
  const key=JSON.stringify({actors:s.actors,lock:s.lock,claims:s.claims,locks:s.locks,hadViolation:s.hadViolation});
  if(seen.has(key))continue;seen.add(key);count++;
  assert.equal(s.hadViolation,false);assert.equal(s.deadlocked,false);
  for(const id of ['P1','P2']){
   const p=s.actors.find(p=>p.id===id);if(p.status==='done'||p.status==='waiting')continue;
   const next=plain(s);L.step(next,id);stack.push(next);
  }
  assert.ok(count<1000,'finite modeled states');
 }
 return count;
}
test('engine exposes usable model operations',()=>{assert.equal(typeof L.create,'function');assert.equal(typeof L.step,'function');assert.equal(typeof L.next,'function')});
test('split check/set caches two zero reads before either write',()=>{
 const s=L.create('lock','split');advance(s,['P1','P2']);
 assert.equal(s.lock,0);assert.deepEqual(plain(s.actors.map(p=>p.read)),[0,0]);
 advance(s,['P1','P2']);assert.equal(s.lock,1);assert.deepEqual(plain(s.claims),['P1','P2']);
});
test('alternating split check/set lets both processes enter critical section',()=>{
 const s=finish(L.create('lock','split'));
 assert.equal(s.hadViolation,true);assert.equal(s.deadlocked,false);assert.equal(s.steps,6);
 assert.deepEqual(plain(s.actors.map(p=>p.status)),['critical','critical']);
});
test('split locking may succeed under serial execution; failure is interleaving dependent',()=>{
 const s=L.create('lock','split');advance(s,['P1','P1','P1','P1','P2','P2','P2','P2']);
 assert.equal(s.done,true);assert.equal(s.hadViolation,false);assert.equal(s.lock,0);
});
test('atomic exchange returns old value and does not grant an occupied lock',()=>{
 const s=L.create('lock','atomic');advance(s,['P1','P2']);
 assert.equal(s.lock,1);assert.deepEqual(plain(s.actors.map(p=>p.read)),[0,1]);
 assert.deepEqual(plain(s.claims),['P1']);assert.equal(s.actors[1].pc,0);assert.equal(s.actors[1].status,'spinning');
});
test('atomic exchange demo completes both without overlap',()=>{
 const s=finish(L.create('lock','atomic'));
 assert.equal(s.done,true);assert.equal(s.hadViolation,false);assert.equal(s.lock,0);assert.deepEqual(plain(s.claims),[]);
});
test('atomic mutual exclusion survives all reachable instruction interleavings',()=>{assert.ok(reachable('lock','atomic')>10)});
test('opposite order creates an actual wait cycle after four attempts',()=>{
 const s=finish(L.create('deadlock','opposite'));
 assert.equal(s.deadlocked,true);assert.equal(s.steps,4);
 assert.deepEqual(plain(s.locks),{A:'P1',B:'P2'});
 assert.deepEqual(plain(s.actors.map(p=>[p.id,p.waiting,p.held])),[['P1','B',['A']],['P2','A',['B']]]);
 assert.deepEqual(plain(L.conditions(s)),{mutual:true,holdWait:true,noPreempt:true,circular:true});
});
test('one waiting process is not deadlock while the other can advance',()=>{
 const s=L.create('deadlock','opposite');advance(s,['P1','P2','P1']);
 assert.equal(s.actors[0].status,'waiting');assert.equal(s.deadlocked,false);assert.equal(s.actors[1].status,'ready');
});
test('deadlocked state cannot be advanced by pretend scheduling',()=>{
 const s=finish(L.create('deadlock','opposite')),before=JSON.stringify(s);L.next(s);L.step(s,'P1');assert.equal(JSON.stringify(s),before);
});
test('opposite acquisition order does not necessarily deadlock under a serial schedule',()=>{
 const s=L.create('deadlock','opposite');advance(s,Array(5).fill('P1'));advance(s,Array(5).fill('P2'));
 assert.equal(s.done,true);assert.equal(s.deadlocked,false);assert.deepEqual(plain(s.locks),{A:null,B:null});
});
test('consistent lock ordering permits waiting but completes',()=>{
 const s=finish(L.create('deadlock','ordered'));
 assert.equal(s.done,true);assert.equal(s.deadlocked,false);assert.deepEqual(plain(s.locks),{A:null,B:null});
});
test('all reachable consistent-order states avoid a circular wait',()=>{assert.ok(reachable('deadlock','ordered')>10)});
test('blocked process cannot skip its pending acquire or unlock its held resource',()=>{
 const s=L.create('deadlock','opposite');advance(s,['P1','P2','P1']);
 const before=JSON.stringify(s);L.step(s,'P1');assert.equal(JSON.stringify(s),before);assert.equal(s.locks.A,'P1');
});
test('release wakes a waiter but does not silently grant the released lock',()=>{
 const s=L.create('deadlock','ordered');advance(s,['P1','P2','P1','P1','P1','P1']);
 assert.equal(s.actors[1].status,'ready');assert.equal(s.actors[1].pc,0);assert.equal(s.actors[1].waiting,null);assert.equal(s.locks.A,null);
 L.step(s,'P2');assert.equal(s.locks.A,'P2');assert.equal(s.actors[1].pc,1);
});
test('resource graph uses resource-to-owner and process-to-request directions',()=>{
 const s=finish(L.create('deadlock','opposite'));
 assert.deepEqual(plain(L.edges(s)),[
  {from:'A',to:'P1',kind:'held'}, {from:'B',to:'P2',kind:'held'},
  {from:'P1',to:'B',kind:'request'}, {from:'P2',to:'A',kind:'request'}
 ]);
});

test('split lesson records two observations of zero before any write',()=>{
 const s=L.create('lock','split');for(let i=0;i<4;i++)L.next(s);
 assert.deepEqual(plain(s.history.map(e=>[e.id,e.op,e.before,e.after,e.observed])),[
  ['P1','read',0,0,0],['P2','read',0,0,0],['P1','write',0,1,0],['P2','write',1,1,0]
 ]);
 assert.equal(s.actors[1].read,0,'P2 keeps its earlier observation even after shared L becomes 1');
});
test('atomic lesson records each read and set as one event with old value intact',()=>{
 const s=L.create('lock','atomic');L.next(s);L.next(s);
 assert.deepEqual(plain(s.history.map(e=>[e.id,e.op,e.before,e.after,e.observed])),[
  ['P1','exchange',0,1,0],['P2','exchange',1,1,1]
 ]);
 assert.equal(s.actors[1].pc,0);assert.deepEqual(plain(s.claims),['P1']);
});
test('previewed next actor matches the actual scheduler and skips blocked processes',()=>{
 const s=L.create('deadlock','opposite');advance(s,['P1','P2','P1']);
 assert.equal(L.nextActor(s),'P2');L.next(s);assert.equal(s.history.at(-1).id,'P2');
 assert.equal(L.nextActor(s),null);
 const a=L.create('lock','atomic');assert.equal(L.nextActor(a),'P1');L.next(a);assert.equal(L.nextActor(a),'P2');
});
