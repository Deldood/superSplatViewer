import * as pc from 'playcanvas'; 
import { Events } from '../events';
import { Scene } from '../scene';

type Point = { x: number, y: number };
    

class WalkableAreaSelector {
    private points: Point[] = [];
    private currentPoint: Point = null;
    private svg: SVGSVGElement;
    private polyline: SVGPolylineElement;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private parent: HTMLElement;
    private events: Events;
    private scene:Scene;
    private Dpoints:pc.Vec3[] = [];

    constructor(events: Events, parent: HTMLElement, mask: { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D },scene: Scene) {
        this.events = events;
        this.parent = parent;
        this.canvas = mask.canvas;
        this.context = mask.context;
        this.scene = scene

        // create svg
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.id = 'walkable-area-svg';
        this.svg.classList.add('select-svg');

        // create polyline element
        this.polyline = document.createElementNS(this.svg.namespaceURI, 'polyline') as SVGPolylineElement;
        this.polyline.setAttribute('fill', 'none');
        this.polyline.setAttribute('stroke-width', '1');
        this.polyline.setAttribute('stroke-dasharray', '5, 5');
        this.polyline.setAttribute('stroke-dashoffset', '0');

        this.svg.appendChild(this.polyline);
        this.parent.appendChild(this.svg);
    }

    private dist(a: Point, b: Point): number {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    private isClosed(): boolean {
        return this.points.length > 1 && this.dist(this.currentPoint, this.points[0]) < 8;
    }

    private paint(): void {
        const allPoints = [...this.points, this.currentPoint].filter(Boolean);
        const pointsAttr = allPoints.map(p => `${p.x},${p.y}`).join(' ');
        this.polyline.setAttribute('points', pointsAttr);
        this.polyline.setAttribute('stroke', this.isClosed() ? '#6fa' : '#0c0');
    }

    private commitSelection(e: PointerEvent): void {
        if (this.canvas.width !== this.parent.clientWidth || this.canvas.height !== this.parent.clientHeight) {
            this.canvas.width = this.parent.clientWidth;
            this.canvas.height = this.parent.clientHeight;
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.beginPath();
        this.context.fillStyle = '#0c0';
        this.points.forEach((p, idx) => {
            if (idx === 0) {
                this.context.moveTo(p.x, p.y);
            } else {
                this.context.lineTo(p.x, p.y);
            }
        });
        this.context.closePath();
        this.context.fill();

        this.events.fire('walkableArea.created', this.points);

        this.points = [];
        this.paint();
    }

    private create3DLine(start: pc.Vec3, end: pc.Vec3, app: any) {
        const devise = app.graphicsDevice;
        const positions = [start.x, start.y, start.z, end.x, end.y, end.z];
    
        const vertexFormat = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 }
        ]);
    
        const vertexBuffer = new pc.VertexBuffer(app.graphicsDevice, vertexFormat, 2, {
            usage: pc.BUFFER_STATIC
        });
        
        const verts = new Float32Array(vertexBuffer.lock());
        verts.set(positions);
        vertexBuffer.unlock();
    
        const mesh = new pc.Mesh(app.graphicsDevice);
        mesh.vertexBuffer = vertexBuffer;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = 2;
        mesh.primitive[0].indexed = false;
    
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0, 1, 0); // grün
        material.update();
    
        const meshInstance = new pc.MeshInstance(mesh, material);
        const entity = new pc.Entity();
        entity.addComponent("render", {
            meshInstances: [meshInstance],
            castShadows: false
        });
    
        app.root.addChild(entity);
        return entity;
    }
    

    private pointermove = (e: PointerEvent) => {
        this.currentPoint = { x: e.offsetX, y: e.offsetY };
        if (this.points.length > 0) this.paint();
    };

    private pointerdown = (e: PointerEvent) => {
        if (this.points.length > 0 || (e.pointerType === 'mouse' ? e.button === 0 : e.isPrimary)) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    private worldPoint: pc.Vec3;
    private CameraPos: pc.Vec3;

    private pointerup = (e: PointerEvent) => {
        
        this.worldPoint = new pc.Vec3(0,0,0); 
        this.CameraPos = this.scene.camera.entity.getPosition();
    
        this.scene.camera.entity.camera.screenToWorld(this.currentPoint.x, this.currentPoint.y, this.CameraPos.y, this.worldPoint);

        this.worldPoint.y= 0;



        if (e.pointerType === 'mouse' ? e.button === 0 : e.isPrimary) {
            e.preventDefault();
            e.stopPropagation();

            if (this.isClosed()) {
                const current = this.Dpoints[0];
                const last = this.Dpoints[this.points.length - 1];
                this.create3DLine(last,current,this.scene.app)
                this.commitSelection(e);
            } else if (this.points.length === 0 || this.dist(this.points[this.points.length - 1], this.currentPoint) > 0) {
                this.Dpoints.push(this.worldPoint);
                this.points.push(this.currentPoint);
            }
        }

        if(this.points.length >= 2){
            const last = this.Dpoints[this.points.length - 2];
            const current = this.Dpoints[this.points.length - 1];

            this.create3DLine(last,current,this.scene.app)
        }
    };

    private dblclick = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.points.length > 2) {
            this.commitSelection(e);
        }
    };

    private XYZPos: pc.Vec3;
    private Rotation: pc.Vec3;
    

    activate(): void {
        

        this.scene.camera.ortho= true;

        this.XYZPos = new pc.Vec3(0,5,0)
        this.Rotation = new pc.Vec3(0,0,0)  
        this.scene.camera.setPose(this.XYZPos,this.Rotation);

        
        this.svg.style.display = 'inline';
        this.parent.style.display = 'block';
        this.parent.addEventListener('pointerdown', this.pointerdown);
        this.parent.addEventListener('pointermove', this.pointermove);
        this.parent.addEventListener('pointerup', this.pointerup);
        this.parent.addEventListener('dblclick', this.dblclick);
    }

    deactivate(): void {

        console.log(this.Dpoints);
        this.scene.grid.remove();
        this.scene.camera.setDistance(0,1)
        this.scene.camera.setFocalPoint(new pc.Vec3(0,0,0), 1 )
        this.scene.camera.ortho = true;
        this.scene.camera.maxElev = 30;
        this.scene.camera.minElev = -30;
        this.scene.camera.flySpeed = 0.1;
        this.scene.camera.fov = 120;
        this.svg.style.display = 'none';
        this.parent.style.display = 'none';
        this.parent.removeEventListener('pointerdown', this.pointerdown);
        this.parent.removeEventListener('pointermove', this.pointermove);
        this.parent.removeEventListener('pointerup', this.pointerup);
        this.parent.removeEventListener('dblclick', this.dblclick);

        const polygon2D = this.Dpoints.map(p => ({ x: p.x, y: p.z }));
        this.scene.camera.setWalkablePolygon(polygon2D)



        this.points = [];
        this.paint();




    }

    getPolygon(): Point[] {
        return this.Dpoints.map(p => ({ x: p.x, y: p.z }));
    }


/**
 * Prüft, ob Punkt innerhalb eines 2D-Polygons liegt
 * @param point Der zu testende Punkt
 * @param polygon Die Punkte des Polygons, im Uhrzeigersinn oder Gegenuhrzeigersinn
 * @returns true, wenn Punkt innerhalb liegt
 */
public isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect =
            yi > point.y !== yj > point.y &&
            point.x < (xj - xi) * (point.y - yi) / (yj - yi + 1e-10) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

}

export { WalkableAreaSelector };
