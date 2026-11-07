// ws.mjs — the small part of WebSocket this tool needs: short text messages, ping, close.
// Keeps the skill free of npm dependencies. Client frames must be masked and unfragmented.
import { createHash } from "node:crypto";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MAX = 64 * 1024;

function frame(opcode, payload) {
  const n = payload.length;
  const head = n < 126 ? Buffer.from([0x80 | opcode, n])
    : n < 65536 ? Buffer.from([0x80 | opcode, 126, n >> 8, n & 255])
    : Buffer.concat([Buffer.from([0x80 | opcode, 127]), (() => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; })()]);
  return Buffer.concat([head, payload]);
}

/** Takes over an upgraded socket. Returns { send, close }; onMessage gets strings, onClose fires once. */
export function accept(req, socket, { onMessage, onClose }) {
  const key = req.headers["sec-websocket-key"];
  if (!key || (req.headers.upgrade || "").toLowerCase() !== "websocket") { socket.destroy(); return null; }
  const answer = createHash("sha1").update(key + GUID).digest("base64");
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 5000);
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${answer}\r\n\r\n`);

  let buffer = Buffer.alloc(0), closed = false;
  const finish = () => { if (closed) return; closed = true; socket.destroy(); onClose(); };
  const write = (data) => { if (!closed && socket.writable) socket.write(data); };

  function parse() {
    while (buffer.length >= 2) {
      const fin = buffer[0] & 0x80, opcode = buffer[0] & 0x0f, masked = buffer[1] & 0x80;
      let len = buffer[1] & 0x7f, at = 2;
      if (!masked || !fin) return finish();
      if (len === 126) { if (buffer.length < 4) return; len = buffer.readUInt16BE(2); at = 4; }
      else if (len === 127) return finish();
      if (len > MAX) return finish();
      if (buffer.length < at + 4 + len) return;
      const mask = buffer.subarray(at, at + 4);
      const payload = Buffer.from(buffer.subarray(at + 4, at + 4 + len));
      for (let k = 0; k < payload.length; k++) payload[k] ^= mask[k & 3];
      buffer = buffer.subarray(at + 4 + len);
      if (opcode === 1) onMessage(payload.toString("utf8"));
      else if (opcode === 8) { write(frame(8, Buffer.alloc(0))); return finish(); }
      else if (opcode === 9) write(frame(10, payload));
      else if (opcode !== 10) return finish();
    }
  }
  socket.on("data", (chunk) => { buffer = Buffer.concat([buffer, chunk]); if (buffer.length > MAX * 2) return finish(); parse(); });
  socket.on("end", finish);
  socket.on("close", finish);
  socket.on("error", finish);
  return { send: (text) => write(frame(1, Buffer.from(text, "utf8"))), close: () => { write(frame(8, Buffer.alloc(0))); finish(); } };
}
