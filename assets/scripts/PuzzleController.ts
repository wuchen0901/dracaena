import { CHANNEL, readSave, SAVE_KEY, SluiceWorld } from './SluiceWorld';
import { _decorator, AudioClip, AudioSource, Camera, Color, Component, EventKeyboard, game, Game, Graphics, Input, input, KeyCode, Label, Mask, Node, Rect, resources, Size, Sprite, SpriteFrame, sys, Texture2D, UITransform } from 'cc';
const { ccclass } = _decorator;
type Layer = { node: Node; x: number; y: number; parallax: number; drift: number; phase: number; bird: boolean };

/** Independent image layers; the previous flat composition is archived in design/. */
@ccclass('PuzzleController')
export class PuzzleController extends Component {
  private actor!: Node;
  private actorSprite!: Sprite;
  private poses: SpriteFrame[] = [];
  private motion = 'idle'; private motionTime = 0;
  private touchRun = false;
  private frame!: Node;
  private layers: Layer[] = [];
  private keys = new Set<KeyCode>();
  private touchDirection = 0;
  private world = new SluiceWorld();
  private facing = 1; private time = 0;
  private terrain!: Graphics; private water!: Graphics;
  private leverPrompt!: Label; private saved = ''; private saveNotice = 0;
  private waterSound!: AudioSource; private leverSound!: AudioSource;
  private waterClip: AudioClip | null = null; private leverClip: AudioClip | null = null;
  private audioUnlocked = false; private storageFailed = false;
  private cameraOffset = 0;
  private status!: Label;
  private pending = 0; private failed = false;
  onLoad() {
    const camera = this.node.scene.getChildByName('Main Camera')?.getComponent(Camera);
    if (camera) { camera.clearFlags = Camera.ClearFlag.SOLID_COLOR; camera.clearColor = new Color(0, 0, 0, 255); }
    this.status = this.text('Loading scene layers…', 0, -328, 16, 900);
    this.frame = this.child('Layered Landscape', 1280, 590, 0, 0);
    this.frame.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.layer('Sky', 'sky', 1400, 650, 0, 0, 0);
    this.layer('Cloud west', 'cloud', 360, 120, -300, 85, .08, 3);
    this.layer('Cloud east', 'cloud', 460, 154, 430, 10, .08, 2);
    this.layer('Distant forest', 'distant-forest', 1440, 660, 0, -35, .18);
    for (let i = 1; i <= 3; i++) {
      this.layer('Forest continuation ' + i, 'distant-forest', 1440, 660, i * 1400, -35, .18);
      this.layer('Tree continuation ' + i, 'main-tree', 1050, 610, i * 1100, 105, .78);
    }
    this.layer('Left tree', 'left-tree', 490, 735, -490, 125, .62);
    this.layer('Main tree', 'main-tree', 1050, 610, -120, 105, .78);
    this.layer('Bird one', 'bird', 140, 94, 390, -5, .35, -17, 0, true);
    this.layer('Bird two', 'bird', 110, 74, 515, 75, .35, -21, 2, true);
    this.terrain = this.child('Canal, banks and floating timber', 1280, 590, 0, 0, this.frame).addComponent(Graphics);
    this.actor = this.picture('Character', 'reference/character', 68, 102, this.frame);
    this.actorSprite = this.actor.getComponent(Sprite)!;
    this.loadCharacterPoses();
    this.water = this.child('Transparent canal water', 1280, 590, 0, 0, this.frame).addComponent(Graphics);
    this.leverPrompt = this.text('', 0, 0, 16, 260); this.leverPrompt.node.setParent(this.frame);
    this.text('A / D  MOVE     SPACE / W / ↑  JUMP     E  LEVER     R  RESTORE CHECKPOINT', 0, 330, 17, 1100);
    this.button('←', -555, -322, -1); this.button('→', 555, -322, 1); this.button('↑', 430, -322, 0);
    this.button('RUN', -430, -322, 0, true);
    this.button('E', 310, -322, 0, false, true);
    try { const save = readSave(sys.localStorage.getItem(SAVE_KEY)); if (save) this.world.restore(save); }
    catch { this.storageFailed = true; }
    this.saved = ''; this.persist();
    this.cameraOffset = Math.max(0, this.world.x - 100);
    this.setupSluiceAudio();
    input.on(Input.EventType.KEY_DOWN, this.down, this); input.on(Input.EventType.KEY_UP, this.up, this);
    game.on(Game.EVENT_HIDE, this.releaseInputs, this);
    this.place();
  }
  onDestroy() { game.off(Game.EVENT_HIDE, this.releaseInputs, this); this.waterSound?.stop(); input.off(Input.EventType.KEY_DOWN, this.down, this); input.off(Input.EventType.KEY_UP, this.up, this); }
  private child(name: string, w: number, h: number, x: number, y: number, parent: Node = this.node) {
    const n = new Node(name); n.setParent(parent); n.layer = this.node.layer; n.setPosition(x, y, 0); n.addComponent(UITransform).setContentSize(w, h); return n;
  }
  private picture(name: string, path: string, w: number, h: number, parent: Node) {
    const n = this.child(name, w, h, 0, 0, parent); const s = n.addComponent(Sprite); s.sizeMode = Sprite.SizeMode.CUSTOM; this.pending++;
    resources.load(path + '/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = `Could not load ${name}`; console.error(error); return; }
      const frame = new SpriteFrame(); frame.texture = texture;
      if (n !== this.actor || !this.poses.length) s.spriteFrame = frame;
      if (!this.pending && !this.failed) this.status.string = '';
    }); return n;
  }
  private loadCharacterPoses() {
    this.pending++;
    resources.load('character/actions/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load character actions'; console.error(error); return; }
      const w = texture.width / 4, h = texture.height / 4;
      for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
        const pose = new SpriteFrame(); pose.texture = texture;
        pose.rect = new Rect(column * w, row * h, w, h);
        pose.originalSize = new Size(w, h);
        this.poses.push(pose);
      }
      this.actor.getComponent(UITransform)!.setContentSize(102, 102);
      this.actor.getComponent(UITransform)!.setAnchorPoint(.5, .06);
      this.animateCharacter(0); this.place();
    });
  }
  private animateCharacter(dt: number) {
    if (!this.poses.length) return;
    const speed = Math.abs(this.world.vx);
    const state = !this.world.grounded ? 'jump' : speed > 175 ? 'run' : speed > 8 ? 'walk' : 'idle';
    if (state !== this.motion) { this.motion = state; this.motionTime = 0; }
    let index: number;
    if (state === 'jump') index = 12 + (this.world.vy > 420 ? 0 : this.world.vy > 80 ? 1 : this.world.vy > -120 ? 2 : 3);
    else {
      const row = state === 'run' ? 2 : state === 'walk' ? 1 : 0;
      const fps = state === 'run' ? 12 * speed / 240 : state === 'walk' ? 8 * speed / 145 : 3;
      this.motionTime += dt * fps;
      index = row * 4 + Math.floor(this.motionTime) % 4;
    }
    this.actorSprite.spriteFrame = this.poses[index];
  }
  private layer(name: string, asset: string, w: number, h: number, x: number, y: number, parallax: number, drift = 0, phase = 0, bird = false) {
    const node = this.picture(name, 'layers/' + asset, w, h, this.frame); node.setPosition(x, y, 0);
    this.layers.push({ node, x, y, parallax, drift, phase, bird }); return node;
  }
  private text(value: string, x: number, y: number, size: number, w: number) {
    const n = this.child(value, w, 48, x, y); const l = n.addComponent(Label); l.string = value; l.fontSize = size; l.lineHeight = size + 6; l.horizontalAlign = Label.HorizontalAlign.CENTER; l.color = new Color(220, 231, 218); return l;
  }
  private button(value: string, x: number, y: number, direction: number, run = false, interact = false) {
    const n = this.child('Move ' + value, 90, 52, x, y); const g = n.addComponent(Graphics); g.fillColor = new Color(30, 55, 51, 240); g.roundRect(-45, -26, 90, 52, 10); g.fill();
    this.text(value, x, y, 30, 90);
    n.on(Node.EventType.TOUCH_START, () => { this.unlockAudio(); if (interact) this.interact(); else if (run) this.touchRun = true; else if (direction) this.touchDirection = direction; else this.world.jump(); });
    const release = () => { if (run) this.touchRun = false; else if (direction) this.touchDirection = 0; };
    n.on(Node.EventType.TOUCH_END, release); n.on(Node.EventType.TOUCH_CANCEL, release);
  }
  private releaseInputs() { this.keys.clear(); this.touchDirection = 0; this.touchRun = false; this.world.vx = 0; }
  private down(e: EventKeyboard) {
    this.unlockAudio();
    const fresh = !this.keys.has(e.keyCode); this.keys.add(e.keyCode);
    if (fresh && [KeyCode.SPACE, KeyCode.KEY_W, KeyCode.ARROW_UP].indexOf(e.keyCode) >= 0) this.world.jump();
    if (fresh && e.keyCode === KeyCode.KEY_E) this.interact();
    if (fresh && e.keyCode === KeyCode.KEY_R) this.reset();
  }
  private interact() {
    if (this.world.interact()) {
      if (this.leverClip) this.leverSound.playOneShot(this.leverClip, .5);
      this.persist();
    }
  }
  private reset() {
    this.world.restore(this.world.save());
    this.facing = 1; this.cameraOffset = Math.max(0, this.world.x - 100);
    this.touchDirection = 0; this.touchRun = false; this.keys.clear();
    this.motion = 'idle'; this.motionTime = 0; this.animateCharacter(0); this.place();
  }
  private persist() {
    const serialized = JSON.stringify(this.world.save());
    if (serialized === this.saved) return;
    try { sys.localStorage.setItem(SAVE_KEY, serialized); this.storageFailed = false; this.saveNotice = 2; }
    catch { this.storageFailed = true; }
    this.saved = serialized;
  }
  private setupSluiceAudio() {
    this.waterSound = this.node.addComponent(AudioSource); this.waterSound.loop = true;
    this.waterSound.playOnAwake = false; this.waterSound.volume = 0;
    this.leverSound = this.node.addComponent(AudioSource); this.leverSound.playOnAwake = false;
    resources.load('audio/sluice-water', AudioClip, (error, clip) => {
      if (!this.isValid || error) return;
      this.waterClip = clip; this.unlockAudio(false);
    });
    resources.load('audio/sluice-lever', AudioClip, (error, clip) => {
      if (this.isValid && !error) this.leverClip = clip;
    });
  }
  private unlockAudio(gesture = true) {
    if (gesture) this.audioUnlocked = true;
    if (this.audioUnlocked && this.waterClip && !this.waterSound.playing) {
      this.waterSound.clip = this.waterClip; this.waterSound.play();
    }
  }
  private up(e: EventKeyboard) { this.keys.delete(e.keyCode); }
  update(delta: number) {
    const dt = Math.min(delta, .25); this.time += dt;
    const direction = this.touchDirection || Number(this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT)) - Number(this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT));
    if (direction) this.facing = direction;
    this.world.step(dt, direction, this.touchRun || this.keys.has(KeyCode.SHIFT_LEFT) || this.keys.has(KeyCode.SHIFT_RIGHT));
    this.persist(); this.saveNotice = Math.max(0, this.saveNotice - dt);
    const target = Math.max(0, this.world.x - 100);
    this.cameraOffset += (target - this.cameraOffset) * (1 - Math.exp(-dt * 3));
    const proximity = Math.max(0, 1 - Math.abs(this.world.x - 1500) / 1000);
    const volume = this.world.opened ? proximity * (this.world.fill < 1 ? .4 : .16) : proximity * .035;
    this.waterSound.volume += (volume - this.waterSound.volume) * Math.min(1, dt * 3);
    this.animateCharacter(dt);
    if (!this.failed && !this.pending) this.status.string = this.storageFailed ? 'Checkpoint kept for this session · local storage unavailable' : this.saveNotice > 0 ? 'Saved' : '';
    this.leverPrompt.string = this.world.canInteract ? 'E · OPEN THE SLUICE' : '';
    this.leverPrompt.node.setPosition(CHANNEL.leverX - this.cameraOffset, CHANNEL.near + 112, 0);
    this.place();
  }
  private drawCanal() {
    const g = this.terrain, c = CHANNEL, viewLeft = this.cameraOffset - 720, viewRight = this.cameraOffset + 720;
    g.clear();
    const rect = (x: number, y: number, w: number, h: number, color: Color) => {
      if (w <= 0) return;
      g.fillColor = color; g.rect(x - this.cameraOffset, y, w, h); g.fill();
    };
    const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 2) => {
      g.strokeColor = color; g.lineWidth = width; g.moveTo(x - this.cameraOffset, y); g.lineTo(x2 - this.cameraOffset, y2); g.stroke();
    };
    const earth = new Color(28, 39, 33), grass = new Color(96, 117, 75), stone = new Color(53, 64, 54);
    rect(viewLeft, -420, Math.max(0, Math.min(c.left, viewRight) - viewLeft), c.near + 420, earth);
    rect(Math.max(c.right, viewLeft), -420, Math.max(0, viewRight - Math.max(c.right, viewLeft)), c.far + 420, earth);
    rect(c.left, -420, c.right - c.left, c.bed + 420, stone);
    if (viewLeft < c.left) line(viewLeft, c.near, Math.min(c.left, viewRight), c.near, grass, 4);
    if (viewRight > c.right) line(Math.max(c.right, viewLeft), c.far, viewRight, c.far, grass, 4);
    // Masonry, mineral waterline and guide posts explain the former water level.
    for (let y = -250; y < 40; y += 28) {
      line(c.right, y, c.right + 65, y + 2, new Color(75, 85, 69));
    }
    line(c.left, c.logHigh - 17, c.right, c.logHigh - 17, new Color(125, 132, 101, 110), 3);
    for (const x of [c.logLeft + 15, c.logRight - 15]) rect(x, c.bed, 9, 230, new Color(65, 73, 54));
    // Fence fragments continue beyond the puzzle without a level-end screen.
    for (let x = Math.max(1080, Math.floor(viewLeft / 160) * 160); x < viewRight; x += 160) {
      if (x > 1340 && x < 1850) continue;
      const floor = x < c.left ? c.near : c.far;
      rect(x, floor, 7, 67, new Color(71, 76, 58));
      line(x, floor + 45, x + 100, floor + 38, new Color(76, 81, 61), 4);
    }
    // A gate beside the lever rises and exposes a visible inlet.
    rect(1332, c.bed, 40, 250, stone);
    rect(1338, c.near - 40 + this.world.fill * 88, 28, 98, new Color(46, 52, 47));
    line(1340, c.near - 32, 1370, c.near - 32, grass, 3);
    rect(c.leverX - 7, c.near, 14, 37, stone);
    const handleX = c.leverX + (this.world.opened ? 25 : -25);
    line(c.leverX, c.near + 27, handleX, c.near + 65, new Color(166, 155, 108), 6);
    // Floating timber: drawing and collision use the exact same height and extent.
    rect(c.logLeft, this.world.logY - 24, c.logRight - c.logLeft, 24, new Color(103, 83, 54));
    line(c.logLeft + 5, this.world.logY - 2, c.logRight - 5, this.world.logY - 2, new Color(161, 140, 86), 3);
    for (let x = c.logLeft + 15; x < c.logRight; x += 39) line(x, this.world.logY - 18, x + 22, this.world.logY - 14, new Color(58, 52, 39));
    // Sparse grass marks walkable banks, leaving the canal edges unobscured.
    for (let x = Math.floor(viewLeft / 31) * 31; x < viewRight; x += 31) {
      if (x > c.left - 20 && x < c.right + 20) continue;
      const y = x <= c.left ? c.near : c.far;
      line(x, y, x + 4, y + 7 + Math.sin(x) * 3, grass, 1);
    }
    const w = this.water; w.clear();
    w.fillColor = new Color(67, 114, 108, 105);
    w.rect(c.left - this.cameraOffset, c.bed, c.right - c.left, this.world.waterY - c.bed); w.fill();
    w.strokeColor = new Color(166, 196, 163, 160); w.lineWidth = 1.5;
    for (let x = c.left; x < c.right; x += 8) {
      const y = this.world.waterY + Math.sin(x * .045 + this.time * 2) * 1.5;
      if (x === c.left) w.moveTo(x - this.cameraOffset, y); else w.lineTo(x - this.cameraOffset, y);
    }
    w.stroke();
    if (this.world.opened) {
      w.strokeColor = new Color(175, 201, 180, 145); w.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        w.moveTo(1360 - this.cameraOffset + i * 3, -52);
        w.quadraticCurveTo(1390 - this.cameraOffset, -45, 1413 - this.cameraOffset + i * 4, this.world.waterY);
      }
      w.stroke();
    }
  }
  private place() {
    if (!this.actor) return;
    const foot = this.world.y;
    this.drawCanal();
    this.actor.setPosition(this.world.x - this.cameraOffset, foot + (this.poses.length ? 0 : 38), 0); this.actor.setScale(this.facing, 1, 1);
    for (const l of this.layers) {
      let drift = l.drift ? ((l.x + 760 + this.time * l.drift) % 1520 + 1520) % 1520 - 760 - l.x : 0;
      let layerX = l.x - this.cameraOffset * l.parallax + drift;
      if (l.node.name.indexOf('continuation') >= 0) {
        const span = l.node.name.indexOf('Forest') === 0 ? 4200 : 3300;
        layerX = ((layerX + 720) % span + span) % span - 720;
      }
      l.node.setPosition(layerX, l.y + (l.bird ? Math.sin(this.time * 1.4 + l.phase) * 18 : 0), 0);
      if (l.bird) { l.node.setScale(1, .8 + Math.sin(this.time * 9 + l.phase) * .2, 1); l.node.setRotationFromEuler(0, 0, Math.sin(this.time * 2 + l.phase) * 5); }
    }
  }
}
