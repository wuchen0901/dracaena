
// ============================================================
//  《逃出工厂》：旧原型留在公共部分里的几样东西，在这一份页面里换掉（这个文件排在 80-ui.js、82-touch.js 后面，主循环前面）
// ============================================================
// 从某一章开头开始时怎么补、怎么撤故事进度：旧原型的那几条（救猫、喂食、水泵……）都不要了
for (const k in SKIP) delete SKIP[k];
for (const k in UNDO) delete UNDO[k];
UNDO[7] = s => { s.freed = false; };
// 结局画面上按 R：再看一遍结尾（旧原型里这个函数在第八章的文件里）
function retryEnding() { if (typeof E8 !== 'undefined' && E8.retry) E8.retry(); }
// 远处偶尔一下的声音、鸟：每一章一组
Object.assign(FAR, { 1: ['clank', 'chain', 'steam', 'creak', 'hum2'], 2: ['clank', 'steam', 'creak', 'knock'], 3: ['chain', 'creak', 'rattle', 'knock'], 4: ['relay', 'hum2', 'clank', 'relay'],
  5: ['steam', 'hum2', 'relay'], 6: ['clank', 'knock', 'chain', 'creak'], 7: ['owl', 'twig', 'owl'], 8: ['twig', 'woodpecker', 'crow'] });
for (const k of [2, 7, 9]) delete BIRDS[k];
BIRDS[8] = [['bird', 0.8], ['dove', 0.2]];
