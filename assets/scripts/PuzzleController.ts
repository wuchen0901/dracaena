import { DogChaseSegment } from './DogChaseSegment';
import { drawDogGap, drawCatRescueProps } from './DogGapArt';
import { drawGuardPostSearch } from './GuardPostArt';
import { drawScrapYard } from './ScrapYardArt';
import { cameraHeight } from './WorldCamera';
import { PushPullAnimation, PUSH_PULL_CANVAS } from './PushPullAnimation';
import { PushBoxSegment } from './PushBoxSegment';
import { IndustrialPressSegment, drawIndustrialPress } from './IndustrialPressSegment';
import { RiverCrossing, drawRiverBoatFront, drawRiverCrossing } from './RiverCrossing';
import { drawPushBox } from './PushBoxArt';
import { drawFactoryPanic, drawReclamationOpening, FACTORY_PANIC_LAYOUT } from './ReclamationOpening';
import { SearchEscape } from './SearchEscape';
import { COVER, POLICE_COVER, GUARD_POST, TreeCover } from './TreeCover';
import { drawNightSearch } from './NightSearch';
import { CharacterAnimation, CHARACTER_COLUMNS, CHARACTER_ROWS, CHARACTER_FOOT_ANCHORS } from './CharacterAnimation';
import { CHANNEL, ROAD, SALVAGE, roadHeight, readProgress, SAVE_KEY, SluiceWorld, ARCHIVE_KEY, AutoSave, SaveArchive, Checkpoint, emptyArchive, readArchive, upsertAutosave, sameMilestone, ensureOpeningAutosave } from './SluiceWorld';
import { ForestMusic } from './ForestMusic';
import { drawJourneyStoryArt } from './JourneyStoryArt';
import { CityStoryLevels, CITY_STORY, drawCityStories } from './CityStoryLevels';
import { _decorator, AudioClip, AudioSource, Camera, Color, Component, EventKeyboard, game, Game, Graphics, Input, input, KeyCode, Label, Mask, Node, Rect, resources, Size, Sprite, SpriteFrame, sys, Texture2D, UITransform } from 'cc';
const { ccclass } = _decorator;
type Layer = { node: Node; x: number; y: number; parallax: number; drift: number; phase: number; bird: boolean };
type JourneyBackdrop = { node: Node; sprite: Sprite; start: number; end: number; fade: number };

