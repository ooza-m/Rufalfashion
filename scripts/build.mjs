import { readdir,copyFile,cp,mkdir,rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of await readdir('.')) if(/\.(html|css|js)$/.test(f)||f==='content.json')await copyFile(f,'dist/'+f);
await cp('assets','dist/assets',{recursive:true});
console.log('Static pages built. Server code, SQL, credentials and tests are excluded.');
