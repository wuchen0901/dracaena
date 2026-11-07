import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
  @property(Node)
  player: Node | null = null;

  @property(Node)
  seed: Node | null = null;

  @property(Node)
  relay: Node | null = null;

  @property(Node)
  gate: Node | null = null;

  private carryingSeed = false;
  private relayLit = false;

  update() {
    if (!this.player) return;
    if (!this.carryingSeed && this.seed && this.distance(this.player, this.seed) < 90) {
      // Wire an interaction prompt here; the browser preview demonstrates the full interaction.
    }
    if (this.carryingSeed && this.seed && this.player) {
      const p = this.player.position;
      this.seed.setPosition(new Vec3(p.x + 22, p.y + 72, p.z));
    }
  }

  /** Call from a UI button or keyboard input bridge. */
  interact() {
    if (!this.player) return;
    if (!this.carryingSeed && this.seed && this.distance(this.player, this.seed) < 90) {
      this.carryingSeed = true;
      this.seed.setParent(this.node);
      return;
    }
    if (this.carryingSeed && this.relay && this.distance(this.player, this.relay) < 110) {
      this.carryingSeed = false;
      this.relayLit = true;
      this.seed?.setPosition(this.relay.position);
      if (this.gate) this.gate.active = false;
    }
  }

  private distance(a: Node, b: Node) {
    return Vec3.distance(a.worldPosition, b.worldPosition);
  }
}
