import {useId, useState, useSyncExternalStore} from 'react';
import type {Content} from '../../services/content';

type Job = Content['experience'][number];

/** Matches Tailwind's `md` breakpoint. Below it the timeline collapses to role, period and employer. */
const query = '(max-width: 767.98px)';
const subscribe = (change: () => void) => {
  const list = window.matchMedia(query);
  list.addEventListener('change', change);
  return () => list.removeEventListener('change', change);
};
const useCompact = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);

/**
 * The experience timeline. On phones each job shows only its role, period and employer, so the whole
 * sequence fits on a screen or two; tapping a job reveals its highlights. From md up every job is open
 * and there is nothing to toggle, so the heading is plain text rather than a button.
 */
export function Experience({jobs}: {jobs: Job[]}) {
  const compact = useCompact();
  return (
    <ol className="border-l border-white/20">
      {jobs.map(job => (
        <Entry key={job.id} job={job} compact={compact} />
      ))}
    </ol>
  );
}

function Entry({job, compact}: {job: Job; compact: boolean}) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const expanded = !compact || open;
  const summary = (
    <>
      <span className="flex flex-wrap items-baseline justify-between gap-x-5">
        <span className="text-lg md:text-xl">{job.role}</span>
        <span className="label shrink-0 text-muted">{job.period}</span>
      </span>
      <span className="mt-1.5 block text-muted">
        {job.organization}
        {job.location ? ` · ${job.location}` : ''}
      </span>
    </>
  );

  return (
    <li className="relative pb-8 pl-7 last:pb-0 md:pb-11">
      <span className="absolute -left-[3.5px] top-2.5 h-1.5 w-1.5 rounded-full bg-amber" />
      <h3>
        {compact ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panel}
            onClick={() => setOpen(!open)}
            className="flex w-full items-start gap-4 text-left"
          >
            <span className="min-w-0 flex-1">{summary}</span>
            <span
              aria-hidden="true"
              className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-amber transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
            >
              <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 1.5v9M1.5 6h9" />
              </svg>
            </span>
            <span className="sr-only">{open ? 'Hide details' : 'Show details'}</span>
          </button>
        ) : (
          summary
        )}
      </h3>
      {/* The grid-rows transition animates to the content's natural height without measuring it. */}
      <div
        id={panel}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        inert={!expanded || undefined}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2.5 pt-5">
            {job.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 leading-7 text-muted">
                <span aria-hidden="true" className="text-amber">
                  —
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
