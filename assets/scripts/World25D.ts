import { CAMERA_ELEVATION, CAMERA_HEIGHT, CAMERA_Z, backdropHeight } from './WorldCamera';
import { ActorModelKit, Animal3D, Robot3D } from './Actors3D';
import { Camera, Color, DirectionalLight, EffectAsset, gfx, Graphics, Layers, Material, Mesh, MeshRenderer, Node, Label, Sprite, SpriteFrame, UITransform, utils, Vec3, Vec4 } from 'cc';
import { CHANNEL, ROAD, ROOM, roadHeight, SALVAGE, SluiceWorld } from './SluiceWorld';
import { PushBoxSegment } from './PushBoxSegment';
import { FactoryEscapePuzzle, FACTORY_ESCAPE_LAYOUT } from './FactoryEscapePuzzle';
import { DISMANTLE_ROOM, FactoryDismantle } from './FactoryDismantle';
import { IndustrialPressSegment, drawIndustrialPress } from './IndustrialPressSegment';
import { CityStoryLevels, CITY_STORY, drawCityStories } from './CityStoryLevels';
import { DogChaseSegment } from './DogChaseSegment';
import { RiverCrossing, drawRiverCrossing } from './RiverCrossing';
import { SearchEscape } from './SearchEscape';
import { COVER, POLICE_COVER, GUARD_POST } from './TreeCover';
import { drawPushBox } from './PushBoxArt';
import { drawCatRescueProps } from './DogGapArt';
import { drawJourneyStoryArt, drawRoadsideCharacters } from './JourneyStoryArt';
import { drawReclamationOpening, drawFactoryPanic, FACTORY_PANIC_LAYOUT } from './ReclamationOpening';
import { batchRunnerPosition, BATCH_REVEAL_LAYOUT, drawScrapYard } from './ScrapYardArt';
import { drawGuardPostSearch } from './GuardPostArt';
import { GeometryBatch, VectorWorldGraphics, WorldGeometry, WORLD_SCALE as S } from './WorldGeometry';
const BLOCKING_WALL_DEPTH = 14;
const PRISON_WALL_DEPTH = 40;
type Backdrop = {
    node: Node;
    sprite: Sprite;
    start: number;
    end: number;
    fade: number;
};
export type World25DState = {
    world: SluiceWorld;
    box: PushBoxSegment;
    factory: FactoryEscapePuzzle;
    dismantle: FactoryDismantle;
    press: IndustrialPressSegment;
    river: RiverCrossing;
    dog: DogChaseSegment;
    city: CityStoryLevels;
    escape: SearchEscape;
    police: SearchEscape;
    scavenger: Node;
    backdrops: Backdrop[];
    cover: boolean;
    gripping: boolean;
    time: number;
    night: number;
    alarm: boolean;
    facing: number;
    cameraX: number;
    prompt: Node;
    dismantleSign: Node;
    openingSigns: Node[];
    prisonSign: Node;
    pressSign: Node;
    riverSign: Node;
    scrapSign: Node;
    beaconSign: Node;
    guardSign: Node;
    clues: {
        node: Node;
        x: number;
        y: number;
        range: number;
    }[];
};
type Card = {
    node: Node;
    material: Material;
    renderer: MeshRenderer;
    mesh?: Mesh;
    key: string;
};
/** Campaign renderer. The original world simulation remains the single source of collision/save state. */
export class World25D {
    private root = new Node('Campaign 2.5D world');
    private camera!: Camera;
    private oldCamera: Node | null;
    private oldLight: Node | null;
    private opaque: Material;
    private translucent: Material;
    private batches = new Map<string, GeometryBatch>();
    private cards = new Map<string, Card>();
    private kit: ActorModelKit;
    private robot!: Robot3D;
    private dogModel!: Animal3D;
    private catModel!: Animal3D;
    private robotCopies = new Map<string, Robot3D>();
    private captions = new Node('Projected world captions');
    private clock = -1;
    private cameraY = 0;
    private previousX = Infinity;
    private lastArt = -10;
    private lastTerrainX = Infinity;
    private canvas: Node;
    private tint = new Color(255, 255, 255);
    private worldPoint = new Vec3();
    private uiPoint = new Vec3();
    constructor(canvas: Node, actorEffect: EffectAsset) {
        this.kit = new ActorModelKit(actorEffect);
        this.canvas = canvas;
        this.root.setParent(canvas.scene);
        this.captions.setParent(canvas);
        this.captions.layer = canvas.layer;
        this.captions.setSiblingIndex(2);
        this.oldLight = canvas.scene.getChildByName('Main Light');
        if (this.oldLight)
            this.oldLight.active = false;
        this.oldCamera = canvas.scene.getChildByName('Main Camera');
        if (this.oldCamera)
            this.oldCamera.active = false;
        const n = new Node(`Campaign camera · ${CAMERA_ELEVATION} degree elevation`);
        n.setParent(this.root);
        this.camera = n.addComponent(Camera);
        this.camera.projection = Camera.ProjectionType.PERSPECTIVE;
        this.camera.fov = 43;
        this.camera.near = .1;
        this.camera.far = 200;
        this.camera.priority = 0;
        this.camera.visibility = Layers.Enum.DEFAULT;
        this.camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        this.camera.clearColor = new Color(33, 45, 49);
        this.camera.node.setRotationFromEuler(-CAMERA_ELEVATION, 0, 0);
        this.opaque = this.vertexMaterial(false);
        this.translucent = this.vertexMaterial(true);
        this.robot = new Robot3D(this.root, this.kit);
        this.dogModel = new Animal3D(this.root, this.kit);
        this.catModel = new Animal3D(this.root, this.kit, true);
        const light = new Node('Soft directional actor lighting');
        light.setParent(this.root);
        light.setRotationFromEuler(-48, -35, 0);
        const sun = light.addComponent(DirectionalLight);
        sun.color = new Color(237, 222, 191);
        sun.illuminance = 70000;
    }
    private vertexMaterial(transparent: boolean) {
        const m = new Material();
        m.initialize({ effectName: 'builtin-unlit', technique: transparent ? 1 : 0, defines: { USE_VERTEX_COLOR: true }, states: { rasterizerState: { cullMode: gfx.CullMode.NONE }, depthStencilState: { depthWrite: !transparent } } });
        return m;
    }
    private batch(name: string, g: WorldGeometry, transparent = false) {
        let b = this.batches.get(name);
        if (!b) {
            b = new GeometryBatch(this.root, name, transparent ? this.translucent : this.opaque);
            this.batches.set(name, b);
        }
        b.commit(g);
    }
    private vector(name: string, s: World25DState, z: number, draw: (g: Graphics) => void, depth = .7, offsetX = 0, offsetY = 0) {
        const g = new VectorWorldGraphics(s.world.x, z, depth, offsetX, offsetY);
        draw(g.asGraphics());
        this.batch(name, g.geometry, true);
    }
    private card(name: string, frame: SpriteFrame | null, width: number, height: number, anchorX: number, anchorY: number, x: number, y: number, z: number, facing = 1, color = this.tint, tilt = -CAMERA_ELEVATION) {
        let card = this.cards.get(name);
        if (!card) {
            const node = new Node(name);
            node.setParent(this.root);
            node.layer = Layers.Enum.DEFAULT;
            const material = new Material();
            material.initialize({ effectName: 'builtin-unlit', technique: name.indexOf('Backdrop') === 0 ? 1 : 0, defines: { USE_TEXTURE: true, USE_ALPHA_TEST: true } });
            material.setProperty('alphaThreshold', .12);
            const renderer = node.addComponent(MeshRenderer);
            renderer.setMaterial(material, 0);
            card = { node, material, renderer, key: '' };
            this.cards.set(name, card);
        }
        card.node.active = !!frame && color.a > 2;
        if (!frame)
            return;
        const r = frame.rect, tex = frame.texture, flip = facing < 0;
        card.material.setProperty('mainTexture', tex);
        card.material.setProperty('mainColor', color);
        // Texture images use top-down V. Mirror UVs while keeping mesh winding stable.
        card.material.setProperty('tilingOffset', new Vec4((flip ? -r.width : r.width) / tex.width, -r.height / tex.height, (r.x + (flip ? r.width : 0)) / tex.width, (r.y + r.height) / tex.height));
        const ax = flip ? 1 - anchorX : anchorX, key = [width, height, ax, anchorY].join(':');
        if (card.key !== key) {
            const l = -ax * width, b = -anchorY * height;
            card.mesh = utils.createMesh({ positions: [l, b, 0, l + width, b, 0, l, b + height, 0, l + width, b + height, 0], uvs: [0, 0, 1, 0, 0, 1, 1, 1], indices: [0, 1, 2, 1, 3, 2] }, card.mesh);
            card.renderer.mesh = card.mesh;
            card.key = key;
        }
        card.node.setPosition(x, y, z);
        card.node.setRotationFromEuler(tilt, 0, 0);
    }
    private sprite(name: string, source: Node, x: number, y: number, z: number, visible = true, size?: number, frame?: SpriteFrame) {
        const sprite = source.getComponent(Sprite), ui = source.getComponent(UITransform);
        if (!sprite || !ui)
            return;
        const color = sprite.color.clone();
        if (!visible)
            color.a = 0;
        this.card(name, frame || sprite.spriteFrame, (size || ui.width) * S, (size || ui.height) * S, ui.anchorX, ui.anchorY, x * S, y * S, z, source.scale.x, color);
    }
    private caption(node: Node, x: number, y: number, z: number, visible: boolean) {
        if (node.parent !== this.captions)
            node.setParent(this.captions);
        node.active = visible;
        if (!visible)
            return;
        this.worldPoint.set(x * S, y * S, z);
        this.camera.convertToUINode(this.worldPoint, this.canvas, this.uiPoint);
        this.uiPoint.y = Math.max(-230, Math.min(220, this.uiPoint.y));
        node.setPosition(this.uiPoint);
    }
    render(s: World25DState) {
        const w = s.world, dt = this.clock < 0 ? 0 : Math.max(0, Math.min(.25, s.time - this.clock));
        this.clock = s.time;
        const teleport = Math.abs(w.x - this.previousX) > 1200;
        this.previousX = w.x;
        const targetY = Math.max(ROAD.floor, w.y - 95) * S;
        this.cameraY = teleport ? targetY : this.cameraY + (targetY - this.cameraY) * (1 - Math.exp(-dt * 7));
        this.camera.node.setPosition((s.cameraX + 100) * S, this.cameraY + CAMERA_HEIGHT, CAMERA_Z);
        for (const card of this.cards.values())
            card.node.active = false;
        for (let i = 0; i < s.backdrops.length; i++) {
            const b = s.backdrops[i], enter = w.x < b.start ? (w.x - b.start + b.fade) / b.fade : 1, leave = w.x > b.end ? (b.end + b.fade - w.x) / b.fade : 1;
            const alpha = Math.max(0, Math.min(1, enter, leave));
            // Distant paintings complement real foreground geometry rather than containing the walkable floor.
            this.card('Backdrop ' + i, b.sprite.spriteFrame, 150, 90, .5, .5, (s.cameraX + 100) * S, this.cameraY + backdropHeight(-68), -68, 1, new Color(210, 218, 207, alpha * 255));
        }
        const onBoat = w.checkpoint === 'river-approach' && s.river.isOnBoat(w.x);
        this.robot.pose({ x: w.x * S, y: w.y * S, z: .65, vx: w.vx, vy: w.vy, grounded: w.grounded, facing: s.facing, cover: s.cover, gripping: s.gripping, seated: onBoat, floor: (w.groundAt(w.x) ?? ROAD.floor) * S, dt });
        const dogZ = s.dog.cleared || s.dog.x >= s.dog.stopX - 1 ? .65 : .65 - Math.min(14, Math.max(0, Math.abs(w.x - s.dog.x) - 48) * .12);
        this.dogModel.active = s.dog.active;
        this.dogModel.pose(s.dog.x * S, s.dog.layout.floor * S, dogZ, s.dog.x > w.x ? -1 : 1, !s.dog.barking, s.dog.barking, s.dog.caught ? 0 : dt);
        const inCity = w.x >= CITY_STORY.cat.bowl - 450 && w.x <= CITY_STORY.cat.gate + 150;
        const catX = inCity ? (s.city.catSolved ? CITY_STORY.cat.survivorX - 40 : CITY_STORY.cat.catX) : s.dog.catX;
        this.catModel.active = Math.abs(w.x - catX) < 1400;
        this.catModel.pose(catX * S, (inCity ? roadHeight(catX) : s.dog.catY) * S, .9, s.facing, s.dog.catRescued, false, dt);
        this.sprite('Survivor and carrion', s.scavenger, CITY_STORY.cat.survivorX, ROAD.floor, -1.5, Math.abs(w.x - CITY_STORY.cat.survivorX) < 1400);
        [-2250, -2150, -1850].forEach((x, i) => this.robotCopy('Deactivated robot ' + i, x, CHANNEL.near, -2.5, Math.abs(w.x + 2050) < 1700, dt, true));
        const panic = ['reclamation', 'factory-solved', 'factory-escape'].indexOf(w.checkpoint) >= 0;
        const factoryRunnerX = s.factory.poweredOff ? s.factory.stopX : w.x;
        for (let i = 0; i < 5; i++) {
            const x = FACTORY_PANIC_LAYOUT.runnerStartX + i * FACTORY_PANIC_LAYOUT.runnerSpacing + Math.max(0, factoryRunnerX - FACTORY_PANIC_LAYOUT.startX) * FACTORY_PANIC_LAYOUT.runnerSpeedRatio;
            const fall = Math.max(0, Math.min(1, (x - FACTORY_PANIC_LAYOUT.pitStart) / (FACTORY_PANIC_LAYOUT.pitEnd - FACTORY_PANIC_LAYOUT.pitStart)));
            this.robotCopy('Factory runner ' + i, x, FACTORY_PANIC_LAYOUT.beltY + 28 - fall * 230, -4.5, panic && x < FACTORY_PANIC_LAYOUT.pitEnd + 18, dt, false, -fall * 78, s.factory.poweredOff ? 0 : 240);
        }
        for (let i = 0; i < 5; i++) {
            const b = batchRunnerPosition(s.time, i);
            this.robotCopy('Batch runner ' + i, b.x, b.y + 21, -4.5, w.checkpoint === 'batch-reveal' && b.visible, dt, false, b.y < BATCH_REVEAL_LAYOUT.beltY ? -38 : 0);
        }
        const terrainChanged = teleport || Math.abs(w.x - this.lastTerrainX) > 120;
        if (terrainChanged) {
            this.terrain(s);
            this.scenery(s);
            this.lastTerrainX = w.x;
        }
        this.dynamicSurfaces(s);
        if (teleport || s.time - this.lastArt > 1 / 30) {
            this.art(s);
            this.lastArt = s.time;
        }
        this.caption(s.prompt, w.x + 75, w.y + 150, .65, !!s.prompt.getComponent(Label)?.string);
        this.caption(s.prisonSign, (s.box.wallX + s.box.wallEndX) / 2, s.box.layout.floor + 113, .55, Math.abs(w.x - s.box.wallX) < 900);
        this.caption(s.pressSign, s.press.plateX, s.press.layout.floor + 340, -2, Math.abs(w.x - s.press.plateX) < 700);
        this.caption(s.riverSign, s.river.waterLeft + 250, 250, -4, Math.abs(w.x - s.river.approachX) < 950);
        this.caption(s.guardSign, GUARD_POST.x, roadHeight(GUARD_POST.x) + 250, -12, Math.abs(w.x - GUARD_POST.x) < 900);
        this.caption(s.scrapSign, SALVAGE.origin + 500, 255, -4, Math.abs(w.x - SALVAGE.origin - 500) < 1000);
        this.caption(s.beaconSign, SALVAGE.beacon, 142, -2, Math.abs(w.x - SALVAGE.beacon) < 700);
        this.caption(s.dismantleSign, DISMANTLE_ROOM.revealX, ROAD.floor + 262, -1, s.dismantle.solved && Math.abs(w.x - DISMANTLE_ROOM.revealX) < 1100);
        s.openingSigns.forEach((n, i) => this.caption(n, [-1960, -2340, -1210][i], [115, 110, 70][i], -5, Math.abs(w.x - [-1960, -2340, -1210][i]) < 1000));
        s.clues.forEach(c => this.caption(c.node, c.x, c.y, -1, Math.abs(w.x - c.x) < c.range));
    }
    private robotCopy(name: string, x: number, y: number, z: number, visible: boolean, dt: number, seated = false, tilt = 0, speed = 240) {
        let copy = this.robotCopies.get(name);
        if (!copy && visible) {
            copy = new Robot3D(this.root, this.kit, name);
            copy.node.setScale(.8, .8, .8);
            this.robotCopies.set(name, copy);
        }
        if (!copy)
            return;
        copy.active = visible;
        if (!visible)
            return;
        copy.pose({ x: x * S, y: y * S, z, vx: seated ? 0 : speed, vy: 0, grounded: true, facing: 1, cover: false, gripping: false, seated, floor: y * S, shadow: tilt === 0, dt });
        copy.node.setRotationFromEuler(0, 0, tilt);
    }
    private terrain(s: World25DState) {
        const g = new WorldGeometry(), w = s.world, left = Math.floor((w.x - 1800) / 40) * 40, right = w.x + 2200;
        const gaps = [CHANNEL.left, CHANNEL.right, s.dog.gapLeft, s.dog.gapRight, s.press.layout.origin + s.press.layout.gapLeft, s.press.layout.origin + s.press.layout.gapRight, s.river.waterLeft, s.river.waterRight];
        const mountainSamples: number[] = [];
        for (let x = Math.ceil(Math.max(left, ROAD.mountainStart) / 80) * 80; x < Math.min(right, ROAD.mountainDescentEnd); x += 80) mountainSamples.push(x);
        const boundaries = [left, right, ROAD.descentStart, ROAD.descentEnd, ROAD.mountainStart, ROAD.mountainPeakStart, ROAD.mountainPeakEnd, ROAD.mountainDescentEnd, FACTORY_PANIC_LAYOUT.pitStart, FACTORY_PANIC_LAYOUT.pitEnd, ...mountainSamples, ...gaps].filter(x => x >= left && x <= right).sort((a, b) => a - b);
        for (let i = 1; i < boundaries.length; i++) {
            const a = boundaries[i - 1], b = boundaries[i], mid = (a + b) / 2;
            if (mid > CHANNEL.left && mid < CHANNEL.right || mid > s.dog.gapLeft && mid < s.dog.gapRight || mid > s.press.layout.origin + s.press.layout.gapLeft && mid < s.press.layout.origin + s.press.layout.gapRight || mid > s.river.waterLeft && mid < s.river.waterRight)
                continue;
            const ay = a < CHANNEL.left ? CHANNEL.near : roadHeight(a), by = b <= CHANNEL.left ? CHANNEL.near : roadHeight(b);
            const mountain = mid >= ROAD.mountainStart - 400 && mid <= ROAD.mountainDescentEnd + 400;
            const indoors = mid >= ROOM.doorX + 45 && mid <= DISMANTLE_ROOM.endX + 80;
            const garden = mid > 14500 && !mountain;
            const color = indoors ? new Color(91, 75, 58) : mountain ? new Color(72, 72, 66) : garden ? new Color(65, 82, 59) : mid < -1050 ? new Color(56, 63, 59) : new Color(72, 75, 63);
            if (mid > FACTORY_PANIC_LAYOUT.pitStart && mid < FACTORY_PANIC_LAYOUT.pitEnd) {
                g.surface(a * S, b * S, ay * S, by * S, 45, -3, color);
                g.surface(a * S, b * S, ay * S, by * S, -6, -58, color);
            }
            else {
                g.surface(a * S, b * S, ay * S, by * S, 45, -58, color);
            }
            g.surface(a * S, b * S, ay * S + .012, by * S + .012, 2.15, -1.85, indoors ? new Color(174, 137, 90) : mountain ? new Color(145, 141, 124) : garden ? new Color(91, 105, 72) : new Color(103, 98, 79));
            for (let x = Math.ceil(a / 180) * 180; x < b; x += 180) {
                const y = x < CHANNEL.left ? CHANNEL.near : roadHeight(x);
                g.surface(x * S, (x + 1.4) * S, y * S + .018, y * S + .018, 2.15, -1.85, new Color(67, 74, 62));
            }
        }
        for (const [a, b, y] of [[s.dog.gapLeft, s.dog.gapRight, -650], [s.press.layout.origin + s.press.layout.gapLeft, s.press.layout.origin + s.press.layout.gapRight, -350]])
            g.surface(a * S, b * S, y * S, y * S, 45, -58, new Color(16, 30, 31));
        // Canal-side remnants are physical pipework rather than a painted soil section.
        for (const x of [360, 820, 1930, 2380, 2850]) {
            const floor = (x < CHANNEL.left ? CHANNEL.near : roadHeight(x)) * S;
            g.box((x + 62) * S, floor + .4, -1.4, 125 * S, .28, .28, new Color(65, 83, 76));
            g.box((x + 125) * S, floor + .85, -1.4, .28, .9, .28, new Color(65, 83, 76));
            for (const offset of [12, 58, 106])
                g.box((x + offset) * S, floor + .4, -1.4, .07, .4, .4, new Color(110, 83, 61));
        }
        const lampX = (CHANNEL.right + 100) * S, floor = CHANNEL.far * S;
        g.box(lampX, floor + 1.6, -2, .12, 3.2, .12, new Color(61, 77, 68));
        g.box(lampX - .3, floor + 3.2, -2, .7, .15, .15, new Color(61, 77, 68));
        g.box(lampX - .6, floor + 2.95, -2, .5, .5, .5, new Color(156, 143, 94));
        // Retaining walls close changes in elevation; no underground face is exposed toward the camera.
        for (const [x, floor, bottom] of [[CHANNEL.left, CHANNEL.near, CHANNEL.bed], [CHANNEL.right, CHANNEL.far, CHANNEL.bed], [s.dog.gapLeft, ROAD.floor, -650], [s.dog.gapRight, ROAD.floor, -650], [s.press.layout.origin + s.press.layout.gapLeft, ROAD.floor, -350], [s.press.layout.origin + s.press.layout.gapRight, ROAD.floor, -350]]) {
            g.box(x * S, (floor + bottom) / 2 * S, -6.5, .16, (floor - bottom) * S, 103, new Color(70, 82, 76));
        }
        const pit = FACTORY_PANIC_LAYOUT;
        g.surface(pit.pitStart * S, pit.pitEnd * S, -315 * S, -315 * S, -3, -6, new Color(15, 26, 28));
        for (const x of [pit.pitStart, pit.pitEnd])
            g.box(x * S, -227.5 * S, -4.5, .13, 175 * S, BLOCKING_WALL_DEPTH, new Color(54, 63, 57));
        this.batch('Walkable terrain surfaces', g);
    }
    private dynamicSurfaces(s: World25DState) {
        const g = new WorldGeometry(), c = CHANNEL, w = s.world, p = s.press;
        const box = (x: number, y: number, z: number, width: number, height: number, depth: number, color: Color) => g.box(x * S, y * S, z, width * S, height * S, depth, color);
        g.surface(c.left * S, c.right * S, w.waterY * S, w.waterY * S, 42, -58, new Color(48, 89, 85));
        box((c.logLeft + c.logRight) / 2, w.logY - 12, 0, c.logRight - c.logLeft, 24, 3.6, new Color(125, 99, 60));
        for (let x = c.logLeft + 20; x < c.logRight; x += 40)
            box(x, w.logY + .6, 0, 2, 1, 3.6, new Color(66, 63, 44));
        box(c.leverX, c.near + 20, 0, 16, 40, .5, new Color(92, 98, 75));
        const lever = new VectorWorldGraphics(w.x, .1, .35);
        lever.strokeColor = new Color(207, 173, 100);
        lever.lineWidth = 7;
        lever.moveTo(c.leverX, c.near + 28);
        lever.lineTo(c.leverX + (w.opened ? 25 : -25), c.near + 66);
        lever.stroke();
        this.batch('Sluice handle', lever.geometry);
        box(1350, c.near + 42 + w.fill * 90, -.5, 32, 100, 1.4, new Color(60, 76, 67));
        box(p.bridgeX, p.bridgeTop - 12, 0, p.layout.bridgeWidth, 24, 3.8, new Color(83, 101, 91));
        box(p.crateX, p.layout.floor + p.layout.crateHeight / 2, -.5, p.layout.crateWidth, p.layout.crateHeight, 1.6, new Color(108, 82, 51));
        box(s.box.x, s.box.layout.floor + s.box.layout.boxHeight / 2, -.5, s.box.layout.boxWidth, s.box.layout.boxHeight, 1.6, new Color(124, 99, 63));
        box((s.box.wallX + s.box.wallEndX) / 2, s.box.layout.floor + s.box.layout.height / 2, -.8, s.box.wallEndX - s.box.wallX, s.box.layout.height, PRISON_WALL_DEPTH, new Color(90, 104, 99));
        const f = s.factory, fl = FACTORY_ESCAPE_LAYOUT;
        box(f.crateX, fl.floor + fl.crateHeight / 2, -.5, fl.crateWidth, fl.crateHeight, 1.6, new Color(118, 91, 57));
        if (!f.poweredOff) box(fl.gateX, fl.floor + fl.gateHeight / 2, -.8, 16, fl.gateHeight, BLOCKING_WALL_DEPTH, new Color(65, 78, 73));
        box(fl.leverX - 12, fl.floor + 42, -.6, 8, 84, .8, new Color(63, 75, 70));
        box(fl.leverX + (f.poweredOff ? 8 : -6), fl.floor + (f.poweredOff ? 70 : 80), -.15, 34, 6, .6, new Color(209, 177, 105));
        const r = s.river, atRiver = w.checkpoint === 'river-approach', onBoat = atRiver && r.isOnBoat(w.x), onRamp = atRiver && r.isOnRamp(w.x);
        const boatX = onBoat ? w.x + 25 : onRamp || w.checkpoint === 'river-cleared' ? r.landingBoatX : r.launchBoatX;
        if (w.x > ROOM.doorX - 1000 && w.x < DISMANTLE_ROOM.endX + 900) {
            const roomLeft = ROOM.doorX + ROOM.doorWidth / 2;
            const roomWidth = DISMANTLE_ROOM.endX - roomLeft;
            // A warm, cutaway interior sits beyond the mountain road's doorway.
            box((roomLeft + ROOM.endX) / 2, ROAD.floor + 260, -24, roomWidth, 520, 1.2, new Color(104, 91, 72));
            box((roomLeft + ROOM.endX) / 2, ROAD.floor + 76, -22.8, roomWidth, 120, .9, new Color(125, 104, 77));
            box((roomLeft + ROOM.endX) / 2, ROAD.floor + 480, -17, roomWidth, 18, 18, new Color(57, 58, 52));
            box(ROOM.doorX - ROOM.doorWidth / 2 - 8, ROAD.floor + ROOM.doorHeight / 2, -14, 16, ROOM.doorHeight, 2.4, new Color(68, 62, 50));
            box(ROOM.doorX + ROOM.doorWidth / 2 + 8, ROAD.floor + ROOM.doorHeight / 2, -14, 16, ROOM.doorHeight, 2.4, new Color(68, 62, 50));
            box(ROOM.doorX, ROAD.floor + ROOM.doorHeight + 8, -14, ROOM.doorWidth + 32, 16, 2.4, new Color(68, 62, 50));
            box(ROOM.doorX - 380, ROAD.floor + 270, -22, 220, 155, 1.4, new Color(49, 70, 72));
            box(ROOM.doorX - 380, ROAD.floor + 270, -21.1, 184, 120, .3, new Color(157, 174, 158));
            box(ROOM.doorX + 310, ROAD.floor + 62, -12, 210, 18, 1.5, new Color(78, 61, 43));
            box(ROOM.doorX + 300, ROAD.floor + 107, -12, 16, 90, 1.28, new Color(89, 72, 51));
            box(ROOM.doorX + 600, ROAD.floor + 100, -13, 185, 20, 1.1, new Color(112, 88, 60));
            box(ROOM.doorX + 540, ROAD.floor + 200, -23, 250, 16, 1.8, new Color(76, 66, 49));
            box(ROOM.doorX + 540, ROAD.floor + 232, -21.8, 192, 46, .6, new Color(160, 132, 88));
            box(ROOM.doorX + 820, ROAD.floor + 300, -20, 18, 66, 2, new Color(207, 170, 100));
            box(ROOM.doorX + 820, ROAD.floor + 300, -18.8, 48, 18, 1.2, new Color(223, 185, 110));
            if (!w.roomDoorOpen) {
                box(ROOM.doorX, ROAD.floor + ROOM.doorHeight / 2, -12.2, ROOM.doorWidth - 18, ROOM.doorHeight - 12, 1.2, new Color(89, 67, 46));
                box(ROOM.doorX + 37, ROAD.floor + ROOM.doorHeight / 2, -11.5, 32, 126, .5, new Color(137, 103, 65));
                box(ROOM.doorX - 37, ROAD.floor + ROOM.doorHeight / 2, -11.5, 32, 126, .5, new Color(137, 103, 65));
                box(ROOM.doorX + 43, ROAD.floor + 102, -10.8, 4, 4, .8, new Color(221, 184, 107));
            } else {
                box(ROOM.doorX + ROOM.doorWidth / 2 - 9, ROAD.floor + ROOM.doorHeight / 2, -10.5, 14, ROOM.doorHeight - 8, 1.2, new Color(89, 67, 46));
            }
        }
        if (w.x > DISMANTLE_ROOM.startX - 1200 && w.x < DISMANTLE_ROOM.endX + 800) {
            const d = s.dismantle, floor = ROAD.floor;
            const lit = d.stepIndex > 0, beltY = floor + 38;
            // The warm shelter ends at an open fire door; the cold dismantling line fills the next bay.
            box((DISMANTLE_ROOM.startX + DISMANTLE_ROOM.endX) / 2, floor + 255, -21.5, DISMANTLE_ROOM.endX - DISMANTLE_ROOM.startX, 510, .65, new Color(48, 58, 57));
            box(DISMANTLE_ROOM.startX + 34, floor + 255, -20.9, 18, 510, 1, new Color(83, 66, 49));
            box(DISMANTLE_ROOM.endX - 34, floor + 255, -20.9, 18, 510, 1, new Color(83, 66, 49));
            box((DISMANTLE_ROOM.startX + DISMANTLE_ROOM.endX) / 2, floor + 498, -18, DISMANTLE_ROOM.endX - DISMANTLE_ROOM.startX, 14, 16, new Color(35, 44, 43));
            // Conveyor, sorting bins and the press share the opening's industrial silhouette.
            box(29210, beltY, -6, 1120, 36, 5, new Color(83, 89, 81));
            for (let x = 28690; x < 29760; x += 100) {
                box(x, floor + 15, -5.5, 5, 15, 2, new Color(48, 52, 49));
                box(x, beltY + 19, -5.4, 9, 3, 5.4, new Color(128, 111, 79));
            }
            box(29610, floor + 214, -7, 165, 385, 8, new Color(67, 74, 69));
            box(29610, floor + 75 + (d.stepIndex >= 4 ? -38 : 0), -3, 190, 22, 14, new Color(d.stepIndex >= 4 ? 147 : 102, 83, 72));
            box(29610, floor + 423, -7, 380, 24, 10, new Color(89, 96, 85));
            box(30010, floor + 52, -5, 390, 88, 6, new Color(69, 77, 69));
            box(30010, floor + 100, -3.8, 310, 8, 1.4, new Color(135, 117, 80));
            // Three warning lamps repeat the exact three-beat signal the player saw during the escape.
            for (let i = 0; i < 3; i++) {
                const beat = s.time % 1.8;
                const pulse = d.stepIndex > 1 || (d.stepIndex > 0 && beat >= i * .48 && beat < i * .48 + .34);
                box(29000 + i * 72, floor + 422, -8.5, 34, 32, 3, pulse ? new Color(196, 65, 47) : new Color(71, 58, 48));
            }
            // At first the robot waits on the belt; then it moves under the press and is reduced to sorted parts.
            if (d.stepIndex < 4) {
                const targetX = 29100;
                const targetY = beltY + 22;
                box(targetX, targetY + 34, 1.3, 36, 54, 5.4, new Color(117, 130, 119));
                box(targetX, targetY + 70, 1.3, 31, 26, 5.4, new Color(140, 148, 132));
                box(targetX - 26, targetY + 34, 1.3, 13, 44, 4, new Color(91, 106, 101));
                box(targetX + 26, targetY + 34, 1.3, 13, 44, 4, new Color(91, 106, 101));
                box(targetX - 11, targetY - 2, 1.3, 12, 28, 4.5, new Color(100, 108, 96));
                box(targetX + 11, targetY - 2, 1.3, 12, 28, 4.5, new Color(100, 108, 96));
                box(targetX + 15, targetY + 48, 4.2, 8, 11, .2, new Color(174, 56, 45));
            } else {
                for (let i = 0; i < 4; i++) box(29910 + i * 55, floor + 120 + (i % 2) * 10, -1.4, 30, 15, 4, new Color(115, 128, 116));
                box(30100, floor + 141, .1, 48, 18, .3, new Color(172, 49, 39));
            }
            if (d.stepIndex >= 2) {
                box(28960, floor + 90, -2, 15, 180, 6, new Color(70, 82, 75));
                box(29440, floor + 90, -2, 15, 180, 6, new Color(70, 82, 75));
                box(28750, floor + 10, 2.5, 130, 8, 1, new Color(76, 184, 126));
                box(28890, floor + 10, 2.5, 80, 8, 1, new Color(76, 184, 126));
            }
            box(DISMANTLE_ROOM.consoleX, floor + 72, -2, 76, 128, 5, new Color(58, 74, 72));
            box(DISMANTLE_ROOM.consoleX, floor + 92, .8, 48, 30, .5, lit ? new Color(184, 60, 42) : new Color(173, 145, 87));
            box(DISMANTLE_ROOM.consoleX + 38, floor + 92, 1, 10, 40, .8, new Color(178, 143, 79));
            // The same stamped batch mark appears beside the separated parts.
            if (d.stepIndex >= 4) {
                box(30100, floor + 178, 1.1, 92, 34, .8, new Color(184, 53, 42));
                box(30100, floor + 178, 1.7, 58, 19, .25, new Color(229, 207, 155));
            }
        }
        g.surface(r.waterLeft * S, r.waterRight * S, r.layout.waterY * S, r.layout.waterY * S, 45, -58, new Color(40, 78, 76));
        box(boatX, r.layout.deckY - 8, -.35, 168, 16, 3.6, new Color(110, 86, 54));
        box(boatX, r.layout.deckY + 8, 1.4, 170, 24, .12, new Color(79, 68, 48));
        const nearRampStart = r.waterLeft - 135, nearRampEnd = r.launchBoatX - 55;
        g.surface(nearRampStart * S, nearRampEnd * S, ROAD.floor * S, r.layout.deckY * S, 1.2, -1.2, new Color(126, 101, 63));
        g.surface(r.disembarkX * S, r.exitX * S, r.layout.deckY * S, ROAD.floor * S, 1.2, -1.2, new Color(126, 101, 63));
        for (let band = 0; band < 5; band++) {
            const z = 2 + band * -4;
            for (let x = Math.floor(r.waterLeft / 160) * 160; x < r.waterRight; x += 160) {
                const a = x + Math.sin(s.time * .8 + band) * 12;
                g.surface(a * S, Math.min(r.waterRight, a + 60) * S, r.layout.waterY * S + .02, r.layout.waterY * S + .02, z + .015, z, new Color(82, 125, 111));
            }
        }
        // Movable city props and their collision tops share the simulation's dimensions.
        for (const [x, h, width, color] of [[s.city.rationBox, 74, 82, new Color(116, 87, 55)], [s.city.battery, 74, 82, new Color(69, 94, 84)], [s.city.waterBowl, 18, 82, new Color(120, 113, 84)], [s.city.pruningBranch, 30, 148, new Color(96, 76, 49)], [s.city.relayPanel, 52, 82, new Color(77, 102, 88)]] as [
            number,
            number,
            number,
            Color
        ][])
            box(x, ROAD.floor + h / 2, -.35, width, h, 1.3, color);
        // Closed city gates span the actual lane; opened gates retract clear of it.
        for (const [x, opened] of [[CITY_STORY.ration.gate,s.city.rationSolved],[CITY_STORY.repair.gate,s.city.repairSolved],[CITY_STORY.pump.gate,s.city.pumpOn],[CITY_STORY.cat.gate,s.city.catSolved],[CITY_STORY.garden.pruningGate,s.city.pruningSolved],[CITY_STORY.garden.waterGate,s.city.wildWater],[CITY_STORY.garden.signalGate,s.city.signalSolved],[CITY_STORY.garden.powerGate,s.city.powerGateOpen]] as [number,boolean][]) {
            if (!opened) box(x,ROAD.floor+99,0,16,198,4.2,new Color(48,60,53));
        }
        // The old overhead switch indicators are mounted on rooted control pillars.
        CITY_STORY.garden.switches.forEach((x,i)=>{
            box(x,ROAD.floor+52,-.55,12,104,.8,new Color(57,72,62));
            box(x,ROAD.floor+55,.02,30,28,.7,new Color(76,89,70));
            box(x,ROAD.floor+55,.42,8,17,.1,s.city.powerSwitches&(1<<i)?new Color(113,186,99):new Color(180,143,79));
        });
        this.batch('Moving platforms, props and water', g);
        this.vector('River boat details', s, 0, g => drawRiverCrossing(g, r, s.cameraX, s.time, boatX), .15, s.cameraX);
        this.police(s);
    }
    private art(s: World25DState) {
        const camera = s.cameraX, world = s.world;
        this.vector('Reclamation station', s, -5, g => drawReclamationOpening(g, s.time, s.alarm), .9);
        this.vector('Factory escape conveyor', s, -4.5, g => drawFactoryPanic(g, s.time, camera, s.factory), 1.4, camera);
        this.vector('Salvage batch processing', s, -4.5, g => drawScrapYard(g, camera, s.time), 1.1, camera);
        this.vector('Prison wall and crate detail', s, .02, g => drawPushBox(g, s.box, camera), .7, camera);
        this.vector('Pressure plate and bridge detail', s, .02, g => drawIndustrialPress(g, s.press, camera, s.time), .7, camera);
        this.vector('Cat perch and barrier', s, -.1, g => drawCatRescueProps(g, s.dog, camera), 1.5, camera);
        this.vector('City and garden interactions', s, .02, g => drawCityStories(g, s.city, camera, s.time), .7, camera);
        this.vector('Journey story traces', s, -1.8, g => drawJourneyStoryArt(g, camera, s.time), .5, camera);
        this.vector('Roadside travelers and wildlife', s, -2.2, g => drawRoadsideCharacters(g, camera, s.time), .3, camera);
        // Remove the old simulated parallax; physical Z now determines distance and occlusion.
        this.vector('Guard post', s, -12, g => drawGuardPostSearch(g, GUARD_POST.x, s.time), 1.6, GUARD_POST.x, roadHeight(GUARD_POST.x));
        const tree = new WorldGeometry();
        for (const cover of [COVER, POLICE_COVER]) {
            const x = cover.treeX * S, y = roadHeight(cover.treeX) * S;
            tree.box(x, y + 2.7, -.75, .85, 5.4, 1.4, new Color(36, 49, 39));
            tree.box(x - .6, y + 6, -.95, 1.2, 2.4, .8, new Color(35, 57, 41));
            tree.box(x + .8, y + 5.8, -.95, 1.5, 2, .8, new Color(35, 57, 41));
            for (let i = 0; i < 5; i++)
                tree.box(x - 1 + i * .5, y + .12, -.5, .6, .24, 1.8, new Color(46, 72, 45));
        }
        this.batch('Automatic shelter trees', tree);
    }
    private scenery(s: World25DState) {
        const g = new WorldGeometry(), left = s.world.x - 1900, right = s.world.x + 2400;
        const mountainRanges: [number, number, number, number, Color][] = [
            [19800, 1170, 5200, -72, new Color(49, 62, 66)],
            [22000, 1510, 5700, -88, new Color(41, 54, 60)],
            [24200, 1260, 5000, -104, new Color(51, 63, 66)],
        ];
        for (const [center, peakY, width, z, shade] of mountainRanges) {
            if (Math.abs(center - s.world.x) > 3600) continue;
            const l = (center - width / 2) * S, r = (center + width / 2) * S;
            const base = (ROAD.floor - 130) * S, peak = peakY * S, cx = center * S;
            g.face([[l, base, z], [cx, peak, z], [r, base, z]], shade);
            g.face([[l, base, z - .02], [cx, peak, z - .02], [(center + width * .12) * S, base, z - .02]], new Color(60, 73, 74));
            const snowY = peak - 180 * S;
            g.face([[(center - 470) * S, snowY, z - .04], [cx, peak, z - .04], [(center + 390) * S, snowY + 70 * S, z - .04]], new Color(139, 148, 141, 205));
        }
        for (let x = Math.floor(left / 220) * 220; x < right; x += 220) {
            if (x > ROOM.doorX + ROOM.doorWidth / 2 && x < DISMANTLE_ROOM.endX) continue;
            const y = (x < CHANNEL.left ? CHANNEL.near : roadHeight(x)) * S;
            if (x < -1050) {
                g.box(x * S, y + 4, -11, .4, 8, .4, new Color(44, 58, 56));
                g.box(x * S + 1, y + 7.8, -11, 3, .25, 3, new Color(75, 79, 64));
                g.box(x * S + 2, y + 1, -13, 2.4, 2, 2, new Color(53, 65, 61));
            }
            else if (x < 3100 || (x > 14500 && x < ROAD.mountainStart - 700) || x > ROAD.mountainDescentEnd + 700) {
                const h = 7 + (Math.abs(x) % 13) * .23;
                g.box(x * S, y + h / 2, -14, .7, h, .8, new Color(46, 61, 46));
                g.box(x * S, y + h - 1, -15, 3.8, 2.5, 2.5, new Color(44, 75, 51));
                g.box(x * S + .7, y + h + .5, -15, 3, 2, 3, new Color(56, 85, 55));
            }
            else if (x >= ROAD.mountainStart - 700 && x <= ROAD.mountainDescentEnd + 700) {
                const h = 3.5 + Math.abs(x * 7) % 4.5, cold = roadHeight(x) > ROAD.mountainPeak * .62;
                g.box(x * S, y + h / 2, -14, .55, h, .55, cold ? new Color(68, 76, 75) : new Color(49, 61, 56));
                if (!cold) {
                    for (let tier = 0; tier < 3; tier++) {
                        const tierY = y + h - 1.8 - tier * 1.65;
                        g.box(x * S, tierY, -14.2, 3.6 - tier * .9, 2.2, 2.2, new Color(43 + tier * 4, 65 + tier * 4, 56 + tier * 3));
                    }
                } else {
                    g.box(x * S, y + h + .8, -14.3, 1.7, .45, .9, new Color(134, 143, 139));
                    if (Math.abs(x * 3) % 2 === 0) g.box(x * S + .8, y + .6, -14.5, 1.5, 1.1, 1.7, new Color(82, 88, 87));
                }
            }
            else {
                g.box(x * S, y + 1.1, -7, .12, 2.2, .12, new Color(52, 65, 58));
                g.box(x * S + 2.75, y + 1.6, -7, 5.5, .06, .06, new Color(68, 81, 68));
                const h = 5 + Math.abs(x * 7) % 9;
                g.box(x * S, y + h / 2, -30, 3, h, 4, new Color(61, 74, 74));
            }
        }
        // Near trunks and canopies pass in front of the character through forest and garden stretches.
        const foregroundTrees = [-900, -420, 350, 1150, 2320, 2900, 14600, 15400, 16200, 16900, 17800, 18600];
        for (let i = 0; i < foregroundTrees.length; i++) {
            const x = foregroundTrees[i];
            if (Math.abs(x - s.world.x) > 2300 || (x > CHANNEL.left - 100 && x < CHANNEL.right + 100)) continue;
            const y = (x < CHANNEL.left ? CHANNEL.near : roadHeight(x)) * S, seed = i % 3;
            const z = 3.8;
            g.box(x * S, y + 1.7, z, .48, 3.4, .9, new Color(66 + seed * 4, 49 + seed * 3, 37));
            g.box(x * S, y + 4.1, z - .1, 2.55, 1.6, 1.7, new Color(32 + seed * 3, 58 + seed * 3, 39 + seed * 2));
            g.box(x * S - .65, y + 3.55, z + .15, 1.9, 1.35, 1.55, new Color(38 + seed * 3, 70 + seed * 3, 44 + seed * 2));
            g.box(x * S + .65, y + 3.55, z - .2, 1.9, 1.35, 1.55, new Color(35 + seed * 3, 64 + seed * 3, 41 + seed * 2));
        }
        // The distant road is a horizontal surface, not a floating strip above the player.
        for (const center of [GUARD_POST.x, POLICE_COVER.treeX]) {
            g.surface((center - 700) * S, (center + 1800) * S, ROAD.floor * S, ROAD.floor * S, -14, -22, new Color(45, 58, 59));
            for (let x = center - 700; x < center + 1800; x += 150)
                g.surface(x * S, (x + 65) * S, ROAD.floor * S + .02, ROAD.floor * S + .02, -17.96, -18.04, new Color(121, 126, 104));
        }
        this.batch('Depth scenery and service roads', g);
    }
    private police(s: World25DState) {
        const g = new WorldGeometry(), base = POLICE_COVER.treeX;
        for (let car = 0; car < 2; car++) {
            const x = (base + car * 240 + s.police.departure * s.police.departure * 1250) * S, y = ROAD.floor * S, z = -18;
            if (Math.abs(x - s.world.x * S) > 55)
                continue;
            g.box(x, y + .65, z, 3.5, .8, 1.7, new Color(29, 42, 48));
            g.box(x, y + 1.23, z, 1.9, .55, 1.4, new Color(83, 108, 116));
            g.box(x, y + .75, z + .88, 3.3, .12, .04, new Color(167, 175, 158));
            for (const side of [-1, 1])
                for (const end of [-1, 1])
                    g.box(x + end * 1.05, y + .28, z + side * .8, .55, .55, .35, new Color(19, 28, 31));
            g.box(x - .2, y + 1.58, z, .35, .12, .3, new Color(255, Math.sin(s.time * 9) > 0 ? 65 : 20, 40));
            g.box(x + .2, y + 1.58, z, .35, .12, .3, new Color(45, 90, Math.sin(s.time * 9) < 0 ? 255 : 70));
        }
        this.batch('Distant police vehicles', g);
        const beams = new WorldGeometry();
        for (const [center, escape] of [[GUARD_POST.x, s.escape], [POLICE_COVER.treeX, s.police]] as [
            number,
            SearchEscape
        ][]) {
            if (escape.cleared || Math.abs(s.world.x - center) > 1600)
                continue;
            const floor = roadHeight(center) * S, x = center * S, aim = (center - 190 + Math.sin(s.time * .7) * 100) * S;
            beams.face([[x, floor + 4.2, -12], [aim - 1, floor + .05, 1], [aim + 1, floor + .05, 1]], new Color(235, 223, 161, 35));
        }
        this.batch('Search lights through real depth', beams, true);
    }
    destroy() {
        for (const b of this.batches.values())
            b.destroy();
        for (const card of this.cards.values()) {
            card.mesh?.destroy();
            card.material.destroy();
        }
        this.robot.destroy();
        this.dogModel.destroy();
        this.catModel.destroy();
        for (const copy of this.robotCopies.values())
            copy.destroy();
        this.kit.destroy();
        this.opaque.destroy();
        this.translucent.destroy();
        this.root.destroy();
        this.captions.destroy();
        if (this.oldCamera)
            this.oldCamera.active = true;
        if (this.oldLight)
            this.oldLight.active = true;
    }
}
