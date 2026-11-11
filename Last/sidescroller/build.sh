#!/bin/bash
# 把 src/ 里的各段源码按文件名顺序拼成一个可以直接双击打开的 HTML：../sidescroller.html
set -e
cd "$(dirname "$0")"
out=../sidescroller.html
cat src/00-head.html src/*.js src/99-tail.html > "$out"
# 语法检查（只检查能不能解析，不执行）
tmp="${TMPDIR:-/tmp}/sidescroller-check.mjs"
cat src/*.js > "$tmp"
node --check "$tmp"
echo "built $out ($(wc -c < "$out") bytes, $(cat src/*.js | wc -l) lines of JS)"