/** Independent image layers; the previous flat composition is archived in design/. */
@ccclass('PuzzleController')
export class PuzzleController extends Component {
  private opening!: Graphics; private openingSigns: Node[] = []; private dormantRobots: Node[] = [];
  private factoryPanicArt!: Graphics; private factoryRunners: Node[] = [];
  private alarmTriggered = false; private factorySound!: AudioSource; private alarmSound!: AudioSource;
  private factoryClip: AudioClip | null = null; private alarmClip: AudioClip | null = null;
  private night = 0; private savedNight = 0; private search!: Graphics;
  private siren!: AudioSource; private sirenClip: AudioClip | null = null;
  private escape = new SearchEscape();
  private policeEscape = new SearchEscape();
  private cover = new TreeCover(); private policeCover = new TreeCover(POLICE_COVER);
  private coverPoses: SpriteFrame[] = []; private coverTree!: Graphics; private policeCoverTree!: Graphics;
  private guardPost!: Graphics; private guardPostSign!: Label;
  private actor!: Node;
  private actorSprite!: Sprite;
  private poses: SpriteFrame[] = [];
  private pushPull = new PushPullAnimation(); private pushPullPoses: SpriteFrame[] = [];
  private animation = new CharacterAnimation(); private breathScaleY = 1;
  private touchRun = false;
  private frame!: Node; private sceneRoot!: Node; private cameraLift = 0;
  private layers: Layer[] = [];
  private journeyBackdrops: JourneyBackdrop[] = [];
  private journeyStoryArt!: Graphics;
  private cityStoryArt!: Graphics;
  private journeyClues: { node: Node; x: number; y: number; range: number }[] = [];
  private scavengerNode!: Node; private flyArt!: Graphics;
  private keys = new Set<KeyCode>();
  private touchDirection = 0;
  private boxPuzzle = new PushBoxSegment(); private boxArt!: Graphics; private prisonSign!: Label;
  private pressPuzzle = new IndustrialPressSegment(); private pressArt!: Graphics; private pressSign!: Label; private touchGrab = false;
  private river = new RiverCrossing(); private riverArt!: Graphics; private riverFrontArt!: Graphics; private riverSign!: Label;
  private dog = new DogChaseSegment(); private dogNode!: Node; private dogArt!: Graphics;
  private catNode!: Node; private catPoses: SpriteFrame[] = []; private catPropsArt!: Graphics;
  private scrapArt!: Graphics; private scrapSign!: Label; private beaconSign!: Label;
  private dogPoses: SpriteFrame[] = []; private barkSound!: AudioSource; private barkClip: AudioClip | null = null;
  private caughtReason!: Label; private caughtDescription!: Label;
  private cityStories = new CityStoryLevels();
  private world = new SluiceWorld(this.boxPuzzle, this.dog, this.pressPuzzle, this.river, this.cityStories);
  private previewMode = false;
  private facing = 1; private time = 0;
  private terrain!: Graphics; private water!: Graphics;
  private leverPrompt!: Label; private saved = ''; private saveNotice = 0;
  private waterSound!: AudioSource; private leverSound!: AudioSource;
  private waterClip: AudioClip | null = null; private leverClip: AudioClip | null = null;
  private audioUnlocked = false; private storageFailed = false;
  private cameraOffset = 0;
  private archive: SaveArchive = emptyArchive(); private saveList!: Node; private savePage = 0;
  private paused = false; private pausePanel!: Node;
  private caughtPanel!: Node;
  private status!: Label;
  private pending = 0; private failed = false;
  onLoad() {
    const camera = this.node.scene.getChildByName('Main Camera')?.getComponent(Camera);
    if (camera) { camera.clearFlags = Camera.ClearFlag.SOLID_COLOR; camera.clearColor = new Color(0, 0, 0, 255); }
    this.status = this.text('Loading scene layers…', 0, -328, 16, 900);
    this.frame = this.child('Layered Landscape', 1280, 590, 0, 0);
    this.frame.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.sceneRoot = this.child('World camera', 1280, 590, 0, 0, this.frame);
    this.layer('Sky', 'sky', 1400, 650, 0, 0, 0);
    this.layer('Cloud west', 'cloud', 360, 120, -300, 85, .08, 3);
    this.layer('Cloud east', 'cloud', 460, 154, 430, 10, .08, 2);
    this.createRuins();
    this.layer('Distant forest', 'distant-forest', 1440, 660, 0, -35, .18);
    for (let i = 1; i <= 3; i++) {
      this.layer('Forest continuation ' + i, 'distant-forest', 1440, 660, i * 1400, -35, .18);
      this.layer('Tree continuation ' + i, 'main-tree', 1050, 610, i * 1100, 105, .78);
    }
    this.layer('Left tree', 'left-tree', 490, 735, -490, 125, .62);
    this.layer('Main tree', 'main-tree', 1050, 610, -120, 105, .78);
    this.layer('Bird one', 'bird', 140, 94, 390, -5, .35, -17, 0, true);
    this.layer('Bird two', 'bird', 110, 74, 515, 75, .35, -21, 2, true);
    this.createJourneyBackdrops();
    this.search = this.child('Police search outside prison', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.guardPost = this.child('Inner yard sentry post', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.guardPostSign = this.text('园区岗哨', 0, 0, 16, 140); this.guardPostSign.node.setParent(this.sceneRoot);
    this.terrain = this.child('Canal, banks and floating timber', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.scavengerNode = this.picture('Starving survivor beside a carcass', 'journey/scavenger', 400, 205, this.sceneRoot);
    this.scavengerNode.getComponent(Sprite)!.color = new Color(255, 255, 255, 255);
    this.scavengerNode.getComponent(UITransform)!.setAnchorPoint(.5, .06);
    this.flyArt = this.child('Flies circling the carrion', 160, 110, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.journeyStoryArt = this.child('AI surveillance and ration traces', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.cityStoryArt = this.child('Playable ruined-city stories', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    const rationFloor = roadHeight(10030);
    const rationClue = this.text('配给仅限登记劳工', 10065, rationFloor + 113, 14, 250);
    rationClue.color = new Color(160, 154, 132, 210); rationClue.node.setParent(this.sceneRoot);
    this.journeyClues.push({ node: rationClue.node, x: 10065, y: rationFloor + 113, range: 800 });
    const relayClue = this.text('行为模型 · 无法归类', 15955, roadHeight(15920) + 245, 13, 230);
    relayClue.color = new Color(163, 183, 143, 210); relayClue.node.setParent(this.sceneRoot);
    this.journeyClues.push({ node: relayClue.node, x: 15955, y: roadHeight(15920) + 245, range: 700 });
    this.opening = this.child('Reclamation station', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.factoryPanicArt = this.child('Factory alarm and conveyor escape', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    for (const [label, x, y] of [['待处理区 · 07', -1960, 115], ['拆解', -2340, 110], ['维修通道 →', -1210, 70]] as [string, number, number][]) {
      const sign = this.text(label, x, y, 18, 240); sign.node.setParent(this.sceneRoot); this.openingSigns.push(sign.node);
    }
    this.boxArt = this.child('Movable crate and maintenance platform', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.pressArt = this.child('Industrial pressure plate and sliding bridge', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.pressSign = this.text('废弃车间\n压住按钮，检修桥才会保持伸出', 0, 0, 14, 270);
    this.pressSign.lineHeight = 19; this.pressSign.node.setParent(this.sceneRoot);
    this.riverArt = this.child('Ruined river and old ferry', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.riverSign = this.text('废城河道\n旧渡船顺流而下', 0, 0, 15, 240);
    this.riverSign.lineHeight = 20; this.riverSign.node.setParent(this.sceneRoot);
    this.prisonSign = this.text('第七区监狱\n外围隔离墙', 0, 0, 13, 140);
    this.prisonSign.lineHeight = 18; this.prisonSign.node.setParent(this.sceneRoot);
    this.dogArt = this.child('Broken prison escape path', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.scrapArt = this.child('Abandoned robot salvage line', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.scrapSign = this.text('07 号报废线\n记忆清除', 0, 0, 17, 220); this.scrapSign.node.setParent(this.sceneRoot);
    this.beaconSign = this.text('海岸中继\n信号微弱 →', 0, 0, 17, 220); this.beaconSign.node.setParent(this.sceneRoot);
    this.dogNode = this.child('Pursuing guard dog', 112, 112, 0, 0, this.sceneRoot);
    this.dogNode.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM; this.loadDogPoses();
    this.catPropsArt = this.child('Kitten perch and blocking crate', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.catNode = this.child('Rescued kitten', 66, 66, 0, 0, this.sceneRoot);
    this.catNode.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM; this.loadCatPoses();
    // Depth order: distant police → shelter tree → robot on the viewer-facing side.
    this.coverTree = this.child('Foreground shelter tree', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.policeCoverTree = this.child('Roadside shelter tree', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.actor = this.child('Character', 102, 102, 0, 0, this.sceneRoot);
    this.actorSprite = this.actor.addComponent(Sprite); this.actorSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.riverFrontArt = this.child('Ferry bow over the seated rider', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.loadCharacterPoses(); this.loadCoverPoses(); this.loadPushPullPoses();
    this.water = this.child('Transparent canal water', 1280, 590, 0, 0, this.sceneRoot).addComponent(Graphics);
    this.leverPrompt = this.text('', 0, 0, 16, 260); this.leverPrompt.node.setParent(this.sceneRoot);
    this.text('A / D  MOVE     SPACE / W / ↑  JUMP     E  INTERACT / HOLD TO PUSH     R  RESTORE CHECKPOINT', 0, 330, 17, 1100);
    this.button('←', -555, -322, -1); this.button('→', 555, -322, 1); this.button('↑', 430, -322, 0);
    this.button('RUN', -430, -322, 0, true);
    this.button('E', 310, -322, 0, false, true);
    this.createCaughtPanel();
    this.createPauseMenu();
    this.saveList = this.child('Autosave history', 1280, 590, 0, 0); this.saveList.active = false;
    try {
      const raw = sys.localStorage.getItem(SAVE_KEY), save = readProgress(raw);
      if (save) {
        this.world.restore(save); this.night = this.savedNight = save.night;
        this.escape.cleared = save.escaped; this.policeEscape.cleared = save.policeCleared === true;
        this.alarmTriggered = save.alarm || save.checkpoint === 'reclamation' || save.checkpoint === 'factory-escape';
        // One-time migration from older split atmosphere/patrol keys.
        if (raw && !Object.prototype.hasOwnProperty.call(JSON.parse(raw), 'escaped')) {
          const legacyNight = Number(sys.localStorage.getItem(SAVE_KEY + '.night'));
          if (Number.isFinite(legacyNight)) this.night = this.savedNight = Math.max(this.night, Math.min(1, Math.max(0, legacyNight)));
          this.escape.cleared = sys.localStorage.getItem(SAVE_KEY + '.escaped') === 'true';
        }
      }
    } catch { this.storageFailed = true; }
    try {
      const history = readArchive(sys.localStorage.getItem(ARCHIVE_KEY));
      if (history && history.entries.length) {
        this.archive = history;
        const active = history.entries.find(e => e.id === history.activeId)!;
        this.world.restore(active.progress); this.night = this.savedNight = active.progress.night;
        this.escape.cleared = active.progress.escaped; this.policeEscape.cleared = active.progress.policeCleared === true;
        this.alarmTriggered = active.progress.alarm || active.progress.checkpoint === 'reclamation' || active.progress.checkpoint === 'factory-escape';
        this.saved = JSON.stringify(active.progress);
      } else {
        const legacy = sys.localStorage.getItem(SAVE_KEY);
        if (readProgress(legacy)) {
          const progress = { ...this.world.save(), night: this.savedNight, escaped: this.escape.cleared, policeCleared: this.policeEscape.cleared, alarm: this.alarmTriggered };
          this.archive = upsertAutosave(this.archive, progress, null);
          this.saved = JSON.stringify(progress); this.writeArchive();
        }
      }
    } catch { this.storageFailed = true; }
    const archiveBeforeOpeningSeed = this.archive;
    this.archive = ensureOpeningAutosave(this.archive, Date.now());
    if (this.archive !== archiveBeforeOpeningSeed) this.writeArchive();
    if (this.world.checkpoint === 'reclamation') this.alarmTriggered = true;
    // Isolated preview entry for quickly inspecting the new city level without touching saves on localhost.
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('preview') === 'city') {
      this.previewMode = true;
      this.cityStories.restore(); this.boxPuzzle.solved = true; this.pressPuzzle.solved = true;
      this.escape.cleared = true; this.policeEscape.cleared = true; this.dog.reset(true, true, 9680);
      this.world.checkpoint = 'city-ration'; this.world.opened = true; this.world.fill = 1;
      this.world.x = 9730; this.world.y = roadHeight(this.world.x); this.world.grounded = true;
      this.alarmTriggered = true;
    }
    this.persist();
    this.cameraOffset = Math.max(-3750, this.world.x - 100);
    this.cameraLift = cameraHeight(0, this.world.y, 1);
    this.setupSluiceAudio();
    input.on(Input.EventType.KEY_DOWN, this.down, this); input.on(Input.EventType.KEY_UP, this.up, this);
    game.on(Game.EVENT_HIDE, this.releaseInputs, this);
    this.place();
    this.node.addComponent(ForestMusic);
  }
  onDestroy() { game.off(Game.EVENT_HIDE, this.releaseInputs, this); this.waterSound?.stop(); this.siren?.stop(); this.factorySound?.stop(); this.alarmSound?.stop(); this.barkSound?.stop(); input.off(Input.EventType.KEY_DOWN, this.down, this); input.off(Input.EventType.KEY_UP, this.up, this); }
  private child(name: string, w: number, h: number, x: number, y: number, parent: Node = this.node) {
    const n = new Node(name); n.setParent(parent); n.layer = this.node.layer; n.setPosition(x, y, 0); n.addComponent(UITransform).setContentSize(w, h); return n;
  }
  private picture(name: string, path: string, w: number, h: number, parent: Node) {
    const n = this.child(name, w, h, 0, 0, parent); const s = n.addComponent(Sprite); s.color = new Color(174, 199, 188); s.sizeMode = Sprite.SizeMode.CUSTOM; this.pending++;
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
    resources.load('character/robot-actions/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load character actions'; console.error(error); return; }
      const w = texture.width / CHARACTER_COLUMNS, h = texture.height / CHARACTER_ROWS;
      for (let row = 0; row < CHARACTER_ROWS; row++) for (let column = 0; column < CHARACTER_COLUMNS; column++) {
        const pose = new SpriteFrame(); pose.texture = texture;
        const left = Math.round(column * w), top = Math.round(row * h);
        const width = Math.round((column + 1) * w) - left, height = Math.round((row + 1) * h) - top;
        pose.rect = new Rect(left, top, width, height);
        pose.originalSize = new Size(width, height);
        this.poses.push(pose);
      }
      for (const x of [-2250, -2150, -1850]) {
        const robot = this.child('Deactivated robot', 102, 102, x, CHANNEL.near, this.sceneRoot);
        robot.getComponent(UITransform)!.setAnchorPoint(.5, CHARACTER_FOOT_ANCHORS[0]);
        const sprite = robot.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.poses[0]; sprite.color = new Color(47, 58, 57);
        robot.setSiblingIndex(this.actor.getSiblingIndex()); this.dormantRobots.push(robot);
      }
      for (let i = 0; i < 5; i++) {
        const runner = this.child('Escaping robot copy ' + (i + 1), 82, 82, 0, FACTORY_PANIC_LAYOUT.beltY, this.sceneRoot);
        runner.getComponent(UITransform)!.setAnchorPoint(.5, CHARACTER_FOOT_ANCHORS[16]);
        const sprite = runner.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.poses[16]; sprite.color = new Color(178, 168, 142, 230);
        runner.setScale(.78, .78, 1); runner.setSiblingIndex(this.actor.getSiblingIndex());
        this.factoryRunners.push(runner);
      }
      this.actor.getComponent(UITransform)!.setContentSize(102, 102);
      this.actor.getComponent(UITransform)!.setAnchorPoint(.5, .06);
      this.animateCharacter(0); this.place();
    });
  }
  private loadCoverPoses() {
    this.pending++;
    resources.load('character/robot-cover/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load cover animation'; console.error(error); return; }
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const left = Math.round(col * texture.width / 4), top = Math.round(row * texture.height / 2);
        const width = Math.round((col + 1) * texture.width / 4) - left;
        const height = Math.round((row + 1) * texture.height / 2) - top;
        const pose = new SpriteFrame(); pose.texture = texture;
        pose.rect = new Rect(left, top, width, height); pose.originalSize = new Size(width, height);
        this.coverPoses.push(pose);
      }
    });
  }
  private loadDogPoses() {
    this.pending++;
    resources.load('dog/chase-bark/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load guard dog'; console.error(error); return; }
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const x = Math.round(col * texture.width / 4), y = Math.round(row * texture.height / 2);
        const w = Math.round((col + 1) * texture.width / 4) - x, h = Math.round((row + 1) * texture.height / 2) - y;
        const frame = new SpriteFrame(); frame.texture = texture; frame.rect = new Rect(x, y, w, h); frame.originalSize = new Size(w, h);
        this.dogPoses.push(frame);
      }
    });
  }
  private loadCatPoses() {
    this.pending++;
    resources.load('cat/follow/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load kitten animation'; console.error(error); return; }
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const left = Math.round(col * texture.width / 4), top = Math.round(row * texture.height / 2);
        const width = Math.round((col + 1) * texture.width / 4) - left;
        const height = Math.round((row + 1) * texture.height / 2) - top;
        const pose = new SpriteFrame(); pose.texture = texture;
        pose.rect = new Rect(left, top, width, height); pose.originalSize = new Size(width, height);
        this.catPoses.push(pose);
      }
    });
  }
  private loadPushPullPoses() {
    this.pending++;
    resources.load('character/robot-push-pull/texture', Texture2D, (error, texture) => {
      this.pending--;
      if (!this.isValid) return;
      if (error) { this.failed = true; this.status.string = 'Could not load push/pull animation'; console.error(error); return; }
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const left = Math.round(col * texture.width / 4), top = Math.round(row * texture.height / 2);
        const width = Math.round((col + 1) * texture.width / 4) - left;
        const height = Math.round((row + 1) * texture.height / 2) - top;
        const pose = new SpriteFrame(); pose.texture = texture;
        pose.rect = new Rect(left, top, width, height); pose.originalSize = new Size(width, height);
        this.pushPullPoses.push(pose);
      }
    });
  }
  private animateCharacter(dt: number) {
    if (!this.poses.length) return;
    const onBoat = this.world.checkpoint === 'river-approach' && this.river.isOnBoat(this.world.x);
    if (onBoat) {
      this.pushPull.reset(); this.facing = 1; this.breathScaleY = 1 + Math.sin(this.time * 3.2) * .012;
      this.actorSprite.spriteFrame = this.poses[0];
      this.actor.getComponent(UITransform)!.setContentSize(88, 92);
      this.actor.getComponent(UITransform)!.setAnchorPoint(.5, CHARACTER_FOOT_ANCHORS[0]);
      return;
    }
    this.breathScaleY = 1;
    const index = this.animation.frame(dt, this.world.vx, this.world.vy, this.world.grounded);
    const guardCoverFrame = this.cover.frame(dt, this.escape.cleared ? -1000 : this.world.x, this.world.grounded, this.world.vx);
    const policeCoverFrame = this.policeCover.frame(dt, this.policeEscape.cleared ? -1000 : this.world.x, this.world.grounded, this.world.vx);
    const coverFrame = guardCoverFrame !== null ? guardCoverFrame : policeCoverFrame;
    const pressing = this.pressPuzzle.canGrab(this.world.x, this.world.y, this.world.grounded);
    const gripping = !(this.escape.caught || this.policeEscape.caught || this.dog.caught) && (this.touchGrab || this.keys.has(KeyCode.KEY_E)) &&
      (pressing || this.boxPuzzle.canGrab(this.world.x, this.world.y, this.world.grounded));
    const crateX = pressing ? this.pressPuzzle.crateX : this.boxPuzzle.x;
    const crateLeft = pressing ? this.pressPuzzle.left : this.boxPuzzle.left;
    const crateRight = pressing ? this.pressPuzzle.right : this.boxPuzzle.right;
    const contact = this.world.x < crateX ? crateLeft : crateRight;
    const effort = this.pushPull.frame(dt, gripping, crateX - this.world.x,
      this.world.vx, pressing ? this.pressPuzzle.moving : this.boxPuzzle.moving, Math.abs(contact - this.world.x));
    this.actor.getComponent(UITransform)!.setContentSize(effort ? PUSH_PULL_CANVAS : 102, effort ? PUSH_PULL_CANVAS : 102);
    if (effort && this.pushPullPoses.length === 8) {
      this.actorSprite.spriteFrame = this.pushPullPoses[effort.index]; this.facing = effort.facing;
      this.actor.getComponent(UITransform)!.setAnchorPoint(effort.anchorX, effort.anchorY);
    } else if (coverFrame !== null && this.coverPoses.length === 8) {
      this.actorSprite.spriteFrame = this.coverPoses[coverFrame];
      this.actor.getComponent(UITransform)!.setAnchorPoint(.5, coverFrame < 4 ? .095 : .09);
    } else {
      this.breathScaleY = this.animation.idleScaleY;
      this.actorSprite.spriteFrame = this.poses[index];
      this.actor.getComponent(UITransform)!.setAnchorPoint(.5, CHARACTER_FOOT_ANCHORS[index]);
    }
  }
  private drawCoverTree(g: Graphics, layout: typeof COVER) {
    const x = layout.treeX - this.cameraOffset, y = roadHeight(layout.treeX);
    g.clear();
    // The trunk blocks the distant search sightline; the robot renders on its viewer-facing side.
    g.fillColor = new Color(26, 39, 34);
    g.moveTo(x - 22, y); g.lineTo(x - 13, y + 200); g.lineTo(x - 43, y + 295);
    g.lineTo(x - 6, y + 295); g.lineTo(x + 12, y + 210); g.lineTo(x + 35, y + 295);
    g.lineTo(x + 54, y + 295); g.lineTo(x + 20, y + 162); g.lineTo(x + 25, y); g.close(); g.fill();
    g.strokeColor = new Color(53, 66, 48); g.lineWidth = 4;
    for (let i = 0; i < 4; i++) { g.moveTo(x - 12 + i * 9, y + 8); g.lineTo(x - 6 + i * 6, y + 155); g.stroke(); }
    g.strokeColor = new Color(30, 47, 36); g.lineWidth = 12;
    for (const side of [-1, 1]) { g.moveTo(x, y + 8); g.quadraticCurveTo(x + side * 35, y + 6, x + side * 80, y + 2); g.stroke(); }
    g.fillColor = new Color(38, 62, 44);
    for (let i = 0; i < 9; i++) { g.ellipse(x - 77 + i * 19, y + 6 + (i % 3) * 4, 15, 7); g.fill(); }
  }

  private layer(name: string, asset: string, w: number, h: number, x: number, y: number, parallax: number, drift = 0, phase = 0, bird = false) {
    const node = this.picture(name, 'layers/' + asset, w, h, this.sceneRoot); node.setPosition(x, y, 0);
    this.layers.push({ node, x, y, parallax, drift, phase, bird }); return node;
  }
  private createJourneyBackdrops() {
    const zones: [string, number, number, number][] = [
      ['factory', -20000, -1050, 600],
      ['desert', -1250, 8500, 750],
      ['city', 8200, 12200, 850],
      ['reclaimed-city', 11800, 15500, 900],
      ['meadow-mystery', 14900, 1000000000, 1000],
    ];
    for (const [asset, start, end, fade] of zones) {
      const node = this.picture('Journey backdrop · ' + asset, 'journey/' + asset, 1400, 700, this.sceneRoot);
      const sprite = node.getComponent(Sprite)!;
      sprite.color = new Color(255, 255, 255, 0);
      this.journeyBackdrops.push({ node, sprite, start, end, fade });
    }
  }
  private backdropAlpha(x: number, start: number, end: number, fade: number) {
    const entering = x < start ? (x - start + fade) / fade : 1;
    const leaving = x > end ? (end + fade - x) / fade : 1;
    return Math.round(255 * Math.max(0, Math.min(1, entering, leaving)));
  }
  /** Distant, non-colliding silhouettes sit behind the forest canopy. */
  private createRuins() {
    const n = this.child('Reclaimed industrial skyline', 2600, 590, 0, 0, this.sceneRoot);
    const g = n.addComponent(Graphics);
    const block = (x: number, y: number, w: number, h: number) => { g.rect(x, y, w, h); g.fill(); };
    g.fillColor = new Color(65, 91, 88, 115);
    for (const x of [220, 980, 1800]) {
      block(x, -190, 75, 330); block(x - 12, 124, 99, 13);
      block(x + 18, 140, 12, 48); block(x + 50, 140, 8, 27);
      block(x + 130, -190, 26, 235);
      block(x + 40, 36, 210, 12); block(x + 290, 36, 170, 12);
      for (let i = 0; i < 3; i++) block(x + 310 + i * 60, -190, 9, 226);
    }
    g.fillColor = new Color(123, 153, 140, 95);
    for (const x of [220, 980, 1800]) {
      for (let y = -90; y < 110; y += 38) block(x + 19, y, 35, 8);
    }
    this.layers.push({ node: n, x: 0, y: 0, parallax: .12, drift: 0, phase: 0, bird: false });
  }

  private text(value: string, x: number, y: number, size: number, w: number) {
    const n = this.child(value, w, 48, x, y); const l = n.addComponent(Label); l.string = value; l.fontSize = size; l.lineHeight = size + 6; l.horizontalAlign = Label.HorizontalAlign.CENTER; l.color = new Color(220, 231, 218); return l;
  }
  private button(value: string, x: number, y: number, direction: number, run = false, interact = false) {
    const n = this.child('Move ' + value, 90, 52, x, y); const g = n.addComponent(Graphics); g.fillColor = new Color(30, 55, 51, 240); g.roundRect(-45, -26, 90, 52, 10); g.fill();
    this.text(value, x, y, 30, 90);
    n.on(Node.EventType.TOUCH_START, () => { this.unlockAudio(); if ((this.escape.caught || this.policeEscape.caught || this.dog.caught) || this.paused) return; if (interact) { this.touchGrab = true; this.interact(); } else if (run) this.touchRun = true; else if (direction) this.touchDirection = direction; else this.world.jump(); });
    const release = () => { if (interact) this.touchGrab = false; if (run) this.touchRun = false; else if (direction) this.touchDirection = 0; };
    n.on(Node.EventType.TOUCH_END, release); n.on(Node.EventType.TOUCH_CANCEL, release);
  }
  private createCaughtPanel() {
    const panel = this.child('Caught · retry', 1280, 590, 0, 0);
    const art = panel.addComponent(Graphics); art.fillColor = new Color(8, 13, 23, 210);
    art.rect(-640, -295, 1280, 590); art.fill();
    const heading = this.text('本关失败', 0, 92, 32, 700); heading.node.setParent(panel);
    const reason = this.caughtReason = this.text('', 0, 35, 22, 760); reason.node.setParent(panel);
    const description = this.caughtDescription = this.text('', 0, -12, 17, 900); description.node.setParent(panel);
    const retry = this.child('Retry search encounter', 300, 60, 0, -85, panel);
    const button = retry.addComponent(Graphics); button.fillColor = new Color(48, 73, 65);
    button.roundRect(-150, -30, 300, 60, 8); button.fill();
    const label = this.text('确认重试本关', 0, 0, 22, 300); label.node.setParent(retry);
    retry.on(Node.EventType.TOUCH_END, () => this.retryCurrentLevel());
    this.caughtPanel = panel; panel.active = false;
  }
  private releaseInputs() { this.keys.clear(); this.touchDirection = 0; this.touchRun = false; this.touchGrab = false; this.world.vx = 0; }
  private down(e: EventKeyboard) {
    this.unlockAudio();
    const fresh = !this.keys.has(e.keyCode); this.keys.add(e.keyCode);
    if (fresh && e.keyCode === KeyCode.ESCAPE) { this.togglePause(); return; }
    if (this.paused) return;
    if (this.escape.caught || this.policeEscape.caught || this.dog.caught) { if (fresh && e.keyCode === KeyCode.KEY_R) this.retryCurrentLevel(); return; }
    if (fresh && [KeyCode.SPACE, KeyCode.KEY_W, KeyCode.ARROW_UP].indexOf(e.keyCode) >= 0) this.world.jump();
    if (fresh && e.keyCode === KeyCode.KEY_E) this.interact();
    if (fresh && e.keyCode === KeyCode.KEY_R) this.reset();
  }
  private interact() {
    if ((this.escape.caught || this.policeEscape.caught || this.dog.caught) || this.paused) return;
    if (this.world.interact() || this.cityStories.interact(this.world.x, this.world.grounded)) {
      if (this.leverClip) this.leverSound.playOneShot(this.leverClip, .5);
      this.persist();
    }
  }
  private createPauseMenu() {
    const toggle = this.text('暂停 · ESC', -520, 277, 17, 180);
    toggle.node.on(Node.EventType.TOUCH_END, () => this.togglePause());
    const panel = this.child('Pause menu', 1280, 590, 0, 0);
    const art = panel.addComponent(Graphics); art.fillColor = new Color(8, 17, 23, 225);
    art.rect(-640, -295, 1280, 590); art.fill();
    const title = this.text('已暂停', 0, 95, 30, 600); title.node.setParent(panel);
    for (const [caption, y, action] of [
      ['继续游戏', 10, () => this.togglePause()],
      ['加载存档', -70, () => this.showSaves()],
    ] as [string, number, () => void][]) {
      const button = this.child(caption, 320, 60, 0, y, panel);
      const g = button.addComponent(Graphics); g.fillColor = new Color(44, 67, 58);
      g.roundRect(-160, -30, 320, 60, 8); g.fill();
      const label = this.text(caption, 0, 0, 23, 320); label.node.setParent(button);
      button.on(Node.EventType.TOUCH_END, action);
    }
    this.pausePanel = panel; panel.active = false;
  }
  private togglePause() {
    if (this.escape.caught || this.policeEscape.caught || this.dog.caught) return;
    this.saveList.active = false;
    this.paused = !this.paused; this.pausePanel.active = this.paused; this.releaseInputs();
  }
  private showSaves(page = 0) {
    this.paused = true; this.pausePanel.active = false; this.releaseInputs();
    const entries = this.archive.entries, pages = Math.max(1, Math.ceil(entries.length / 5));
    this.savePage = Math.max(0, Math.min(pages - 1, page));
    for (const child of [...this.saveList.children]) child.destroy();
    this.saveList.removeAllChildren(); this.saveList.active = true;
    const background = this.child('Save list background', 1280, 590, 0, 0, this.saveList);
    const art = background.addComponent(Graphics); art.fillColor = new Color(8, 17, 23, 245);
    art.rect(-640, -295, 1280, 590); art.fill();
    const heading = this.text('自动存档 · 左侧较早  ←  游戏进度  →  右侧较新', 0, 245, 24, 1050); heading.node.setParent(this.saveList);
    const pageEntries = entries.slice(this.savePage * 5, this.savePage * 5 + 5);
    pageEntries.forEach((entry, i) => {
      const x = -500 + i * 250;
      const button = this.child('Load ' + entry.name, 220, 190, x, 20, this.saveList);
      const g = button.addComponent(Graphics); g.fillColor = new Color(35, 56, 49);
      g.roundRect(-110, -95, 220, 190, 8); g.fill();
      const date = entry.createdAt === null ? '旧存档 · 时间未知' : new Date(entry.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Tokyo', hour12: false });
      const index = this.savePage * 5 + i + 1;
      const label = this.text(`#${index}\n${entry.name}`, 0, 35, 19, 205); label.node.setParent(button);
      const time = this.text(date, 0, -62, 12, 205); time.node.setParent(button);
      button.on(Node.EventType.TOUCH_END, () => this.loadEntry(entry));
    });
    for (const [caption, x, action] of [
      ['上一页', -310, () => this.showSaves(this.savePage - 1)],
      [`${this.savePage + 1} / ${pages} · 返回`, 0, () => { this.saveList.active = false; this.paused = !(this.escape.caught || this.policeEscape.caught || this.dog.caught); this.pausePanel.active = this.paused; }],
      ['下一页', 310, () => this.showSaves(this.savePage + 1)],
    ] as [string, number, () => void][]) {
      const label = this.text(caption, x, -245, 20, 260); label.node.setParent(this.saveList);
      label.node.on(Node.EventType.TOUCH_END, action);
    }
  }
  private reset() {
    const latest = this.archive.entries[this.archive.entries.length - 1];
    if (latest) this.loadEntry(latest);
  }
  private retryCurrentLevel() {
    const checkpoint: Checkpoint = this.dog.caught ? 'dog-approach' : this.policeEscape.caught ? 'police-approach' : 'patrol-approach';
    const progress = {
      ...this.world.save(), checkpoint,
      night: this.savedNight, escaped: this.escape.cleared,
      policeCleared: this.policeEscape.cleared, alarm: this.alarmTriggered,
    };
    this.world.restore(progress);
    this.escape.reset(); this.escape.cleared = progress.escaped;
    this.policeEscape.reset(); this.policeEscape.cleared = progress.policeCleared;
    this.paused = false; this.saveList.active = this.pausePanel.active = this.caughtPanel.active = false;
    this.facing = 1; this.cameraOffset = Math.max(-3750, this.world.x - 100);
    this.releaseInputs(); this.cover.reset(); this.policeCover.reset(); this.pushPull.reset(); this.animation.reset();
    this.saved = JSON.stringify(progress);
    this.cameraLift = cameraHeight(0, this.world.y, 1);
    this.animateCharacter(0); this.place();
  }
  private loadEntry(entry: AutoSave) {
    const save = entry.progress;
    this.world.restore(save); this.night = this.savedNight = save.night;
    this.escape.reset(); this.escape.cleared = save.escaped; this.policeEscape.reset(); this.policeEscape.cleared = save.policeCleared === true; this.alarmTriggered = save.alarm || save.checkpoint === 'reclamation' || save.checkpoint === 'factory-escape';
    this.paused = false; this.saveList.active = this.pausePanel.active = this.caughtPanel.active = false;
    this.facing = 1; this.cameraOffset = Math.max(-3750, this.world.x - 100);
    this.releaseInputs(); this.cover.reset(); this.policeCover.reset(); this.pushPull.reset(); this.animation.reset();
    // Keep later slots visible until a new milestone branches forward from this save.
    this.archive.activeId = entry.id; this.saved = JSON.stringify(save); this.writeArchive();
    this.cameraLift = cameraHeight(0, this.world.y, 1);
    this.animateCharacter(0); this.place();
  }
  private writeArchive() {
    try { sys.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(this.archive)); this.storageFailed = false; }
    catch { this.storageFailed = true; }
  }
  private persist() {
    if (this.previewMode) return;
    if (this.escape.active || this.policeEscape.active || this.escape.caught || this.policeEscape.caught || this.dog.caught || (this.dog.active && !this.dog.cleared) || this.boxPuzzle.moving) return;
    const progress = { ...this.world.save(), night: this.savedNight, escaped: this.escape.cleared, policeCleared: this.policeEscape.cleared, alarm: this.alarmTriggered };
    const previous = readProgress(this.saved);
    // Save meaningful story milestones, not every lighting interpolation frame.
    if (previous && sameMilestone(previous, progress)) return;
    this.archive = upsertAutosave(this.archive, progress, Date.now());
    this.saved = JSON.stringify(progress); this.writeArchive(); this.saveNotice = 2;
  }
  private setupSluiceAudio() {
    this.barkSound = this.node.addComponent(AudioSource); this.barkSound.loop = true;
    this.barkSound.playOnAwake = false; this.barkSound.volume = 0;
    resources.load('audio/guard-dog-bark', AudioClip, (error, clip) => {
      if (this.isValid && !error) this.barkClip = clip;
    });
    this.factorySound = this.node.addComponent(AudioSource); this.factorySound.loop = true;
    this.factorySound.playOnAwake = false; this.factorySound.volume = 0;
    this.alarmSound = this.node.addComponent(AudioSource); this.alarmSound.loop = true;
    this.alarmSound.playOnAwake = false; this.alarmSound.volume = 0;
    resources.load('audio/reclamation-machinery', AudioClip, (error, clip) => {
      if (!this.isValid || error) return; this.factoryClip = clip; this.unlockAudio(false);
    });
    resources.load('audio/reclamation-alarm', AudioClip, (error, clip) => {
      if (!this.isValid || error) return; this.alarmClip = clip; this.unlockAudio(false);
    });
    this.siren = this.node.addComponent(AudioSource); this.siren.loop = true;
    this.siren.playOnAwake = false; this.siren.volume = 0;
    resources.load('audio/distant-siren', AudioClip, (error, clip) => {
      if (!this.isValid || error) return;
      this.sirenClip = clip; this.unlockAudio(false);
    });
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
    for (const [source, clip] of [[this.factorySound, this.factoryClip], [this.alarmSound, this.alarmClip]] as [AudioSource, AudioClip | null][]) {
      if (this.audioUnlocked && clip && !source.playing) { source.clip = clip; source.play(); }
    }
    if (this.audioUnlocked && this.sirenClip && !this.siren.playing) {
      this.siren.clip = this.sirenClip; this.siren.play();
    }
    if (this.audioUnlocked && this.waterClip && !this.waterSound.playing) {
      this.waterSound.clip = this.waterClip; this.waterSound.play();
    }
  }
  private up(e: EventKeyboard) { this.keys.delete(e.keyCode); }
  update(delta: number) {
    if (this.paused) return;
    const dt = Math.min(delta, .25); this.time += dt;
    const direction = this.touchDirection || Number(this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT)) - Number(this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT));
    if (direction) this.facing = direction;
    const underCover = (!this.escape.cleared && this.cover.contains(this.world.x, this.world.grounded)) ||
      (!this.policeEscape.cleared && this.policeCover.contains(this.world.x, this.world.grounded));
    const recovery = this.world.recoverySerial;
    if (this.escape.caught || this.policeEscape.caught || this.dog.caught) this.world.vx = 0;
    else this.world.step(dt, direction * (underCover ? .5 : 1), !underCover && (this.touchRun || this.keys.has(KeyCode.SHIFT_LEFT) || this.keys.has(KeyCode.SHIFT_RIGHT)), this.touchGrab || this.keys.has(KeyCode.KEY_E));
    if (this.world.recoverySerial !== recovery) { this.releaseInputs(); this.dog.reset(this.world.checkpoint === 'dog-cleared'); }
    this.dog.step(dt, this.world.x, this.world.y, this.world.grounded);
    const ridingRiver = this.world.checkpoint === 'river-approach' && (this.river.isOnBoat(this.world.x) || this.river.isOnRamp(this.world.x));
    if (ridingRiver && this.dog.catRescued) { this.dog.catX = this.world.x - 54; this.dog.catY = this.world.y + 2; }
    if (this.dog.cleared && this.world.checkpoint === 'dog-approach') this.world.checkpoint = 'dog-cleared';
    if (this.dog.barking && this.audioUnlocked && this.barkClip && !this.barkSound.playing) {
      this.barkSound.clip = this.barkClip; this.barkSound.play();
    }
    if (!this.dog.barking && this.barkSound.playing) this.barkSound.stop();
    this.barkSound.volume = this.dog.barking ? .55 * Math.max(0, 1 - Math.abs(this.world.x - this.dog.x) / 950) : 0;
    this.escape.step(dt, this.cover.contains(this.world.x, this.world.grounded), this.world.x >= COVER.left);
    this.policeEscape.step(dt, this.policeCover.contains(this.world.x, this.world.grounded), this.world.x >= POLICE_COVER.left);
    if (this.escape.caught || this.policeEscape.caught || this.dog.caught) {
      this.caughtReason.string = this.dog.caught ? '失败原因：被追犬追上' : this.policeEscape.caught ? '失败原因：被警车发现' : '失败原因：被园区岗哨发现';
      this.caughtDescription.string = this.dog.caught ? '没有及时跃过断口，追犬追上了机器人。' : this.policeEscape.caught ? '离开路边树的遮挡范围时，进入了警车的搜寻视线。' : '离开树的遮挡范围时，进入了园区岗哨的视线。';
      this.releaseInputs(); this.caughtPanel.active = true;
    }
    if (this.escape.cleared && this.world.checkpoint === 'patrol-approach') this.world.checkpoint = 'patrol-cleared';
    if (this.policeEscape.cleared && this.world.checkpoint === 'police-approach') this.world.checkpoint = 'police-cleared';
    if (this.world.x >= -1040) this.alarmTriggered = true;
    const factoryVolume = Math.max(0, Math.min(1, (-this.world.x - 500) / 1000)) * .32;
    const alarmVolume = this.alarmTriggered ? Math.max(0, 1 - Math.max(0, this.world.x + 3200) / 2200) * .3 : 0;
    this.factorySound.volume += (factoryVolume - this.factorySound.volume) * Math.min(1, dt * 3);
    this.alarmSound.volume += (alarmVolume - this.alarmSound.volume) * Math.min(1, dt * 3);
    this.saveNotice = Math.max(0, this.saveNotice - dt);
    const target = Math.max(-3750, this.world.x - 100);
    this.cameraOffset += (target - this.cameraOffset) * (1 - Math.exp(-dt * 3));
    this.cameraLift = cameraHeight(this.cameraLift, this.world.y, dt);
    const proximity = Math.max(0, 1 - Math.abs(this.world.x - 1500) / 1000);
    const volume = this.world.opened ? proximity * (this.world.fill < 1 ? .4 : .16) : proximity * .035;
    this.waterSound.volume += (volume - this.waterSound.volume) * Math.min(1, dt * 3);
    const progress = Math.max(0, Math.min(1, (this.world.x - 1950) / 1300));
    this.night = Math.max(this.night, progress * progress * (3 - 2 * progress));
    if (this.night - this.savedNight >= .02 || (this.night === 1 && this.savedNight < 1)) {
      this.savedNight = this.night;
    }
    this.persist();
    const sirenVolume = (1 - this.policeEscape.departure) * this.night * .24 * Math.max(0, 1 - Math.abs(this.world.x - POLICE_COVER.treeX) / 1500);
    this.siren.volume += (sirenVolume - this.siren.volume) * Math.min(1, dt * 2);
    this.animateCharacter(this.escape.caught || this.policeEscape.caught || this.dog.caught ? 0 : dt);
    if (!this.failed && !this.pending) this.status.string = this.storageFailed ? 'Checkpoint kept for this session · local storage unavailable' : this.saveNotice > 0 ? '已自动保存' : '';
    const nearPress = this.pressPuzzle.canGrab(this.world.x, this.world.y, this.world.grounded);
    const nearBox = this.boxPuzzle.canGrab(this.world.x, this.world.y, this.world.grounded);
    const nearCityProp = this.cityStories.canGrab(this.world.x, this.world.grounded, false);
    const nearPump = this.world.grounded && Math.abs(this.world.x - CITY_STORY.pump.switchX) < 95 && !this.cityStories.pumpOn;
    const atPressurePlate = this.world.grounded && Math.abs(this.world.x - this.pressPuzzle.plateX) < 58 && Math.abs(this.world.y - this.pressPuzzle.layout.floor) < 5;
    const atRiver = this.world.checkpoint === 'river-approach';
    const onBoat = atRiver && this.river.isOnBoat(this.world.x);
    const onLanding = atRiver && this.river.isOnRamp(this.world.x);
    this.leverPrompt.string = atRiver ? onBoat ? '已上船 · 按住 → 划向对岸' : onLanding ? '抵达对岸 · 向右下船' : '走上渡船 · 按住 → 划过河道' : nearCityProp || nearPump ? 'E' : nearPress ? '按住 E / 交互键 · 推箱压住压力板' : atPressurePlate && !this.pressPuzzle.solved ? '踩住压力板启动检修桥，再用箱子压住它' : nearBox ? '按住 E / 交互键 · 左右推拉' : this.world.canInteract ? 'E · OPEN THE SLUICE' : '';
    this.leverPrompt.node.getComponent(UITransform)!.setContentSize(380, 48);
    const cityPropX = Math.abs(this.world.x - this.cityStories.rationBox) < 170 ? this.cityStories.rationBox : Math.abs(this.world.x - this.cityStories.battery) < 170 ? this.cityStories.battery : this.cityStories.waterBowl;
    const promptX = atRiver ? this.world.x + 110 : nearCityProp ? cityPropX : nearPump ? CITY_STORY.pump.switchX : nearPress ? this.pressPuzzle.crateX : atPressurePlate ? this.pressPuzzle.plateX : nearBox ? this.boxPuzzle.x : CHANNEL.leverX;
    const promptY = atRiver ? this.world.y + 126 : nearCityProp || nearPump ? roadHeight(promptX) + 145 : nearPress || atPressurePlate ? this.pressPuzzle.layout.floor + 125 : nearBox ? this.boxPuzzle.layout.floor + 140 : CHANNEL.near + 112;
    this.leverPrompt.node.setPosition(promptX - this.cameraOffset, promptY, 0);
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
    const palette = [
      { x: -1500, earth: [43, 42, 39], edge: [92, 80, 65] },
      { x: -600, earth: [66, 51, 39], edge: [115, 84, 56] },
      { x: 8200, earth: [66, 51, 39], edge: [115, 84, 56] },
      { x: 11800, earth: [49, 45, 41], edge: [119, 87, 62] },
      { x: 15500, earth: [41, 54, 42], edge: [82, 119, 72] },
      { x: 17000, earth: [47, 69, 43], edge: [99, 145, 78] },
    ];
    let before = palette[0], after = palette[palette.length - 1];
    for (let i = 1; i < palette.length; i++) {
      if (this.world.x <= palette[i].x) { before = palette[i - 1]; after = palette[i]; break; }
    }
    const blend = Math.max(0, Math.min(1, (this.world.x - before.x) / (after.x - before.x)));
    const mix = (a: number, b: number) => Math.round(a + (b - a) * blend);
    const color = (a: number[], b: number[]) => new Color(mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2]));
    const earth = color(before.earth, after.earth), grass = color(before.edge, after.edge), stone = new Color(53, 64, 54);
    rect(viewLeft, -420, Math.max(0, Math.min(c.left, viewRight) - viewLeft), c.near + 420, earth);
    const farLeft = Math.max(c.right, viewLeft);
    if (viewRight > farLeft) {
      const points = [farLeft, ROAD.descentStart, ROAD.descentEnd, this.dog.gapLeft, this.dog.gapRight, viewRight]
        .filter(x => x >= farLeft && x <= viewRight).sort((a, b) => a - b);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if (a >= this.dog.gapLeft && b <= this.dog.gapRight) continue;
        g.fillColor = earth; g.moveTo(a - this.cameraOffset, -420); g.lineTo(a - this.cameraOffset, roadHeight(a));
        g.lineTo(b - this.cameraOffset, roadHeight(b)); g.lineTo(b - this.cameraOffset, -420); g.close(); g.fill();
        line(a, roadHeight(a), b, roadHeight(b), grass, 4);
      }
    }
    rect(c.left, -420, c.right - c.left, c.bed + 420, stone);
    if (viewLeft < c.left) line(viewLeft, c.near, Math.min(c.left, viewRight), c.near, grass, 4);
    // Masonry, mineral waterline and guide posts explain the former water level.
    for (let y = -250; y < 40; y += 28) {
      line(c.right, y, c.right + 65, y + 2, new Color(75, 85, 69));
    }
    line(c.left, c.logHigh - 17, c.right, c.logHigh - 17, new Color(125, 132, 101, 110), 3);
    for (const x of [c.logLeft + 15, c.logRight - 15]) rect(x, c.bed, 9, 230, new Color(65, 73, 54));
    // Fence fragments continue beyond the puzzle without a level-end screen.
    for (let x = Math.max(1080, Math.floor(viewLeft / 160) * 160); x < viewRight; x += 160) {
      if (x > 1340 && x < 1850 || x < this.dog.gapRight + 20 && x + 100 > this.dog.gapLeft - 20) continue;
      const floor = x < c.left ? c.near : roadHeight(x);
      rect(x, floor, 7, 67, new Color(71, 76, 58));
      line(x, floor + 45, x + 100, (x + 100 < c.left ? c.near : roadHeight(x + 100)) + 38, new Color(76, 81, 61), 4);
    }
    // Old service pipes and a roofless maintenance shelter, reclaimed by vines.
    const metal = new Color(62, 79, 76), rust = new Color(110, 83, 61);
    for (const x of [360, 820, 1930, 2380, 2850]) {
      const floor = x < c.left ? c.near : roadHeight(x);
      line(x, floor + 17, x + 125, floor + 17, metal, 15);
      line(x + 125, floor + 17, x + 125, floor + 53, metal, 15);
      for (const offset of [12, 58, 106]) {
        line(x + offset, floor + 8, x + offset, floor + 26, rust, 3);
      }
      for (let i = 0; i < 7; i++) {
        const vx = x + i * 18;
        line(vx, floor, vx + 12, floor + 30, new Color(56, 88, 68), 3);
        line(vx + 7, floor + 16, vx - 1, floor + 22, grass, 3);
      }
    }
    rect(960, c.near, 12, 125, metal); rect(1130, c.near, 12, 103, metal);
    line(953, c.near + 125, 1050, c.near + 130, metal, 8);
    line(1070, c.near + 127, 1150, c.near + 107, metal, 7);
    rect(988, c.near + 18, 60, 65, metal);
    rect(997, c.near + 50, 42, 22, new Color(28, 44, 42));
    for (let i = 0; i < 5; i++) {
      line(960 + i * 7, c.near + 125, 975 + i * 9, c.near + 55 - i * 6, grass, 2);
    }
    // Bank lamp slowly warms as the canal fills; restored saves retain the light.
    const lampX = c.right + 100, lampY = c.far + 128;
    rect(lampX - 3, c.far, 6, 128, metal);
    line(lampX, lampY, lampX - 25, lampY, metal, 5);
    rect(lampX - 34, lampY - 20, 20, 20, new Color(36, 49, 46));
    const light = this.world.fill;
    if (light > 0) {
      for (let radius = 48; radius >= 12; radius -= 12) {
        g.fillColor = new Color(242, 192, 106, Math.round(light * 10));
        g.circle(lampX - 24 - this.cameraOffset, lampY - 10, radius); g.fill();
      }
    }
    rect(lampX - 30, lampY - 16, 12, 12, new Color(110 + Math.round(134 * light), 111 + Math.round(90 * light), 79 + Math.round(47 * light)));
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
    const vegetation = Math.max(0, Math.min(1, (this.world.x - 10500) / 4500));
    const sproutColor = color(before.edge, [105, 157, 83]);
    for (let x = Math.floor(viewLeft / 31) * 31; x < viewRight && vegetation > .04; x += 31) {
      if (x > c.left - 20 && x < c.right + 20 || x > this.dog.gapLeft - 20 && x < this.dog.gapRight + 20) continue;
      if (Math.abs(Math.sin(x * .1)) > vegetation) continue;
      const y = x <= c.left ? c.near : roadHeight(x);
      line(x, y, x + 4, y + (7 + Math.sin(x) * 3) * vegetation, sproutColor, 1);
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
    this.sceneRoot.setPosition(0, -this.cameraLift, 0);
    for (const backdrop of this.journeyBackdrops) {
      backdrop.sprite.color = new Color(255, 255, 255, this.backdropAlpha(this.world.x, backdrop.start, backdrop.end, backdrop.fade));
      // Full-screen paintings stay in camera space; world parallax would move them offscreen.
      backdrop.node.setPosition(0, this.cameraLift, 0);
    }
    this.drawCanal();
    const onBoat = this.world.checkpoint === 'river-approach' && this.river.isOnBoat(this.world.x);
    const onLanding = this.world.checkpoint === 'river-approach' && this.river.isOnRamp(this.world.x);
    const boatX = onBoat ? this.world.x + 25 : onLanding || this.world.checkpoint === 'river-cleared' ? this.river.landingBoatX : this.river.launchBoatX;
    drawRiverCrossing(this.riverArt, this.river, this.cameraOffset, this.time, boatX);
    this.riverSign.node.active = Math.abs(this.world.x - this.river.layout.origin) < 700;
    if (this.riverSign.node.active) this.riverSign.node.setPosition(this.river.layout.origin + 360 - this.cameraOffset, 190, 0);
    this.drawCoverTree(this.coverTree, COVER); this.drawCoverTree(this.policeCoverTree, POLICE_COVER);
    drawGuardPostSearch(this.guardPost, this.cameraOffset, this.time);
    this.guardPostSign.node.setPosition((GUARD_POST.x - this.cameraOffset) * .55, 260, 0);
    drawDogGap(this.dogArt, this.dog, this.cameraOffset);
    drawScrapYard(this.scrapArt, this.cameraOffset, this.time);
    this.scrapSign.node.setPosition(SALVAGE.origin + 500 - this.cameraOffset, 255, 0);
    this.beaconSign.node.setPosition(SALVAGE.beacon - this.cameraOffset, 142, 0);
    this.dogNode.active = this.dog.active && this.dogPoses.length === 8;
    if (this.dogNode.active) {
      this.dogNode.getComponent(Sprite)!.spriteFrame = this.dogPoses[this.dog.frame];
      this.dogNode.getComponent(UITransform)!.setAnchorPoint(.5, this.dog.barking ? .15 : .21);
      this.dogNode.setPosition(this.dog.x - this.cameraOffset, this.dog.layout.floor, 0);
    }
    drawCatRescueProps(this.catPropsArt, this.dog, this.cameraOffset);
    this.catNode.active = this.catPoses.length === 8;
    if (this.catNode.active) {
      this.catNode.getComponent(Sprite)!.spriteFrame = this.catPoses[this.dog.catFrame];
      this.catNode.getComponent(UITransform)!.setAnchorPoint(.5, .09);
      const inScavengerStory = this.world.x >= CITY_STORY.cat.bowl - 450 && this.world.x <= CITY_STORY.cat.gate + 150;
      const storyCatX = this.cityStories.catSolved ? CITY_STORY.cat.survivorX - 40 : CITY_STORY.cat.catX;
      this.catNode.setPosition((inScavengerStory ? storyCatX : this.dog.catX) - this.cameraOffset, inScavengerStory ? roadHeight(storyCatX) : this.dog.catY, 0);
    }
    drawPushBox(this.boxArt, this.boxPuzzle, this.cameraOffset);
    drawIndustrialPress(this.pressArt, this.pressPuzzle, this.cameraOffset, this.time);
    this.pressSign.node.active = Math.abs(this.world.x - this.pressPuzzle.plateX) < 700;
    if (this.pressSign.node.active) this.pressSign.node.setPosition(this.pressPuzzle.layout.origin + 470 - this.cameraOffset, 255, 0);
    this.prisonSign.node.setPosition((this.boxPuzzle.wallX + this.boxPuzzle.wallEndX) / 2 - this.cameraOffset - 4, this.boxPuzzle.layout.floor + 113, 0);
    this.opening.node.setPosition(-this.cameraOffset, 0, 0);
    drawReclamationOpening(this.opening, this.time, this.alarmTriggered);
    const panicActive = this.world.checkpoint === 'reclamation' || this.world.checkpoint === 'factory-escape';
    this.factoryPanicArt.node.active = panicActive;
    if (panicActive) drawFactoryPanic(this.factoryPanicArt, this.time, this.cameraOffset);
    const panicProgress = Math.max(0, this.world.x - FACTORY_PANIC_LAYOUT.startX);
    this.factoryRunners.forEach((runner, i) => {
      const x = FACTORY_PANIC_LAYOUT.runnerStartX + i * FACTORY_PANIC_LAYOUT.runnerSpacing + panicProgress * FACTORY_PANIC_LAYOUT.runnerSpeedRatio;
      const fall = Math.max(0, Math.min(1, (x - FACTORY_PANIC_LAYOUT.pitStart) / (FACTORY_PANIC_LAYOUT.pitEnd - FACTORY_PANIC_LAYOUT.pitStart)));
      const visible = panicActive && x < FACTORY_PANIC_LAYOUT.pitEnd + 18;
      runner.active = visible;
      if (!visible) return;
      const sprite = runner.getComponent(Sprite)!;
      sprite.spriteFrame = this.poses[16 + (Math.floor(this.time * 13 + i * 1.7) % 8)];
      sprite.color = new Color(178, 168, 142, Math.round(230 * (1 - fall * .72)));
      runner.setPosition(x - this.cameraOffset, FACTORY_PANIC_LAYOUT.beltY - fall * 230, 0);
      runner.setRotationFromEuler(0, 0, -fall * 78);
    });
    const signsX = [-1960, -2340, -1210], signsY = [115, 110, 70];
    this.openingSigns.forEach((n, i) => n.setPosition(signsX[i] - this.cameraOffset, signsY[i], 0));
    this.dormantRobots.forEach((n, i) => n.setPosition([-2250, -2150, -1850][i] - this.cameraOffset, CHANNEL.near, 0));
    drawNightSearch(this.search, this.cameraOffset, this.time, this.night, this.policeEscape.departure, POLICE_COVER.treeX);
    drawJourneyStoryArt(this.journeyStoryArt, this.cameraOffset, this.time);
    drawCityStories(this.cityStoryArt, this.cityStories, this.cameraOffset, this.time);
    for (const clue of this.journeyClues) {
      const visible = Math.abs(this.world.x - clue.x) < clue.range;
      clue.node.active = visible;
      if (visible) clue.node.setPosition(clue.x - this.cameraOffset, clue.y, 0);
    }
    const survivorX = CITY_STORY.cat.survivorX, survivorFloor = roadHeight(survivorX);
    const survivorVisible = Math.abs(this.world.x - survivorX) < 820;
    this.scavengerNode.active = survivorVisible;
    this.flyArt.node.active = survivorVisible;
    this.scavengerNode.setPosition(survivorX - this.cameraOffset, survivorFloor, 0);
    this.flyArt.node.setPosition(survivorX - this.cameraOffset + 75, survivorFloor + 142, 0);
    this.flyArt.clear();
    if (survivorVisible) {
      this.flyArt.fillColor = new Color(22, 24, 20, 225);
      for (let i = 0; i < 5; i++) {
        const angle = this.time * (1.8 + i * .13) + i * 1.27;
        this.flyArt.circle(Math.cos(angle) * (13 + i % 2 * 8), Math.sin(angle * 1.3) * 9, 2 + (i % 2));
        this.flyArt.fill();
      }
    }
    this.actor.setPosition(this.world.x - this.cameraOffset, foot + (onBoat ? -14 : this.poses.length ? 0 : 38), 0); this.actor.setScale(this.facing, this.breathScaleY, 1);
    this.actor.setRotationFromEuler(0, 0, 0);
    drawRiverBoatFront(this.riverFrontArt, this.river, this.cameraOffset, this.time, this.world.x, onBoat);
    for (const l of this.layers) {
      let drift = l.drift ? ((l.x + 760 + this.time * l.drift) % 1520 + 1520) % 1520 - 760 - l.x : 0;
      let layerX = l.x - this.cameraOffset * l.parallax + drift;
      if (l.node.name.indexOf('continuation') >= 0) {
        const span = l.node.name.indexOf('Forest') === 0 ? 4200 : 3300;
        layerX = ((layerX + 720) % span + span) % span - 720;
      }
      l.node.setPosition(layerX, l.y + (l.node.name === 'Sky' ? this.cameraLift : 0) + (l.bird ? Math.sin(this.time * 1.4 + l.phase) * 18 : 0), 0);
      if (l.bird) { l.node.setScale(1, .8 + Math.sin(this.time * 9 + l.phase) * .2, 1); l.node.setRotationFromEuler(0, 0, Math.sin(this.time * 2 + l.phase) * 5); }
    }
  }
}
