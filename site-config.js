/* One content source for every page, with separate, exportable design drafts. */
(function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const mediaKeys = ['hero','story','collection','orders','contact','account','workspace','floralFront','floralBack','headerLogo','footerLogo'];
  function safeImage(value) {
    return value === '' || (typeof value === 'string' && value.length < 9000000 && (/^assets\/[a-zA-Z0-9_./-]+\.(png|webp|jpe?g)$/.test(value) || /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value)));
  }
  function sanitize(candidate, defaults) {
    if (!candidate || candidate.version !== 2 || typeof candidate.texts !== 'object') throw new Error('invalidConfig');
    const result = clone(defaults);
    for (const lang of ['ar','en']) for (const key of Object.keys(defaults.texts[lang])) {
      const value = candidate.texts?.[lang]?.[key];
      if (typeof value === 'string' && value.length <= 10000) result.texts[lang][key] = value;
    }
    for (const key of mediaKeys) if (safeImage(candidate.media?.[key])) result.media[key] = candidate.media[key];
    for (const key of ['headerBackground','footerBackground','accent','paper']) {
      const value = candidate.appearance?.[key];
      if (/^#[a-fA-F0-9]{6}$/.test(value || '')) result.appearance[key] = value;
    }
    for (const key of ['headerLogoHeight','footerLogoHeight','flowerScale']) {
      const value = Number(candidate.appearance?.[key]);
      if (Number.isFinite(value)) result.appearance[key] = Math.max(30, Math.min(key === 'flowerScale' ? 150 : 220, value));
    }
    for (const key of ['flowers','petals']) if (typeof candidate.appearance?.[key] === 'boolean') result.appearance[key] = candidate.appearance[key];
    if (typeof candidate.links?.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.links.email)) result.links.email = candidate.links.email;
    for (const key of ['whatsapp','instagram']) {
      const value = candidate.links?.[key];
      try { const u = new URL(value); if (u.protocol === 'https:') result.links[key] = u.href; } catch { /* blank stays disabled */ }
    }
    return result;
  }
  const openDB = () => new Promise((resolve,reject) => {
    const request = indexedDB.open('rufal-design-v2',1);
    request.onupgradeneeded = () => request.result.createObjectStore('design');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function draft(operation, value) {
    const db = await openDB();
    try { return await new Promise((resolve,reject) => {
      const tx = db.transaction('design', operation === 'get' ? 'readonly' : 'readwrite');
      const object = tx.objectStore('design');
      const request = operation === 'get' ? object.get('draft') : operation === 'set' ? object.put(value,'draft') : object.delete('draft');
      let found;
      request.onsuccess = () => { found = request.result; };
      tx.oncomplete = () => resolve(found);
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('storageError'));
    }); } finally { db.close(); }
  }
  const Site = window.RufalSite = {
    defaults:null, config:null, language:'ar', sanitize, clone, safeImage, draft,
    text(key) { return (this.config?.texts[this.language]?.[key] ?? this.defaults?.texts[this.language]?.[key] ?? key).replace(/\{year\}/g,String(new Date().getFullYear())); },
    apply(config) {
      this.config = sanitize(config,this.defaults);
      document.documentElement.lang = this.language;
      document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
      document.querySelectorAll('[data-text]').forEach(el => { el.textContent = this.text(el.dataset.text); });
      for (const [attr,data] of [['aria-label','label'],['placeholder','placeholder'],['alt','alt']]) {
        document.querySelectorAll('[data-'+data+']').forEach(el => el.setAttribute(attr,this.text(el.dataset[data])));
      }
      document.querySelectorAll('[data-media]').forEach(el => {
        const value = this.config.media[el.dataset.media] || '';
        el.hidden = !value;
        if (value) { if (el.tagName === 'IMG') el.src = value; else el.style.backgroundImage = 'url("'+value+'")'; }
      });
      const a = this.config.appearance;
      for (const [key,css] of [['headerBackground','--header-background'],['footerBackground','--footer-background'],['accent','--terra'],['paper','--paper']]) document.documentElement.style.setProperty(css,a[key]);
      document.documentElement.style.setProperty('--header-logo-height',a.headerLogoHeight+'px');
      document.documentElement.style.setProperty('--footer-logo-height',a.footerLogoHeight+'px');
      document.documentElement.style.setProperty('--flower-scale',a.flowerScale/100);
      document.body.classList.toggle('no-flowers',!a.flowers);
      document.body.classList.toggle('no-petals',!a.petals);
      document.querySelectorAll('[data-contact]').forEach(el => {
        const type = el.dataset.contact, value = this.config.links[type];
        if (value) { el.href = type === 'email' ? 'mailto:'+value : value; el.removeAttribute('aria-disabled'); }
        else { el.removeAttribute('href'); el.setAttribute('aria-disabled','true'); }
      });
      const title = document.body.dataset.title || 'siteTitle';
      document.title = this.text(title);
      const meta = document.querySelector('meta[name=description]'); if(meta) meta.content=this.text('siteDescription');
      window.dispatchEvent(new CustomEvent('rufal:updated'));
    },
    setLanguage(language) {
      this.language = language === 'en' ? 'en' : 'ar';
      try { localStorage.setItem('rufal-language',this.language); } catch {}
      this.apply(this.config);
    }
  };
  Site.ready = (async () => {
    const response = await fetch('content.json'); if(!response.ok) throw new Error('contentUnavailable');
    Site.defaults = await response.json(); Site.config = clone(Site.defaults);
    try { const runtimeResponse=await fetch('/api/status'); if(runtimeResponse.ok) {Site.runtime=await runtimeResponse.json(); if(Site.runtime.database) {const published=await fetch('/api/design');if(published.ok){const value=await published.json();if(value.settings)Site.defaults=sanitize(value.settings,Site.defaults);Site.config=clone(Site.defaults);}}}} catch { /* Static design remains available when server setup is incomplete. */ }
    try { Site.language = localStorage.getItem('rufal-language') === 'en' ? 'en' : 'ar'; } catch {}
    if (!new URL(location.href).searchParams.has('published')) {
      try { const value = await draft('get'); if(value) Site.config = sanitize(value,Site.defaults); } catch {}
    }
    Site.apply(Site.config);
    window.addEventListener('message',event => {
      if(event.origin !== location.origin || event.source !== parent || parent === window || event.data?.type !== 'rufal:preview') return;
      try { Site.apply(sanitize(event.data.config,Site.defaults)); } catch {}
    });
    return Site;
  })();
})();
