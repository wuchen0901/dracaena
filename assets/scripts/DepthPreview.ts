import { CAMERA_ELEVATION, CAMERA_HEIGHT, CAMERA_Z } from './WorldCamera';
import { _decorator, Camera, Color, Component, EventKeyboard, Graphics, gfx, Input, input, KeyCode, Label, Layers, Material, MeshRenderer, Node, primitives, resources, Texture2D, UITransform, utils, Vec4 } from 'cc';
import { CharacterAnimation } from './CharacterAnimation';
const { ccclass } = _decorator;

/** A real perspective world, with movement constrained to the X/Y gameplay plane. */
@ccclass('DepthPreview')
export class DepthPreview extends Component {
  private root!: Node; private camera!: Camera; private actor!: Node; private dog!: Node;
  private actorMaterial!: Material; private dogMaterial!: Material;
  private animation = new CharacterAnimation(); private keys = new Set<KeyCode>();
  private x = 0; private y = 0; private vy = 0; private facing = 1; private elapsed = 0;
  private chasing = false; private dogX = 9; private dogZ = -20; private touch = 0;
  private notice!: Label; private car!: Node; private lamp!: Node;
  onLoad() {
    this.root = new Node('2.5D perspective world'); this.root.setParent(this.node.scene);
    const old = this.node.scene.getChildByName('Main Camera'); if (old) old.active = false;
    const cam = new Node(`${CAMERA_ELEVATION} degree perspective camera`); cam.setParent(this.root);
    this.camera = cam.addComponent(Camera); this.camera.projection = Camera.ProjectionType.PERSPECTIVE;
    this.camera.fov = 43; this.camera.near = .1; this.camera.far = 180;
    this.camera.visibility = Layers.Enum.DEFAULT; this.camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    this.camera.clearColor = new Color(37, 49, 56); this.camera.priority = 0;
    this.box('Continuous ground surface', 0, -.12, -12, 160, .2, 85, [68, 72, 64]);
    this.box('Player walking lane', 0, -.008, 0, 150, .025, 3.6, [100, 96, 80]);
    this.box('Distant service road', 0, -.005, -19, 150, .03, 5, [56, 63, 63]);
    for (let x = -70; x < 80; x += 4) {
      this.box('Road marking', x, .018, -19, 1.8, .02, .12, [135, 133, 108]);
      this.box('Path paving seam', x, .015, 0, .025, .015, 3.5, [73, 76, 66]);
    }
    for (let i = 0; i < 35; i++) {
      const x = -70 + i * 4.4, h = 5 + ((i * 17) % 11);
      this.box('Distant city silhouette', x, h / 2, -48 - (i % 3) * 5, 3.2, h, 4, [49 + i % 3 * 3, 62 + i % 3 * 3, 68 + i % 3 * 3]);
    }
    for (let x = -40; x < 65; x += 12) {
      this.box('Fence post', x, 1, -8, .12, 2, .12, [44, 54, 52]);
      for (const y of [.6, 1.4]) this.box('Fence rail', x + 6, y, -8, 12, .05, .05, [58, 68, 62]);
    }
    this.box('Guard booth', 5, 1.6, -13, 3, 3.2, 2.5, [77, 84, 76]);
    this.box('Guard booth roof', 5, 3.3, -13, 3.8, .22, 3.2, [43, 53, 52]);
    this.box('Guard booth window', 5, 2, -11.72, 2.2, 1.1, .03, [35, 49, 49]);
    this.box('Gate pole', 8, 1.5, -12, .2, 3, .2, [63, 70, 65]);
    this.box('Raised gate', 10, 2.8, -12, 4, .18, .18, [158, 142, 95]);
    this.car = new Node('Police car on distant road'); this.car.setParent(this.root); this.car.setPosition(-8, 0, -19);
    this.box('Car body', 0, .65, 0, 4.5, .8, 1.9, [37, 47, 53], this.car);
    this.box('Car cabin', -.2, 1.3, 0, 2.4, .7, 1.6, [85, 102, 107], this.car);
    this.box('Police stripe', 0, .75, 1, 4.3, .18, .025, [164, 167, 150], this.car);
    for (const x of [-1.4, 1.4]) for (const z of [-.95, .95]) this.box('Tire', x, .35, z, .65, .65, .35, [24, 30, 31], this.car);
    this.lamp = this.box('Police beacon', 0, 1.82, 0, .7, .16, .4, [192, 66, 48], this.car);
    this.actorMaterial = this.textureMaterial(); this.actor = this.billboard('Robot on fixed Z lane', this.actorMaterial, 2.9);
    this.dogMaterial = this.textureMaterial(); this.dog = this.billboard('Dog approaching through depth', this.dogMaterial, 2.5);
    this.actor.active = false;   // its sprite sheet was deleted on 2026-11-12; the lane, dog and camera still work
    resources.load('dog/chase-bark/texture', Texture2D, (error, texture) => { if (!error && this.isValid) this.dogMaterial.setProperty('mainTexture', texture); });
    this.text(`2.5D · ${CAMERA_ELEVATION}° 俯角 · 玩家固定 Z 轴`, 300, 22);
    this.text('A / D 左右移动    SPACE 跳跃    SHIFT 奔跑    E 狗从远处接近    R 重置', -300, 18);
    this.notice = this.text('远处：警车与岗哨    中景：围栏    近处：角色行走面', 260, 16);
    this.control('←', -540, () => this.touch = -1, () => this.touch = 0);
    this.control('→', -420, () => this.touch = 1, () => this.touch = 0);
    this.control('跳跃', 420, () => this.jump()); this.control('追逐', 540, () => this.chasing = true);
    this.control('返回 2D', 520, () => { location.href = location.pathname + '?view=2d&preview=city'; }, undefined, 300);
    input.on(Input.EventType.KEY_DOWN, this.down, this); input.on(Input.EventType.KEY_UP, this.up, this);
    this.update(0);
  }
  private material(rgb: number[]) { const m = new Material(); m.initialize({ effectName: 'builtin-unlit' }); m.setProperty('mainColor', new Color(rgb[0], rgb[1], rgb[2])); return m; }
  private textureMaterial() { const m = new Material(); m.initialize({ effectName: 'builtin-unlit', defines: { USE_TEXTURE: true, USE_ALPHA_TEST: true } }); m.setProperty('alphaThreshold', .12); m.overridePipelineStates({ rasterizerState: { cullMode: gfx.CullMode.NONE } }); return m; }
  private box(name: string, x: number, y: number, z: number, w: number, h: number, d: number, rgb: number[], parent = this.root) {
    const n = new Node(name); n.setParent(parent); n.layer = Layers.Enum.DEFAULT; n.setPosition(x, y, z); n.setScale(w, h, d);
    const r = n.addComponent(MeshRenderer); r.mesh = utils.createMesh(primitives.box()); r.setMaterial(this.material(rgb), 0); return n;
  }
  private billboard(name: string, material: Material, size: number) {
    const n = new Node(name); n.setParent(this.root); n.layer = Layers.Enum.DEFAULT;
    n.setScale(size, size, 1); n.setRotationFromEuler(-CAMERA_ELEVATION, 0, 0);
    const r = n.addComponent(MeshRenderer); r.mesh = utils.createMesh(primitives.quad()); r.setMaterial(material, 0); return n;
  }
  private text(value: string, y: number, size: number) {
    const n = new Node(value); n.setParent(this.node); n.layer = this.node.layer; n.setPosition(0, y);
    n.addComponent(UITransform).setContentSize(1200, 45); const l = n.addComponent(Label); l.string = value; l.fontSize = size; l.lineHeight = size + 6; l.color = new Color(225, 224, 201); return l;
  }
  private control(value: string, x: number, down: () => void, up?: () => void, y = -245) {
    const n = new Node(value); n.setParent(this.node); n.layer = this.node.layer; n.setPosition(x, y);
    n.addComponent(UITransform).setContentSize(110, 48); const g = n.addComponent(Graphics); g.fillColor = new Color(25, 37, 39, 230); g.roundRect(-55, -24, 110, 48, 8); g.fill();
    const label = this.text(value, 0, 18); label.node.setParent(n); label.node.getComponent(UITransform)!.setContentSize(110, 48);
    n.on(Node.EventType.TOUCH_START, down); if (up) { n.on(Node.EventType.TOUCH_END, up); n.on(Node.EventType.TOUCH_CANCEL, up); }
  }
  private jump() { if (this.y <= 0) this.vy = 6; }
  private down(e: EventKeyboard) { this.keys.add(e.keyCode); if (e.keyCode === KeyCode.SPACE) this.jump(); if (e.keyCode === KeyCode.KEY_E) this.chasing = true; if (e.keyCode === KeyCode.KEY_R) { this.x = this.y = this.vy = 0; this.dogX = 9; this.dogZ = -20; this.chasing = false; } }
  private up(e: EventKeyboard) { this.keys.delete(e.keyCode); }
  update(delta: number) {
    if (!this.actor) return; const dt = Math.min(delta, .05); this.elapsed += dt;
    const direction = this.touch || Number(this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT)) - Number(this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT));
    const speed = this.keys.has(KeyCode.SHIFT_LEFT) ? 6 : 3.2; this.x = Math.max(-45, Math.min(55, this.x + direction * speed * dt));
    if (direction) this.facing = Math.sign(direction);
    this.vy -= 16 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (!this.y) this.vy = 0;
    this.actor.setPosition(this.x, this.y + 1.15, .65); this.actor.setScale(2.9, 2.9, 1);
    const frame = this.animation.frame(dt, direction * speed * 60, this.vy * 100, this.y === 0);
    this.actorMaterial.setProperty('tilingOffset', new Vec4(this.facing / 8, -1 / 4, (frame % 8 + (this.facing < 0 ? 1 : 0)) / 8, (4 - Math.floor(frame / 8)) / 4));
    if (this.chasing) { this.dogZ = Math.min(.65, this.dogZ + dt * 3); this.dogX += Math.sign(this.x - this.dogX) * Math.min(Math.abs(this.x - this.dogX), dt * 3.5); }
    const face = this.dogX > this.x ? -1 : 1; this.dog.setPosition(this.dogX, 1, this.dogZ); this.dog.setScale(2.5, 2.5, 1);
    const dogFrame = this.chasing ? Math.floor(this.elapsed * 10) % 4 : 4;
    this.dogMaterial.setProperty('tilingOffset', new Vec4(face / 4, -.5, (dogFrame % 4 + (face < 0 ? 1 : 0)) / 4, dogFrame < 4 ? 1 : .5));
    const follow = this.camera.node.position.x + (this.x - this.camera.node.position.x) * (1 - Math.exp(-dt * 4));
    this.camera.node.setPosition(follow, CAMERA_HEIGHT, CAMERA_Z); this.camera.node.setRotationFromEuler(-CAMERA_ELEVATION, 0, 0);
    this.car.setPosition(-8 + Math.sin(this.elapsed * .15) * 8, 0, -19);
    this.lamp.active = Math.sin(this.elapsed * 9) > 0;
    this.notice.string = this.chasing ? (this.dogZ < -.5 ? `狗正在沿 Z 轴接近 · 距离行走面 ${Math.abs(this.dogZ).toFixed(1)}` : '狗已到达玩家行走面 · R 重置演示') : '远处：警车与岗哨    中景：围栏    近处：角色行走面';
  }
  onDestroy() { input.off(Input.EventType.KEY_DOWN, this.down, this); input.off(Input.EventType.KEY_UP, this.up, this); this.root?.destroy(); }
}
