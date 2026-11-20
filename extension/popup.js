'use strict';
const els=Object.fromEntries(['status','dot','count','mediaCount','details','progress','start','pause','zip','html','json','txt','import','importFile','clear','revealBlocked','revealNow','verify','verifyReport','verifySummary'].map(id=>[id,document.getElementById(id)]));
let lastResult=null;
async function send(type,extra={}) {
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id) throw new Error('Open a Discord direct message in your browser.');
  return chrome.tabs.sendMessage(tab.id,{type,...extra});
}
function setNotice(note){if(note)els.progress.textContent=note;}
function render(s){
  if(!s?.ok)throw new Error(s?.error||'Unknown error');
  lastResult=s;
  els.revealBlocked.checked=s.revealBlocked!==false;
  els.status.textContent=s.exporting?'Saving media ZIP…':s.verifying?'Verifying history…':s.running?'Auto-capturing':s.phase==='complete'?'Capture finished':s.phase==='paused'?'Paused':s.phase==='stalled'?'Capture stalled':'Ready';
  els.dot.className='dot'+(s.running?' active':s.phase==='complete'?' complete':s.phase==='paused'?' paused':'');
  els.count.textContent=Number(s.total||0).toLocaleString();
  els.mediaCount.textContent=Number(s.mediaCount||0).toLocaleString();
  els.details.textContent='DM: '+s.dmId+' · '+(s.unknownAuthors||0)+' missing author labels';
  els.progress.textContent=s.progress||'Start auto capture and the page will scroll through the conversation.';
  els.start.textContent=s.running?'Auto-capturing…':s.phase==='complete'?'Scan again':s.phase==='paused'?'Resume auto capture':s.phase==='stalled'?'Retry capture':'Start auto capture';
  els.start.disabled=!!s.running||!!s.exporting;
  els.pause.disabled=!s.running;
  for(const key of ['zip','html','json','txt'])els[key].disabled=!s.total||!!s.exporting;
  els.clear.disabled=!s.total||!!s.exporting;
  els.verify.disabled=!s.total||!!s.running||!!s.exporting;
  els.verifyReport.disabled=!s.verifyReport&&!s.verifying;
  els.verifySummary.textContent=s.verifyReport?'Rechecked '+s.verifyReport.rechecked+'/'+s.verifyReport.expected+' originals · '+s.verifyReport.recovered+' recovered · '+s.verifyReport.unrechecked+' not re-observed · '+s.verifyReport.batches+' batches · '+s.verifyReport.verdict : s.verifying?'Checking archive in 200-message batches. Keep the DM tab open.':'Second pass rechecks visible history; it cannot guarantee all server messages were shown.';
}
function disconnected(error){
  els.status.textContent='Not connected';els.dot.className='dot';
  els.count.textContent='0';els.mediaCount.textContent='0';
  els.details.textContent='Discord Web · open a direct message';
  setNotice(error||'Refresh your Discord tab after installing the extension.');
  for(const key of ['start','pause','zip','html','json','txt','clear','verify','verifyReport'])els[key].disabled=true;
}
async function refresh(){
  try {render(await send('STATUS'));}
  catch(err){disconnected(err?.message||String(err));}
}
async function doAction(type,extra={}){
  try {const result=await send(type,extra);render(result);if(result.note)setNotice(result.note);}
  catch(err){setNotice(err?.message||String(err));}
}
els.start.addEventListener('click',()=>doAction('START'));
els.pause.addEventListener('click',()=>doAction('PAUSE'));
els.verify.addEventListener('click',()=>doAction('VERIFY'));
els.verifyReport.addEventListener('click',()=>doAction('VERIFY_REPORT'));
els.revealNow.addEventListener('click',()=>doAction('REVEAL_VISIBLE'));
els.revealBlocked.addEventListener('change',()=>doAction('SET_REVEAL',{enabled:els.revealBlocked.checked}));
els.clear.addEventListener('click',()=>{if(confirm('Delete captured messages for this DM from extension storage?'))void doAction('CLEAR');});
for(const format of ['html','json','txt','zip'])els[format].addEventListener('click',()=>doAction('EXPORT',{format}));
els.import.addEventListener('click',()=>els.importFile.click());
els.importFile.addEventListener('change',async()=>{
  const file=els.importFile.files?.[0];if(!file)return;
  try {const data=JSON.parse(await file.text());await doAction('IMPORT',{data});}
  catch(err){setNotice('Import failed: '+String(err?.message||err));}
  els.importFile.value='';
});
refresh();
setInterval(refresh,1200);