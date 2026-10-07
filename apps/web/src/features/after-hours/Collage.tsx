import React from 'react';
import {Link} from 'react-router-dom';
import type {Interest,Shot} from '../../services/content';
const widths=['w-[150px]','w-[220px]','w-[128px]','w-[190px]','w-[164px]','w-[240px]'];
function Row({shots,height,reverse,slow}:{shots:Shot[];height:string;reverse?:boolean;slow?:boolean}){return <div className={`drift ${slow?'drift-slow':''} ${reverse?'drift-rev':''}`}>{[...shots,...shots].map((s,i)=><img key={`${s.src}-${i}`} src={s.thumb} alt="" aria-hidden="true" loading="lazy" decoding="async" className={`${widths[i%shots.length]} ${height} mr-3 shrink-0 object-cover`}/>)}</div>}
export default function Collage({interest,motion}:{interest:Interest;motion:boolean}){const {gallery,story,slug,title,description}=interest;const second=[...gallery.slice(3),...gallery.slice(0,3)];
return <Link to={`/after-hours/${slug}`} aria-label={`${title} — read the full build story`} className="collage group relative isolate block overflow-hidden border border-white/20 bg-panel hover:border-amber/60">
{motion?<div className="fade-x flex flex-col gap-3 pt-3 pb-28 opacity-85 sm:pb-32 transition duration-500 group-hover:opacity-100"><Row shots={gallery} height="h-44 sm:h-56"/><Row shots={second} height="h-36 sm:h-48" reverse slow/></div>
:<div className="grid grid-cols-3 gap-3 p-3 pb-44 opacity-85 sm:grid-cols-6 sm:pb-48">{gallery.map(s=><img key={s.src} src={s.thumb} alt="" aria-hidden="true" loading="lazy" className="h-36 w-full object-cover sm:h-44"/>)}</div>}
<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink from-40% via-ink/90 via-72% to-transparent px-7 pt-28 pb-8 sm:px-10 sm:pt-32 sm:pb-10">
<p className="label text-amber">{story?.kicker??'Personal project'}</p>
<h3 className="mt-3 text-3xl sm:text-4xl">{title}</h3>
<p className="mt-3 line-clamp-2 max-w-xl leading-7 text-muted sm:line-clamp-none">{description}</p>
<span className="mt-6 block text-amber">Open the build ↗</span>
</div></Link>}
