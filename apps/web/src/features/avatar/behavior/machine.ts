import {isScene,sceneDefinitions,type Scene} from './scenes';
export type Role = 'casual' | 'developer' | 'photographer' | 'mechanic';
export type Clip = 'idle' | 'wave' | 'poke' | 'think' | 'stretch' | Scene;
export const settings = {enter: .95, exit: .85, pokeCooldown: 1000, decisionMin: 20000, decisionSpread: 25000, recovery: 3800, contextDelay: 2000, outfitCooldown: 25000};
export function eligible(previous: boolean, progress: number, hasHero: boolean) {
  return !hasHero || progress >= (previous ? settings.exit : settings.enter);
}
export class Behavior {
  clip: Clip = 'idle';
  until = 0;
  next = 0;
  lastPoke = -Infinity;
  recent: Clip[] = [];
  lastBalance = -Infinity;
  request(clip:Clip,now:number) { this.clip=clip; this.until=now+(isScene(clip)?sceneDefinitions[clip].duration:settings.recovery); if(clip==='balance')this.lastBalance=now; }
  constructor(private random = Math.random) {}
  reset(now: number) { this.clip = 'idle'; this.until = 0; this.next = now + settings.decisionMin + this.random() * settings.decisionSpread; }
  poke(now: number, restricted: boolean) {
    if (restricted || now - this.lastPoke < settings.pokeCooldown) return false;
    this.lastPoke = now; this.clip = 'poke'; this.until = now + 800; return true;
  }
  tick(now: number, restricted: boolean, tour: boolean): Clip {
    if (restricted) { this.reset(now); return 'idle'; }
    if (this.until && now >= this.until) this.reset(now);
    if (!tour && !this.until && now >= this.next) {
      const pool:Clip[]=['think','stretch','rest','nap','scroll','study'];
      if(now>180000&&now-this.lastBalance>=180000&&this.recent.includes('study'))pool.push('balance');
      const options=pool.filter(x=>!this.recent.includes(x));
      const choices=options.length?options:pool.filter(x=>x!==this.recent.at(-1));
      this.request(choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))],now);
      this.recent=[...this.recent,this.clip].slice(-3);
    }
    return this.clip;
  }
}
