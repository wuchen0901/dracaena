import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
  @property({ tooltip: 'Horizontal movement speed in scene units per second.' })
  speed = 260;

  @property({ tooltip: 'Jump impulse in scene units per second.' })
  jumpVelocity = 620;

  @property({ tooltip: 'Gravity in scene units per second squared.' })
  gravity = 1500;

  private held = new Set<KeyCode>();
  private verticalVelocity = 0;
  private grounded = true;

  onEnable() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  onDisable() {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  update(deltaTime: number) {
    const left = this.held.has(KeyCode.ARROW_LEFT) || this.held.has(KeyCode.KEY_A);
    const right = this.held.has(KeyCode.ARROW_RIGHT) || this.held.has(KeyCode.KEY_D);
    const direction = Number(right) - Number(left);
    const position = this.node.position;
    const x = Math.max(-520, Math.min(520, position.x + direction * this.speed * deltaTime));

    this.verticalVelocity -= this.gravity * deltaTime;
    let y = position.y + this.verticalVelocity * deltaTime;
    if (y <= 0) {
      y = 0;
      this.verticalVelocity = 0;
      this.grounded = true;
    }
    this.node.setPosition(new Vec3(x, y, position.z));
    if (direction !== 0) this.node.setScale(new Vec3(Math.sign(direction), 1, 1));
  }

  private onKeyDown(event: EventKeyboard) {
    this.held.add(event.keyCode);
    const jump = event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ARROW_UP || event.keyCode === KeyCode.KEY_W;
    if (jump && this.grounded) {
      this.verticalVelocity = this.jumpVelocity;
      this.grounded = false;
    }
  }

  private onKeyUp(event: EventKeyboard) {
    this.held.delete(event.keyCode);
  }
}
