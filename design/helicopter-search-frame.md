# 夜搜 · 候车亭镜头

基线：2026-11-15 拉取的 main，提交 `56cb03f`。

先看 `generated_images/heli-search-before.png` 的游戏截图，再用内置 imagegen 绘制 `generated_images/heli-search-target.png`，最后在游戏中实现对应的光色、层次与细节。参考图是美术方向，不是贴在游戏里的背景。

原画面的问题：机群挤在同一高度，光柱边缘过硬，重复圆树冠抢眼，候车亭墙面与公路缺少质感。

目标：一架近机、五架错落的远机；蓝灰月夜；带薄雾的柔边搜索光；细碎林线；旧混凝土与潮湿路面的破碎反光。保持原有遮挡、搜索范围和安全区规则。

## 实现与验证

- 修改 `Last/sidescroller/src/69-ch11-heli.js`，重新拼接 `Last/escape.html`。游戏菜单为第 18 章“夜搜”，入口 `escape.html?ch=18`。
- `heli-search-after.png`：与优化前相同的候车亭节点，真实游戏渲染。`heli-search-bridge.png`：先经过被发现、重生，再抵达断桥下的画面检查。
- 光柱沿视线与表面夹角柔化，缓慢变化的雾纹保留屋顶裁剪；只修改本章材质。远机改为五架，错开高度和深度，近机侧向悬停。林线、地雾、植被色调、混凝土、路面细碎反光同步调整。
- 拼接源码的 `node --check` 和 `git diff --check` 通过。Chrome 实际渲染未出现 JavaScript 或着色器编译错误。
- 现有 `tools/heli-route.html?layout=check` 自动玩家：延迟 0 / 1 / 2 秒均经过四处掩体、零次被发现、抵达 x=148.2，直升机正常离开。完整记录在 `helicopter-search-check.json`。
- 参考图中的精细机身与植被质感尚未全部达到；当前落地的是程序化场景的构图、光色和层次，参考图没有被当作游戏截图。

## 原工作区保留

旧分叉提交保留在分支 `backup/pre-heli-main-20261115`；原未提交跳跃修改及工具保留在 stash `preserve-local-jump-before-helicopter-main-update`。本次分支 `codex/heli-search-frame` 直接从最新 main 开始，未混入旧跳跃修改。

## 第二轮：机身与植被

用户指出与概念图仍有差距，继续在同一 main 基线上打磨。第一轮截图单独保存在 `generated_images/heli-search-v1.png`；第二轮候车亭与奔跑实机图为 `heli-search-v2.png`、`heli-search-v2-run.png`。

- 新增 `69-ch11-art.js`：截面构成的机身与渐细尾梁，沿曲面贴合的分块座舱窗，舱门接缝、铆钉、发动机整流罩、格栅、弯曲滑橇、尾翼及柔边旋翼模糊。近机保留细节，远机省去小窗框与铆钉。使用实际三维几何与场景光照。
- 草地改为六批合并几何，弯曲、渐细的草叶与种穗随风摆动，疏密分布有变化；不再复用规则草丛方片。树冠细化为枝梢与零碎针叶，补充左上角近景枝条。
- 光柱内尘埃从 420 减到 260 颗，大小降为原来的 40%，避免雪花感。湿路面增加细碎的月光反射。
- 新截图单帧约 11.1 万个三角形、418 次绘制（包含场景与阴影；不同动画时刻可能变化）。这只是渲染规模记录，不代表帧率。手机帧率尚未实测。
- 第二轮验证：拼接源码语法检查与 diff 检查通过；候车亭、离开掩体奔跑两张实际截图无 JavaScript/着色器编译错误。自动玩家延迟 0 / 1 / 2 秒均通过四处掩体、零次被发现、抵达终点并等到直升机离开，结果保存在 `helicopter-search-check-v2.json`。
- 美术取舍：优先保证直升机轮廓、搜索光落点和掩体可读，再提高材质与空气感；概念图作为构图和气氛标尺。游戏截图与概念图保持明确区分。

## 第三轮：雾里的剪影（2026-11-16）

基线：main 上的 `533139c`。把第 21 章试出来的画面做法（`design/visual-style.md`）套到这一章：蓝灰月夜换成浅灰的雾，光只给孩子周围，近处沉进黑里，颜色几乎全去掉（孩子暗红上衣、落叶、航行灯留色），远处换成雾里一层层立体的枯树、谷仓、水塔、高压线塔；路灯、前景的草和近景枝条、画出来的林线都拿掉了。做法细节见 `visual-style.md` 最后一节。概念图那一版的蓝色调、林线和湿路面的大片反光不再作为目标。

- 前后对比：`generated_images/heli-search-fog-before-after.jpg`（左：改之前；右：改之后。`tools/heli-route.html?layout=route` 同一个自动玩家、同一时刻的游戏实际画面）。
- 自动玩家（`tools/heli-route.html?layout=check`）：延迟 0 / 1 / 2 秒都零次被发现、走到 x = 148.2、直升机照常飞走；每一处的到达时间、掉头和飞远的时刻和 `helicopter-search-check-v2.json` 完全一样 —— 玩法没动。
- 浏览器里没有 JavaScript 或着色器报错；手机那一档（`?low=1`）也跑过一次。
- 渲染规模（跑向集装箱那一刻，含两张影子贴图）：改之前 425 次绘制、约 11 万个三角形，改之后 445 次、约 26 万个三角形（手机档约 14 万）。帧率没有实测，手机上尤其没有。
- 路的前后弯、高低起伏没有做（原因见 `visual-style.md`）。第 6 章《大门》里那段直升机搜索是旧代码的另一份拷贝（`escape/67-e7-gate.js`），这次没动。

## 参考图提示词（内置 imagegen）

Use case: stylized-concept. Asset type: art direction target frame for an existing 3D side-scrolling stealth adventure game. Input image is a reference for gameplay geography, not an image to copy literally. Create a beautiful cinematic 16:9 night helicopter search scene, painterly environmental concept art with believable forms that can guide procedural Three.js implementation. Preserve a small lone teenage protagonist concealed inside the concrete roadside bus shelter in the lower left-middle, the horizontal abandoned road, field behind it, distant forest and mountains, and helicopter search formation. Art direction: deep desaturated ink blue and blue-gray, a little silver moonlight, tiny restrained red aviation lights; no bright saturated neon. One dominant helicopter above/right of the shelter in an oblique side view with a long recognizable tail, five smaller helicopters at staggered heights and distances searching separate strips of the valley. Avoid an evenly spaced row. Beams have soft translucent feathered edges and irregular wisps of illuminated low mist, brightest at the lamp, gently spreading onto ground; roof blocks the nearest beam, protagonist remains safe in shadow. Silhouettes of forest should have irregular elegant fine branch and conifer detail, not cartoon round lollipop trees. Damp cracked road with narrow broken silver reflections, sparse reeds and ragged foreground grass silhouettes frame the bottom. Layered distant hills fading into mist, dark foreground with readable shelter structure and small human silhouette, atmospheric depth, sophisticated low-key lighting. Strong hierarchy and negative space, no UI, no text, no watermark, no extra people. Produce a polished production concept painting, not a screenshot filter.
