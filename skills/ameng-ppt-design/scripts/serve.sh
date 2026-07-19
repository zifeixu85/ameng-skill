#!/usr/bin/env bash
# ============================================================================
# serve.sh — 启动（或复用）本地服务器并给出 deck 网址（交付协议的一部分）。
#
#   ./scripts/serve.sh <deck-name> [port]
#
# 为什么必须有它：编辑器/导出（PDF/PPTX/PNG/HTML）只在 http:// 下完整工作——
# file:// 会被浏览器拦截字体/图片读取，导出会缺字少图。做完 deck 后必须跑它，
# 把打印出的 URL 交给用户（能 open 就顺手帮用户打开）。
#
# 行为：端口空闲 → 从 skill 根目录起 python http.server；端口被占 → curl 验证
# 它确实在服务本目录（防把别人的服务器当成自己的），不是则换下一个端口。
# ============================================================================
set -euo pipefail
NAME="${1:?usage: serve.sh <deck-name> [port]}"
BASE_PORT="${2:-8123}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REL="slides/${NAME}/index.html"
[ -f "$ROOT/$REL" ] || { echo "no deck at $REL (run new-ppt.sh first)"; exit 1; }

PORT=""
for p in $(seq "$BASE_PORT" $((BASE_PORT + 9))); do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    # something listens — only reuse if it is OUR root (the deck URL resolves)
    if curl -sf -o /dev/null --max-time 2 "http://localhost:${p}/${REL}"; then PORT="$p"; break; fi
  else
    # no-store handler: stale runtime.js/CSS after skill updates showed up as
    # "shortcuts stopped working" — never let the browser cache deck assets.
    (cd "$ROOT" && nohup python3 -c "
import http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
http.server.ThreadingHTTPServer(('', $p), H).serve_forever()
" >/dev/null 2>&1 & disown) || true
    sleep 0.7
    if curl -sf -o /dev/null --max-time 2 "http://localhost:${p}/${REL}"; then PORT="$p"; break; fi
  fi
done
[ -n "$PORT" ] || { echo "could not start a server on ports ${BASE_PORT}-$((BASE_PORT + 9))"; exit 1; }

URL="http://localhost:${PORT}/${REL}"
echo "URL: $URL"
echo "（放映 F · 编辑 ✎ · 导出 ⤓ —— 导出必须从这个 http:// 地址）"
command -v open >/dev/null 2>&1 && open "$URL" || true
