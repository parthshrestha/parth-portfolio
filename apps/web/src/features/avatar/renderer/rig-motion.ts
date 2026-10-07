import type {Clip} from '../behavior/machine';
export const duration:Record<Clip,number>={idle:0,wave:2600,poke:1000,think:3200,stretch:3600,rest:24000,nap:36000,scroll:28000,study:30000,balance:9000};
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
// Different joints arrive and settle at different times, with a quiet hold between.
const gesture=(elapsed:number,length:number,delay=0,rise=450,fall=650)=>
 smooth((elapsed-delay)/rise)*(1-smooth((elapsed-length+fall)/fall));
/**
 * Resting arm angles. The artwork hangs both sleeves dead vertical, which reads as a paper doll, so the
 * rest pose opens the shoulders slightly and softens the elbows.
 */
export const rest={shoulder:.085,elbow:.05};
/**
 * Idle life. Every term is a sine of absolute time with no phase offset, so the whole body is at its rest
 * pose at time zero and gestures still start and finish from rest. Left and right use deliberately different
 * frequencies rather than a shared phase, so the two sides drift in and out of step instead of mirroring
 * each other, and the slowest terms act as a weight shift that never repeats on an obvious beat.
 */
function alive(time:number) {
 const shift=Math.sin(time*.14);
 return {
  breath:Math.sin(time*1.05)*2+Math.sin(time*.43)*.65,
  // Leaning the body and counter-tilting the head reads as the weight moving from one leg to the other.
  body:shift*.026+Math.sin(time*.23)*.009,
  head:-shift*.05+Math.sin(time*.33)*.014,
  shoulderLeft:Math.sin(time*.37)*.055+shift*.02,
  shoulderRight:-Math.sin(time*.31)*.055+shift*.02,
  elbowLeft:Math.sin(time*.41)*.04,
  elbowRight:-Math.sin(time*.29)*.04,
  lift:Math.sin(time*.19)*.7,
 };
}
export function pose(clip:Clip,elapsed:number,time:number) {
 const length=duration[clip];
 const amount=length?gesture(elapsed,length):0;
 const wave=clip==='wave'?amount:0;
 const elbowWave=clip==='wave'?gesture(elapsed,length,100,450,500):0;
 const stretch=clip==='stretch'?amount:0;
 const secondStretch=clip==='stretch'?gesture(elapsed,length,240,600,800):0;
 const think=clip==='think'?amount:0,poke=clip==='poke'?amount:0;
 const wristPhase=elapsed/1000*Math.PI*4;
 // Diminishing wrist arcs with a small timing variation, rather than a metronomic loop.
 const wristEnvelope=clip==='wave'?gesture(elapsed,2200,400,240,600):0;
 const idle=alive(time);
 // A raised arm stops swinging: idle sway fades out as a gesture takes the joint over.
 const leftBusy=1-Math.min(1,wave+stretch),rightBusy=1-Math.min(1,secondStretch+think);
 return {breath:idle.breath,body:idle.body+poke*.012,
   head:idle.head-wave*.035+think*.045,
   shoulderLeft:rest.shoulder*leftBusy+idle.shoulderLeft*leftBusy+wave*.8+stretch*.7,
   elbowLeft:rest.elbow*leftBusy+idle.elbowLeft*leftBusy+elbowWave*1.95+stretch*1.1,
   wrist:wristEnvelope*Math.sin(wristPhase+.08*Math.sin(wristPhase*.5))*(.26-.07*Math.min(1,elapsed/2200)),
   shoulderRight:-rest.shoulder*rightBusy+idle.shoulderRight*rightBusy-secondStretch*.65-think*.16,
   elbowRight:-rest.elbow*rightBusy+idle.elbowRight*rightBusy-secondStretch*1.15-think*1.8,
   lift:idle.lift+stretch*1.2-poke*Math.sin(elapsed/1000*Math.PI)*1.2,smile:clip==='poke'&&amount>.25};
}
