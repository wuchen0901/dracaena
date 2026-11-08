import { _decorator, AudioClip, AudioSource, Color, Component, EventKeyboard, Graphics, Input, input, KeyCode, Label, Node, resources, UITransform } from 'cc';
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

  onLoad() {
    this.source = this.node.addComponent(AudioSource);
    this.source.loop = true; this.source.playOnAwake = false; this.source.volume = 0;
    this.button = new Node('Music toggle'); this.button.setParent(this.node); this.button.layer = this.node.layer;
    this.button.setPosition(530, 277, 0); this.button.addComponent(UITransform).setContentSize(150, 42);
    const art = this.button.addComponent(Graphics); art.fillColor = new Color(15, 41, 36, 215);
    art.roundRect(-75, -21, 150, 42, 8); art.fill();
    const labelNode = new Node('Music label'); labelNode.setParent(this.button); labelNode.layer = this.node.layer;
    labelNode.addComponent(UITransform).setContentSize(150, 42);
    this.caption = labelNode.addComponent(Label); this.caption.fontSize = 14; this.caption.lineHeight = 32;
    this.caption.color = new Color(228, 235, 210); this.caption.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.caption.string = 'M · MUSIC ON';
    this.button.on(Node.EventType.TOUCH_START, this.toggle, this);
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
    this.caption.string = this.enabledByPlayer ? 'M · MUSIC ON' : 'M · MUSIC OFF';
    this.startIfReady();
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
    input.off(Input.EventType.KEY_DOWN, this.keyDown, this); input.off(Input.EventType.KEY_UP, this.keyUp, this);
    input.off(Input.EventType.TOUCH_START, this.unlock, this);
    this.button?.off(Node.EventType.TOUCH_START, this.toggle, this);
    this.source?.stop();
  }
}
