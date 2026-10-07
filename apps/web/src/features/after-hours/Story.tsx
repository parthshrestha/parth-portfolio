import React,{useEffect} from 'react';
import {Link} from 'react-router-dom';
import type {Interest} from '../../services/content';
import Schematic from './Schematic';
export default function Story({interest}:{interest:Interest}){const story=interest.story!;
useEffect(()=>{document.title=`${interest.title} — Parth Shrestha`;return()=>{document.title='Parth Shrestha — Software developer'}},[interest.title]);
return <main id="main" className="mx-auto max-w-5xl px-6 pt-40 pb-28">
<Link to="/#after-hours" className="text-amber">← After hours</Link>
<p className="label mt-12 text-muted">{story.kicker}</p>
<h1 className="mt-6 max-w-3xl text-4xl leading-tight sm:text-5xl">{story.headline}</h1>
<p className="mt-7 max-w-3xl text-xl leading-9 text-muted">{story.lede}</p>
{story.cover&&<img src={story.cover.src} alt={story.cover.alt} className="mt-12 max-h-[70svh] w-full object-cover"/>}
{story.links.length>0&&<div className="mt-9 flex flex-wrap gap-4">{story.links.map(l=>l.href.startsWith('/')?<Link key={l.href} to={l.href} className="border border-white/30 px-7 py-3.5 hover:border-amber hover:text-amber">{l.label}</Link>:<a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="bg-amber px-7 py-3.5 text-ink hover:opacity-90">{l.label}</a>)}</div>}
{story.specs.length>0&&<dl className="mt-12 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 md:grid-cols-3">{story.specs.map(s=><div key={s.label} className="bg-ink p-6"><dt className="label text-muted">{s.label}</dt><dd className="mt-2.5">{s.value}</dd></div>)}</dl>}
{story.chapters.map(c=><section key={c.id} className="mt-24">
<h2 className="max-w-2xl text-2xl sm:text-3xl">{c.title}</h2>
{c.body.map((t,i)=><p key={i} className="mt-6 max-w-2xl leading-8 text-muted">{t}</p>)}
{c.diagram&&<Schematic diagram={c.diagram}/>}
{c.image&&<img src={c.image.src} alt={c.image.alt} loading="lazy" decoding="async" className="mt-10 max-h-[70svh] w-full object-cover"/>}
</section>)}
<div className="mt-24 border-t border-white/20 pt-10"><Link to="/#after-hours" className="border-b border-amber pb-2 text-lg hover:text-amber">Back to after hours ↗</Link></div>
</main>}
