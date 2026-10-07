export const sceneDefinitions={
 rest:{label:'Couch rest',duration:24000},
 nap:{label:'Couch nap',duration:36000},
 scroll:{label:'Phone scrolling',duration:28000},
 study:{label:'Study at the desk',duration:30000},
 balance:{label:'Chair near-fall',duration:9000},
} as const;
export type Scene=keyof typeof sceneDefinitions;
export const isScene=(name:string):name is Scene=>Object.hasOwn(sceneDefinitions,name);
export const ease=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
export const sceneExit=1800;
export function scenePose(scene:Scene,elapsed:number){
 const total=sceneDefinitions[scene].duration;
 const exiting=ease((elapsed-total+sceneExit)/sceneExit);
 const presence=ease(elapsed/1100)*(1-exiting);
 const seated=ease((elapsed-650)/1400)*(1-ease((elapsed-total+sceneExit)/1100));
 const activity=ease((elapsed-2200)/800)*(1-ease((elapsed-total+sceneExit+300)/700));
 const nap=ease((elapsed-4500)/3000)*activity;
 const lean=scene==='balance'?(ease((elapsed-2400)/1500)-ease((elapsed-4500)/500))*.19:0;
 const catchAmount=scene==='balance'?ease((elapsed-4200)/200)*(1-ease((elapsed-5400)/900)):0;
 const settle=scene==='balance'&&elapsed>4800?Math.sin((elapsed-4800)/100)*Math.exp(-(elapsed-4800)/350)*.025:0;
 return {presence,seated,activity,nap,lean:lean+settle,catchAmount,finished:elapsed>=total};
}
