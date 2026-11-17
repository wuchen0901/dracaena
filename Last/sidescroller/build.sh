#!/bin/bash
# 把各段源码按顺序拼成一份可以直接打开的 HTML：../escape.html，一共三十七章，在世界里接成一条连着的路（各章挨着摆，两章之间的路在 src/69-zz-links.js，剪接见 src/20-world.js 的 link / stitch）
#   第 1–8 章   《逃出工厂》的灰模（七章加结尾）：escape/6*.js（整段在世界的最左边，原点见 escape/60-kit.js 的 EX：结尾下山正好走到旧原型工厂的门口）
#   第 9–22 章  旧原型《铁锈与微光》的十四章：src/6*-ch*.js（前八章还在原来的位置，后面的原点照前一章算；章节号是 OLD + 旧的编号，见 src/20-world.js）
#   第 23 章    “高台”：src/69-ch15-drop.js（试验关，接在旧原型后面，章节号写成 OLD + 15）
#   第 24 章    “水下实验室”：src/69-ch16-lab.js（接在“高台”右边，OLD + 16）
#   第 25–36 章 “工厂深处”：src/69-h00-kit.js（共用）+ src/69-h01 … h12（十二个恐怖工厂的场景，一章挨着一章，原点 hX(k)，章节号 HN(k) = OLD + 17 + k）
#   第 37 章    “草地”：src/69-m01-meadow.js（出了第 36 章“铃”的门，章节号 HN(HLAST) + 1；m 排在 h 后面、zz 前面）
#   两章之间的路：src/69-zz-links.js（拼在所有章节后面，用得到各章的原点）
# 拼的顺序：公共的核心、布景、角色、玩家、声音（src/1* 到 5*）→《逃出工厂》→ 旧原型 → 空中、鸟、旧原型各章的空中细节和脚边的东西、水（src/7*）
#   → 界面、触屏（src/8*）→《逃出工厂》登记在公共表里的几样（escape/8*）→ 主循环（src/9*）
#   章节要按世界里从左到右的顺序登记：地形、光的关键帧都是按登记的先后接起来的（两章之间那一段的会在 stitch 里排进去）
set -e
cd "$(dirname "$0")"
out=../escape.html
js="${TMPDIR:-/tmp}/escape-build.mjs"
cat src/[1-5]*.js escape/6*.js src/6*.js src/7*.js src/8*.js escape/8*.js src/9*.js > "$js"
node --check "$js"                         # 语法检查：只检查能不能解析，不执行
cat src/00-head.html "$js" src/99-tail.html > "$out"
echo "built $out ($(wc -c < "$out") bytes, $(wc -l < "$js") lines of JS)"
