import React,{useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import type {Clip,Interest} from '../../services/content';
function Frame({clip,motion}:{clip:Clip;motion:boolean}){const ref=useRef<HTMLVideoElement>(null);
useEffect(()=>{const video=ref.current;if(!video)return;let visible=false,starting:Promise<void>|null=null;
const sync=()=>{const wanted=visible&&!document.hidden;if(wanted&&video.paused&&!starting)starting=video.play().catch(()=>{}).finally(()=>{starting=null});else if(!wanted&&!video.paused)starting?starting.then(()=>video.pause()):video.pause()};
const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{rootMargin:'250px'});observer.observe(video);
document.addEventListener('visibilitychange',sync);video.addEventListener('canplay',sync);
return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);video.removeEventListener('canplay',sync)}},[motion]);
return <div className={`overflow-hidden bg-ink ${clip.wide?'col-span-2 aspect-[3/2]':'aspect-[3/4]'}`}>{motion
?<video ref={ref} src={clip.src} poster={clip.poster} role="img" aria-label={clip.alt} muted loop playsInline preload="none" className="h-full w-full object-cover"/>
:<img src={clip.poster} alt={clip.alt} loading="lazy" decoding="async" className="h-full w-full object-cover"/>}</div>}
export default function Reel({interest,motion}:{interest:Interest;motion:boolean}){const {reel,kicker,title,description,slug,story}=interest;const open=slug&&story;
return <section className="relative isolate border border-white/20 bg-panel p-7 hover:border-amber/60 sm:p-10">
<p className="label text-amber">{kicker??'Photography'}</p>
<h3 className="mt-3 text-3xl sm:text-4xl">{open?<Link to={`/after-hours/${slug}`} className="after:absolute after:inset-0 after:content-['']">{title}</Link>:title}</h3>
<p className="mt-3 max-w-xl leading-7 text-muted">{description}</p>
{open&&<span className="mt-6 block text-amber">Read the story ↗</span>}
<div role="group" aria-label={`Clips from recent ${title.toLowerCase()} shoots`} className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">{reel.map(c=><Frame key={c.src} clip={c} motion={motion}/>)}</div>
</section>}
