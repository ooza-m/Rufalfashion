(function(){
  'use strict';
  const site=window.RufalSite;
  const menu=document.querySelector('#menuToggle'),nav=document.querySelector('#mobileNav'),dialog=document.querySelector('#bagDialog');
  document.querySelector('#languageToggle')?.addEventListener('click',()=>site.setLanguage(site.language==='ar'?'en':'ar'));
  menu?.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden));});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.hidden=true;menu.setAttribute('aria-expanded','false');}));
  document.querySelector('#bagButton')?.addEventListener('click',()=>dialog.showModal());
  document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-size]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    const target=document.querySelector('#sizeStatus');target.removeAttribute('data-text');target.textContent=site.text('sizeSelected')+' '+site.text('size'+button.dataset.size);
  }));
  document.querySelectorAll('[data-thumb]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-thumb]').forEach(other=>other.classList.toggle('selected',other===button));
    document.querySelector('.photo-placeholder').textContent=site.text('thumbnail'+button.dataset.thumb);
  }));
  document.querySelectorAll('form:not([method="dialog"])').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
  const updateContact=()=>{
    const selected=document.querySelector('[data-size][aria-pressed="true"]');
    if(selected) document.querySelector('#sizeStatus').textContent=site.text('sizeSelected')+' '+site.text('size'+selected.dataset.size);
    document.querySelectorAll('[data-contact-value]').forEach(el=>{
    const value=site.config.links[el.dataset.contactValue];
    if(value){el.removeAttribute('data-text');el.textContent=el.dataset.contactValue==='email'?value:new URL(value).hostname;}
    else {el.dataset.text='contactSoon';el.textContent=site.text('contactSoon');}
    });
  };
  window.addEventListener('rufal:updated',updateContact);
  site.ready.then(updateContact).catch(()=>document.body.classList.add('content-load-error'));
})();
