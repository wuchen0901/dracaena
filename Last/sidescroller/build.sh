#!/bin/bash
# 把各段源码按文件名顺序拼成可以直接双击打开的 HTML。一共拼两份：
#   ../sidescroller.html  旧原型（《铁锈与微光》十三章）：src/ 里的全部
#   ../escape.html        新故事《逃出工厂》的灰模：src/ 里公共的部分（核心、布景、角色、玩家、声音、界面、主循环）
#                         + escape/ 里的章节。旧的十三章、它们的空中细节和脚边的东西（6*-ch*、72、73）不进这一份
set -e
cd "$(dirname "$0")"
tmp="${TMPDIR:-/tmp}/sidescroller-check.mjs"
build() {                                  # build <输出> <各段 JS…>：拼好，再做一遍语法检查（只检查能不能解析，不执行）
  local out=$1; shift
  cat src/00-head.html "$@" src/99-tail.html > "$out"
  cat "$@" > "$tmp"
  node --check "$tmp"
  echo "built $out ($(wc -c < "$out") bytes, $(cat "$@" | wc -l) lines of JS)"
}
build ../sidescroller.html src/*.js
build ../escape.html src/[1-5]*.js escape/6*.js src/70-air.js src/71-air-birds.js src/74-water-fx.js src/80-ui.js src/82-touch.js escape/8*.js src/90-main.js
