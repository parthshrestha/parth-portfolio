import type {Clip,Role} from '../behavior/machine';
import type {AvatarRenderer} from './adapter';
import {duration,pose} from './rig-motion';
import {isScene,sceneDefinitions,scenePose,sceneExit,ease} from '../behavior/scenes';
interface Part {x:number;y:number;width:number;height:number}
/** Small Canvas 2D cutout skeleton. Artwork, pivots and motion are independent of the host. */
export class RigRenderer implements AvatarRenderer {
 private context:CanvasRenderingContext2D;
 private parts:Part[]=[];
 private sceneParts:Part[]=[];
 private queued:Clip|null=null;
 private frame=0;
 private paused=false;
 private disposed=false;
 private clock=0;
 private last=0;
 private clip:Clip='idle';
 private started=0;
 private nextBlink=3000+Math.random()*4000;
 private blinkUntil=0;
 private gazeX=0;
 private gazeY=0;
 private targetX=0;
 private targetY=0;
 private gazeUntil=0;
 private nextGaze=0;
 private rendered=pose('idle',0,0);
 private blendStep=1;
 constructor(private canvas:HTMLCanvasElement,private image:HTMLImageElement,private sceneImage:HTMLImageElement) {
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D avatar canvas unavailable');this.context=ctx;
  canvas.width=320;canvas.height=360;
  const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
  const sc=source.getContext('2d',{willReadFrequently:true});if(!sc)throw Error('Avatar parts unavailable');
  sc.drawImage(image,0,0);const pixels=sc.getImageData(0,0,source.width,source.height).data;
  const rows=[0,420,810,1254],u=source.width/1254;
  for(let i=0;i<9;i++){
   const row=Math.floor(i/3),col=i%3;let x1=source.width,y1=source.height,x2=0,y2=0;
   for(let y=Math.ceil(rows[row]*u);y<Math.floor(rows[row+1]*u);y++)for(let x=Math.ceil(col*418*u);x<Math.floor((col+1)*418*u);x++){
    if(pixels[(y*source.width+x)*4+3]<100)continue;
    x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);
   }
   if(x2<x1||y2<y1)throw Error(`Missing avatar part ${i}`);
   this.parts.push({x:x1,y:y1,width:x2-x1+1,height:y2-y1+1});
  }
  source.width=sceneImage.naturalWidth;source.height=sceneImage.naturalHeight;sc.drawImage(sceneImage,0,0);
  const scenePixels=sc.getImageData(0,0,source.width,source.height).data;
  const sceneUnit=source.width/1254;
  const ys=[0,314,628,938,1254];
  for(let i=0;i<16;i++){
   const row=Math.floor(i/4),col=i%4;
   const xs=row===1?[0,345,650,935,1254]:[0,313.5,627,940.5,1254];
   let x1=source.width,y1=source.height,x2=0,y2=0;
   for(let y=Math.ceil(ys[row]*sceneUnit);y<Math.floor(ys[row+1]*sceneUnit);y++)for(let x=Math.ceil(xs[col]*sceneUnit);x<Math.floor(xs[col+1]*sceneUnit);x++){
    if(scenePixels[(y*source.width+x)*4+3]<100)continue;
    x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);
   }
   if(x2<x1||y2<y1)throw Error(`Missing scene part ${i}`);
   this.sceneParts.push({x:x1,y:y1,width:x2-x1+1,height:y2-y1+1});
  }
  this.draw();this.frame=requestAnimationFrame(this.tick);
  window.addEventListener('pointermove',this.pointer,{passive:true});
 }
 private pointer=(e:PointerEvent)=>{
  if(this.paused||this.disposed||e.pointerType!=='mouse'||this.clock<this.nextGaze)return;
  const r=this.canvas.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height*.3;
  if(Math.hypot(dx,dy)>240)return;
  this.targetX=Math.max(-1,Math.min(1,dx/120));this.targetY=Math.max(-1,Math.min(1,dy/120));
  this.gazeUntil=this.clock+900+Math.random()*900;this.nextGaze=this.clock+4500+Math.random()*3500;
 };
 private part(id:number,x:number,y:number,w:number,h:number,from=0,to=1){
  const p=this.parts[id];this.context.drawImage(this.image,p.x,p.y+p.height*from,p.width,p.height*(to-from),x,y,w,h);
 }
 private scenePart(id:number,x:number,y:number,w:number,h:number){
  const p=this.sceneParts[id];this.context.drawImage(this.sceneImage,p.x,p.y,p.width,p.height,x,y,w,h);
 }
 private arm(side:'left'|'right',shoulder:number,elbow:number,wrist:number,open:boolean,prop:'phone'|'pencil'|null=null,point=false){
  const ctx=this.context,left=side==='left';
  ctx.save();ctx.translate(left?111:209,176);ctx.rotate(shoulder);
  // Separate authored upper-arm and forearm pieces, each with a painted overlap at the elbow.
  this.scenePart(left?0:2,-14,-8,28,54);
  ctx.translate(0,38);ctx.rotate(elbow);
  this.scenePart(left?1:3,-12,-8,25,51);
  ctx.translate(0,38);ctx.rotate(wrist);
  if(prop){
   ctx.rotate(-shoulder-elbow-wrist);
   if(prop==='phone'){this.scenePart(8,-10,-31,27,43);this.scenePart(11,-15,-4,19,24)}
   else {this.scenePart(10,-4,-12,12,34);this.scenePart(11,-12,-5,23,25)}
  }else if(point){ctx.rotate(-shoulder-elbow-wrist-.55);this.scenePart(15,-13,-21,21,29)}
  else if(open){ctx.rotate(Math.PI);this.part(7,-12,-27,25,30)}
  else {if(left)ctx.scale(-1,1);this.part(8,-10,-3,21,30)}
  ctx.restore();
 }
 private draw(){
  const ctx=this.context,t=this.clock/1000,target=pose(this.clip,this.clock-this.started,t);
  // Keep continuity when a poke interrupts a pose or a gesture finishes.
  for(const key of ['breath','body','head','shoulderLeft','elbowLeft','wrist','shoulderRight','elbowRight','lift'] as const){
   this.rendered[key]+=(target[key]-this.rendered[key])*this.blendStep;
  }
  this.rendered.smile=target.smile;
  const p=this.rendered;
  ctx.clearRect(0,0,320,360);
  const elapsed=this.clock-this.started;
  const scene=isScene(this.clip)?this.clip:null;
  const state=scene?scenePose(scene,elapsed):null;
  const sit=state?.seated??0,activity=state?.activity??0;
  const onCouch=scene==='rest'||scene==='nap'||scene==='scroll';
  const sleeping=scene==='nap'?(state?.nap??0):0;
  const scrolling=scene==='scroll'?activity:0,studying=scene==='study'?activity:0;
  const catching=state?.catchAmount??0;
  // Furniture and seated body share the same rear-foot pivot in the chair gag.
  ctx.save();
  if(scene==='balance'){ctx.translate(214,344);ctx.rotate(state!.lean);ctx.translate(-214,-344);}
  if(state){
   ctx.save();ctx.globalAlpha=state.presence;
   const slide=(1-state.presence)*280;
   if(onCouch)this.scenePart(4,10+slide,206,300,141);
   else this.scenePart(6,103+slide,192,137,155);
   ctx.restore();
  }
  ctx.save();ctx.globalAlpha=1-sit;this.part(6,109,229,102,116);ctx.restore();
  if(sit>0){ctx.save();ctx.globalAlpha=sit;this.scenePart(7,108,254,104,92);ctx.restore();}
  const relaxed=onCouch?sit:0;
  ctx.save();ctx.translate(160,237+sit*28);ctx.rotate(p.body+sleeping*.035);ctx.translate(-160,-237-p.lift);
  const reach=state?(1-ease((elapsed-1500)/600))*ease(elapsed/500)*(1-activity):0;
  const swipe=scrolling*Math.max(0,Math.sin(t*1.8))*Math.pow(Math.max(0,Math.sin(t*.47)),8);
  const write=studying*Math.sin(t*5)*.035*Math.pow(Math.max(0,Math.sin(t*.8)),2);
  const leftShoulder=p.shoulderLeft+relaxed*.05+scrolling*.15+studying*.13+catching*.55;
  const leftElbow=p.elbowLeft-relaxed*.3-scrolling*.95-studying*1.1+catching*1.3;
  const rightShoulder=p.shoulderRight-relaxed*.05-scrolling*.12-studying*.16-reach*.5-catching*.7;
  const rightElbow=p.elbowRight+relaxed*.3+scrolling*1.15+studying*1.3+write+catching*1.4;
  this.arm('right',rightShoulder,rightElbow,swipe*.13,false,studying>.1?'pencil':null,scrolling>.1);
  this.arm('left',leftShoulder,leftElbow,p.wrist,this.clip==='wave'&&p.elbowLeft>1.1,scrolling>.1?'phone':null);
  this.part(3,106,147-p.breath,108,103+p.breath);
  ctx.save();ctx.translate(160+this.gazeX*2,164-p.breath+sleeping*3);ctx.rotate(p.head+this.gazeX*.04+sleeping*.10+studying*.045);
  if(catching>.15)this.scenePart(14,-87,-143,174,149);
  else if(sleeping>.45)this.scenePart(12,-87,-143,174,149);
  else if((scrolling>.1||studying>.1)&&this.clock>=this.blinkUntil)this.scenePart(13,-87,-143,174,149);
  else {const head=this.clock<this.blinkUntil?1:p.smile?2:0;this.part(head,-87,-143+this.gazeY*1.2,174,149);}
  ctx.restore();ctx.restore();ctx.restore();
  if(scene==='study'&&state){
   ctx.save();ctx.globalAlpha=state.presence;
   this.scenePart(5,43+(1-state.presence)*280,267,236,82);
   this.scenePart(9,119,249,86,32);
   // Infrequent page turn, with long reading/writing holds between turns.
   const pagePhase=(elapsed%12000)/12000;
   if(pagePhase>.83&&pagePhase<.95&&activity>.9){
    const fold=Math.sin((pagePhase-.83)/.12*Math.PI);
    ctx.save();ctx.translate(162,252);ctx.scale(Math.max(.05,1-fold),1);this.scenePart(9,0,0,43,28);ctx.restore();
   }
   ctx.restore();
  }
 }

 private tick=(now:number)=>{
  this.frame=0;if(this.paused||this.disposed)return;
  if(this.last&&now-this.last<32){this.frame=requestAnimationFrame(this.tick);return;}
  const dt=this.last?Math.min(now-this.last,80):33;this.last=now;this.clock+=dt;this.blendStep=1-Math.exp(-dt/85);
  if(this.clip!=='idle'&&this.clock-this.started>=duration[this.clip]){this.clip=this.queued??'idle';this.queued=null;this.started=this.clock;}
  if(this.clock>=this.nextBlink){this.blinkUntil=this.clock+150;this.nextBlink=this.clock+2800+Math.random()*5200;}
  if(this.clock>this.gazeUntil){this.targetX=0;this.targetY=0;}
  const ease=1-Math.exp(-dt/220);this.gazeX+=(this.targetX-this.gazeX)*ease;this.gazeY+=(this.targetY-this.gazeY)*ease;
  this.draw();this.frame=requestAnimationFrame(this.tick);
 };
 play(clip:Clip){
  if(this.disposed||this.paused||clip===this.clip)return;
  if(clip==='idle'&&this.clip!=='idle')return;
  if(isScene(this.clip)){this.endScene();this.queued=clip;return;}
  this.clip=clip;this.started=this.clock;
 }
 endScene(){
  if(!isScene(this.clip))return;
  const end=sceneDefinitions[this.clip].duration-sceneExit;
  if(this.clock-this.started<end)this.started=this.clock-end;
  this.queued=null;
 }
 setRole(_role:Role){}
 setPaused(value:boolean){
  if(value===this.paused)return;this.paused=value;cancelAnimationFrame(this.frame);this.frame=0;this.last=0;
  if(value){this.targetX=0;this.targetY=0;}
  else {this.nextBlink=this.clock+2000+Math.random()*4000;this.frame=requestAnimationFrame(this.tick);}
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);window.removeEventListener('pointermove',this.pointer);}
}
