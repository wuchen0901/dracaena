import { _decorator, Camera, Color, Component, EventKeyboard, Graphics, Input, input, KeyCode, Label, Mask, Node, resources, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
const { ccclass } = _decorator;
type Layer = { node: Node; x: number; y: number; parallax: number; drift: number; phase: number; bird: boolean };

/** Independent image layers; the previous flat composition is archived in design/. */
@ccclass('PuzzleController')
export class PuzzleController extends Component {
  private actor!: Node;
  private frame!: Node;
  private layers: Layer[] = [];
  private keys = new Set<KeyCode>();
  private touchDirection = 0;
  private x = -90; private velocity = 0; private facing = 1; private time = 0;
  private cameraOffset = 0;
  private y = -124.5; private verticalVelocity = 0; private grounded = true;
  private coyote = .12; private jumpBuffer = 0; private crossed = false;
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
    this.layer('Left tree', 'left-tree', 490, 735, -490, 125, .62);
    this.layer('Main tree', 'main-tree', 1050, 610, -120, 105, .78);
    this.layer('Bird one', 'bird', 140, 94, 390, -5, .35, -17, 0, true);
    this.layer('Bird two', 'bird', 110, 74, 515, 75, .35, -21, 2, true);
    this.layer('Grassy cliff', 'ground', 1230, 410, -170, -90, 1);
    this.layer('Far bank', 'ground', 720, 240, 975, -200, 1);
    this.actor = this.picture('Character', 'reference/character', 68, 102, this.frame);
    this.layer('Foreground foliage', 'foreground', 1360, 450, 0, -100, 1.3);
    this.text('A / D  or  ← / →  MOVE     SPACE / W / ↑  JUMP     R  RESET', 0, 330, 17, 900);
    this.button('←', -555, -322, -1); this.button('→', 555, -322, 1); this.button('↑', 430, -322, 0);
    input.on(Input.EventType.KEY_DOWN, this.down, this); input.on(Input.EventType.KEY_UP, this.up, this);
    this.place();
  }
  onDestroy() { input.off(Input.EventType.KEY_DOWN, this.down, this); input.off(Input.EventType.KEY_UP, this.up, this); }
  private child(name: string, w: number, h: number, x: number, y: number, parent: Node = this.node) {
    const n = new Node(name); n.setParent(parent); n.layer = this.node.layer; n.setPosition(x, y, 0); n.addComponent(UITransform).setContentSize(w, h); return n;
  }
  private picture(name: string, path: string, w: number, h: number, parent: Node) {
    const n = this.child(name, w, h, 0, 0, parent); const s = n.addComponent(Sprite); s.sizeMode = Sprite.SizeMode.CUSTOM; this.pending++;
    resources.load(path + '/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (error) { this.failed = true; this.status.string = `Could not load ${name}`; console.error(error); return; }
      const frame = new SpriteFrame(); frame.texture = texture; s.spriteFrame = frame;
      if (!this.pending && !this.failed) this.status.string = 'Independent layers · parallax scenery · drifting clouds · flying birds';
    }); return n;
  }
  private layer(name: string, asset: string, w: number, h: number, x: number, y: number, parallax: number, drift = 0, phase = 0, bird = false) {
    const node = this.picture(name, 'layers/' + asset, w, h, this.frame); node.setPosition(x, y, 0);
    this.layers.push({ node, x, y, parallax, drift, phase, bird }); return node;
  }
  private text(value: string, x: number, y: number, size: number, w: number) {
    const n = this.child(value, w, 48, x, y); const l = n.addComponent(Label); l.string = value; l.fontSize = size; l.lineHeight = size + 6; l.horizontalAlign = Label.HorizontalAlign.CENTER; l.color = new Color(220, 231, 218); return l;
  }
  private button(value: string, x: number, y: number, direction: number) {
    const n = this.child('Move ' + value, 90, 52, x, y); const g = n.addComponent(Graphics); g.fillColor = new Color(30, 55, 51, 240); g.roundRect(-45, -26, 90, 52, 10); g.fill();
    this.text(value, x, y, 30, 90);
    n.on(Node.EventType.TOUCH_START, () => { if (direction) this.touchDirection = direction; else this.jumpBuffer = .14; });
    n.on(Node.EventType.TOUCH_END, () => { if (direction) this.touchDirection = 0; }); n.on(Node.EventType.TOUCH_CANCEL, () => { if (direction) this.touchDirection = 0; });
  }
  private down(e: EventKeyboard) {
    const fresh = !this.keys.has(e.keyCode); this.keys.add(e.keyCode);
    if (fresh && [KeyCode.SPACE, KeyCode.KEY_W, KeyCode.ARROW_UP].includes(e.keyCode)) this.jumpBuffer = .14;
    if (e.keyCode === KeyCode.KEY_R) this.reset();
  }
  private reset() {
    this.x = -90; this.y = this.groundAt(this.x)!; this.velocity = this.verticalVelocity = 0;
    this.facing = 1; this.cameraOffset = this.time = this.jumpBuffer = 0;
    this.grounded = true; this.coyote = .12; this.crossed = false; this.touchDirection = 0; this.place();
  }
  private groundAt(x: number): number | null {
    if (x >= -785 && x <= 445) return -87 - Math.max(0, Math.min(1, (x + 510) / 955)) * 83;
    if (x >= 615 && x <= 1335) return -175 - (x - 615) / 720 * 65;
    return null;
  }
  private up(e: EventKeyboard) { this.keys.delete(e.keyCode); }
  update(delta: number) {
    const dt = Math.min(delta, 1 / 30); this.time += dt;
    const direction = this.touchDirection || Number(this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT)) - Number(this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT));
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? .12 : Math.max(0, this.coyote - dt);
    this.velocity += (direction * 240 - this.velocity) * Math.min(1, dt * 15); if (direction) this.facing = direction;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.verticalVelocity = 610; this.grounded = false; this.jumpBuffer = this.coyote = 0;
    }
    const previousY = this.y;
    this.x = Math.max(-510, Math.min(1250, this.x + this.velocity * dt));
    const surface = this.groundAt(this.x);
    if (this.grounded && surface !== null) this.y = surface;
    else {
      this.grounded = false; this.verticalVelocity -= 1400 * dt; this.y += this.verticalVelocity * dt;
      if (surface !== null && this.verticalVelocity <= 0 && previousY >= surface - 3 && this.y <= surface) {
        this.y = surface; this.verticalVelocity = 0; this.grounded = true;
      }
    }
    if (this.grounded && this.x >= 615) this.crossed = true;
    if (this.y < -460) {
      this.x = this.crossed ? 710 : 350; this.y = this.groundAt(this.x)!;
      this.velocity = this.verticalVelocity = 0; this.grounded = true; this.coyote = .12; this.jumpBuffer = 0;
    }
    const target = Math.max(0, Math.min(650, (this.x - 100) * .75));
    this.cameraOffset += (target - this.cameraOffset) * (1 - Math.exp(-dt * 3));
    if (!this.failed && !this.pending) this.status.string = this.crossed ? 'You made it across!  ·  R to try again' : 'Run toward the edge, then jump to the far bank';
    this.place();
  }
  private place() {
    if (!this.actor) return;
    const foot = this.y;
    this.actor.setPosition(this.x - this.cameraOffset, foot + 38 + (this.grounded && Math.abs(this.velocity) > 8 ? Math.sin(this.time * 16) * 1.2 : 0), 0); this.actor.setScale(this.facing, 1, 1);
    for (const l of this.layers) {
      let drift = l.drift ? ((l.x + 760 + this.time * l.drift) % 1520 + 1520) % 1520 - 760 - l.x : 0;
      l.node.setPosition(l.x - this.cameraOffset * l.parallax + drift, l.y + (l.bird ? Math.sin(this.time * 1.4 + l.phase) * 18 : 0), 0);
      if (l.bird) { l.node.setScale(1, .8 + Math.sin(this.time * 9 + l.phase) * .2, 1); l.node.setRotationFromEuler(0, 0, Math.sin(this.time * 2 + l.phase) * 5); }
    }
  }
}
