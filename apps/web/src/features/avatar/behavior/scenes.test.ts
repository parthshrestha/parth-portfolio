import {describe,it,expect} from 'vitest';
import {sceneDefinitions,scenePose,type Scene} from './scenes';
import {Behavior} from './machine';
describe('companion scenes',()=>{
 it('enters from standing and returns to standing with furniture gone',()=>{
  for(const scene of Object.keys(sceneDefinitions) as Scene[]){
   const initial=scenePose(scene,0),end=scenePose(scene,sceneDefinitions[scene].duration);
   expect(initial.presence).toBe(0);expect(initial.seated).toBe(0);
   expect(end.presence).toBe(0);expect(end.seated).toBe(0);expect(end.activity).toBe(0);expect(end.finished).toBe(true);
   expect(scenePose(scene,3000).seated).toBe(1);
  }
 });
 it('settles into sleep after sitting, not on arrival',()=>{
  expect(scenePose('nap',2000).nap).toBe(0);expect(scenePose('nap',9000).nap).toBe(1);
 });
 it('catches the chair and recovers before the scene exits',()=>{
  expect(scenePose('balance',4000).lean).toBeGreaterThan(.1);
  expect(scenePose('balance',4500).catchAmount).toBe(1);
  expect(Math.abs(scenePose('balance',7000).lean)).toBeLessThan(.001);
 });
 it('keeps a scene active for its full duration instead of the short gesture timeout',()=>{
  const behavior=new Behavior(()=>0);behavior.request('nap',100);
  expect(behavior.tick(20000,false,false)).toBe('nap');expect(behavior.tick(36101,false,false)).toBe('idle');
 });
 it('never auto-selects the chair gag early and enforces its cooldown',()=>{
  const b=new Behavior(()=>.999);b.reset(0);b.recent=['study'];
  expect(b.tick(b.next,false,false)).not.toBe('balance');
  b.reset(200000);b.recent=['study'];expect(b.tick(b.next,false,false)).toBe('balance');
  b.reset(b.until+1);b.recent=['study'];expect(b.tick(b.next,false,false)).not.toBe('balance');
 });
 it('suppresses all autonomous scene selection during tours',()=>{
  const b=new Behavior(()=>.9);b.reset(0);expect(b.tick(500000,false,true)).toBe('idle');
 });
});
