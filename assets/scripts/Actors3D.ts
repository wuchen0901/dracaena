import { Color, Material, EffectAsset, MeshRenderer, Node, Layers, primitives, utils, Prefab, resources, instantiate, isValid } from 'cc';
/** Shared meshes/materials for articulated campaign actors; all dimensions are world units. */
export class ActorModelKit {
    private cube = utils.createMesh(primitives.box());
    private sphere = utils.createMesh(primitives.sphere(0.5, { segments: 16 }));
    private materials = new Map<string, Material>();
    constructor(private effect: EffectAsset) { }
    pivot(parent: Node, name: string, x = 0, y = 0, z = 0) { const n = new Node(name); n.setParent(parent); n.layer = Layers.Enum.DEFAULT; n.setPosition(x, y, z); return n; }
    part(parent: Node, name: string, x: number, y: number, z: number, w: number, h: number, d: number, rgb: number[], rounded = false, glow = false) {
        const n = this.pivot(parent, name, x, y, z);
        n.setScale(w, h, d);
        const r = n.addComponent(MeshRenderer);
        r.mesh = rounded ? this.sphere : this.cube;
        const key = rgb.join(':') + glow;
        let material = this.materials.get(key);
        if (!material) {
            material = new Material();
            material.initialize(glow ? { effectName: 'builtin-unlit', defines: { USE_INSTANCING: true } } : { effectAsset: this.effect, defines: { USE_INSTANCING: true } });
            material.setProperty('mainColor', new Color(rgb[0], rgb[1], rgb[2]));
            if (!glow) {
                material.setProperty('roughness', .78);
                material.setProperty('metallic', .12);
            }
            this.materials.set(key, material);
        }
        r.setMaterial(material, 0);
        return n;
    }
    destroy() {
        this.cube.destroy();
        this.sphere.destroy();
        for (const m of this.materials.values())
            m.destroy();
    }
}
export type RobotPose = {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    grounded: boolean;
    facing: number;
    cover: boolean;
    gripping: boolean;
    seated: boolean;
    floor: number;
    shadow?: boolean;
    dt: number;
};
export class Robot3D {
    readonly node: Node;
    private body: Node;
    private head: Node;
    private hips: Node[] = [];
    private knees: Node[] = [];
    private shoulders: Node[] = [];
    private elbows: Node[] = [];
    private phase = 0;
    private shadow: Node;
    private detailedModel: Node | null = null;
    private detailedBones = new Map<string, Node>();
    constructor(parent: Node, kit: ActorModelKit, name = 'Maintenance robot', useDetailedModel = false) {
        this.node = kit.pivot(parent, name);
        this.body = kit.pivot(this.node, 'Animated body');
        const ivory = [207, 196, 160], edge = [145, 138, 112], joint = [48, 57, 54], dark = [27, 37, 37], amber = [238, 174, 63];
        kit.part(this.body, 'Pelvis', 0, .88, 0, .42, .3, .4, edge, true);
        kit.part(this.body, 'Ivory chest', 0, 1.3, 0, .61, .78, .56, ivory, true);
        kit.part(this.body, 'Front chest plate', .24, 1.34, 0, .12, .42, .42, edge, true);
        kit.part(this.body, 'Chest amber lamp', .31, 1.36, .08, .09, .12, .14, amber, true, true);
        kit.part(this.body, 'Backpack', -.33, 1.3, 0, .27, .5, .45, edge, true);
        kit.part(this.body, 'Pack straps', -.37, 1.3, .22, .08, .38, .05, joint);
        kit.part(this.body, 'Neck', 0, 1.77, 0, .23, .25, .22, joint, true);
        this.head = kit.pivot(this.body, 'Head pivot', 0, 1.99, 0);
        kit.part(this.head, 'Weathered helmet', 0, 0, 0, .77, .69, .68, ivory, true);
        kit.part(this.head, 'Recessed dark visor', .25, -.015, 0, .4, .43, .57, dark, true);
        for (const z of [-.17, .17])
            kit.part(this.head, 'Amber eye', .39, .025, z, .08, .13, .12, amber, true, true);
        kit.part(this.head, 'Ear joint', -.07, 0, .35, .2, .22, .1, edge, true);
        kit.part(this.head, 'Shell seam', -.12, .28, .18, .35, .03, .02, joint);
        for (const z of [-.235, .235]) {
            const hip = kit.pivot(this.body, 'Hip', 0, .83, z);
            this.hips.push(hip);
            kit.part(hip, 'Hip joint', 0, 0, 0, .22, .22, .22, joint, true);
            kit.part(hip, 'Thigh armour', 0, -.2, 0, .24, .38, .25, ivory, true);
            const knee = kit.pivot(hip, 'Knee', 0, -.39, 0);
            this.knees.push(knee);
            kit.part(knee, 'Knee bearing', 0, 0, 0, .24, .2, .25, joint, true);
            kit.part(knee, 'Shin armour', 0, -.17, 0, .22, .34, .23, edge, true);
            kit.part(knee, 'Boot', .09, -.33, 0, .42, .16, .3, joint, true);
            const shoulder = kit.pivot(this.body, 'Shoulder', 0, 1.57, z * 1.45);
            this.shoulders.push(shoulder);
            kit.part(shoulder, 'Shoulder bearing', 0, 0, 0, .23, .23, .22, joint, true);
            kit.part(shoulder, 'Upper arm', 0, -.18, 0, .19, .33, .22, ivory, true);
            const elbow = kit.pivot(shoulder, 'Elbow', 0, -.35, 0);
            this.elbows.push(elbow);
            kit.part(elbow, 'Elbow bearing', 0, 0, 0, .18, .18, .18, joint, true);
            kit.part(elbow, 'Forearm', 0, -.15, 0, .19, .29, .22, edge, true);
            kit.part(elbow, 'Hand', .01, -.32, 0, .18, .17, .23, joint, true);
        }
        this.shadow = kit.part(parent, name + ' contact shadow', 0, 0, 0, .95, .008, .6, [35, 43, 37], true, true);
        if (useDetailedModel) {
            resources.load('models/last-light-robot-detailed/last-light-robot-detailed', Prefab, (error, prefab) => {
                if (error || !prefab || !isValid(this.node)) {
                    if (error) console.warn('Detailed robot model unavailable; using the built-in actor.', error);
                    return;
                }
                const facingRoot = new Node('Detailed robot model');
                facingRoot.setParent(this.node);
                facingRoot.setScale(.72, .72, .72);
                facingRoot.setRotationFromEuler(0, 90, 0);
                const rig = instantiate(prefab);
                rig.setParent(facingRoot);
                this.detailedModel = facingRoot;
                this.collectBones(rig);
                this.body.active = false;
                this.poseDetailed();
            });
        }
    }
    private collectBones(root: Node) {
        const visit = (node: Node) => {
            if (node.name.startsWith('Bone_')) this.detailedBones.set(node.name.slice(5), node);
            node.children.forEach(visit);
        };
        visit(root);
    }
    private bone(name: string, angle: number) {
        this.detailedBones.get(name)?.setRotationFromEuler(angle, 0, 0);
    }
    private poseDetailed() {
        if (!this.detailedModel) return;
        const run = Math.abs(this.lastPose.vx) > 200;
        const p = this.lastPose;
        const wave = Math.sin(this.phase), stride = run ? 38 : 27;
        this.detailedModel.setPosition(0, p.bob - (p.cover ? .23 : p.seated ? .32 : 0), 0);
        this.bone('Spine', p.gripping ? -5 : p.cover ? -12 : run ? -5 : 0);
        this.bone('Head', p.cover ? 8 : p.gripping ? -6 : 0);
        for (const side of ['Left', 'Right']) {
            const sign = side === 'Left' ? -1 : 1;
            const swing = wave * sign;
            const leg = !p.grounded ? (side === 'Left' ? -20 : 15) : swing * stride;
            this.bone(side + 'Thigh', p.seated ? 68 : p.cover ? 40 : leg);
            this.bone(side + 'Shin', p.seated ? -78 : p.cover ? -62 : !p.grounded ? -34 : -Math.max(0, -swing) * (run ? 55 : 30));
            this.bone(side + 'Foot', p.seated ? 8 : -Math.max(0, swing) * 14);
            this.bone(side + 'UpperArm', p.gripping ? -58 : p.seated ? 20 : p.cover ? -25 : -swing * (run ? 34 : 22));
            this.bone(side + 'Forearm', p.gripping ? -14 : run ? -46 : 10);
        }
    }
    private lastPose: RobotPose & { bob: number } = { x: 0, y: 0, z: 0, vx: 0, vy: 0, grounded: true, facing: 1, cover: false, gripping: false, seated: false, floor: 0, dt: 0, bob: 0 };
    pose(p: RobotPose) {
        const speed = Math.abs(p.vx), moving = speed > 3, run = speed > 200;
        if (moving && p.grounded)
            this.phase += p.dt * speed / 110 * Math.PI;
        const wave = Math.sin(this.phase), bob = moving && p.grounded ? Math.abs(Math.sin(this.phase * 2)) * (run ? .065 : .035) : Math.sin(this.phase) * .008;
        this.lastPose = { ...p, bob };
        this.node.setPosition(p.x, p.y, p.z);
        this.node.setRotationFromEuler(0, p.facing < 0 ? 180 : 0, 0);
        const crouch = p.cover ? .32 : p.seated ? .45 : 0;
        this.body.setPosition(0, bob - crouch, 0);
        this.body.setRotationFromEuler(0, 0, p.gripping ? -12 : p.cover ? -20 : run ? -9 : 0);
        this.head.setRotationFromEuler(0, 0, p.cover ? 12 : p.gripping ? 8 : 0);
        for (let i = 0; i < 2; i++) {
            const swing = wave * (i ? 1 : -1), air = !p.grounded;
            this.hips[i].setRotationFromEuler(0, 0, p.seated ? 70 : p.cover ? 45 : air ? (i ? 18 : -15) : swing * (run ? 42 : 28));
            this.knees[i].setRotationFromEuler(0, 0, p.seated ? -85 : p.cover ? -75 : air ? -45 : -Math.max(0, -swing) * (run ? 65 : 35));
            this.shoulders[i].setRotationFromEuler(0, 0, p.gripping ? 62 : p.seated ? 25 : p.cover ? 30 : air ? -25 : -swing * (run ? 36 : 23));
            this.elbows[i].setRotationFromEuler(0, 0, p.gripping ? 17 : run ? 55 : air ? 35 : 12);
        }
        const airborne = Math.max(0, p.y - p.floor);
        this.shadow.active = this.node.active && p.shadow !== false;
        this.shadow.setPosition(p.x, p.floor + .012, p.z);
        this.shadow.setScale(.95 / (1 + airborne * .1), .008, .6 / (1 + airborne * .1));
        this.poseDetailed();
    }
    set active(value: boolean) { this.node.active = value; this.shadow.active = value; }
    destroy() { this.node.destroy(); this.shadow.destroy(); }
}
/** Low-poly quadruped with articulated legs; depth motion is supplied by the encounter. */
export class Animal3D {
    readonly node: Node;
    private legs: Node[] = [];
    private head: Node;
    private tail: Node;
    private phase = 0;
    constructor(parent: Node, kit: ActorModelKit, cat = false) {
        this.node = kit.pivot(parent, cat ? 'Kitten 3D' : 'Guard dog 3D');
        const tan = cat ? [150, 145, 128] : [133, 101, 63], dark = cat ? [76, 81, 72] : [50, 52, 43];
        kit.part(this.node, 'Body', 0, .64, 0, 1.2, .58, .48, tan, true);
        kit.part(this.node, 'Dark saddle', -.1, .81, 0, .9, .24, .46, dark, true);
        this.head = kit.pivot(this.node, 'Head', .6, .94, 0);
        kit.part(this.head, 'Skull', 0, 0, 0, .44, .44, .36, tan, true);
        kit.part(this.head, 'Muzzle', .24, -.08, 0, .4, .23, .25, dark, true);
        kit.part(this.head, 'Nose', .42, -.05, 0, .08, .11, .19, [28, 34, 31], true);
        for (const side of [-1, 1]) {
            const ear = kit.part(this.head, 'Pointed ear', -.08, .26, side * .14, .16, .35, .11, dark);
            ear.setRotationFromEuler(0, 0, side * 12);
            kit.part(this.head, 'Eye', .11, .07, side * .18, .07, .07, .025, [207, 174, 98], true, true);
            for (const x of [-.4, .4]) {
                const leg = kit.pivot(this.node, 'Leg', x, .62, side * .2);
                this.legs.push(leg);
                kit.part(leg, 'Leg segment', 0, -.25, 0, .14, .5, .14, tan, true);
                kit.part(leg, 'Paw', .08, -.52, 0, .26, .12, .18, dark, true);
            }
        }
        this.tail = kit.pivot(this.node, 'Tail', -.6, .75, 0);
        const tail = kit.part(this.tail, 'Tail fur', -.27, 0, 0, .65, .18, .18, dark, true);
        tail.setRotationFromEuler(0, 0, 20);
        if (cat)
            this.node.setScale(.5, .5, .5);
    }
    pose(x: number, y: number, z: number, facing: number, moving: boolean, barking: boolean, dt: number) {
        this.node.setPosition(x, y, z);
        this.node.setRotationFromEuler(0, facing < 0 ? 180 : 0, 0);
        this.phase += dt * (moving ? 13 : 2);
        this.legs.forEach((leg, i) => leg.setRotationFromEuler(0, 0, moving ? Math.sin(this.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 36 : 0));
        this.head.setRotationFromEuler(0, 0, barking ? Math.sin(this.phase * 2) * 8 : 0);
        this.tail.setRotationFromEuler(Math.sin(this.phase) * 15, 0, -15);
    }
    set active(value: boolean) { this.node.active = value; }
    destroy() { this.node.destroy(); }
}
