(function(){
  'use strict';
  const site=window.RufalSite;
  const menu=document.querySelector('#menuToggle'),nav=document.querySelector('#siteMenu'),dialog=document.querySelector('#bagDialog');
  document.querySelector('#languageToggle')?.addEventListener('click',()=>site.setLanguage(site.language==='ar'?'en':'ar'));
  menu?.addEventListener('click',()=>{nav.showModal();menu.setAttribute('aria-expanded','true');});
  nav?.addEventListener('close',()=>menu.setAttribute('aria-expanded','false'));
  nav?.addEventListener('click',event=>{if(event.target===nav&&event.clientX<nav.getBoundingClientRect().left)nav.close();});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.close()));
  document.querySelector('#bagButton')?.addEventListener('click',()=>dialog.showModal());
  document.querySelectorAll('form:not([method="dialog"])').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
  const updateContact=()=>{
    document.querySelectorAll('[data-contact-value]').forEach(el=>{
    const value=site.config.links[el.dataset.contactValue];
    if(value){el.removeAttribute('data-text');el.textContent=el.dataset.contactValue==='email'?value:new URL(value).hostname;}
    else {el.dataset.text='contactSoon';el.textContent=site.text('contactSoon');}
    });
  };
  window.addEventListener('rufal:updated',updateContact);
  site.ready.then(updateContact).catch(()=>document.body.classList.add('content-load-error'));
})();
