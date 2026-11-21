'use strict';
(() => {
  // Verification is of browser-observed message rows, never a claim of complete server history.
  const SIZE=200;
  const validId=v=>/^\d{15,21}$/.test(String(v||''));
  const order=(a,b)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0;
  const baseline=records=>[...new Set((records||[]).map(m=>m?.id).filter(validId))].sort(order);
  function report(records,initial,seen,details={}){
    const messages=(records||[]).filter(m=>validId(m?.id));
    const known=baseline(messages);
    const expect=[...new Set((initial||[]).filter(validId).map(String))].sort(order);
    const expectSet=new Set(expect),seenSet=new Set(seen||[]);
    const size=200,batches=[];
    let rechecked=0;
    for(let start=0;start<expect.length;start+=size){
      const ids=expect.slice(start,start+size),checked=ids.filter(x=>seenSet.has(x)).length;
      rechecked+=checked;
      batches.push({batch:batches.length+1,fromId:ids[0],toId:ids[ids.length-1],
        expected:ids.length,rechecked:checked,notRechecked:ids.length-checked,
        status:checked===ids.length?'rechecked':'needs-review'});
    }
    const missing=expect.filter(x=>!seenSet.has(x));
    const newIds=known.filter(x=>!expectSet.has(x));
    const unknownAuthors=messages.filter(m=>!m.author).length;
    const unverifiedLegacy=messages.filter(m=>m.authorSource==='unverified-legacy'||!!m.legacyAuthor&&!m.author).length;
    const attributedByHeader=messages.filter(m=>m.authorSource==='same-message-header').length;
    const attributedByAdjacentGroup=messages.filter(m=>m.authorSource==='adjacent-group').length;
    const emptyPayload=messages.filter(m=>!String(m.content||'').trim()&&!(m.media||[]).length&&!(m.links||[]).length).length;
    const startObserved=details.startObserved===true,endObserved=details.endObserved===true;
    const collapsedBlockedGroups=Math.max(0,Number(details.collapsedBlockedGroups||0));
    let verdict='incomplete-pass';
    if(endObserved&&startObserved)verdict=(missing.length||collapsedBlockedGroups||emptyPayload||unknownAuthors)?'needs-review':'observed-records-rechecked';
    return {schema:'dm-archive-verification-v1',generatedAt:new Date().toISOString(),
      disclaimer:'Cross-checks the messages Discord displayed during two separate scroll passes. It cannot prove that all server-side messages were displayed or recover deleted or inaccessible content. Discord message IDs are not consecutive: numeric gaps do not prove messages are missing.',
      verdict,initialCount:expect.length,currentCount:known.length,
      secondPassRechecked:rechecked,notRechecked:missing.length,newlyRecovered:newIds.length,
      unknownAuthors,unverifiedLegacy,attributedByHeader,attributedByAdjacentGroup,emptyPayload,topReachedApparent:startObserved,bottomReachedApparent:endObserved,
      collapsedBlockedGroups,fieldChanges:Math.max(0,Number(details.fieldChanges||0)),
      batchSize:size,batchCount:batches.length,batches,
      unrecheckedIdsSample:missing.slice(0,100),newlyRecoveredIdsSample:newIds.slice(0,100),
      earliestCapturedId:known[0]||null,latestCapturedId:known[known.length-1]||null};
  }
  globalThis.DmAudit={baseline,report};
})();