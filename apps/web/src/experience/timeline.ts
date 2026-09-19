export const experience={progress:0,heroComplete:false,avatarEnabled:false,invalidate:()=>{}};
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
export function stages(p:number){return {turn:smooth(.12,.43,p),disperse:smooth(.28,.85,p),opacity:1-smooth(.72,.98,p)}}
export function seeded(i:number){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
