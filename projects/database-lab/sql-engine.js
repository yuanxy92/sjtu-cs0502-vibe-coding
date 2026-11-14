/* CS0502 数据库实验室 · 共享 SQL 教学引擎
 * 供 index.html（SQL 平台）与 exercises.html（课堂练习）共用；纯本地、离线可用。
 * 支持：SELECT [DISTINCT] 列|* FROM 表[,表…] [NATURAL JOIN 表] [WHERE 条件]
 * 条件：= != < <= > >=，AND / OR，表别名；多表逗号=笛卡尔积；谓词下推；内存护栏。 */
window.SQLE = (function(){
'use strict';

let DATA = null;

function slideData(){
  return {
    Student:{cols:['Sid','Sname','Sage'],rows:[
      ['3023001093','李家杰',21],['3011112340','王伟',20],
      ['3020621034','刘佳琪',18],['3020831035','吕松',19],['3021131123','赵万里',22]]},
    Course:{cols:['Cid','Cname','Credit'],rows:[
      [1,'数据库',4],[2,'操作系统',5],[3,'英语',3],[4,'微积分',2]]},
    Enrolled:{cols:['Sid','Cid','Grade'],rows:[
      ['3023001093',1,92],['3023001093',2,88],['3020621034',1,70],
      ['3020831035',1,85],['3021131123',2,95]]}
  };
}
function randomData(nStu, nCou){
  nStu=Math.max(1,Math.min(10000,Math.floor(nStu)||200));
  nCou=Math.max(1,Math.min(20,Math.floor(nCou)||20));
  const SUR='王李张刘陈杨赵黄周吴徐孙马朱胡郭何高林郑'.split('');
  const GIV='伟芳娜敏静丽强磊军洋勇艳杰娟涛明超霞平刚华晨悦辰昊'.split('');
  const COURSES=['高等数学','线性代数','大学物理','数据结构','操作系统','计算机网络','数据库','编译原理','机器学习','信号与系统','电路理论','概率统计','软件工程','计算机组成','人工智能','密码学','图形学','嵌入式系统','算法设计','数值分析'].slice(0,nCou);
  const students=[];
  for(let i=0;i<nStu;i++){
    const id='3023'+String(i).padStart(7,'0');
    students.push([id, SUR[Math.floor(Math.random()*SUR.length)]+GIV[Math.floor(Math.random()*GIV.length)], 17+Math.floor(Math.random()*7)]);
  }
  const courses=COURSES.map((c,i)=>[i+1,c,2+Math.floor(Math.random()*4)]);
  const enrolled=[]; const seen=new Set();
  students.forEach(s=>{
    const k=Math.min(nCou,3+Math.floor(Math.random()*6));   // 每人选 3~8 门
    const picks=new Set();
    while(picks.size<k) picks.add(1+Math.floor(Math.random()*nCou));
    picks.forEach(c=>{
      const key=s[0]+'_'+c;
      if(!seen.has(key)){ seen.add(key); enrolled.push([s[0],c,40+Math.floor(Math.random()*61)]); }
    });
  });
  return {
    Student:{cols:['Sid','Sname','Sage'],rows:students},
    Course:{cols:['Cid','Cname','Credit'],rows:courses},
    Enrolled:{cols:['Sid','Cid','Grade'],rows:enrolled}
  };
}
function loadSlide(){ DATA=slideData(); return DATA; }
function loadRandom(nStu,nCou){ DATA=randomData(nStu,nCou); return DATA; }
function getData(){ return DATA; }

function fmt(n){ return n.toLocaleString('en-US'); }
function tableHTML(rel, capRows, withIndex){
  let h='<div class="tablewrap"><table class="rel"><thead><tr>';
  if(withIndex) h+='<th class="idx">#</th>';
  h+=rel.cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>';
  const rows = capRows ? rel.rows.slice(0,capRows) : rel.rows;
  rows.forEach((r,i)=>{
    h+='<tr>';
    if(withIndex) h+='<td class="num idx">'+(i+1)+'</td>';
    h+=r.map(v=>'<td'+(typeof v==='number'?' class="num"':'')+'>'+v+'</td>').join('')+'</tr>';
  });
  if(!rows.length) h+='<tr class="empty"><td'+(withIndex?' colspan="'+(rel.cols.length+1)+'"':' colspan="'+rel.cols.length+'"')+'>（空集，没有满足条件的元组）</td></tr>';
  h+='</tbody></table></div>';
  if(capRows&&rel.rows.length>capRows) h+='<p class="muted" style="margin-top:8px">只显示前 '+capRows+' 行，共 '+fmt(rel.rows.length)+' 行。</p>';
  return h;
}

const KEYWORDS=new Set(['SELECT','FROM','WHERE','AND','OR','NATURAL','JOIN','DISTINCT']);
function tokenize(s){
  const t=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){i++;continue;}
    if(c==="'"){ let j=i+1,str=''; while(j<s.length&&s[j]!=="'"){str+=s[j];j++;} if(j>=s.length) throw new Error('字符串缺少收尾的单引号'); t.push({k:'str',v:str}); i=j+1; continue; }
    if(/[A-Za-z_\u4e00-\u9fa5]/.test(c)){ let j=i; while(j<s.length&&/[A-Za-z0-9_.\u4e00-\u9fa5]/.test(s[j]))j++; t.push({k:'id',v:s.slice(i,j)}); i=j; continue; }
    if(/[0-9]/.test(c)){ let j=i; while(j<s.length&&/[0-9.]/.test(s[j]))j++; t.push({k:'num',v:Number(s.slice(i,j))}); i=j; continue; }
    const two=s.slice(i,i+2);
    if(two==='<='||two==='>='||two==='!='||two==='<>'){ t.push({k:'op',v:two==='<>'?'!=':two}); i+=2; continue; }
    if('=<>'.includes(c)){ t.push({k:'op',v:c}); i++; continue; }
    if('(),;*'.includes(c)){ t.push({k:'sym',v:c}); i++; continue; }
    throw new Error('无法识别的符号：'+c);
  }
  return t;
}
function parseSQL(src){
  const t=tokenize(src); let p=0;
  const peek=()=>t[p], next=()=>t[p++];
  const kw=x=>{ const tk=next(); if(!tk||tk.k!=='id'||tk.v.toUpperCase()!==x) throw new Error('需要关键字 '+x+'，但看到「'+(tk?tk.v:'结尾')+'」'); };
  const isKw=x=>peek()&&peek().k==='id'&&peek().v.toUpperCase()===x;
  kw('SELECT');
  let distinct=false;
  if(isKw('DISTINCT')){ next(); distinct=true; }
  const select=[];
  if(peek()&&peek().k==='sym'&&peek().v==='*'){ next(); select.push('*'); }
  else{
    for(;;){
      const tk=next(); if(!tk||tk.k!=='id') throw new Error('SELECT 后需要列名');
      select.push(tk.v);
      if(peek()&&peek().k==='sym'&&peek().v===','){next();continue;}
      break;
    }
  }
  kw('FROM');
  const from=[];
  for(;;){
    const isNat = isKw('NATURAL') && from.length>0;
    if(isNat){ next(); kw('JOIN'); }
    const name=next(); if(!name||name.k!=='id') throw new Error('FROM 后需要表名');
    let alias=null;
    if(peek()&&peek().k==='id'&&!KEYWORDS.has(peek().v.toUpperCase())) alias=next().v;
    from.push({name:name.v,alias:alias||name.v,natural:isNat});
    if(peek()&&peek().k==='sym'&&peek().v===','){next();continue;}
    if(isKw('NATURAL')) continue;
    break;
  }
  let where=null;
  if(isKw('WHERE')){ next(); where=parseOr(); }
  if(peek()&&peek().k==='sym'&&peek().v===';') next();
  if(p<t.length) throw new Error('SQL 末尾有多余内容：「'+t[p].v+'」（本平台支持 SELECT…FROM…WHERE）');
  return {select,from,where,distinct};

  function parseOr(){ let l=parseAnd(); while(isKw('OR')){ next(); l={t:'or',l,r:parseAnd()}; } return l; }
  function parseAnd(){ let l=parseCond(); while(isKw('AND')){ next(); l={t:'and',l,r:parseCond()}; } return l; }
  function parseCond(){
    const a=parseOperand();
    const tk=next();
    if(!tk||tk.k!=='op') throw new Error('条件里需要比较符（= != < <= > >=），看到「'+(tk?tk.v:'结尾')+'」');
    return {t:'cmp',op:tk.v,l:a,r:parseOperand()};
  }
  function parseOperand(){
    const tk=next();
    if(!tk) throw new Error('条件不完整');
    if(tk.k==='num') return {t:'num',v:tk.v};
    if(tk.k==='str') return {t:'str',v:tk.v};
    if(tk.k==='id') return {t:'col',v:tk.v};
    throw new Error('条件里不能使用「'+tk.v+'」');
  }
}
function countConds(n){
  if(!n) return 0;
  if(n.t==='and'||n.t==='or') return countConds(n.l)+countConds(n.r);
  return 1;
}
function runSQL(src){
  const t0=performance.now();
  const ast=parseSQL(src);
  let env=null, crossRows=0, joinComps=0, joinKind='none', joinSizes=[], whereEvals=0, pending=[];
  function lookup(o,col){
    if(o[col]!==undefined) return o[col];
    if(col.includes('.')) throw new Error('找不到列「'+col+'」。请检查表名/别名拼写。');
    const hits=env.aliases.map(a=>a+'.'+col).filter(c=>o[c]!==undefined);
    if(hits.length===1) return o[hits[0]];
    if(hits.length>1) throw new Error('列名「'+col+'」在多张表中出现，请写成 表名.'+col);
    throw new Error('找不到列「'+col+'」');
  }
  function operandVal(nd,o){ return nd.t==='col'?lookup(o,nd.v):nd.v; }
  function evalCmp(n,o){
    const l=operandVal(n.l,o), r=operandVal(n.r,o);
    switch(n.op){
      case '=': return l==r;
      case '!=': return l!=r;
      default:{
        const ln=Number(l), rn=Number(r);
        const numeric=!isNaN(ln)&&!isNaN(rn)&&l!==''&&r!=='';
        const a=numeric?ln:l, b=numeric?rn:r;
        if(n.op==='>')return a>b; if(n.op==='<')return a<b;
        if(n.op==='>=')return a>=b; return a<=b;
      }
    }
  }
  function evalWhere(n,o){
    if(!n) return true;
    if(n.t==='and') return evalWhere(n.l,o)&&evalWhere(n.r,o);
    if(n.t==='or') return evalWhere(n.l,o)||evalWhere(n.r,o);
    return evalCmp(n,o);
  }
  /* 谓词下推：WHERE 拆成顶层 AND 合取项，只涉及已连接表的条件提前过滤 */
  const conjuncts=[];
  (function flat(n){ if(!n)return; if(n.t==='and'){flat(n.l);flat(n.r);} else conjuncts.push(n); })(ast.where);
  pending=conjuncts.slice();
  const condCount=countConds(ast.where);
  function conjReady(c){
    let ok=true;
    (function walk(n){
      if(!ok||!n)return;
      if(n.t==='and'||n.t==='or'||n.t==='cmp'){ walk(n.l); walk(n.r); return; }
      if(n.t!=='col')return;
      const v=n.v;
      if(v.includes('.')){ if(!env||!(v.split('.')[0] in env.aliasTable)) ok=false; }
      else if(env){ if(!env.aliases.some(a=>DATA[env.aliasTable[a]].cols.includes(v))) ok=false; }
      else ok=false;
    })(c);
    return ok;
  }
  function applyReady(){
    const now=[], later=[];
    pending.forEach(c=>(conjReady(c)?now:later).push(c));
    if(now.length){
      whereEvals += env.rows.length*now.length;
      if(env.rows.length) env.rows=env.rows.filter(o=>now.every(c=>evalWhere(c,o)));
    }
    pending=later;
  }
  ast.from.forEach(tb=>{
    const key=Object.keys(DATA).find(k=>k.toLowerCase()===tb.name.toLowerCase());
    if(!key) throw new Error('没有名为「'+tb.name+'」的表。可用表：'+Object.keys(DATA).join('、'));
    const d=DATA[key];
    const mk=r=>{const o={};d.cols.forEach((c,i)=>o[tb.alias+'.'+c]=r[i]);return o;};
    if(tb.natural&&env){
      const common=d.cols.filter(c=>env.aliases.some(a=>DATA[env.aliasTable[a]].cols.includes(c)));
      if(!common.length) throw new Error(tb.alias+' 与前面的表没有公共属性，不能 NATURAL JOIN');
      const prevRows=env.rows.length, newRows=d.rows.length;
      if(prevRows*newRows>5e7) throw new Error('连接比较次数达 '+fmt(prevRows*newRows)+' 次，超出浏览器计算上限。请把数据规模调小，或先在 WHERE 里过滤。');
      joinComps += prevRows*newRows*common.length;
      joinSizes.push(prevRows+'×'+newRows);
      joinKind='natural';
      const cur=d.rows.map(mk), rows=[];
      const prevVal=(re,c)=>{
        for(const a of env.aliases){ const q=a+'.'+c; if(re[q]!==undefined) return re[q]; }
        return undefined;
      };
      env.rows.forEach(re=>cur.forEach(ce=>{
        if(common.every(c=>prevVal(re,c)===ce[tb.alias+'.'+c])){
          const merged=Object.assign({},re,ce);
          common.forEach(c=>{delete merged[tb.alias+'.'+c];});
          rows.push(merged);
        }
      }));
      env={rows, cols:env.cols.concat(d.cols.filter(c=>!common.includes(c)).map(c=>tb.alias+'.'+c)),
           aliases:env.aliases.concat([tb.alias]),
           aliasTable:Object.assign(env.aliasTable, Object.fromEntries([[tb.alias,key]]))};
      applyReady();
      crossRows=env.rows.length;
      return;
    }
    if(!env){ env={rows:d.rows.map(mk), cols:d.cols.map(c=>tb.alias+'.'+c), aliases:[tb.alias], aliasTable:Object.fromEntries([[tb.alias,key]])}; applyReady(); crossRows=env.rows.length; return; }
    const prevRows=env.rows.length, newRows=d.rows.length;
    if(prevRows*newRows>5e7) throw new Error('先做笛卡尔积会产生 '+fmt(prevRows*newRows)+' 行中间结果，超出浏览器内存上限。请把数据规模调小，或先在 WHERE 里写上连接条件（如 S.Sid=E.Sid）。');
    joinComps += prevRows*newRows;
    joinSizes.push(prevRows+'×'+newRows);
    joinKind=joinKind==='natural'?'mixed':'cross';
    const rows=[];
    env.rows.forEach(re=>d.rows.forEach(r=>rows.push(Object.assign({},re,mk(r)))));
    env={rows, cols:env.cols.concat(d.cols.map(c=>tb.alias+'.'+c)),
         aliases:env.aliases.concat([tb.alias]),
         aliasTable:Object.assign(env.aliasTable, Object.fromEntries([[tb.alias,key]]))};
    applyReady();
    crossRows=env.rows.length;
  });
  if(!env) throw new Error('FROM 后面需要至少一张表');
  if(pending.length){
    const n=env.rows.length;
    if(n) env.rows=env.rows.filter(o=>pending.every(c=>evalWhere(c,o)));
    whereEvals += n*pending.length;
  }
  let rows=env.rows;
  let outCols;
  if(ast.select[0]==='*'){
    outCols=env.cols;
    rows=rows.map(o=>outCols.map(c=>o[c]));
  } else {
    outCols=ast.select;
    rows=rows.map(o=>ast.select.map(c=>lookup(o,c)));
  }
  if(ast.distinct){
    const seen=new Set(), ded=[];
    rows.forEach(r=>{const k=JSON.stringify(r); if(!seen.has(k)){seen.add(k);ded.push(r);}});
    rows=ded;
  }
  const ms=performance.now()-t0;
  const fromSizes=ast.from.map(tb=>{
    const key=Object.keys(DATA).find(k=>k.toLowerCase()===tb.name.toLowerCase());
    return DATA[key].rows.length;
  });
  const scanned=fromSizes.reduce((a,b)=>a+b,0);
  return {cols:outCols, rows, fromSizes, scanned, crossRows, joinComps, joinKind, joinSizes, condCount, whereEvals, ms};
}

return { fmt, tableHTML, runSQL, loadSlide, loadRandom, getData, slideData, randomData };
})();
