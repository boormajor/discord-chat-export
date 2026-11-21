'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const scope = { globalThis: {} };
for (const name of ['pacing.js', 'audit.js']) {
  const file = path.join(__dirname, '..', 'extension', name);
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), scope);
}
const pace = scope.globalThis.DmPacing;
const audit = scope.globalThis.DmAudit;

test('safe scrolling never takes large jumps', () => {
  assert.equal(pace.step(100), 110);
  assert.equal(pace.step(600), 204);
  assert.equal(pace.step(2000), 340);
  assert.ok(pace.config.minimumWaitMs >= 1200);
  assert.ok(pace.config.historyLoadWaitMs >= 20000);
});
test('window changes and visible oldest ID are detected', () => {
  const old = {oldest:'1500000000000000001',newest:'1500000000000000003',count:3};
  assert.equal(pace.sameWindow(old,{...old}),true);
  assert.equal(pace.sameWindow(old,{...old,newest:'1500000000000000004'}),false);
  assert.equal(pace.oldestVisible([old.newest,old.oldest]),old.oldest);
});
test('batch verification flags unrechecked messages', () => {
  const messages=Array.from({length:420},(_,i)=>({
    id:String(1500000000000000000n+BigInt(i)*4194304n),author:'Tester',content:'text'
  }));
  const ids=audit.baseline(messages);
  const seen=new Set(ids.filter((_,i)=>i!==14));
  const report=audit.report(messages,ids,seen,{startObserved:true,endObserved:true});
  assert.equal(report.batchCount,3);
  assert.equal(report.notRechecked,1);
  assert.equal(report.secondPassRechecked,419);
  assert.equal(report.verdict,'needs-review');
});
test('an unobserved history boundary always means incomplete verification', () => {
  const m={id:'1500000000000000000',author:'Tester',content:'text'};
  const report=audit.report([m],[m.id],new Set([m.id]),{startObserved:false,endObserved:true});
  assert.equal(report.verdict,'incomplete-pass');
});
