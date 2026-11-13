# The Last Light

一个横版解谜冒险的原型，游戏里的标题是《铁锈与微光》，共八章。代码全部在 `Last/` 里，用 three.js 写成，直接在浏览器里运行。

仓库根目录原来还有一个 Cocos Creator 3.8.8 项目，已在 2026-11-12 删除。需要时可以从 git 历史找回，最后一个包含它的提交是 `01addf2`。

## 运行

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory Last
```

然后在浏览器打开 <http://127.0.0.1:8765/sidescroller.html>。页面需要联网，three.js 从 cdn.jsdelivr.net 加载。

地址后面加 `?ch=5` 可以直接从第五章开始。

## 操作

| 按键 | 作用 |
| --- | --- |
| ← → 或 A D | 移动 |
| 空格 | 跳跃、攀爬 |
| E | 按住推拉，按一下操作机关 |
| Shift | 慢走 |
| Esc | 选择章节 |
| R | 回到存档点 |
| V | 近看主角 |
| M | 静音 |

## 目录

- `Last/sidescroller/src/`：原型的源码，按文件名顺序分段（核心、世界、布景、灯光、角色、地上的东西、玩家、声音、八个章节、空中的细节、界面、主循环）。`46-ground.js` 是各章共用的地上的东西：石头、落叶、草和蕨（一张共用的图集）、树枝和倒木、泥、会映出画面的水洼，还有走近了会逃开的青蛙、蜥蜴和虫子。空中的细节在 `70-air.js`（光里的尘埃、落叶、风沙、虫子、远处的鸟群、萤火虫）、`71-air-birds.js`（会被惊飞的鸟）、`72-air-chapters.js`（每一章摆什么）。
- `Last/sidescroller/build.sh`：把 `src/` 拼成 `Last/sidescroller.html`。改完源码后运行 `bash Last/sidescroller/build.sh`。
- `Last/sidescroller.html`：拼好的成品，浏览器打开的就是它。
- `Last/models/hero.glb`：主角模型。
- `Last/tools/`：出图和处理模型的小工具，用法写在各文件开头。`shot.mjs` 用无头 Chrome 截图，`model-sheet.html` 是模型效果图页面，`look-sheet.html` 是场景画面的对比图页面（同一屏换几套光色或布景，也能沿路截一遍游戏原样的画面），`look-sheet-ch7.html` 是第七章用的同一种页面（另外能把这一章的机关自动走一遍、截一小段连续的画面做动图），`ground-sheet.html` 是地上的东西的选项图页面（一格只开一样，也能把小动物逃开的样子截成动图、把一章地上会动的东西自动走一遍），`air-sheet.html` 是空中细节的画面页面（同一屏关掉和打开对比，也能截一小段连续的画面做动图），`daylight-sheet.html` 是“白天的六个办法”对比图（第七章那一屏，每格打开几条：太阳放低、空气透视、前景压暗、限制颜色、留出阴影区、形状做大），`shrink-glb-textures.mjs` 缩小 GLB 贴图，`recolor-glb-top.mjs` 给主角换上衣颜色。
- `design/`：故事、关卡和角色的设计文档与设定图。较早的文档写的是已删除的 Cocos 版本，里面提到的 `assets/`、`preview/` 路径和音效生成脚本都已经不存在。
- `generated_images/`：导出的效果图。
