import {describe,it,expect} from 'vitest';
import {stages,seeded} from './timeline';
import {bundled,schema,refreshContent} from '../services/content';
import {vi} from 'vitest';
describe('reversible scroll',()=>{it('has stable endpoints and identical reverse states',()=>{expect(stages(0)).toEqual({turn:0,disperse:0,opacity:1});expect(stages(1)).toEqual({turn:1,disperse:1,opacity:0});const forward=[0,.2,.5,.8,1].map(stages);expect([1,.8,.5,.2,0].map(stages).reverse()).toEqual(forward);expect(seeded(20)).toBe(seeded(20));});});
describe('content safety',()=>{it('rejects incompatible schemas',()=>{expect(()=>schema.parse({...bundled,schemaVersion:2})).toThrow()});it('keeps bundled content usable during API outage',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(Error('offline')));await expect(refreshContent()).rejects.toThrow();expect(bundled.projects.length).toBeGreaterThan(0);vi.unstubAllGlobals()})});
