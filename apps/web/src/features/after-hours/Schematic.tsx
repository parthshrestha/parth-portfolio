import React from 'react';
import type {Diagram} from '../../services/content';
export default function Schematic({diagram}:{diagram:Diagram}){return <figure className="mt-10">
<a href={diagram.src} target="_blank" rel="noreferrer noopener" className="block rounded bg-paper p-4 sm:p-7" aria-label={`${diagram.alt} Opens the full-size diagram in a new tab.`}><img src={diagram.src} alt={diagram.alt} loading="lazy" decoding="async" className="w-full"/></a>
{diagram.caption&&<figcaption className="mt-3 font-mono text-xs leading-5 text-muted">{diagram.caption}</figcaption>}
</figure>}
