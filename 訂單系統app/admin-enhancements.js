/* Formal-main overrides layered on top of the original admin controller. */
const prettyPhone=v=>{const p=String(v||'').replace(/\D/g,'');return /^09\d{8}$/.test(p)?`${p.slice(0,4)}-${p.slice(4,7)}-${p.slice(7)}`:v||''};

renderOrders=function(){
  if(!orders.length){$('#orders').innerHTML='<section class="panel">目前沒有訂單</section>';return}
  $('#orders').innerHTML=orders.map(o=>`<article class="order-card"><div class="order-top"><div><span class="order-no">${esc(o.order_no)}</span> <span class="pill">${esc(o.status)}</span></div><div class="order-price">${money(o.total)}</div></div><div class="customer-line"><b>${esc(o.customer_name||'未留姓名')}</b><a href="tel:${esc(o.customer_phone||'')}">${esc(prettyPhone(o.customer_phone||'未留電話'))}</a></div><div class="order-items item-lines">${(o.items||[]).map(i=>`<div><span>${esc(i.name)} × ${Number(i.qty||0)}</span><b>${money(Number(i.price||0)*Number(i.qty||0))}</b></div>`).join('')}</div><div class="order-meta"><b>${esc(o.dining_type)}${o.table_no?' · 桌 '+esc(o.table_no):''}</b> · ${esc(o.payment_method)} · ${esc(o.payment_status)} · ${fmt(o.created_at)}</div>${o.note?`<div class="order-note">備註：${esc(o.note)}</div>`:''}<div class="order-actions">${o.payment_status!=='已收款'?`<button class="btn btn-soft act" data-id="${o.id}" data-action="paid">確認收款</button>`:''}${o.status==='新訂單'?`<button class="btn btn-yellow act" data-id="${o.id}" data-action="making">開始製作</button>`:''}${o.status==='製作中'?`<button class="btn btn-dark act" data-id="${o.id}" data-action="done">完成</button>`:''}<button class="btn btn-ghost print" data-id="${o.id}">列印</button>${!['已完成','已取消'].includes(o.status)?`<button class="btn btn-danger act" data-id="${o.id}" data-action="cancel">取消</button>`:''}</div></article>`).join('')
};

printReceipt=function(o){
  const rows=(o.items||[]).map(i=>`<div style="display:flex;justify-content:space-between;margin:5px 0"><span>${esc(i.name)} ×${i.qty}</span><span>${money(Number(i.price||0)*Number(i.qty||0))}</span></div>`).join('');
  const w=open('','_blank');if(!w)return;
  w.document.write(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><body style="font-family:sans-serif;width:72mm;margin:auto;padding:5mm"><div style="text-align:center;font-size:24px;font-weight:900">${esc(store?.name||'脆日炸雞')}</div><div style="text-align:center;font-size:11px">${esc(store?.address||'忠孝夜市')}</div><div style="text-align:center;font-size:30px;font-weight:900;margin:8px">${esc(o.order_no)}</div><div style="font-size:13px;font-weight:700">訂購人：${esc(o.customer_name||'')}<br>電話：${esc(prettyPhone(o.customer_phone||''))}</div><hr>${rows}<hr><b>合計 ${money(o.total)}</b><p>${esc(o.dining_type)}${o.table_no?' · 桌 '+esc(o.table_no):''}<br>${esc(o.payment_method)} · ${esc(o.payment_status)}<br>${o.note?'備註：'+esc(o.note)+'<br>':''}${fmt(o.created_at)}</p><button onclick="print()" style="width:100%;padding:12px">列印訂單</button></body></html>`);w.document.close()
};

$('#changePassBtn').onclick=async()=>{
  const cur=$('#currentPass').value.trim(),next=$('#changePass').value.trim();
  if(!cur||!next){status('請輸入目前密碼與新密碼。',true);return}
  if(!/^\d{6,12}$/.test(next)){status('新密碼請使用 6–12 位數字。',true);return}
  $('#changePassBtn').disabled=true;
  try{
    const d=await rpc('smallshop_admin_change_passcode',{p_token:token,p_current:cur,p_new:next});
    if(!d.ok){status(d.error||'密碼更新失敗',true);return}
    $('#currentPass').value='';$('#changePass').value='';setSession('');store=null;showGate();
    status('管理密碼已更新。舊密碼已失效，所有店家裝置已登出，請使用新密碼重新登入。')
  }catch(e){status(e.message||'密碼更新失敗',true)}finally{$('#changePassBtn').disabled=false}
};

function appStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function installPlatform(){const ua=navigator.userAgent.toLowerCase();return{ios:/iphone|ipad|ipod/.test(ua),android:/android/.test(ua)}}
function openInstallHelp(){
  const p=installPlatform();let html='';
  if(p.ios)html='<div class="install-step"><b>iPhone / iPad</b><ol><li>請使用 Safari 開啟此頁。</li><li>點 Safari 的「分享」按鈕。</li><li>選擇「加入主畫面」。</li><li>確認名稱後點「加入」。</li></ol></div>';
  else if(p.android)html='<div class="install-step"><b>Android</b><ol><li>建議使用 Chrome 開啟此頁。</li><li>如果沒有跳出安裝視窗，點右上角「⋮」。</li><li>選擇「安裝應用程式」或「加到主畫面」。</li></ol></div>';
  else html='<div class="install-step"><b>安裝方式</b><p>請使用支援 PWA 的瀏覽器開啟選單，選擇「安裝應用程式」或「建立捷徑」。手機建議使用 Android Chrome 或 iPhone/iPad Safari。</p></div>';
  $('#installHelpBody').innerHTML=html;$('#installHelpModal').classList.remove('hidden');document.body.classList.add('modal-open')
}
function closeInstallHelp(){$('#installHelpModal').classList.add('hidden');document.body.classList.remove('modal-open')}
$('#closeInstallHelp').onclick=closeInstallHelp;$('#closeInstallHelpBottom').onclick=closeInstallHelp;$('#installHelpModal').addEventListener('click',e=>{if(e.target===$('#installHelpModal'))closeInstallHelp()});
if(!appStandalone())$('#installBtn').classList.remove('hidden');
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').onclick=async()=>{
  if(appStandalone()){status('目前已經是 App 模式。');return}
  if(deferredPrompt){try{deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;if(choice.outcome!=='accepted')openInstallHelp()}catch{openInstallHelp()}return}
  openInstallHelp()
};
addEventListener('appinstalled',()=>{$('#installBtn').classList.add('hidden');closeInstallHelp();status('店家 App 已安裝。')});

(async()=>{if(!('serviceWorker' in navigator))return;try{const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});reg.update().catch(()=>{})}catch(e){console.warn('Service worker registration failed',e)}})();
