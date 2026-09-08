const ORDER_SYSTEM_CANONICAL_BASE_URL='https://jikong0709.github.io/my-first-project/order-app/';
window.ORDER_SYSTEM_CONFIG = Object.freeze({
  supabaseUrl: 'https://uuefhkqtslcdkdgeyiof.supabase.co',
  publishableKey: 'sb_publishable_v_Yzne9MJIj-9sjXYN-NDA_iA_u8wii',
  canonicalBaseUrl: ORDER_SYSTEM_CANONICAL_BASE_URL,
  appName: '訂單系統',
  appVersion: '2026.09.08.p1-2c-admin-tenant-fix1'
});

window.ORDER_SYSTEM_URLS=Object.freeze({
  buildCustomerOrderUrl(slug){
    const normalized=String(slug??'').trim();
    if(!normalized)throw new Error('缺少店家 slug');
    const url=new URL('order.html',ORDER_SYSTEM_CANONICAL_BASE_URL);
    url.searchParams.set('store',normalized);
    return url.href;
  }
});

const ORDER_SYSTEM_THEME_KEYS = Object.freeze([
  '--brand-primary','--brand-secondary','--brand-bg','--brand-surface','--brand-text',
  '--brand-muted','--brand-line','--brand-accent','--brand-button','--brand-button-text',
  '--brand-soft','--brand-danger','--brand-radius'
]);
const ORDER_SYSTEM_THEME_COLOR=/^#[0-9A-Fa-f]{6}$/;
const ORDER_SYSTEM_THEME_RADIUS=/^(?:0|8|12|16|18|20|22|24)px$|^999px$/;
window.ORDER_SYSTEM_THEME=Object.freeze({
  apply(branding){
    const vars=branding?.css_vars||{},style=document.documentElement.style;
    for(const key of ORDER_SYSTEM_THEME_KEYS){
      const value=String(vars[key]||'').trim();
      const valid=key==='--brand-radius'?ORDER_SYSTEM_THEME_RADIUS.test(value):ORDER_SYSTEM_THEME_COLOR.test(value);
      if(valid)style.setProperty(key,value);
    }
    document.documentElement.dataset.theme=branding?.theme_key||'default';
    const themeColor=String(vars['--brand-primary']||'').trim();
    if(ORDER_SYSTEM_THEME_COLOR.test(themeColor))document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themeColor);
  },
  reset(){
    const style=document.documentElement.style;
    for(const key of ORDER_SYSTEM_THEME_KEYS)style.removeProperty(key);
    document.documentElement.dataset.theme='default';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#2563EB');
  }
});

// Generic Core theme is the pre-resolution authority. Tenant branding may only arrive
// from the two resolver read models established by P1-1.
window.ORDER_SYSTEM_THEME.reset();
const ORDER_SYSTEM_NATIVE_FETCH=window.fetch.bind(window);
window.fetch=async(...args)=>{
  const response=await ORDER_SYSTEM_NATIVE_FETCH(...args);
  try{
    const input=args[0],url=String(input instanceof Request?input.url:input||'');
    const resolver=url.endsWith('/smallshop_public_store')||url.endsWith('/smallshop_admin_session_info');
    if(response.ok&&resolver){
      response.clone().json().then(data=>{
        const branding=data?.branding||data?.store?.branding;
        if(branding)window.ORDER_SYSTEM_THEME.apply(branding);
      }).catch(()=>{});
    }
  }catch{}
  return response;
};

// Multi-tenant admin bootstrap. An explicit ?store= slug is authoritative for this page.
// It must never fall back to the old crisp-day legacy session, and it is also remembered
// so a generic installed PWA launched at ./ returns to the most recently selected store.
const ORDER_SYSTEM_ADMIN_QUERY_STORE=(new URLSearchParams(location.search).get('store')||'').trim();
const ORDER_SYSTEM_IS_ADMIN=!!document.querySelector('#loginGate');
if(ORDER_SYSTEM_IS_ADMIN&&ORDER_SYSTEM_ADMIN_QUERY_STORE){
  try{
    localStorage.setItem('order-system.admin.last-store.v1',ORDER_SYSTEM_ADMIN_QUERY_STORE);
    if(ORDER_SYSTEM_ADMIN_QUERY_STORE!=='crisp-day')localStorage.removeItem('crispday.store.session');
  }catch{}
}

