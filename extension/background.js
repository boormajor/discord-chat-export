'use strict';
// The sole network operation: user-initiated fetching of already-displayed media URLs
// to build an optional offline archive. No Discord API, credentials, or auth headers.
const MAX_MEDIA_FILE = 28 * 1024 * 1024; // protect against accidental very large uploads
const ALLOWED = /^(cdn\.discordapp\.com|[a-z0-9-]+\.discordapp\.net|(?:[a-z0-9-]+\.)?tenor\.com|(?:[a-z0-9-]+\.)?giphy\.com|(?:[a-z0-9-]+\.)?imgur\.com)$/i;

function allowed(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED.test(u.hostname);
  } catch (_) { return false; }
}

function base64FromBytes(bytes) {
  const block = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += block) {
    binary += String.fromCharCode(...bytes.subarray(i, i + block));
  }
  return btoa(binary);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'DM_ARCHIVE_FETCH_MEDIA') return false;
  (async () => {
    if (!sender.url?.startsWith('https://discord.com/channels/@me/') || !allowed(message.url))
      throw new Error('Media host not permitted');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const resp = await fetch(message.url, {credentials:'omit', redirect:'follow', signal:controller.signal});
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      if (!allowed(resp.url)) throw new Error('Media redirected to an unsupported host');
      const indicatedSize = Number(resp.headers.get('content-length'));
      if (indicatedSize > MAX_MEDIA_FILE) throw new Error('File exceeds 28 MB limit');
      if (!resp.body) throw new Error('Empty media response');
      const reader = resp.body.getReader();
      const chunks = [];
      let total = 0;
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_MEDIA_FILE) {
          await reader.cancel();
          throw new Error('File exceeds 28 MB limit');
        }
        chunks.push(value);
      }
      const all = new Uint8Array(total);
      let pos = 0;
      for (const chunk of chunks) { all.set(chunk, pos); pos += chunk.length; }
      sendResponse({ok:true, data:base64FromBytes(all), mime:resp.headers.get('content-type') || '', size:total});
    } finally { clearTimeout(timeout); }
  })().catch(error => sendResponse({ok:false,error:String(error?.message || error)}));
  return true;
});