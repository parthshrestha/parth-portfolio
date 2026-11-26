import {Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {experience, schedule, stages} from '../../experience/timeline';
import {Arrow} from '../../ui/Arrow';

const Particles = lazy(() => import('./Particles'));
gsap.registerPlugin(ScrollTrigger);
// The mobile address bar showing or hiding resizes the viewport mid-scroll; recalculating then causes a jump.
ScrollTrigger.config({ignoreMobileResize: true});

class GraphicsBoundary extends Component<{children: ReactNode; onError: (reason: string) => void}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Tiny diagnostics overlay, shown when the URL has `?debug`: ready/failed state, progress and hero frame rate. */
function Diagnostics({ready, failed, motion}: {ready: boolean; failed: boolean; motion: boolean}) {
  const [line, setLine] = useState('');
  useEffect(() => {
    let last = experience.frames;
    const timer = setInterval(() => {
      const fps = (experience.frames - last) * 2;
      last = experience.frames;
      setLine(`motion ${motion ? 'on' : 'off'} · ready ${ready} · failed ${failed} · progress ${experience.progress.toFixed(2)} · ${fps} fps`);
    }, 500);
    return () => clearInterval(timer);
  }, [ready, failed, motion]);
  return <p className="label pointer-events-none absolute left-4 top-24 z-30 bg-ink/80 px-3 py-2 text-amber">{line}</p>;
}

const explore = [
  ['01', 'Selected work', 'work'],
  ['02', 'After hours', 'after-hours'],
  ['03', 'About me', 'about'],
  ['04', 'Let’s connect', 'contact'],
];

export default function Hero({motion}: {motion: boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const portrait = useRef<HTMLImageElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLAnchorElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Graphics problems are not user-facing errors: keep the static portrait, but say why in the console.
  const fail = (reason: string) => {
    console.warn('[hero] particles unavailable, showing the static portrait:', reason);
    setFailed(true);
  };

  useEffect(() => {
    if (!root.current) return;
    experience.progress = 0;
    experience.heroComplete = false;
    experience.invalidate();
    if (!motion || failed) {
      gsap.set([intro.current, cards.current, cue.current], {clearProps: 'all'});
      root.current.setAttribute('data-progress', '0');
      ScrollTrigger.refresh();
      return;
    }
    // One authoritative progress value; everything else is derived from it.
    const apply = (p: number) => {
      experience.progress = p;
      experience.heroComplete = p > schedule.fadeEnd;
      experience.invalidate();
      const s = stages(p);
      if (intro.current) intro.current.style.opacity = String(s.intro);
      if (cue.current) cue.current.style.opacity = String(s.cue);
      if (cards.current) {
        cards.current.style.opacity = String(s.cards);
        cards.current.style.visibility = s.cards > 0 ? 'visible' : 'hidden';
        cards.current.style.transform = `translate3d(0, ${(1 - s.cards) * 65}px, 0)`;
      }
      root.current?.setAttribute('data-progress', p.toFixed(3));
    };
    // Scroll events arrive in uneven steps, especially from touch momentum on phones. Rather than jumping
    // to each one, the rendered progress eases toward the scroll position on a short, frame-rate
    // independent lag, so the dispersal glides instead of stuttering.
    let shown = 0;
    let target = 0;
    const lag = 0.12; // seconds to cover ~63% of the remaining distance
    const follow = (_time: number, deltaMs: number) => {
      const step = 1 - Math.exp(-Math.min(deltaMs, 100) / 1000 / lag);
      shown += (target - shown) * step;
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        gsap.ticker.remove(follow);
      }
      apply(shown);
    };
    const chase = (p: number) => {
      target = p;
      gsap.ticker.remove(follow);
      gsap.ticker.add(follow);
    };
    const jump = (p: number) => {
      gsap.ticker.remove(follow);
      target = shown = p;
      apply(p);
    };
    const trigger = ScrollTrigger.create({
      trigger: root.current.parentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => chase(self.progress),
      onRefresh: self => jump(self.progress),
    });
    // Restored scroll positions and anchor visits must land on the matching frame, not on progress 0.
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      jump(trigger.progress);
    });
    return () => {
      cancelAnimationFrame(frame);
      gsap.ticker.remove(follow);
      trigger.kill();
    };
  }, [motion, failed]);

  const graphics = motion && !failed;
  const debug = /[?&]debug\b/.test(location.search);
  return (
    <div ref={root} className="hero-stage" data-progress="0" data-ready={ready} data-failed={failed}>
      {debug && <Diagnostics ready={ready} failed={failed} motion={motion} />}
      <div className="absolute inset-0 flex items-center justify-center pb-12 sm:pb-4">
        <img
          ref={portrait}
          src="/assets/hero/portrait-fallback.webp"
          alt="Dotted portrait of Parth Shrestha"
          className={`portrait h-auto w-[95vw] max-w-[690px] sm:w-[min(70vw,82vh)] ${graphics && ready ? 'opacity-0' : ''}`}
        />
      </div>
      {graphics && (
        <div className="absolute inset-0" aria-hidden="true">
          <GraphicsBoundary onError={fail}>
            <Suspense fallback={null}>
              <Particles portrait={portrait} onReady={() => setReady(true)} onError={fail} />
            </Suspense>
          </GraphicsBoundary>
        </div>
      )}
      <div ref={intro} className="pointer-events-none absolute inset-0">
        <div className="absolute left-6 top-[14%] z-10 max-w-[300px] md:left-[5vw] md:top-[31%]">
          <p className="font-mono text-base leading-relaxed tracking-wide md:text-2xl">
            Solving problems
            <br />
            one software solution at a time.
          </p>
          <div className="mt-5 h-px w-8 bg-amber" />
        </div>
        <p className="label absolute right-[5vw] top-[38%] hidden leading-7 text-muted lg:block">
          Code
          <br />
          Photography
          <br />
          Machines
          <span className="mt-5 block h-px w-7 bg-amber" />
        </p>
        <p className="label absolute bottom-32 left-[5vw] hidden leading-6 text-muted sm:block">
          A little curiosity.
          <br />A lot of possibility.
        </p>
      </div>
      <div ref={cards} className={`absolute inset-x-6 top-[28%] mx-auto max-w-[1150px] md:top-24 md:bottom-28 md:flex md:items-center short:top-20 short:bottom-24 ${motion && !failed ? 'opacity-0 invisible' : 'hidden'}`}>
        <div className="relative grid w-full grid-cols-2 gap-4 md:gap-x-[48%] md:gap-y-8 short:gap-y-4">
          {explore.map(([n, label, id], i) => (
            <a key={id} href={`#${id}`} className={`glass border border-white/20 p-5 hover:border-amber sm:p-8 short:px-7 short:py-5 ${i > 1 ? 'translate-y-20 md:translate-y-0 md:mt-20 short:mt-8' : ''}`}>
              <span className="label text-muted">{n} / Explore</span>
              <h2 className="mt-4 text-lg sm:text-2xl short:mt-2 short:text-xl">{label}</h2>
              <span className="mt-4 block text-xl leading-none text-amber sm:text-2xl short:mt-3"><Arrow /></span>
            </a>
          ))}
          {/* The 48% column gap exists to leave the middle empty; the mark sits in it, and only once
              there is a gap to sit in. From md up the second row's offset is a real margin, so the
              grid's height includes it and the mark centres on the whole staggered block. On short
              landscape screens (car browsers, small laptops) the cards and the offset tighten so all
              four fit between the header and the nav. */}
          <img
            src="/assets/brand/logo-full.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[min(24vw,290px)] short:w-[min(20vw,34vh)] -translate-x-1/2 -translate-y-1/2 md:block"
          />
        </div>
      </div>
      <a ref={cue} href="#work" className="label absolute bottom-[108px] left-1/2 -translate-x-1/2 whitespace-nowrap text-muted">
        Scroll to explore <Arrow direction="down"/>
      </a>
      <div className="absolute right-6 bottom-32 hidden text-right md:block short:hidden">
        <span className="label leading-6 text-muted">
          Ideas
          <br />
          into
          <br />
          reality
        </span>
      </div>
    </div>
  );
}
