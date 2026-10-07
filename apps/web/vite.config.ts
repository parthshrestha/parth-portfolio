import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
// GitHub Pages has no history fallback — it serves 404.html for any unknown path, so an
// identical copy of index.html there is what makes /projects/:slug survive a direct hit or refresh.
const spaFallback=():Plugin=>{let outDir='';return{name:'spa-404',apply:'build',configResolved(config){outDir=resolve(config.root,config.build.outDir)},closeBundle(){const index=join(outDir,'index.html');if(existsSync(index))copyFileSync(index,join(outDir,'404.html'))}}};
export default defineConfig({plugins:[tailwindcss(),spaFallback()],server:{proxy:{'/api':'http://127.0.0.1:8000'}}});
