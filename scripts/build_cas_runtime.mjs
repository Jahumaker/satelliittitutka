// Run from repository root after installing esbuild@0.28.2, leaflet@1.9.4,
// and satellite.js@6.0.1 locally. Rebuild whenever app.js changes.
import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({
  stdin:{contents:"window.L=require('leaflet');window.satellite=require('satellite.js');require('./app.js');",resolveDir:process.cwd()},
  bundle:true,target:'es2015',format:'iife',outfile:'radar-cas-20261124.js',minify:true,legalComments:'eof'
});
await copyFile('node_modules/leaflet/dist/leaflet.css','leaflet-local.css');
