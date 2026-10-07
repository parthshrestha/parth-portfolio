import {describe,it,expect} from 'vitest';
import {Behavior,eligible} from './behavior/machine';
import {chooseAnchor,pathClear} from './layout/safe';
import {manifestSchema} from './renderer/adapter';
describe('companion behavior',()=>{
 it('does not flicker around hero entry and exits on return',()=>{expect(eligible(false,.94,true)).toBe(false);expect(eligible(false,.96,true)).toBe(true);expect(eligible(true,.9,true)).toBe(true);expect(eligible(true,.84,true)).toBe(false);expect(eligible(false,0,false)).toBe(true)});
 it('coalesces rapid pokes and recovers after an interrupted action',()=>{const b=new Behavior(()=>0);b.reset(0);b.tick(b.next,false,false);const now=b.next+100;expect(b.poke(now,false)).toBe(true);expect(b.poke(now+100,false)).toBe(false);expect(b.tick(now+900,false,false)).toBe('idle')});
 it('restrictions win and a tour prevents autonomous actions',()=>{const b=new Behavior(()=>0);b.reset(0);expect(b.poke(10,true)).toBe(false);expect(b.tick(30000,false,true)).toBe('idle');expect(b.tick(30001,true,false)).toBe('idle');expect(b.tick(30002,false,false)).toBe('idle')});
 it('avoids recent idle choices with deterministic randomness',()=>{const b=new Behavior(()=>0);b.reset(0);const first=b.tick(b.next,false,false);b.tick(b.until+1,false,false);const second=b.tick(b.next,false,false);expect(first).not.toBe(second)});
});
describe('layout and assets',()=>{
 it('refuses a blocked viewport',()=>{expect(chooseAnchor(390,844,[{x:0,y:0,width:390,height:844}])).toBeNull()});
 it('rejects a path crossing content even with clear endpoints',()=>{expect(pathClear({x:0,y:100,width:50,height:50},{x:300,y:100,width:50,height:50},[{x:120,y:100,width:80,height:50}])).toBe(false)});
 it('keeps anchors inside small screens',()=>{const r=chooseAnchor(320,640,[],88)!;expect(r.x+r.width).toBeLessThan(320);expect(r.y+r.height).toBeLessThan(540)});
 it('rejects production claims and incomplete manifests',()=>{expect(manifestSchema.safeParse({schemaVersion:1,productionReady:true}).success).toBe(false)});
 it('accepts a rigged model manifest only with an idle clip and repo-local assets',()=>{
  const base={schemaVersion:1,renderer:'glb',productionReady:false,roles:['casual'],model:'/assets/avatar/casual-rig.glb',bounds:{width:160,height:180}};
  expect(manifestSchema.safeParse({...base,clips:{idle:{loop:true},wave:{file:'/assets/avatar/casual-wave.glb'}},fallback:{atlas:'/assets/avatar/casual-atlas-v1.png'}}).success).toBe(true);
  expect(manifestSchema.safeParse({...base,clips:{wave:{}}}).success).toBe(false);
  expect(manifestSchema.safeParse({...base,model:'https://example.com/x.glb',clips:{idle:{}}}).success).toBe(false);
 });
});
