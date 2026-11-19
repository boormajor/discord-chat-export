'use strict';
// DOM-only DM archive. No token, cookie, authenticated API calls, or telemetry.
// Automatic scrolling may violate Discord's rules: use only with necessary permission.
(() => {
 if(globalThis.__dmArchiveV2Loaded)return;
 globalThis.__dmArchiveV2Loaded=true;
 const selector='li[id^="chat-messages-"],li[data-list-item-id^="chat-messages"],[data-list-item-id^="chat-messages"]';
 const dmPath=/^\/channels\/@me\/(\d{15,21})\/?$/;
 const autoKey='dm-archive-v2:auto-dm',prefix='dm-archive-v2:messages:';
 const state={id:null,loaded:false,records:new Map(),running:false,phase:'idle',progress:'',
   dirty:false,saveChain:Promise.resolve(),saveTimer:null,scrollTimer:null,scanTimer:null,observer:null,
   topTicks:0,topId:null,noScroll:0,exporting:false,mediaSaved:0,mediaFailed:0,title:null};
 let booting=false;
 const id=()=>location.pathname.match(dmPath)?.[1]||null;
 const storeKey=x=>prefix+x;
 const clean=x=>String(x||'').replace(/\u00a0/g,' ').replace(/[\t ]+\n/g,'\n').trim();
 function safe(x){try{const u=new URL(x,location.href);return u.protocol==='https:'?u.href:null}catch(_){return null}}
 function snowflake(x){try{return new Date(Number((BigInt(x)>>22n)+1420070400000n)).toISOString()}catch(_){return null}}
 function messageId(el){return (el.getAttribute('data-list-item-id')||el.id||'').match(/(\d{15,21})$/)?.[1]||null}
 function author(el){const elName=el.querySelector('[id^="message-username-"],h3 [class*="username"],h3 [class*="Username"]');return clean(elName?.textContent||'').replace(/,?\s*Server Tag:\s*[^\n]*$/i,'').trim()||null}
 function avatar(el){return safe(el.querySelector('img[class*="avatar"],img[src*="/avatars/"],img[src*="/embed/avatars/"]')?.getAttribute('src'))}
 function body(el){
  const item=el.querySelector('[id^="message-content-"],[class*="messageContent"]');if(!item)return '';
  const node=item.cloneNode(true);
  for(const img of node.querySelectorAll('img'))img.replaceWith(document.createTextNode(img.getAttribute('alt')||''));
  for(const br of node.querySelectorAll('br'))br.replaceWith(document.createTextNode('\n'));
  return clean(node.textContent||'');
 }
 function time(el,msgId){const raw=el.querySelector('time[datetime]')?.getAttribute('datetime');return raw&&!Number.isNaN(Date.parse(raw))?new Date(raw).toISOString():snowflake(msgId)}
 function mediaType(src,hint=''){
  const path=new URL(src).pathname.toLowerCase();
  if(hint)return hint;
  if(/\.gif$/.test(path))return 'gif';
  if(/\.(png|jpe?g|webp|bmp|svg|avif)$/.test(path))return 'image';
  if(/\.(mp4|m4v|mov|webm|mkv)$/.test(path))return 'video';
  if(/\.(mp3|ogg|wav|opus|aac|m4a|flac)$/.test(path))return 'audio';
  return 'file';
 }
 function mediaKey(src){try{const u=new URL(src);return (u.pathname.includes('/attachments/')?'discord:':u.hostname+':')+u.pathname+(u.searchParams.get('format')||'')}catch(_){return src}}
 function media(el){
  const found=new Map();
  function add(src,hint,opts={}){
   const s=safe(src);if(!s)return;const key=mediaKey(s),kind=mediaType(s,hint),old=found.get(key);
   if(!old||(s.includes('cdn.discordapp.com')&&!old.url.includes('cdn.discordapp.com'))){
    let name='';try{name=decodeURIComponent(new URL(s).pathname.split('/').pop()||'')}catch(_){}
    found.set(key,{url:s,kind,name:opts.name||name,poster:opts.poster||null});
   }else if(opts.poster&&!old.poster)old.poster=opts.poster;
  }
  for(const a of el.querySelectorAll('a[href]')){
   const s=safe(a.getAttribute('href'));if(s&&/discordapp\.(com|net)/.test(new URL(s).hostname)&&/\/(?:ephemeral-)?attachments\//.test(s))add(s,'',{name:a.getAttribute('download')||''});
  }
  for(const img of el.querySelectorAll('img[src],img[srcset]')){
   if(img.closest('h3,[class*="avatar"],[class*="Avatar"],[class*="reaction"],[id^="message-username"]'))continue;
   const s=safe(img.currentSrc||img.getAttribute('src'));
   if(!s||/\/avatars\/|\/embed\/avatars\//.test(s))continue;
   const sticker=!!img.closest('[class*="sticker"],[class*="Sticker"]');
   if(!sticker&&(/emoji|emote/i.test(img.className||'')||(img.width>0&&img.height>0&&img.width<=40&&img.height<=40)))continue;
   const target=safe(img.closest('a[href]')?.getAttribute('href'));
   const candidate=target&&(/\.(gif|jpe?g|png|webp)(?:\?|$)/i.test(target)||target.includes('/attachments/'))?target:s;
   add(candidate,sticker?'sticker':/\.gif(?:\?|$)/i.test(candidate)||/\bgif\b/i.test(img.getAttribute('alt')||'')?'gif':'image',{poster:candidate!==s?s:null,name:img.getAttribute('alt')||''});
  }
  for(const video of el.querySelectorAll('video')){
   const s=video.currentSrc||video.getAttribute('src')||video.querySelector('source[src]')?.getAttribute('src');
   if(safe(s))add(s,video.loop||video.hasAttribute('autoplay')?'gif-video':'video',{poster:safe(video.getAttribute('poster'))});
  }
  for(const audio of el.querySelectorAll('audio')){
   const s=audio.currentSrc||audio.getAttribute('src')||audio.querySelector('source[src]')?.getAttribute('src');
   if(safe(s))add(s,'audio');
  }
  return [...found.values()];
 }
 function links(el){const out=new Set();for(const a of el.querySelectorAll('[id^="message-content-"] a[href],[class*="messageContent"] a[href]')){const s=safe(a.getAttribute('href'));if(s)out.add(s)}return [...out]}
 function mergeMedia(a=[],b=[]){const m=new Map(a.filter(x=>x?.url).map(x=>[mediaKey(x.url),x]));for(const x of b)if(x?.url&&!m.has(mediaKey(x.url)))m.set(mediaKey(x.url),x);return [...m.values()]}
 function scan(){
  if(!state.running||state.id!==id())return;
  let lastName=null,lastAvatar=null,changed=false;const seen=new Set();
  for(const el of document.querySelectorAll(selector)){
   const mid=messageId(el);if(!mid||seen.has(mid))continue;seen.add(mid);
   const direct=author(el);
   if(direct){lastName=direct;lastAvatar=avatar(el)}
   const old=state.records.get(mid);
   const newName=direct||lastName||old?.author||null;
   const rec={id:mid,author:newName,avatar:(direct?avatar(el):(lastName?lastAvatar:null))||old?.avatar||null,
    authorSource:direct?'header':old?.authorSource||(lastName?'visible-context':'unknown'),
    timestamp:time(el,mid)||old?.timestamp||null,
    content:body(el)||old?.content||'',
    media:mergeMedia(old?.media||[],media(el)),
    links:[...new Set([...(old?.links||[]),...links(el)])]};
   if(old?.authorSource==='header'&&!direct&&!lastName){rec.author=old.author;rec.authorSource='header'}
   if(!old||JSON.stringify(old)!==JSON.stringify(rec)){state.records.set(mid,rec);changed=true}
  }
  if(changed){state.dirty=true;scheduleSave()}
 }
 function scheduleScan(){if(!state.running||state.scanTimer)return;state.scanTimer=setTimeout(()=>{state.scanTimer=null;scan()},150)}
 function observe(){if(state.observer||!document.body)return;state.observer=new MutationObserver(scheduleScan);state.observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['src','href']})}
 function teardown(){if(state.scrollTimer)clearInterval(state.scrollTimer);if(state.scanTimer)clearTimeout(state.scanTimer);state.scrollTimer=state.scanTimer=null;state.observer?.disconnect();state.observer=null;state.running=false}
 function scrollBox(){
  const row=document.querySelector(selector);if(!row)return null;const choices=[];
  for(let p=row.parentElement;p&&p!==document.body;p=p.parentElement){
   if(p.scrollHeight>p.clientHeight+60&&p.clientHeight>150){const overflow=getComputedStyle(p).overflowY;choices.push({node:p,score:/auto|scroll/.test(overflow)?10:0})}
  }
  return choices.sort((a,b)=>b.score-a.score)[0]?.node||null;
 }
 function oldest(){let out=null;for(const k of state.records.keys())if(!out||BigInt(k)<BigInt(out))out=k;return out}
 function finish(reason){scan();teardown();state.phase='complete';state.progress=reason;state.dirty=true;scheduleSave()}
 function scroll(){
  if(!state.running||state.id!==id()){teardown();return}scan();
  const scroller=scrollBox();
  if(!scroller){state.noScroll++;state.progress='Waiting for Discord to load the message list…';if(state.noScroll>=20)finish('Message scroller not detected. Retry or scroll manually.');return}
  state.noScroll=0;const first=oldest();
  if(scroller.scrollTop<=3){
   if(first&&state.topId!==first){state.topId=first;state.topTicks=0}else state.topTicks++;
   state.progress='Checking oldest loaded messages… '+state.topTicks+'/12';
   if(state.topTicks>=12){finish('Reached apparent beginning of the loaded history. Verify the oldest message and gaps.');return}
   scroller.scrollTop=0;return;
  }
  state.topId=first;state.topTicks=0;
  scroller.scrollTop=Math.max(0,scroller.scrollTop-Math.max(250,Math.min(650,Math.floor(scroller.clientHeight*.75))));
  state.progress='Scrolling upward · '+state.records.size.toLocaleString()+' messages observed';
 }
 async function save(){
  if(!state.dirty||!state.id||!state.loaded)return;state.dirty=false;
  const key=storeKey(state.id),payload={schema:'dm-archive-v2',title:state.title,messages:[...state.records.values()],savedAt:new Date().toISOString()};
  state.saveChain=state.saveChain.catch(()=>{}).then(()=>chrome.storage.local.set({[key]:payload})).catch(e=>{state.progress='Storage error: '+e.message;state.dirty=true});
  await state.saveChain;
 }
 function scheduleSave(){if(state.saveTimer)return;state.saveTimer=setTimeout(()=>{state.saveTimer=null;void save()},1600)}
 async function load(next){
  if(next===state.id&&state.loaded)return;
  if(state.id&&state.dirty)await save();
  teardown();state.id=next;state.loaded=false;state.records.clear();state.phase='idle';state.progress='';state.title=null;state.topTicks=0;
  const prior=(await chrome.storage.local.get(storeKey(next)))[storeKey(next)];
  if(state.id!==next)return;
  if(Array.isArray(prior?.messages))for(const m of prior.messages)if(m?.id){
   if(!m.media&&Array.isArray(m.attachments))m.media=m.attachments.map(x=>({url:x,kind:mediaType(x),name:''}));
   state.records.set(m.id,m);
  }
  state.title=prior?.title||null;state.loaded=true;
 }
 async function start(persist=true){
  const next=id();if(!next)return {ok:false,error:'Open a Discord DM first.'};await load(next);
  if(persist)await chrome.storage.local.set({[autoKey]:next});
  teardown();state.phase='scrolling';state.running=true;state.topTicks=0;state.noScroll=0;state.topId=null;
  state.title ||= document.querySelector('main [class*="title"]')?.textContent?.trim()?.slice(0,150)||null;
  state.progress='Starting automatic upward capture…';observe();scan();state.scrollTimer=setInterval(scroll,1150);scroll();return status();
 }
 async function pause(){if(state.running)scan();teardown();state.phase='paused';state.progress='Paused; captured messages remain saved.';await chrome.storage.local.remove(autoKey);await save();return status()}
 async function clear(){await pause();const next=id();if(!next)return {ok:false,error:'Open a Discord DM first.'};state.records.clear();state.dirty=false;state.phase='idle';state.progress='Local archive cleared.';await chrome.storage.local.remove(storeKey(next));return status()}
 function status(){
  const same=state.id===id()&&state.loaded,rows=same?[...state.records.values()]:[];
  return {ok:true,dmId:id()||'none',running:same&&state.running,phase:same?state.phase:'idle',total:rows.length,
   mediaCount:rows.reduce((n,m)=>n+(m.media?.length||0),0),unknownAuthors:rows.filter(m=>!m.author).length,
   progress:same?state.progress:'Open a Discord DM.',exporting:state.exporting,mediaSaved:state.mediaSaved,mediaFailed:state.mediaFailed};
 }
 function snapshot(){return {schema:'dm-archive-v2',dmId:state.id,title:state.title,exportedAt:new Date().toISOString(),
  scope:'messages observed in the rendered DM',messages:[...state.records.values()].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:BigInt(a.id)>BigInt(b.id)?1:0)}}
 function filename(){return 'discord-dm-'+state.id+'-'+new Date().toISOString().slice(0,10)}
 function download(name,content,mime){
  const blob=content instanceof Blob?content:new Blob([content],{type:mime}),object=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=object;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),180000);
 }
 function plain(data){
  return 'Discord DM Archive '+data.dmId+'\n'+data.messages.length+' observed messages\n\n'+data.messages.map(m=>
   '['+(m.timestamp||'Unknown')+'] '+(m.author||'Unknown author')+':\n'+(m.content||'')+
   (m.media||[]).map(x=>'\n['+x.kind+'] '+x.url).join('')).join('\n\n');
 }
 function decode(b64){const raw=atob(b64),result=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)result[i]=raw.charCodeAt(i);return result}
 function fileExt(x,mime,kind){
  const types={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3','audio/ogg':'ogg'};
  const match=types[mime?.split(';')[0]?.trim()?.toLowerCase()];if(match)return match;
  const ext=new URL(x).pathname.split('/').pop()?.split('.').pop()?.toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(ext||'')?ext:kind==='gif'?'gif':kind==='image'?'png':kind==='audio'?'mp3':kind.includes('video')?'mp4':'bin';
 }
 async function exportZip(data){
  state.exporting=true;state.mediaSaved=0;state.mediaFailed=0;
  try{
   const zip=new DmZip(),mapping=new Map(),seen=new Map(),errors=[];let used=0;
   for(const m of data.messages){
    for(const x of [...(m.media||[]),...(m.avatar?[{url:m.avatar,kind:'image'}]:[])])if(x.url&&!seen.has(mediaKey(x.url)))seen.set(mediaKey(x.url),x);
    for(const x of m.media||[])if(x.poster&&!seen.has(mediaKey(x.poster)))seen.set(mediaKey(x.poster),{url:x.poster,kind:'image'});
   }
   const items=[...seen.values()];
   for(let i=0;i<items.length;i++){
    if(i>=1500||used>=250*1024*1024){errors.push('Archive media limit reached');break}
    const item=items[i];
    state.progress='Downloading media '+(i+1)+'/'+items.length+' · '+state.mediaSaved+' saved, '+state.mediaFailed+' unavailable';
    try{
     const res=await chrome.runtime.sendMessage({type:'DM_ARCHIVE_FETCH_MEDIA',url:item.url});
     if(!res?.ok)throw new Error(res?.error||'Download failed');
     const bytes=decode(res.data);
     if(used+bytes.length>250*1024*1024)throw new Error('250 MB total limit exceeded');
     const ext=fileExt(item.url,res.mime,item.kind);
     const short=(new URL(item.url).pathname.split('/').pop()?.replace(/\.[^.]+$/,'')||'media').replace(/[^a-z0-9._-]/gi,'_').slice(0,65);
     const name=String(i+1).padStart(5,'0')+'_'+short+'.'+ext;
     zip.add('media/'+name,bytes);mapping.set(item.url,name);state.mediaSaved++;used+=bytes.length;
    }catch(e){errors.push(item.url+' -> '+e.message);state.mediaFailed++}
    if(i%4===0)await new Promise(done=>setTimeout(done,0));
   }
   for(const m of data.messages){
    for(const x of [...(m.media||[]),...(m.avatar?[{url:m.avatar}]:[])]){
     if(x.url&&!mapping.has(x.url)){
      const found=[...mapping.entries()].find(([u])=>mediaKey(u)===mediaKey(x.url));if(found)mapping.set(x.url,found[1]);
     }
    }
   }
   zip.add('index.html',DmRenderer.create(data,mapping,{mediaSaved:state.mediaSaved,mediaFailed:state.mediaFailed}));
   zip.add('messages.json',JSON.stringify(data,null,2));
   zip.add('README.txt','Discord DM Archive\nOpen index.html after extracting this ZIP.\nMessages: '+data.messages.length+
    '\nMedia saved: '+state.mediaSaved+'\nMedia unavailable: '+state.mediaFailed+
    '\nArchives contain private conversations. Protect them.\n\nFailures:\n'+errors.join('\n'));
   download(filename()+'-with-media.zip',zip.toBlob(),'application/zip');
   state.progress='ZIP prepared. Check Downloads. '+state.mediaSaved+' media files saved, '+state.mediaFailed+' unavailable.';
  }finally{state.exporting=false}
 }
 async function exportData(format){
  if(!state.loaded||state.id!==id())return {ok:false,error:'Open the archived DM first.'};
  if(state.running)scan();if(!state.records.size)return {ok:false,error:'No captured messages yet.'};
  if(state.exporting)return {ok:false,error:'Already building ZIP.'};
  const data=snapshot();
  if(format==='zip'){void exportZip(data).catch(e=>{state.progress='ZIP failed: '+e.message});return {...status(),note:'Preparing ZIP; keep the tab open.'}}
  if(format==='html')download(filename()+'.html',DmRenderer.create(data),'text/html;charset=utf-8');
  else if(format==='json')download(filename()+'.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');
  else if(format==='txt')download(filename()+'.txt',plain(data),'text/plain;charset=utf-8');
  else return {ok:false,error:'Unsupported format'};
  return {...status(),note:'Export saved; check Downloads.'};
 }
 async function importData(data){
  if(!data||!Array.isArray(data.messages))return {ok:false,error:'Invalid JSON archive'};
  const next=id();if(!next||data.dmId!==next)return {ok:false,error:'Import requires the same DM ID'};
  await load(next);
  for(const m of data.messages)if(/^\d{15,21}$/.test(m?.id||'')){
   if(!m.media&&Array.isArray(m.attachments))m.media=m.attachments.map(u=>({url:u,kind:mediaType(u),name:''}));
   const prev=state.records.get(m.id);
   state.records.set(m.id,prev?{...m,...prev,media:mergeMedia(m.media,prev.media)}:m);
  }
  state.dirty=true;await save();return {...status(),note:'Imported JSON messages.'};
 }
 async function reconcile(){
  if(booting)return;const next=id();if(!next){if(state.running)teardown();return}booting=true;
  try{if(state.id!==next||!state.loaded)await load(next);
   if(state.id!==next||state.running||state.phase==='paused'||state.phase==='complete')return;
   if((await chrome.storage.local.get(autoKey))[autoKey]===next)await start(false);
  }catch(e){state.progress='Initialization error: '+e.message}finally{booting=false}
 }
 chrome.runtime.onMessage.addListener((message,_sender,respond)=>{
  if(!message?.type)return false;
  (async()=>{switch(message.type){
   case 'STATUS':await reconcile();return status();
   case 'START':return start(true);
   case 'PAUSE':return pause();
   case 'CLEAR':return clear();
   case 'EXPORT':return exportData(message.format);
   case 'IMPORT':return importData(message.data);
   default:return {ok:false,error:'Unknown command'};
  }})().then(respond).catch(e=>respond({ok:false,error:e.message}));return true;
 });
 void reconcile();setInterval(()=>void reconcile(),1800);
 window.addEventListener('pagehide',()=>{if(state.dirty)void save()});
})();