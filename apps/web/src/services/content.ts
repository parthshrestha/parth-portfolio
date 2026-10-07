import { z } from 'zod';
import snapshot from '../../../../content/portfolio.json';
const safeUrl=z.string().url().refine(s=>/^https?:/.test(s));
const picture=z.object({src:z.string().regex(/^\/assets\//),alt:z.string(),fit:z.enum(['cover','contain']).optional()});
const shot=picture.extend({thumb:z.string().regex(/^\/assets\//)});
const diagram=z.object({src:z.string().regex(/^\/assets\//),alt:z.string(),caption:z.string().optional()});
const clip=z.object({src:z.string().regex(/^\/assets\//),poster:z.string().regex(/^\/assets\//),alt:z.string(),wide:z.boolean().optional()});
export const projectSchema=z.object({id:z.string(),slug:z.string(),title:z.string(),summary:z.string(),stack:z.array(z.string()),image:picture.optional(),caseStudy:z.object({problem:z.string(),role:z.string(),approach:z.string(),architecture:z.string().optional(),outcome:z.string().optional()}),diagram:diagram.optional(),links:z.object({repository:safeUrl.optional(),demo:safeUrl.optional()})});
export const experienceSchema=z.object({id:z.string(),role:z.string(),organization:z.string(),location:z.string().optional(),period:z.string(),highlights:z.array(z.string())});
export const educationSchema=z.object({id:z.string(),school:z.string(),credential:z.string(),location:z.string().optional(),period:z.string().optional(),details:z.array(z.string()).default([])});
export const skillGroupSchema=z.object({level:z.string(),items:z.array(z.string())});
export const storySchema=z.object({kicker:z.string(),headline:z.string(),lede:z.string(),cover:shot.optional(),specs:z.array(z.object({label:z.string(),value:z.string()})).default([]),links:z.array(z.object({label:z.string(),href:z.string()})).default([]),chapters:z.array(z.object({id:z.string(),title:z.string(),body:z.array(z.string()),diagram:diagram.optional(),image:shot.optional()}))});
export const interestSchema=z.object({id:z.string(),slug:z.string().optional(),kicker:z.string().optional(),title:z.string(),description:z.string(),image:picture.optional(),gallery:z.array(shot).default([]),reel:z.array(clip).default([]),story:storySchema.optional()});
export const schema=z.object({schemaVersion:z.literal(1),owner:z.object({name:z.string(),headline:z.string(),bio:z.string()}),projects:z.array(projectSchema),experience:z.array(experienceSchema).default([]),education:z.array(educationSchema).default([]),certifications:z.array(z.string()).default([]),skills:z.array(skillGroupSchema).default([]),interests:z.array(interestSchema),contact:z.object({email:z.string().email().optional(),github:safeUrl.optional(),linkedin:safeUrl.optional(),resume:safeUrl.optional()})});
export type Content=z.infer<typeof schema>;
export type Interest=z.infer<typeof interestSchema>;
export type Shot=z.infer<typeof shot>;
export type Clip=z.infer<typeof clip>;
export type Diagram=z.infer<typeof diagram>;
export const bundled=schema.parse(snapshot);
// Static hosting has no content service, so the bundled snapshot is the whole site unless
// VITE_API_BASE names one. In dev the Vite proxy handles the empty base.
const apiBase=import.meta.env.VITE_API_BASE??(import.meta.env.DEV?'':null);
export async function refreshContent(signal?:AbortSignal):Promise<Content>{if(apiBase===null)throw Error('No content API configured');const response=await fetch(`${apiBase}/api/v1/portfolio`,{signal:signal??AbortSignal.timeout(2500)});if(!response.ok)throw Error('Content unavailable');return schema.parse(await response.json());}
