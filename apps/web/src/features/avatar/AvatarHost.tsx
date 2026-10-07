import {useEffect,useRef,useState} from 'react';
import {Behavior,type Role} from './behavior/machine';
import {manifestSchema,type AvatarRenderer} from './renderer/adapter';
import {RigRenderer} from './renderer/rig';
import {sceneDefinitions,type Scene} from './behavior/scenes';
import {steps} from './tour/steps';
const preference=(key:string)=>{try{return localStorage.getItem(key)==='true'}catch{return false}};
const save=(key:string,value:boolean)=>{try{localStorage.setItem(key,String(value))}catch{}};
export default function AvatarHost({motion,activeSection,path}:{motion:boolean;activeSection:string;path:string}) {
  const [hidden,setHidden]=useState(()=>preference('avatar-hidden'));
  const [paused,setPaused]=useState(()=>preference('avatar-paused'));
  const [ready,setReady]=useState(false);
  const artwork=useRef<HTMLImageElement|null>(null);
  const sceneArt=useRef<HTMLImageElement|null>(null);
  const [selectedScene,setSelectedScene]=useState<Scene>('rest');
  const [menu,setMenu]=useState(false);
  const [tour,setTour]=useState<number|null>(null);
  const [visible,setVisible]=useState(!document.hidden);
  const [reaction,setReaction]=useState('');
  const token=useRef<HTMLCanvasElement>(null),button=useRef<HTMLButtonElement>(null);
  const renderer=useRef<AvatarRenderer|null>(null);
  const behavior=useRef(new Behavior());
  const host=useRef<HTMLDivElement>(null);
  const role=useRef<Role>('casual');
  const available=steps.filter(s=>document.getElementById(s.id));
  const step=tour===null?null:available[tour];
  useEffect(()=>{const change=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[]);
  useEffect(()=>{
    if(hidden||ready)return;
    const abort=new AbortController();
    fetch('/assets/avatar/manifest.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Avatar manifest unavailable');return r.json()}).then(async data=>{
      const manifest=manifestSchema.parse(data);
      const loadAtlas=async(src:string)=>{const image=new Image();image.src=src;await image.decode();artwork.current=image};
      if(manifest.renderer!=='cutout-2d')throw Error('Expected layered 2D avatar');
      await loadAtlas(manifest.atlas);
      const sceneImage=new Image();sceneImage.src=manifest.sceneAtlas;await sceneImage.decode();sceneArt.current=sceneImage;
      if(!abort.signal.aborted)setReady(true)}).catch(error=>{if(!abort.signal.aborted)console.warn('[avatar]',error)});
    return()=>abort.abort();
  },[hidden,ready]);
  const shown=ready&&!hidden;
  useEffect(()=>{
    if(!shown||!token.current)return;
    if(!artwork.current||!sceneArt.current)return;
    const adapter=new RigRenderer(token.current,artwork.current,sceneArt.current);
    renderer.current=adapter;
    behavior.current.reset(performance.now());
    if(motion&&!paused&&visible)adapter.play('wave');
    return()=>{adapter.dispose();renderer.current=null};
  },[shown]);
  useEffect(()=>{
    const adapter=renderer.current;if(!adapter)return;
    const restricted=paused||!motion||!visible;
    adapter.setPaused(restricted);
    behavior.current.reset(performance.now());
    if(restricted)return;
    const tick=()=>adapter.play(behavior.current.tick(performance.now(),false,tour!==null));
    const timer=setInterval(tick,200);
    return()=>clearInterval(timer);
  },[paused,motion,visible,shown,tour]);
  useEffect(()=>{
    setMenu(false);setTour(null);
  },[path]);
  useEffect(()=>{
    const timer=setTimeout(()=>{role.current=activeSection==='work'?'developer':'casual';renderer.current?.setRole(role.current)},2000);
    return()=>clearTimeout(timer);
  },[activeSection]);
  useEffect(()=>{
    if(tour===null)return;
    const end=()=>setTour(null);
    window.addEventListener('wheel',end,{passive:true});window.addEventListener('touchmove',end,{passive:true});
    return()=>{window.removeEventListener('wheel',end);window.removeEventListener('touchmove',end)};
  },[tour]);
  const close=()=>{setMenu(false);setTour(null);button.current?.focus()};
  const react=()=>{
    if(paused)return;
    if(!motion){setReaction('Hello!');return;}
    if(behavior.current.poke(performance.now(),!visible)){renderer.current?.play('poke');setReaction('Hello!')}
  };
  const navigate=(index:number)=>{
    const target=available[index];if(!target){close();return;}
    renderer.current?.endScene?.();
    setTour(index);setMenu(true);document.getElementById(target.id)?.scrollIntoView({behavior:motion?'smooth':'instant',block:'start'});
  };
  if(hidden)return <div data-avatar-host className="fixed right-3 bottom-28 z-30"><button className="rounded-full border border-white/30 bg-ink px-4 py-2 text-sm" onClick={()=>{save('avatar-hidden',false);setHidden(false)}}>Restore companion</button></div>;
  if(!shown)return null;
  return <div ref={host} data-avatar-host className="pointer-events-none fixed inset-0 z-30" onKeyDown={e=>{if(e.key==='Escape')close()}}>
    <div className="pointer-events-auto absolute right-3 h-[162px] w-[144px] sm:right-6 sm:h-[234px] sm:w-[208px]" style={{bottom:'calc(100px + env(safe-area-inset-bottom))'}}>
      <button ref={button} aria-label="Companion actions" aria-expanded={menu} onClick={()=>{react();setMenu(!menu)}} className="h-full w-full rounded-xl bg-transparent text-center">
        <canvas ref={token} className="h-full w-full object-contain" aria-hidden="true" />
      </button>
    </div>
    {menu&&<section aria-label="Companion controls" className="pointer-events-auto absolute right-3 bottom-[350px] max-h-[45svh] w-[min(320px,calc(100vw-24px))] overflow-auto rounded-xl border border-white/25 bg-ink p-5 shadow-xl">
      <p className="mb-3 text-sm text-muted">Parth’s companion · casual preview</p>
      <div aria-live="polite">{step?<><h2 className="mb-2 text-lg">{step.title}</h2><p className="mb-4 text-base">{step.text}</p></>:reaction&&<p className="mb-3">{reaction}</p>}</div>
      {step?<div className="mb-4 flex gap-4"><button disabled={tour===0} onClick={()=>navigate(tour!-1)}>Back</button><button onClick={()=>navigate(tour!+1)}>{tour===available.length-1?'Finish':'Next'}</button><button onClick={close}>End tour</button></div>:null}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Try a scene<select value={selectedScene} onChange={e=>setSelectedScene(e.target.value as Scene)} className="mt-2 block rounded border border-white/25 bg-ink p-2 text-paper">{Object.entries(sceneDefinitions).map(([id,scene])=><option key={id} value={id}>{scene.label}</option>)}</select></label>
        <button disabled={paused||!motion||tour!==null} className="rounded border border-white/20 px-3 py-2 text-sm disabled:opacity-40" onClick={()=>{behavior.current.request(selectedScene,performance.now());renderer.current?.play(selectedScene);setMenu(false)}}>Play scene</button>
        <button className="rounded border border-white/20 px-3 py-2 text-sm" onClick={()=>{renderer.current?.endScene?.();behavior.current.reset(performance.now())}}>Back to idle</button>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <button disabled={paused||!motion} onClick={()=>{behavior.current.request('wave',performance.now());renderer.current?.play('wave')}} className="rounded border border-white/20 px-3 py-2 disabled:opacity-40">Wave</button>
        <button disabled={paused} onClick={react} className="rounded border border-white/20 px-3 py-2 disabled:opacity-40">React</button>
        {available.length>0&&tour===null&&<button className="rounded border border-white/20 px-3 py-2" onClick={()=>navigate(0)}>Take a tour</button>}
        <button className="rounded border border-white/20 px-3 py-2" onClick={()=>{setPaused(!paused);save('avatar-paused',!paused)}}>{paused?'Resume':'Pause'}</button>
        <button className="rounded border border-white/20 px-3 py-2" onClick={()=>{setHidden(true);save('avatar-hidden',true);setMenu(false);setTour(null)}}>Hide</button>
        <button className="rounded border border-white/20 px-3 py-2" onClick={close}>Close</button>
      </div>
    </section>}
  </div>;
}
