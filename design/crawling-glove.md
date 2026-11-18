# 爬来爬去的手套（留着，给别的关卡当会咬人的东西）

2026-11-18 从《夜里的房子》（`mini/house.html`）里拿掉的。主人在厨房地上看见它，问“这是啥？也没有什么攻击力”，接着说：“这个东西留在别的关卡用吧，作为有攻击力的东西。”

## 在夜里的房子里是什么样

- 一只手套（颜色用的是 `P.scarf`），在暗处像螃蟹一样爬：四根手指当腿，一跳一跳地交替着迈；大拇指翘在前面；袖口那头是“脑袋”，上面一个黑点当眼睛。
- 照到光就不动了，平平地躺在地上，就是一只掉在地上的普通手套（它站的地方光的覆盖超过 0.4 就算照到）。
- 门厅两只、厨房一只、地下室一只，各自在一段地上来回爬（`x = lerp(x0, x1, 0.5 + 0.5·sin(t·0.22 + ph))`，往哪边走就朝哪边）。
- 只是画面：不挡路、不碰规则、不追人、不抓人。

## 拿来当有攻击力的东西，打算怎么用（还没定）

延续“光把东西变回普通东西”的规矩：

- 暗处醒着：看见孩子就朝他爬过去，比衣服快、比衣服小，能从桌子、柜子底下钻过来。爬到脚边就扑上去咬住（或者缠住脚），孩子被拖住、走不动。
- 照到光：马上僵住，平平地躺下，变成普通手套。可以捡起来、塞进抽屉、扔进炉子里？
- 适合放在一大片地板、光一块一块的地方：要一边挪灯一边走，或者引它到光底下再过去。

用的时候再和主人对一遍。

## 画法（原样从 `mini/house.html` 摘出来的）

用的是那一页的铅笔画法工具：`part`（上色描边）、`tube`（一串点粗细变化的管子）、`roundPts`（圆角矩形的点）、`fillPts`、`arcPts`、`ink`、`lcOf`、`INK`、`TAU`。`crawl` 为真时是爬的样子，为假时是躺平的样子。原来的调用：

```js
const u = 0.5 + 0.5 * Math.sin(t * 0.22 + ph), x = lerp(x0, x1, u), f = Math.cos(t * 0.22 + ph) >= 0 ? 1 : -1, still = coverage(x, fy - 10, LT) > 0.4;
drawGlove(b, P, lit, x, fy + 1, f, !lit && !still, t, 297000 + i * 40 + id.length * 9);
```

```js
function drawGlove(b, P, lit, x, y, f, crawl, t, seed) {
  const lc = lcOf(P, lit), col = P.scarf; b.save(); b.translate(x, y); b.scale(f * 1.4, 1.4); b.seedN = seed;
  if (crawl) {
    const lift = 9 + Math.sin(t * 6 + seed) * 1.5;
    for (let i = 0; i < 4; i++) { const ph = Math.sin(t * 7 + i * 1.7 + seed), fx = 7 - i * 4.6; part(b, tube([[fx, -lift], [fx + 7, -lift - 6], [fx + 9 + ph * 3, 0]], [4.4, 4, 3.4]), col, { w: 0.6, tex: 0, lc }); }
    part(b, roundPts(-14, -lift - 9, 27, 12, 5), col, { w: 0.8, tex: 0, lc });
    part(b, tube([[9, -lift - 6], [15, -lift - 14], [20, -lift - 12]], [4.2, 3.8, 3.2]), col, { w: 0.6, tex: 0, lc });
    part(b, roundPts(-23, -lift - 10, 10, 14, 3), P.coatLo, { w: 0.6, tex: 0, lc }); fillPts(b, arcPts(-23, -lift - 3, 2, 5.5, 0, TAU, 10), INK);
  } else {
    part(b, [[-20, -5], [6, -7], [10, -6], [24, -4], [26, -1.5], [22, 0.5], [-20, 0.5]], col, { w: 0.8, tex: 0, lc });
    for (let i = 0; i < 3; i++) ink(b, [[9, -1.5 - i * 1.4], [24, -1 - i * 1.2]], { w: 0.45, a: 0.6 });
  }
  b.restore();
}
```

挑风格时的样张页 `mini/tools/worlds.html` 里还有一份差不多的（`wGlove`），没动。
