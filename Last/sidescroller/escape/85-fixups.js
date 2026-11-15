
// ============================================================
//  《逃出工厂》（第 1–8 章）登记在公共部分那几张表里的东西（拼好的页面里这个文件在 80-ui.js、82-touch.js 后面，主循环前面）
//  旧原型的章节在同一张表里，从第 OLD + 1 章起，互不相干
// ============================================================
// 从某一章开头开始时怎么撤故事进度：第七章拉开的囚车锁扣
UNDO[7] = s => { s.freed = false; };
// 结局画面上按 R：再看一遍结尾。不用另写 —— 第八章演结局时 showEndBare 记下了这一章，旧原型的 retryEnding（67-ch8-hub.js）就回到它
// 远处偶尔一下的声音、鸟：每一章一组
Object.assign(FAR, { 1: ['clank', 'chain', 'steam', 'creak', 'hum2'], 2: ['clank', 'steam', 'creak', 'knock'], 3: ['chain', 'creak', 'rattle', 'knock'], 4: ['relay', 'hum2', 'clank', 'relay'],
  5: ['steam', 'hum2', 'relay'], 6: ['clank', 'knock', 'chain', 'creak'], 7: ['owl', 'twig', 'owl'], 8: ['twig', 'woodpecker', 'crow'] });
BIRDS[8] = [['bird', 0.8], ['dove', 0.2]];
