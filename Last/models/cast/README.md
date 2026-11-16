# 配角的模型

游戏里路上的人（看守、劳动者、被抓来的人、尸体，旧原型里的老人、工人、居民）用的现成模型。代码在 `Last/sidescroller/src/45-cast.js`：谁用哪个、穿什么颜色看那里的 `CAST_ROLE`。

## 来源和授权

都是 **Quaternius** 的低面数人物，授权是 **CC0 1.0（公有领域）**：可以随便用、改、再分发，不用署名。素材包里自带的授权文本原样放在 `LICENSE-Quaternius.txt`。

| 文件 | 原来的名字 | 出自 | 游戏里谁在用 |
|---|---|---|---|
| `swat.glb` | Swat | Ultimate Modular Men（2022-02） | 看守 |
| `worker.glb` | Worker | 同上 | 旧原型：登记劳工 |
| `casual.glb` | Casual Character（Casual_2） | 同上 | 劳动者、被抓来的人、尸体 |
| `hoodie.glb` | Hoodie Character（Casual_Hoodie） | 同上 | 被抓来的人、尸体；旧原型：幸存者 |
| `suit.glb` | Business Man（Suit） | 同上 | 劳动者、被抓来的人、尸体；旧原型：拄杖的老人 |
| `farmer.glb` | Farmer | 同上 | 旧原型：照看机器人的老人 |
| `woman-casual.glb` | Casual | Ultimate Modular Women（2022-04） | 劳动者、被抓来的人、尸体；旧原型：居民 |
| `woman-suit.glb` | Suit | 同上 | 劳动者、被抓来的人、尸体 |
| `woman-formal.glb` | Formal | 同上 | 被抓来的人、尸体 |

- 官方页面应该是 <https://quaternius.com/packs/ultimatemodularmen.html>、<https://quaternius.com/packs/ultimatemodularwomen.html>，单个模型也挂在 <https://poly.pizza> 上 —— 这几个地址是从别人的笔记里抄来的，没能打开核对。
- 2026-11-16 下载的时候，做这件事的那台机器连不上上面两个网站，文件是从 GitHub 上别人的仓库里拿的原包文件：
  男的六个来自 `Hhk187/Zomopocalypse`（`Assets/Models/Characters/Ultimate Modular Men Pack-glb/`），
  女的三个和授权文本来自 `osman-1002/3D-3rd-Person-Godot-Game-With-GenAI-Integration`（`addons/Ultimate Modular Women - April 2022/`、`addons/Ultimate Modular Men- Feb 2022/License.txt`）。
- 正式发布前最好到官方页面再核对一遍授权：有人记录过 Quaternius 网站 2026 年换了一份新的授权说明（说是不溯及以前的包；这一条也是转述，没核对），这几个包随包的 `License.txt` 写的是 CC0。

## 文件做过什么处理

用 `Last/tools/slim-glb.mjs` 瘦过身：去掉自带的 24 段动画（游戏里的动作是现算的，用不上）、贴图坐标，法线和骨骼权重存得省一些。网格、骨架、材质没动。一个文件从 1.4 MB 降到 0.35 MB 上下。

```bash
node Last/tools/slim-glb.mjs 下载的文件.glb Last/models/cast/名字.glb
```

## 再加一个模型

1. 找同一套里的别的人物（同一副骨架、不带贴图、一块一个颜色的都行），用上面的命令瘦身后放进这个目录。
   Ultimate Modular Men 里还有 Adventurer、Beach、Punk、King、Astronaut；Women 里还有 Soldier（不戴头盔的女 SWAT）、Worker、Punk、Adventurer 等。
2. 在 `src/45-cast.js` 的 `CAST_ROLE` 里把文件名写进要用它的那种人的 `file` 里（写几个就轮着用）。
3. 打开 `Last/tools/cast-sheet.html` 看效果：上半张是模型，下半张是原来搭出来的人。哪一块颜色分错了（比如头发被当成了帽子），在 `CAST_LIB` 里写明。

带贴图的模型、骨架差得远的模型（比如手脚是浮空的那种）现在不支持。