async function ORDER_SYSTEM_PREVIEW_ADMIN_TENANT(slug){
  if(!ORDER_SYSTEM_IS_ADMIN||!slug)return;
  try{
    const r=await fetch(window.ORDER_SYSTEM_CONFIG.supabaseUrl+'/rest/v1/rpc/smallshop_public_store',{
      method:'POST',
      headers:{apikey:window.ORDER_SYSTEM_CONFIG.publishableKey,'Content-Type':'application/json'},
      body:JSON.stringify({p_store_slug:slug})
    });
    if(!r.ok)return;
    const data=await r.json(),resolved=data?.store||data;
    if(!resolved?.store_id||resolved.slug!==slug)return;
    if(resolved.branding)window.ORDER_SYSTEM_THEME.apply(resolved.branding);
    const name=resolved.name||'店家',brandEn=resolved.brand_en||'STORE';
    const brandName=document.querySelector('#brandName'),brandEnEl=document.querySelector('#brandEn'),brandMeta=document.querySelector('#brandMeta');
    if(brandName)brandName.textContent=name;
    if(brandEnEl)brandEnEl.textContent=brandEn+' · STORE';
    if(brandMeta)brandMeta.textContent=(resolved.address?resolved.address+' · ':'')+'店家管理';
    const slugInput=document.querySelector('#storeSlug');if(slugInput)slugInput.value=slug;
    const customerLink=document.querySelector('#customerLink');
    if(customerLink){customerLink.href=window.ORDER_SYSTEM_URLS.buildCustomerOrderUrl(slug);customerLink.classList.remove('hidden')}
    document.title=name+'｜店家管理';
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content',name+'店家');
  }catch{}
}
if(ORDER_SYSTEM_IS_ADMIN&&ORDER_SYSTEM_ADMIN_QUERY_STORE)ORDER_SYSTEM_PREVIEW_ADMIN_TENANT(ORDER_SYSTEM_ADMIN_QUERY_STORE);

// Remove legacy Crisp-specific PWA presentation from the shared Core at runtime as well.
if(ORDER_SYSTEM_IS_ADMIN){
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content','店家管理');
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href','./icon.svg');
  const manifest=document.querySelector('link[rel="manifest"]');if(manifest)manifest.href='./manifest.webmanifest?v=20260908-tenant-1';
}

// Shared formal-main visual layer. Loaded here so both store and customer pages get it.
(()=>{const link=document.createElement('link');link.rel='stylesheet';link.href='./enhancements.css?v=20260904-3';document.head.appendChild(link)})();

addEventListener('DOMContentLoaded',()=>{
  if(!document.querySelector('#loginGate'))return;
  const loginGate=document.querySelector('#loginGate');
  new MutationObserver(()=>{
    if(!loginGate.classList.contains('hidden')&&!ORDER_SYSTEM_ADMIN_QUERY_STORE)window.ORDER_SYSTEM_THEME.reset()
  }).observe(loginGate,{attributes:true,attributeFilter:['class']});
  if(!loginGate.classList.contains('hidden')&&!ORDER_SYSTEM_ADMIN_QUERY_STORE)window.ORDER_SYSTEM_THEME.reset();
  if(ORDER_SYSTEM_ADMIN_QUERY_STORE)ORDER_SYSTEM_PREVIEW_ADMIN_TENANT(ORDER_SYSTEM_ADMIN_QUERY_STORE);
  const setupButton=document.querySelector('#showSetupBtn'),setupBox=document.querySelector('#setupBox');
  if(setupButton)setupButton.classList.add('hidden');if(setupBox)setupBox.classList.add('hidden');
  if(!document.querySelector('#installHelpModal')){
    const wrap=document.createElement('div');wrap.id='installHelpModal';wrap.className='modal-layer hidden';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
    wrap.innerHTML='<div class="modal-card install-card"><div class="modal-head"><div><div class="section-kicker">INSTALL</div><h2>安裝店家 App</h2></div><button id="closeInstallHelp" class="modal-close" aria-label="關閉">×</button></div><div id="installHelpBody" class="install-help-body"></div><button id="closeInstallHelpBottom" class="btn btn-dark btn-wide">知道了</button></div>';
    document.body.appendChild(wrap);
  }
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});
  load('./admin-enhancements.js?v=20260904-3').then(()=>load('./admin-ledger-enhancements.js?v=20260904-3')).catch(err=>console.warn('Admin enhancement load failed',err));
});
