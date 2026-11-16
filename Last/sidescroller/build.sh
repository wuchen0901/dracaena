#!/bin/bash
# 把各段源码按顺序拼成一份可以直接打开的 HTML：../escape.html，一共二十二章，排成一条路
#   第 1–8 章   《逃出工厂》的灰模（七章加结尾）：escape/6*.js（整段在世界的最左边，原点见 escape/60-kit.js 的 EX）
#   第 9–22 章  旧原型《铁锈与微光》的十四章：src/6*-ch*.js（还在原来的位置；章节号是 OLD + 旧的编号，见 src/20-world.js）
# 拼的顺序：公共的核心、布景、角色、玩家、声音（src/1* 到 5*）→《逃出工厂》→ 旧原型 → 空中、鸟、旧原型各章的空中细节和脚边的东西、水（src/7*）
#   → 界面、触屏（src/8*）→《逃出工厂》登记在公共表里的几样（escape/8*）→ 主循环（src/9*）
#   章节要按世界里从左到右的顺序登记：地形、光的关键帧都是按登记的先后接起来的
set -e
cd "$(dirname "$0")"
out=../escape.html
js="${TMPDIR:-/tmp}/escape-build.mjs"
cat src/[1-5]*.js escape/6*.js src/6*.js src/7*.js src/8*.js escape/8*.js src/9*.js > "$js"
node --check "$js"                         # 语法检查：只检查能不能解析，不执行
cat src/00-head.html "$js" src/99-tail.html > "$out"
echo "built $out ($(wc -c < "$out") bytes, $(wc -l < "$js") lines of JS)"
