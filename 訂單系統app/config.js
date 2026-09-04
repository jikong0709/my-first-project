window.CRISP_CONFIG = Object.freeze({
  supabaseUrl: 'https://uuefhkqtslcdkdgeyiof.supabase.co',
  publishableKey: 'sb_publishable_v_Yzne9MJIj-9sjXYN-NDA_iA_u8wii',
  defaultStore: 'crisp-day',
  appName: '脆日炸雞',
  appVersion: '2026.09.04.3'
});

// Shared formal-main visual layer. Loaded here so both store and customer pages get it.
(()=>{const link=document.createElement('link');link.rel='stylesheet';link.href='./enhancements.css?v=20260904-3';document.head.appendChild(link)})();

addEventListener('DOMContentLoaded',()=>{
  if(!document.querySelector('#loginGate'))return;
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
