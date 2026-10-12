const translations = {
  ar: { skip:'تخطي إلى المحتوى', announcement:'رُفال للأزياء · تصاميم مختارة بعناية', collection:'المجموعة', story:'قصة رُفال', contact:'تواصلي معنا', heroTitle:'تفاصيل تليق بك', heroText:'تصاميم مختارة بعناية', browse:'تصفّحي المجموعة', collectionEyebrow:'من حديقة رُفال', collectionTitle:'المجموعة', comingSoon:'الصورة قريبًا', productPending:'تفاصيل المنتج ستُضاف لاحقًا', collectionNote:'ستظهر القطع المتاحة هنا بعد إضافة صورها وتفاصيلها وأسعارها.', gardenTitle:'كلما اقتربتِ، انفتحت الحديقة', gardenText:'صفحة تنمو بتفاصيل رُفال: أقواس، أوراق، ومساحات تترك للأزياء حضورها.', stepsTitle:'من اختيارك إلى بابك', step1Title:'اختاري القطعة', step1Text:'المقاس والكمية المتاحة يظهران عند إضافة المنتجات.', step2Title:'أكملي الطلب', step2Text:'ادخلي بيانات التوصيل داخل الإمارات دون إنشاء حساب.', step3Title:'استلمي رابط الدفع', step3Text:'يرسل فريق رُفال رابط زينة الخاص بطلبك بعد مراجعته.', footerLocation:'أبوظبي · الإمارات العربية المتحدة', emailPending:'البريد الإلكتروني سيُضاف لاحقًا', backToTop:'العودة للأعلى ↑', bagTitle:'سلة رُفال', bagEmpty:'ستُتاح إضافة القطع بعد اعتماد بيانات المنتجات وأسعارها.', continueBrowsing:'متابعة التصفح' },
  en: { skip:'Skip to content', announcement:'Rufal Fashion · Thoughtfully selected designs', collection:'Collection', story:'Our story', contact:'Contact', heroTitle:'Details that belong to you', heroText:'Thoughtfully selected designs', browse:'Explore the collection', collectionEyebrow:'From the Rufal garden', collectionTitle:'The collection', comingSoon:'Image coming soon', productPending:'Product details will be added soon', collectionNote:'Available pieces will appear here when their photos, details, and prices are ready.', gardenTitle:'A garden unfolding', gardenText:'Arches, leaves, and breathing room give each design its own presence.', stepsTitle:'From your choice to your door', step1Title:'Choose a piece', step1Text:'Sizes and live availability appear when products are added.', step2Title:'Place your order', step2Text:'Enter UAE delivery details without creating an account.', step3Title:'Receive a payment link', step3Text:'The Rufal team sends a Ziina link for your order after review.', footerLocation:'Abu Dhabi · United Arab Emirates', emailPending:'Email will be added soon', backToTop:'Back to top ↑', bagTitle:'Your Rufal bag', bagEmpty:'Adding pieces will be available once product details and prices are approved.', continueBrowsing:'Continue browsing' }
};

const langButton = document.querySelector('#languageToggle');
const menuButton = document.querySelector('#menuToggle');
const mobileNav = document.querySelector('#mobileNav');
const bagDialog = document.querySelector('#bagDialog');

function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = translations[lang][element.dataset.i18n];
    if (value) element.textContent = value;
  });
  langButton.textContent = lang === 'ar' ? 'EN' : 'عربي';
  langButton.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية');
  try { localStorage.setItem('rufal-language', lang); } catch { /* private browsing */ }
}

langButton.addEventListener('click', () => setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar'));
menuButton.addEventListener('click', () => {
  mobileNav.hidden = !mobileNav.hidden;
  menuButton.setAttribute('aria-expanded', String(!mobileNav.hidden));
});
mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}));
document.querySelector('#bagButton').addEventListener('click', () => bagDialog.showModal());
document.querySelector('#year').textContent = new Date().getFullYear();

const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.1 }) : null;
document.querySelectorAll('.reveal').forEach((element) => observer ? observer.observe(element) : element.classList.add('visible'));
let selectedLanguage = 'ar';
try { selectedLanguage = localStorage.getItem('rufal-language') === 'en' ? 'en' : 'ar'; } catch { /* private browsing */ }
setLanguage(selectedLanguage);
