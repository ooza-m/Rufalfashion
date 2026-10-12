(function(){
'use strict';
const site=window.RufalSite;
let config,tab='texts',textLanguage='ar',search='';
const panel=document.querySelector('#editorPanel'),frame=document.querySelector('#livePreview'),status=document.querySelector('#studioStatus');
const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
const label=key=>site.text(key);
const statusMessage=key=>{status.dataset.text=key;status.textContent=label(key);};
let previewTimer;
function sendPreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>{if(frame.contentWindow)frame.contentWindow.postMessage({type:'rufal:preview',config},location.origin);},150);}
function changed(){site.apply(config);statusMessage('unsavedMessage');sendPreview();}
function labelled(tag,key,className){const el=node(tag,className,label(key));el.dataset.text=key;return el;}
function button(key,action){const e=labelled('button',key,'outline-button');e.type='button';e.addEventListener('click',action);return e;}
function selectLocale(){const e=node('select');for(const [v,k]of [['ar','arabicOption'],['en','englishOption']]){const o=labelled('option',k);o.value=v;e.append(o);}e.value=textLanguage;return e;}
function renderTexts(){
 panel.append(labelled('h2','textTab'),labelled('p','allTextNote'));
 const controls=node('div','text-controls');
 const l1=node('label');l1.append(labelled('span','textLanguage'));const select=selectLocale();select.addEventListener('change',()=>{textLanguage=select.value;render();});l1.append(select);
 const l2=node('label');l2.append(labelled('span','searchTexts'));const input=node('input');input.type='search';input.value=search;input.placeholder=label('searchPlaceholder');input.dataset.placeholder='searchPlaceholder';input.addEventListener('input',()=>{search=input.value;renderTextFields(fields);});l2.append(input);controls.append(l1,l2);panel.append(controls);
 const fields=node('div');panel.append(fields);renderTextFields(fields);
}
function renderTextFields(container){
 container.replaceChildren();
 const entries=Object.entries(config.texts[textLanguage]).filter(([k,v])=>!search||k.toLowerCase().includes(search.toLowerCase())||v.toLowerCase().includes(search.toLowerCase())||config.texts.ar[k].includes(search));
 for(const[key,value]of entries){
  const f=node('label','editor-field');const title=node('span',null,config.texts.ar[key]||key);title.dir='rtl';f.append(title,node('small',null,key));
  const input=node('textarea');input.rows=value.length>120?4:2;input.dir=textLanguage==='ar'?'rtl':'ltr';input.value=value;input.maxLength=10000;
  input.addEventListener('input',()=>{config.texts[textLanguage][key]=input.value;changed();});f.append(input);container.append(f);
 }
 if(!entries.length)container.append(labelled('p','noResults'));
}
async function readImage(file,logo){
 const key=logo?'invalidLogo':'invalidImage';
 if(!file||file.size>5*1024*1024||!(logo?file.type==='image/png':['image/png','image/jpeg','image/webp'].includes(file.type)))throw Error(key);
 if(logo){const sig=new Uint8Array(await file.slice(0,8).arrayBuffer());if(sig.join(',')!=='137,80,78,71,13,10,26,10')throw Error(key);}
 const value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error(key));reader.readAsDataURL(file);});
 if(!site.safeImage(value))throw Error(key);
 await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{if(image.naturalWidth<1||image.naturalHeight<1||image.naturalWidth*image.naturalHeight>40000000)reject(Error(key));else resolve();};image.onerror=()=>reject(Error(key));image.src=value;});
 return value;
}
function imageCard(key,title,logo=false){
 const card=node('section',logo?'logo-card':'image-card'+(key.startsWith('floral')?' alpha':''));card.append(labelled('h3',title));
 const value=config.media[key];
 if(logo){const holder=node('div','logo-preview checkerboard');if(value){const img=node('img');img.src=value;img.alt=label(title);holder.append(img);}card.append(holder);}
 else{const img=node('img','image-preview'+(key.startsWith('floral')?' checkerboard':''));img.src=value;img.alt=label(title);card.append(img);}
 const upload=node('label','upload-label');upload.append(labelled('span',logo?'uploadLogo':'uploadImage'));const file=node('input');file.type='file';file.accept=logo?'image/png':'.png,.jpg,.jpeg,.webp';
 file.addEventListener('change',async()=>{try{config.media[key]=await readImage(file.files[0],logo);changed();render();}catch(e){statusMessage(e.message);}finally{file.value='';}});upload.append(file);card.append(upload);
 const actions=node('div','card-actions');if(logo)actions.append(button('removeLogo',()=>{config.media[key]='';changed();render();}));actions.append(button(logo?'restoreLogo':'restoreImage',()=>{config.media[key]=site.defaults.media[key];changed();render();}));card.append(actions);return card;
}
function renderLogos(){panel.append(labelled('h2','logoTab'),labelled('p','logoHint'));panel.append(imageCard('headerLogo','headerLogoLabel',true),imageCard('footerLogo','footerLogoLabel',true));}
function renderImages(){panel.append(labelled('h2','imageTab'));for(const[key,k]of [['hero','heroMedia'],['heroLilac','heroLilacMedia'],['heroSage','heroSageMedia'],['story','storyMedia'],['collection','collectionMedia'],['orders','ordersMedia'],['contact','contactMedia'],['account','accountMedia'],['workspace','workspaceMedia'],['floralFront','floralFrontMedia'],['floralBack','floralBackMedia']])panel.append(imageCard(key,k));}
function renderLayout(){
 panel.append(labelled('h2','layoutTab'));
 for(const[key,k]of [['headerBackground','headerBackground'],['footerBackground','footerBackground'],['accent','accentColor'],['paper','paperColor']]){const l=node('label','color-field');l.append(labelled('span',k));const i=node('input');i.type='color';i.value=config.appearance[key];i.addEventListener('input',()=>{config.appearance[key]=i.value;changed();});l.append(i);panel.append(l);}
 for(const[key,k,min,max]of [['headerLogoHeight','headerLogoHeight',30,220],['footerLogoHeight','footerLogoHeight',30,220],['flowerScale','flowerScale',30,150],['fontSize','fontSizeSetting',14,22],['petalDensity','petalDensity',8,50],['heroCycleSeconds','heroCycleSeconds',18,90]]){const l=node('div','range-field');l.append(labelled('label',k));const i=node('input');i.type='range';i.min=min;i.max=max;i.value=config.appearance[key];i.setAttribute('aria-label',label(k));const o=node('output',null,i.value);i.addEventListener('input',()=>{config.appearance[key]=Number(i.value);o.value=i.value;changed();});l.append(i,o);panel.append(l);}
 for(const[key,k]of [['flowers','flowersToggle'],['petals','petalsToggle'],['flowerSway','flowerSway'],['heroCycle','heroCycle']]){const l=node('label','toggle-field');const i=node('input');i.type='checkbox';i.checked=config.appearance[key];i.addEventListener('change',()=>{config.appearance[key]=i.checked;changed();});l.append(i,labelled('span',k));panel.append(l);}
 for(const[key,k,fonts]of [['arabicFont','arabicFont',['Tajawal','Cairo','Amiri','Noto Naskh Arabic','IBM Plex Sans Arabic']],['arabicHeadingFont','arabicHeadingFont',['Tajawal','Cairo','Amiri','Noto Naskh Arabic','IBM Plex Sans Arabic']],['englishFont','englishFont',['Cinzel','Georgia']]]){const l=node('label','editor-field');l.append(labelled('span',k));const sel=node('select');for(const value of fonts){const o=node('option',null,value);o.value=value;sel.append(o);}sel.value=config.appearance[key];sel.onchange=()=>{config.appearance[key]=sel.value;changed();};l.append(sel);panel.append(l);}panel.append(labelled('p','fontSample','font-sample'));
 panel.append(labelled('h2','contactSettings'));
 for(const[key,k]of [['email','emailLinkLabel'],['whatsapp','whatsappLinkLabel'],['instagram','instagramLinkLabel']]){const l=node('label','editor-field');l.append(labelled('span',k));const i=node('input');i.type=key==='email'?'email':'url';i.dir='ltr';i.value=config.links[key];i.addEventListener('input',()=>{config.links[key]=i.value;changed();});l.append(i);panel.append(l);}
}
function renderGallery(){
 panel.append(labelled('h2','galleryTitle'),labelled('p','galleryIntro'));const link=node('a','text-link',label('galleryTab'));link.href='gallery.html';link.target='_blank';link.rel='noopener';panel.append(link);
 const grid=node('div','editor-gallery');for(const p of site.defaults.pages){const c=node('article');const img=node('img');img.src=config.media[p.media];img.alt='';img.loading='lazy';c.append(img,labelled('h3',p.title));if(p.url){const a=node('a',null,label('viewDesign'));a.href=p.url;a.target='_blank';a.rel='noopener';c.append(a);}else c.append(labelled('p','pageArtOnly'));grid.append(c);}panel.append(grid);
}
function render(){panel.replaceChildren();({texts:renderTexts,logo:renderLogos,images:renderImages,layout:renderLayout,gallery:renderGallery})[tab]();}
site.ready.then(()=>{
 config=site.clone(site.config);
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render();}));
 document.querySelectorAll('[data-device]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#previewFrameWrap').className='preview-frame-wrap '+button.dataset.device;document.querySelectorAll('[data-device]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});}));
 const pageSelect=document.querySelector('#previewPage');for(const p of site.defaults.pages.filter(p=>p.url&&!p.url.startsWith('design'))){const o=labelled('option',p.title);o.value=p.url;pageSelect.append(o);}pageSelect.addEventListener('change',()=>{frame.src=pageSelect.value.split('#')[0]+'?designPreview=1'+(pageSelect.value.includes('#')?'#'+pageSelect.value.split('#')[1]:'');});frame.addEventListener('load',sendPreview);
 document.querySelector('#saveDesign').addEventListener('click',async()=>{try{config=site.sanitize(config,site.defaults);await site.draft('set',config);site.apply(config);statusMessage('savedMessage');sendPreview();}catch{statusMessage('storageError');}});
 document.querySelector('#publishDesign').addEventListener('click',async()=>{try{const clean=site.sanitize(config,site.defaults);const data=JSON.stringify(clean);if(new TextEncoder().encode(data).length>3000000){statusMessage('designPublishTooLarge');return;}const clerk=await window.RufalAuth.load();if(!clerk.session){statusMessage('designPublishUnavailable');return;}const token=await clerk.session.getToken();const response=await fetch('/api/design',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:data});if(!response.ok)throw Error('unavailable');statusMessage('designPublished');}catch{statusMessage('designPublishUnavailable');}});
 document.querySelector('#exportDesign').addEventListener('click',()=>{const clean=site.sanitize(config,site.defaults);const url=URL.createObjectURL(new Blob([JSON.stringify(clean,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='rufal-design.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);statusMessage('exportedMessage');});
 document.querySelector('#importDesign').addEventListener('change',async(event)=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100*1024*1024)throw Error('importTooLarge');config=site.sanitize(JSON.parse(await file.text()),site.defaults);site.apply(config);render();sendPreview();statusMessage('importedMessage');}catch(e){statusMessage(e.message==='importTooLarge'?'importTooLarge':'invalidConfig');}finally{event.target.value='';}});
 document.querySelector('#resetDesign').addEventListener('click',async()=>{if(!confirm(label('resetConfirm')))return;try{await site.draft('delete');config=site.clone(site.defaults);site.apply(config);render();sendPreview();statusMessage('restoredMessage');}catch{statusMessage('storageError');}});
 render();sendPreview();
}).catch(()=>{panel.textContent=label('storageError');});
})();
