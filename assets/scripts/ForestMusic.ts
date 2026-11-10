import { _decorator, AudioClip, AudioSource, Color, Component, EventKeyboard, Graphics, Input, input, KeyCode, Label, Node, resources, screen, sys, UITransform, view } from 'cc';
const { ccclass } = _decorator;

/** Original ambient score, unlocked by the first player gesture. */
@ccclass('ForestMusic')
export class ForestMusic extends Component {
  private source!: AudioSource;
  private clip: AudioClip | null = null;
  private enabledByPlayer = true;
  private unlocked = false;
  private mHeld = false;
  private caption!: Label;
  private button!: Node;
  private captionNode!: Node;

  onLoad() {
    this.source = this.node.addComponent(AudioSource);
    this.source.loop = true; this.source.playOnAwake = false; this.source.volume = 0;
    this.button = new Node('Music toggle'); this.button.setParent(this.node); this.button.layer = this.node.layer;
    this.button.addComponent(UITransform).setContentSize(150, 42);
    const art = this.button.addComponent(Graphics); art.fillColor = new Color(15, 41, 36, 215);
    art.roundRect(-75, -21, 150, 42, 8); art.fill();
    this.captionNode = new Node('Music label'); this.captionNode.setParent(this.button); this.captionNode.layer = this.node.layer;
    this.captionNode.addComponent(UITransform).setContentSize(150, 42);
    this.caption = this.captionNode.addComponent(Label); this.caption.fontSize = 14; this.caption.lineHeight = 32;
    this.caption.color = new Color(228, 235, 210); this.caption.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.caption.string = sys.isMobile ? '♪ 音乐开' : 'M · MUSIC ON';
    this.button.on(Node.EventType.TOUCH_START, this.toggle, this);
    screen.on('window-resize', this.layoutButton, this);
    screen.on('orientation-change', this.layoutButton, this);
    this.layoutButton();
    input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.on(Input.EventType.KEY_UP, this.keyUp, this);
    input.on(Input.EventType.TOUCH_START, this.unlock, this);
    resources.load('audio/forest-theme', AudioClip, (error, clip) => {
      if (!this.isValid) return;
      if (error) { this.caption.string = 'MUSIC UNAVAILABLE'; console.error(error); return; }
      this.clip = clip; this.startIfReady();
    });
  }
  private unlock() { this.unlocked = true; this.startIfReady(); }
  private keyDown(event: EventKeyboard) {
    this.unlock();
    if (event.keyCode === KeyCode.KEY_M && !this.mHeld) { this.mHeld = true; this.toggle(); }
  }
  private keyUp(event: EventKeyboard) { if (event.keyCode === KeyCode.KEY_M) this.mHeld = false; }
  private toggle() {
    this.unlocked = true; this.enabledByPlayer = !this.enabledByPlayer;
    this.caption.string = sys.isMobile ? `♪ 音乐${this.enabledByPlayer ? '开' : '关'}` : `M · MUSIC ${this.enabledByPlayer ? 'ON' : 'OFF'}`;
    this.startIfReady();
  }
  private layoutButton() {
    if (!this.button) return;
    const visible = view.getVisibleSize(), scale = Math.max(.78, Math.min(1, visible.width / 800, visible.height / 420));
    const safe = sys.getSafeAreaRect(), halfWidth = visible.width / 2, halfHeight = visible.height / 2;
    const safeRight = safe.x + safe.width - halfWidth, safeTop = safe.y + safe.height - halfHeight;
    const edge = 64 * scale, pauseWidth = (sys.isMobile ? 112 : 180) * scale, musicWidth = 150 * scale;
    const gap = 14 * scale, pauseCenter = safeRight - edge - pauseWidth / 2;
    this.button.setPosition(pauseCenter - pauseWidth / 2 - gap - musicWidth / 2, safeTop - 36 * scale, 0);
    this.button.setScale(scale, scale, 1);
  }
  private startIfReady() {
    if (this.unlocked && this.enabledByPlayer && this.clip && !this.source.playing) {
      this.source.clip = this.clip; this.source.play();
    }
  }
  update(dt: number) {
    const target = this.unlocked && this.enabledByPlayer ? .28 : 0;
    this.source.volume += (target - this.source.volume) * Math.min(1, dt * 3);
  }
  onDestroy() {
    screen.off('window-resize', this.layoutButton, this); screen.off('orientation-change', this.layoutButton, this);
    input.off(Input.EventType.KEY_DOWN, this.keyDown, this); input.off(Input.EventType.KEY_UP, this.keyUp, this);
    input.off(Input.EventType.TOUCH_START, this.unlock, this);
    this.button?.off(Node.EventType.TOUCH_START, this.toggle, this);
    this.source?.stop();
  }
}
