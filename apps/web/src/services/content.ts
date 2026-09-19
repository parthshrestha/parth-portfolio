import { z } from 'zod';
import snapshot from '../../../../content/portfolio.json';
const safeUrl=z.string().url().refine(s=>/^https?:/.test(s));
const picture=z.object({src:z.string().regex(/^\/assets\//),alt:z.string()});
export const projectSchema=z.object({id:z.string(),slug:z.string(),title:z.string(),summary:z.string(),stack:z.array(z.string()),image:picture.optional(),caseStudy:z.object({problem:z.string(),role:z.string(),approach:z.string(),architecture:z.string().optional(),outcome:z.string().optional()}),links:z.object({repository:safeUrl.optional(),demo:safeUrl.optional()})});
export const schema=z.object({schemaVersion:z.literal(1),owner:z.object({name:z.string(),headline:z.string(),bio:z.string()}),projects:z.array(projectSchema),interests:z.array(z.object({id:z.string(),title:z.string(),description:z.string(),image:picture.optional()})),contact:z.object({email:z.string().email().optional(),github:safeUrl.optional(),linkedin:safeUrl.optional(),resume:safeUrl.optional()})});
export type Content=z.infer<typeof schema>;
export const bundled=schema.parse(snapshot);
export async function refreshContent(signal?:AbortSignal):Promise<Content>{const response=await fetch('/api/v1/portfolio',{signal:signal??AbortSignal.timeout(2500)});if(!response.ok)throw Error('Content unavailable');return schema.parse(await response.json());}
