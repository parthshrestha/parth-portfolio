import {describe,it,expect} from 'vitest';
import {pose,duration,rest} from './rig-motion';
import type {Clip} from '../behavior/machine';
describe('layered rig motion',()=>{
 it('hangs the arms slightly open rather than dead vertical',()=>{
  const p=pose('idle',0,0);
  expect(p.shoulderLeft).toBeCloseTo(rest.shoulder);expect(p.shoulderRight).toBeCloseTo(-rest.shoulder);
 });
 it('returns joints to rest at both ends of every action',()=>{
  for(const clip of ['wave','poke','think','stretch'] as Clip[]){
   for(const elapsed of [0,duration[clip]]){
    // Rest is the idle pose at the same moment, not zero: the arms hang slightly open.
    const p=pose(clip,elapsed,0),resting=pose('idle',0,0);
    expect(p.shoulderLeft).toBeCloseTo(resting.shoulderLeft);expect(p.elbowLeft).toBeCloseTo(resting.elbowLeft);
    expect(p.shoulderRight).toBeCloseTo(resting.shoulderRight);expect(p.elbowRight).toBeCloseTo(resting.elbowRight);
    expect(p.wrist).toBeCloseTo(0);
   }
  }
 });
 it('waves the wrist in both directions with the elbow held up',()=>{
  const left=pose('wave',625,0),right=pose('wave',875,0);
  expect(left.wrist).toBeGreaterThan(0);expect(right.wrist).toBeLessThan(0);
  expect(left.elbowLeft).toBeCloseTo(right.elbowLeft);expect(left.shoulderLeft).toBeCloseTo(right.shoulderLeft);
 });
 it('breathes and shifts weight while idle, asymmetrically',()=>{
  const samples=Array.from({length:121},(_,i)=>pose('idle',0,i*.25));
  const range=(k:'breath'|'body'|'head')=>{const v=samples.map(s=>s[k]);return Math.max(...v)-Math.min(...v)};
  expect(range('breath')).toBeGreaterThan(2);
  expect(range('body')).toBeGreaterThan(.03);
  expect(range('head')).toBeGreaterThan(.06);
  // The two arms must not move as a mirrored pair.
  expect(samples.some(s=>Math.abs(s.shoulderLeft+s.shoulderRight)>.02)).toBe(true);
 });
 it('keeps all sampled poses finite and arm angles bounded',()=>{
  for(const clip of Object.keys(duration) as Clip[])for(let t=0;t<=4000;t+=16){
   const p=pose(clip,t,t/1000);
   for(const value of Object.values(p))if(typeof value==='number')expect(Number.isFinite(value)).toBe(true);
   expect(Math.abs(p.elbowLeft)).toBeLessThan(Math.PI);expect(Math.abs(p.elbowRight)).toBeLessThan(Math.PI);
  }
 });
});
