'use strict';
(() => {
  // Conservative DOM-scrolling defaults. Never infer remote history completeness.
  const config=Object.freeze({
    stepFraction:0.34,
    minStepPx:110,
    maxStepPx:340,
    minimumWaitMs:1450,
    extraRenderWaitMs:900,
    hiddenWaitMs:2500,
    historyLoadWaitMs:22000,
    maxHistoryRetries:3,
    afterRevealWaitMs:2600
  });
  function step(height){
    const n=Number(height);
    const h=Number.isFinite(n)&&n>0?n:600;
    return Math.min(config.maxStepPx,Math.max(config.minStepPx,Math.floor(h*config.stepFraction)));
  }
  function oldestVisible(ids){
    let earliest=null;
    for(const raw of ids){
      const id=String(raw||'');
      if(!/^\d{15,21}$/.test(id))continue;
      if(earliest===null||BigInt(id)<BigInt(earliest))earliest=id;
    }
    return earliest;
  }
  function sameWindow(a,b){
    return !!a&&!!b&&a.oldest===b.oldest&&a.newest===b.newest&&a.count===b.count;
  }
  globalThis.DmPacing={config,step,oldestVisible,sameWindow};
})();