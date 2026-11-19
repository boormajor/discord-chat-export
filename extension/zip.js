'use strict';
// Tiny dependency-free ZIP writer, STORE format. Exposes DmZip in the isolated content-script world.
// STORE avoids recompression of GIF/MP4/PNG files and works with browser ZIP readers.
(() => {
  const enc = new TextEncoder();
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    table[n] = c >>> 0;
  }
  function crc32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function header(size) { return new DataView(new ArrayBuffer(size)); }
  function dosTime(date) {
    return [(date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
      ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()];
  }
  class Zip {
    constructor() { this.files = []; this.size = 0; }
    add(name, data) {
      if (!/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\\x00-\x1f]+$/.test(name)) throw new Error('Unsafe ZIP filename');
      const content = typeof data === 'string' ? enc.encode(data) : data;
      if (!(content instanceof Uint8Array)) throw new Error('ZIP file must be UTF-8 text or Uint8Array');
      this.files.push({name, content, checksum: crc32(content), date: new Date()});
      this.size += content.byteLength;
    }
    toBlob() {
      if (this.files.length > 65535) throw new Error('ZIP entry count limit exceeded');
      const parts = [], central = [];
      let offset = 0;
      for (const file of this.files) {
        const name = enc.encode(file.name);
        const [time, date] = dosTime(file.date);
        const local = header(30);
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // UTF-8 names
        local.setUint16(8, 0, true); // STORE
        local.setUint16(10, time, true);
        local.setUint16(12, date, true);
        local.setUint32(14, file.checksum, true);
        local.setUint32(18, file.content.byteLength, true);
        local.setUint32(22, file.content.byteLength, true);
        local.setUint16(26, name.byteLength, true);
        parts.push(local.buffer, name, file.content);
        const c = header(46);
        c.setUint32(0, 0x02014b50, true);
        c.setUint16(4, 20, true);
        c.setUint16(6, 20, true);
        c.setUint16(8, 0x0800, true);
        c.setUint16(10, 0, true);
        c.setUint16(12, time, true);
        c.setUint16(14, date, true);
        c.setUint32(16, file.checksum, true);
        c.setUint32(20, file.content.byteLength, true);
        c.setUint32(24, file.content.byteLength, true);
        c.setUint16(28, name.byteLength, true);
        c.setUint32(42, offset, true);
        central.push(c.buffer, name);
        offset += 30 + name.byteLength + file.content.byteLength;
        if (offset >= 0xffffffff) throw new Error('ZIP exceeds 4 GB');
      }
      const centerSize = central.reduce((sum, part) => sum + part.byteLength, 0);
      const end = header(22);
      end.setUint32(0, 0x06054b50, true);
      end.setUint16(8, this.files.length, true);
      end.setUint16(10, this.files.length, true);
      end.setUint32(12, centerSize, true);
      end.setUint32(16, offset, true);
      return new Blob([...parts, ...central, end.buffer], {type: 'application/zip'});
    }
  }
  globalThis.DmZip = Zip;
})();