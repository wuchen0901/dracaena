import { Color, Graphics, Material, Mesh, MeshRenderer, Node, Layers, utils } from 'cc';
export const WORLD_SCALE = 1 / 40;
type Point = [
    number,
    number
];
/** Batched vertex-colour geometry. World Y remains height; Z is scene depth. */
export class WorldGeometry {
    positions: number[] = [];
    colors: number[] = [];
    indices: number[] = [];
    face(points: number[][], color: Color, shade = 1) {
        const base = this.positions.length / 3;
        for (const p of points) {
            this.positions.push(...p);
            this.colors.push(color.r / 255 * shade, color.g / 255 * shade, color.b / 255 * shade, color.a / 255);
        }
        for (let i = 1; i + 1 < points.length; i++)
            this.indices.push(base, base + i, base + i + 1);
    }
    box(x: number, y: number, z: number, w: number, h: number, d: number, color: Color) {
        const l = x - w / 2, r = x + w / 2, b = y - h / 2, t = y + h / 2, f = z + d / 2, a = z - d / 2;
        this.face([[l, b, f], [r, b, f], [r, t, f], [l, t, f]], color);
        this.face([[l, t, f], [r, t, f], [r, t, a], [l, t, a]], color, 1.16);
        this.face([[r, b, f], [r, b, a], [r, t, a], [r, t, f]], color, .72);
        this.face([[l, b, a], [l, b, f], [l, t, f], [l, t, a]], color, .84);
        this.face([[r, b, a], [l, b, a], [l, t, a], [r, t, a]], color, .8);
    }
    surface(a: number, b: number, ay: number, by: number, near: number, far: number, color: Color) {
        this.face([[a, ay, near], [b, by, near], [b, by, far], [a, ay, far]], color);
    }
}
export class GeometryBatch {
    readonly node: Node;
    private renderer: MeshRenderer;
    private mesh?: Mesh;
    constructor(parent: Node, name: string, material: Material) {
        this.node = new Node(name);
        this.node.setParent(parent);
        this.node.layer = Layers.Enum.DEFAULT;
        this.renderer = this.node.addComponent(MeshRenderer);
        this.renderer.setMaterial(material, 0);
    }
    commit(g: WorldGeometry) {
        this.node.active = g.indices.length > 0;
        if (!g.indices.length)
            return;
        this.mesh = utils.createMesh({ positions: g.positions, colors: g.colors, indices: g.indices }, this.mesh);
        this.renderer.mesh = this.mesh;
    }
    destroy() { this.mesh?.destroy(); this.node.destroy(); }
}
/** Preserve authored silhouettes/details while placing their solid shapes in real depth. */
export class VectorWorldGraphics {
    fillColor = new Color();
    strokeColor = new Color();
    lineWidth = 1;
    readonly geometry = new WorldGeometry();
    private paths: Point[][] = [];
    private path: Point[] = [];
    private rectangle = false;
    private order = 0;
    constructor(private center: number, private z: number, private thickness = .7, private xOffset = 0, private yOffset = 0) { }
    asGraphics() { return this as unknown as Graphics; }
    clear() { }
    moveTo(x: number, y: number) { this.path = [[x, y]]; this.paths.push(this.path); this.rectangle = false; }
    lineTo(x: number, y: number) { this.path.push([x, y]); }
    close() {
        if (this.path.length)
            this.path.push(this.path[0]);
    }
    quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
        const p = this.path[this.path.length - 1];
        if (!p)
            return;
        for (let i = 1; i <= 8; i++) {
            const t = i / 8, q = 1 - t;
            this.lineTo(q * q * p[0] + 2 * q * t * cx + t * t * x, q * q * p[1] + 2 * q * t * cy + t * t * y);
        }
    }
    rect(x: number, y: number, w: number, h: number) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.close(); this.rectangle = true; }
    roundRect(x: number, y: number, w: number, h: number, _radius: number) { this.rect(x, y, w, h); }
    circle(x: number, y: number, r: number) { this.ellipse(x, y, r, r); }
    ellipse(x: number, y: number, rx: number, ry: number) {
        this.moveTo(x + rx, y);
        for (let i = 1; i <= 20; i++)
            this.lineTo(x + Math.cos(i / 20 * Math.PI * 2) * rx, y + Math.sin(i / 20 * Math.PI * 2) * ry);
    }
    private visible(p: Point[]) { const xs = p.map(a => a[0] + this.xOffset); return Math.min(...xs) < this.center + 1500 && Math.max(...xs) > this.center - 1500; }
    fill() {
        for (const raw of this.paths) {
            if (!this.visible(raw) || this.fillColor.a < 8)
                continue;
            const p = raw.slice();
            if (p.length > 1 && Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < .001)
                p.pop();
            if (p.length < 3)
                continue;
            const z = this.z + (++this.order) * .00003;
            if (this.rectangle && p.length === 4 && this.fillColor.a >= 210) {
                const l = p[0][0], b = p[0][1], w = p[1][0] - l, h = p[2][1] - b;
                // Underground cutaway panels are replaced by horizontal terrain/water surfaces.
                if (b + this.yOffset < -200 && h > 90)
                    continue;
                this.geometry.box((l + w / 2 + this.xOffset) * WORLD_SCALE, (b + h / 2 + this.yOffset) * WORLD_SCALE, z, w * WORLD_SCALE, h * WORLD_SCALE, this.thickness, this.fillColor);
            }
            else {
                // Ear clipping handles concave roots, boat hulls and warning glyphs.
                let area = 0;
                for (let i = 0; i < p.length; i++) {
                    const a = p[i], b = p[(i + 1) % p.length];
                    area += a[0] * b[1] - b[0] * a[1];
                }
                const ids = p.map((_, i) => i);
                if (area < 0)
                    ids.reverse();
                let guard = 0;
                const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
                while (ids.length > 2 && guard++ < p.length * p.length) {
                    let clipped = false;
                    for (let i = 0; i < ids.length; i++) {
                        const a = p[ids[(i + ids.length - 1) % ids.length]], b = p[ids[i]], c = p[ids[(i + 1) % ids.length]];
                        if (cross(a, b, c) <= .000001)
                            continue;
                        if (ids.some(j => p[j] !== a && p[j] !== b && p[j] !== c && cross(a, b, p[j]) > 0 && cross(b, c, p[j]) > 0 && cross(c, a, p[j]) > 0))
                            continue;
                        this.geometry.face([a, b, c].map(q => [(q[0] + this.xOffset) * WORLD_SCALE, (q[1] + this.yOffset) * WORLD_SCALE, z + this.thickness / 2 + .002]), this.fillColor);
                        ids.splice(i, 1);
                        clipped = true;
                        break;
                    }
                    if (!clipped)
                        break;
                }
            }
        }
        this.paths = [];
        this.path = [];
        this.rectangle = false;
    }
    stroke() {
        for (const p of this.paths) {
            if (!this.visible(p) || this.strokeColor.a < 8)
                continue;
            const z = this.z + this.thickness / 2 + .004 + (++this.order) * .00003;
            for (let i = 1; i < p.length; i++) {
                const a = p[i - 1], b = p[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
                if (len < .001)
                    continue;
                const dx = -(b[1] - a[1]) / len * this.lineWidth / 2, dy = (b[0] - a[0]) / len * this.lineWidth / 2;
                this.geometry.face([[a[0] + dx, a[1] + dy], [a[0] - dx, a[1] - dy], [b[0] - dx, b[1] - dy], [b[0] + dx, b[1] + dy]].map(q => [(q[0] + this.xOffset) * WORLD_SCALE, (q[1] + this.yOffset) * WORLD_SCALE, z]), this.strokeColor);
            }
        }
        this.paths = [];
        this.path = [];
        this.rectangle = false;
    }
}
