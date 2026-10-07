import {z} from 'zod';
import type {Clip, Role} from '../behavior/machine';
export const clipNames = ['idle', 'wave', 'poke', 'think', 'stretch'] as const;
const assetPath = (ext: string) => z.string().regex(new RegExp(`^/assets/avatar/[\\w.-]+\\.${ext}$`));
const shared = {
  schemaVersion: z.literal(1),
  productionReady: z.literal(false),
  roles: z.array(z.literal('casual')).min(1),
  bounds: z.object({width: z.number().positive().max(180), height: z.number().positive().max(180)}),
};
/** Authored frame atlas drawn on a 2D canvas. */
export const atlasManifest = z.object({...shared, renderer: z.literal('frame-atlas'), clips: z.array(z.enum(['idle', 'wave', 'poke'])).refine(c => c.includes('idle')), atlas: assetPath('(png|webp)')});
/** Rigged GLB with animation clips; each clip comes from the model file or from a separate GLB on the same rig. */
export const glbManifest = z.object({
  ...shared,
  renderer: z.literal('glb'),
  model: assetPath('glb'),
  clips: z.partialRecord(z.enum(clipNames), z.object({file: assetPath('glb').optional(), name: z.string().optional(), loop: z.boolean().optional()})).refine(c => !!c.idle, 'idle clip required'),
  fallback: z.object({atlas: assetPath('(png|webp)')}).optional(),
});
export const rigManifest = z.object({...shared,renderer:z.literal('cutout-2d'),atlas:assetPath('(png|webp)'),sceneAtlas:assetPath('(png|webp)'),clips:z.array(z.enum(['idle','wave','poke','think','stretch','rest','nap','scroll','study','balance'])).refine(c=>c.includes('idle'))});
export const manifestSchema = z.discriminatedUnion('renderer', [atlasManifest, glbManifest, rigManifest]);
export type Manifest = z.infer<typeof manifestSchema>;
export type GlbManifest = z.infer<typeof glbManifest>;
export interface AvatarRenderer {play(clip:Clip):void;setRole(role:Role):void;setPaused(value:boolean):void;endScene?():void;dispose():void}
// Durations are per frame. Wave omits frame 6, which changes the raised hand.
export const sequences = {
 idle: [[0,3200],[2,140],[0,2200]],
 wave: [[4,220],[5,1800],[4,220],[0,240]],
 poke: [[8,220],[10,400],[0,200]],
} as const;
/** Limited, authored frame-atlas animation; no skeletal runtime or fabricated wardrobe. */
export class AtlasRenderer implements AvatarRenderer {
  private timer=0;
  private transition=0;
  private displayed=0;
  private clip:keyof typeof sequences='idle';
  private index=0;
  private paused=false;
  private disposed=false;
  private crops: {x:number;y:number;width:number;height:number;footX:number}[]=[];
  constructor(private canvas:HTMLCanvasElement,private image:HTMLImageElement) {
    canvas.width=320;canvas.height=360;
    const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
    const context=source.getContext('2d',{willReadFrequently:true})!;context.drawImage(image,0,0);
    const pixels=context.getImageData(0,0,source.width,source.height).data;
    const rows=[0,326,638,943,1254],unit=source.width/1254;
    for(let frame=0;frame<12;frame++){
      const row=Math.floor(frame/4),col=frame%4;
      let left=source.width,top=source.height,right=0,bottom=0;
      for(let y=Math.ceil(rows[row]*unit);y<Math.floor(rows[row+1]*unit);y++)for(let x=Math.ceil(col*313.5*unit);x<Math.floor((col+1)*313.5*unit);x++){
        if(pixels[(y*source.width+x)*4+3]<100)continue;
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
      // Anchor the body at its feet, not at the silhouette centre (which shifts with the raised hand).
      let footLeft=right,footRight=left;
      for(let y=Math.max(top,bottom-24);y<=bottom;y++)for(let x=left;x<=right;x++){
        if(pixels[(y*source.width+x)*4+3]>=100){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x)}
      }
      this.crops.push({x:left,y:top,width:right-left+1,height:bottom-top+1,footX:(footLeft+footRight)/2});
    }
    this.draw(0);
  }
  private draw(frame:number, previous?:number, blend=1) {
    const ctx=this.canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,320,360);
    const scale=330/this.crops[0].height;
    const paint=(id:number,alpha:number)=>{
      const crop=this.crops[id];
      ctx.globalAlpha=alpha;
      ctx.drawImage(this.image,crop.x,crop.y,crop.width,crop.height,160-(crop.footX-crop.x)*scale,350-crop.height*scale,crop.width*scale,crop.height*scale);
    };
    if(previous!==undefined&&blend<1)paint(previous,1-blend);
    paint(frame,blend);ctx.globalAlpha=1;
  }
  /** Hold the raised-arm pose and articulate only its hand around the wrist. */
  private waveHand(duration:number) {
    cancelAnimationFrame(this.transition);
    const ctx=this.canvas.getContext('2d');if(!ctx)return;
    const crop=this.crops[5],unit=this.image.naturalWidth/1254;
    const scale=330/this.crops[0].height;
    const x=160-crop.footX*scale,y=350-(crop.y+crop.height)*scale;
    const hand=new Path2D();
    const outline=[[363,403],[400,396],[414,418],[415,443],[404,467],[387,465],[369,447]];
    outline.forEach(([px,py],i)=>i?hand.lineTo(px*unit,py*unit):hand.moveTo(px*unit,py*unit));hand.closePath();
    const start=performance.now();
    const render=(now:number)=>{
      if(this.paused||this.disposed)return;
      const t=Math.min(1,(now-start)/duration);
      // Three lateral wrist swings, easing in and out without moving the shoulder or body.
      const envelope=Math.min(1,t*7,(1-t)*7);
      const angle=Math.sin(t*Math.PI*6)*0.24*Math.max(0,envelope);
      ctx.clearRect(0,0,320,360);
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
      const body=new Path2D();body.rect(crop.x,crop.y,crop.width,crop.height);body.addPath(hand);
      ctx.save();ctx.clip(body,'evenodd');ctx.drawImage(this.image,0,0);ctx.restore();
      ctx.translate(399*unit,463*unit);ctx.rotate(angle);ctx.translate(-399*unit,-463*unit);
      ctx.clip(hand);ctx.drawImage(this.image,0,0);ctx.restore();
      this.transition=t<1?requestAnimationFrame(render):0;
    };
    this.displayed=5;this.transition=requestAnimationFrame(render);
  }
  private show(frame:number,smooth:boolean) {
    cancelAnimationFrame(this.transition);this.transition=0;
    const previous=this.displayed;this.displayed=frame;
    if(!smooth||previous===frame){this.draw(frame);return;}
    const start=performance.now();
    const animate=(now:number)=>{
      if(this.disposed||this.paused)return;
      const t=Math.min(1,(now-start)/140);
      const eased=t*t*(3-2*t);
      this.draw(frame,previous,eased);
      this.transition=t<1?requestAnimationFrame(animate):0;
    };
    this.transition=requestAnimationFrame(animate);
  }

  private advance=()=>{
    if(this.disposed||this.paused)return;
    const frames=sequences[this.clip];
    if(this.index>=frames.length){this.clip='idle';this.index=0;}
    const [frame,duration]=sequences[this.clip][this.index++];
    if(this.clip==='wave'&&frame===5)this.waveHand(duration);
    else this.show(frame,this.clip==='wave');
    this.timer=window.setTimeout(this.advance,duration);
  };
  play(clip:Clip) {
    const next=clip==='wave'||clip==='poke'?clip:'idle';
    // Never interrupt a one-shot just because the idle scheduler ticks.
    if(next==='idle'&&this.clip!=='idle'&&this.timer)return;
    if(next===this.clip&&this.timer)return;
    clearTimeout(this.timer);this.timer=0;this.clip=next;this.index=0;
    if(!this.paused)this.advance();
  }
  setRole(_role:Role) { /* Only the casual outfit is currently authored. */ }
  setPaused(value:boolean) {
    if(this.paused===value)return;
    this.paused=value;clearTimeout(this.timer);this.timer=0;cancelAnimationFrame(this.transition);this.transition=0;
    if(value){this.clip='idle';this.index=0;this.displayed=0;this.draw(0)}else this.advance();
  }
  dispose(){this.disposed=true;clearTimeout(this.timer);cancelAnimationFrame(this.transition);this.timer=0;this.transition=0;}
}
