const CFG=window.CRISP_CONFIG;
const RPC=CFG.supabaseUrl+'/rest/v1/rpc/';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'NT$ '+Number(n||0).toLocaleString('zh-TW');
const storeSlug=new URLSearchParams(location.search).get('store')||CFG.defaultStore;
const HISTORY_KEY='crispday.customer.order_refs.v2';
let menu=[],store=null,cart=new Map(),dining='外帶',payment='現金',submitting=false,tracking=null,trackTimer=null,currentOrder=null;

async function rpc(name,body={}){
  const r=await fetch(RPC+name,{method:'POST',headers:{apikey:CFG.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const text=await r.text();let data={};
  try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if(!r.ok)throw new Error(data.message||data.error||'連線失敗');
  return data;
}
function show(msg,bad=false){$('#orderStatus').innerHTML=msg?`<div class="status${bad?' bad':''}">${esc(msg)}</div>`:''}
function fmt(v){return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v))}
function phoneDigits(v){return String(v||'').replace(/\D/g,'')}
function validPhone(v){return /^09\d{8}$/.test(phoneDigits(v))}
function formatPhone(v){const p=phoneDigits(v);return /^09\d{8}$/.test(p)?`${p.slice(0,4)}-${p.slice(4,7)}-${p.slice(7)}`:v||''}
function openModal(id){$('#'+id).classList.remove('hidden');document.body.classList.add('modal-open')}
function closeModal(id){$('#'+id).classList.add('hidden');if(!$$('.modal-layer:not(.hidden)').length)document.body.classList.remove('modal-open')}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('.modal-layer').forEach(m=>m.addEventListener('click',e=>{if(e.target===m&&m.id!=='successModal')closeModal(m.id)}));

function historyRefs(){try{return (JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')||[]).filter(x=>x&&x.storeSlug&&x.orderNo&&x.publicToken)}catch{return[]}}
function saveHistoryRef(order){const next=[{storeSlug,orderNo:order.order_no,publicToken:order.public_token,createdAt:order.created_at||new Date().toISOString()},...historyRefs().filter(x=>!(x.storeSlug===storeSlug&&x.orderNo===order.order_no))].slice(0,50);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));updateHistoryBadge()}
function updateHistoryBadge(){const n=historyRefs().filter(x=>x.storeSlug===storeSlug).length;$('#historyBadge').textContent=n;$('#historyBadge').classList.toggle('hidden',!n)}

async function init(){
  updateHistoryBadge();
  try{
    const d=await rpc('smallshop_get_menu',{p_store_slug:storeSlug});
    store=d.store||{};menu=Array.isArray(d.menu)?d.menu:[];
    applyStore();renderMenu();renderPayment();renderCartBar();
  }catch(e){$('#menuRoot').innerHTML='';show(e.message||'菜單載入失敗',true)}
}
function applyStore(){
  $('#storeName').textContent=store.name||'脆日炸雞';$('#storeEn').textContent=store.brand_en||'CRISP DAY';
  $('#storePhone').textContent=store.phone||'電話未設定';$('#storeAddress').textContent=store.address||'忠孝夜市';
  document.title=(store.name||'脆日炸雞')+'｜手機點餐';$('#closedBanner').classList.toggle('hidden',!!store.business_open);
}
function renderMenu(){
  const groups={};for(const x of menu)(groups[x.category]??=[]).push(x);
  const cats=Object.keys(groups);
  $('#categoryNav').innerHTML=cats.map((c,i)=>`<button class="category-chip${i===0?' active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $('#menuRoot').innerHTML=cats.map(c=>`<section class="menu-section" id="cat-${encodeURIComponent(c)}"><h2>${esc(c)}</h2><div class="menu-grid">${groups[c].map(x=>`<article class="product-card"><div><div class="product-name">${esc(x.name)}</div><div class="product-price">${money(x.price)}</div></div><div class="qty"><button data-id="${x.id}" data-delta="-1" aria-label="減少">−</button><b data-qty="${x.id}">${cart.get(Number(x.id))||0}</b><button data-id="${x.id}" data-delta="1" aria-label="增加">＋</button></div></article>`).join('')}</div></section>`).join('')||'<div class="loading">目前沒有上架商品</div>';
}
$('#categoryNav').addEventListener('click',e=>{const b=e.target.closest('.category-chip');if(!b)return;$$('.category-chip').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('cat-'+encodeURIComponent(b.dataset.cat))?.scrollIntoView({behavior:'smooth',block:'start'})});
$('#menuRoot').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b||submitting)return;changeQty(Number(b.dataset.id),Number(b.dataset.delta))});
function changeQty(id,delta){const next=Math.max(0,Math.min(99,(cart.get(id)||0)+delta));if(next)cart.set(id,next);else cart.delete(id);const q=document.querySelector(`[data-qty="${id}"]`);if(q)q.textContent=next;renderCartBar();if(!$('#cartModal').classList.contains('hidden'))renderCartModal()}
function cartState(){let total=0,count=0,items=[];for(const [id,qty] of cart){const m=menu.find(x=>Number(x.id)===Number(id));if(!m)continue;total+=Number(m.price)*qty;count+=qty;items.push({id:Number(id),name:m.name,price:Number(m.price),qty,subtotal:Number(m.price)*qty})}return{total,count,items}}
function renderCartBar(){const c=cartState();$('#orderTotal').textContent=money(c.total);$('#cartCount').textContent=c.count?`${c.count} 件商品`:'尚未選擇商品';$('#openCartBtn').disabled=!c.count}
function renderCartModal(){const c=cartState();$('#cartModalTotal').textContent=money(c.total);$('#goCheckoutBtn').disabled=!c.count;$('#cartItems').innerHTML=c.items.length?c.items.map(i=>`<div class="cart-item"><div class="cart-main"><b>${esc(i.name)}</b><span>${money(i.price)} / 份</span></div><div class="cart-controls"><button data-cart-id="${i.id}" data-delta="-1">−</button><b>${i.qty}</b><button data-cart-id="${i.id}" data-delta="1">＋</button><button class="cart-remove" data-remove-id="${i.id}">刪除</button></div><div class="cart-subtotal">${money(i.subtotal)}</div></div>`).join(''):'<div class="empty-state">購物車目前是空的</div>'}
$('#openCartBtn').onclick=()=>{renderCartModal();openModal('cartModal')};
$('#continueShoppingBtn').onclick=()=>closeModal('cartModal');
$('#cartItems').addEventListener('click',e=>{const q=e.target.closest('[data-cart-id]');if(q){changeQty(Number(q.dataset.cartId),Number(q.dataset.delta));return}const r=e.target.closest('[data-remove-id]');if(r){cart.delete(Number(r.dataset.removeId));const n=document.querySelector(`[data-qty="${r.dataset.removeId}"]`);if(n)n.textContent='0';renderCartBar();renderCartModal()}});

function renderPayment(){
  const opts=[];if(store?.cash_enabled)opts.push({v:'現金',label:'現金'});if(store?.linepay_enabled)opts.push({v:'LINE Pay',label:store.linepay_live?'LINE Pay':'LINE Pay（測試）'});
  if(!opts.length){$('#paymentOptions').innerHTML='<div class="status bad">目前沒有可用付款方式</div>';payment='';return}
  if(!opts.some(x=>x.v===payment))payment=opts[0].v;
  $('#paymentOptions').innerHTML=opts.map(x=>`<button class="pay-btn${x.v===payment?' active':''}" data-pay="${x.v}" type="button">${x.label}</button>`).join('');
  $('#paymentNote').textContent=!store.linepay_live&&store.linepay_enabled?'LINE Pay 尚未串接正式金流，送單後仍由店家確認收款。':'';
}
$('#paymentOptions').addEventListener('click',e=>{const b=e.target.closest('.pay-btn');if(!b)return;payment=b.dataset.pay;renderPayment()});
$$('.dining-btn').forEach(b=>b.onclick=()=>{dining=b.dataset.dining;$$('.dining-btn').forEach(x=>x.classList.toggle('active',x===b));const inside=dining==='內用';$('#tableNo').disabled=!inside;$('#tableBox').classList.toggle('disabled',!inside);$('#tableNo').placeholder=inside?'例如：A3、12':'選擇內用後填寫';$('#tableHint').textContent=inside?'請填桌號':'外帶免填桌號';if(inside)setTimeout(()=>$('#tableNo').focus(),80);else $('#tableNo').value=''});
$('#goCheckoutBtn').onclick=()=>{const c=cartState();if(!c.count)return;closeModal('cartModal');$('#checkoutTotal').textContent=money(c.total);renderPayment();openModal('checkoutModal')};
$('#backToCartBtn').onclick=()=>{closeModal('checkoutModal');renderCartModal();openModal('cartModal')};
function checkoutData(){return{name:$('#customerName').value.trim(),phone:phoneDigits($('#customerPhone').value),table:$('#tableNo').value.trim(),note:$('#orderNote').value.trim(),dining,payment}}
function validateCheckout(){const d=checkoutData();let msg='';if(!d.name)msg='請填寫訂購人姓名。';else if(!validPhone(d.phone))msg='手機電話請輸入 09 開頭共 10 碼。';else if(d.dining==='內用'&&!d.table)msg='內用請填寫桌號。';else if(!d.payment)msg='目前沒有可用付款方式。';$('#contactError').textContent=msg;$('#contactError').classList.toggle('hidden',!msg);return !msg}
$('#reviewOrderBtn').onclick=()=>{if(!validateCheckout())return;const c=cartState(),d=checkoutData();$('#confirmSummary').innerHTML=`<div class="confirm-person"><b>${esc(d.name)}</b><span>${esc(formatPhone(d.phone))}</span></div><div class="confirm-meta">${esc(d.dining)}${d.table?' · 桌 '+esc(d.table):''} · ${esc(d.payment)}</div><div class="confirm-items">${c.items.map(i=>`<div><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.subtotal)}</b></div>`).join('')}</div>${d.note?`<div class="confirm-note">備註：${esc(d.note)}</div>`:''}<div class="confirm-total"><span>合計</span><b>${money(c.total)}</b></div>`;closeModal('checkoutModal');openModal('confirmModal')};
$('#editCheckoutBtn').onclick=()=>{closeModal('confirmModal');openModal('checkoutModal')};

function stopTracking(){if(trackTimer){clearInterval(trackTimer);trackTimer=null}}
function renderStatus(o){
  $('#trackPay').textContent=`${o.payment_method} · ${o.payment_status}`;
  if(o.status==='已取消'){$('#trackBody').className='track-cancel';$('#trackBody').innerHTML='此訂單已取消';$('#trackNote').textContent='如有疑問請直接聯絡店家。';stopTracking();return}
  const stages=['新訂單','製作中','已完成'],labels=['已接單','製作中','已完成'],idx=Math.max(0,stages.indexOf(o.status));
  $('#trackBody').className='track-steps';$('#trackBody').innerHTML=labels.map((label,i)=>`<div class="track-step${i<idx?' done':''}${i===idx?' on':''}">${label}</div>`).join('');
  $('#trackNote').textContent=o.status==='已完成'?'餐點已完成，請依現場指示取餐。':'頁面開著時會自動更新訂單狀態。';if(o.status==='已完成')stopTracking();
}
function renderOrderDetail(o,ref){
  currentOrder=o;tracking=ref||tracking;
  $('#successNo').textContent=o.order_no;$('#successInfo').innerHTML=`<b>訂購人：${esc(o.customer_name||'')}</b><br>電話：${esc(formatPhone(o.customer_phone||''))}<br>${esc(o.dining_type)}${o.table_no?' · 桌 '+esc(o.table_no):''}<br>${esc(o.payment_method)} · ${esc(o.payment_status)}`;
  $('#successItems').innerHTML=(o.items||[]).map(i=>`<div><span>${esc(i.name)} × ${Number(i.qty||0)}</span><b>${money(Number(i.price||0)*Number(i.qty||0))}</b></div>`).join('');$('#successTotal').textContent=money(o.total);renderStatus(o)
}
async function refreshTracking(manual=false){if(!tracking)return;try{const d=await rpc('smallshop_public_order_status',{p_store_slug:storeSlug,p_order_no:tracking.orderNo,p_public_token:tracking.publicToken});if(!d.ok)throw new Error(d.error||'找不到訂單');renderOrderDetail(d.order,tracking)}catch(e){if(manual)$('#trackNote').textContent=e.message||'暫時無法更新訂單狀態'}}
function startTracking(){stopTracking();refreshTracking();trackTimer=setInterval(()=>{if(!document.hidden&&tracking)refreshTracking(false)},5000)}
$('#refreshTrackBtn').onclick=()=>refreshTracking(true);

$('#submitOrder').onclick=async()=>{
  const c=cartState(),d=checkoutData();if(!c.count||!validateCheckout()||submitting)return;
  submitting=true;$('#submitOrder').disabled=true;$('#submitOrder').textContent='送出中…';
  try{
    const res=await rpc('smallshop_create_order',{p_store_slug:storeSlug,p_items:c.items.map(i=>({id:i.id,qty:i.qty})),p_customer_name:d.name,p_customer_phone:d.phone,p_dining_type:d.dining,p_payment_method:d.payment,p_note:d.note,p_table_no:d.table});
    const o=res.order;tracking={orderNo:o.order_no,publicToken:o.public_token};saveHistoryRef(o);renderOrderDetail(o,tracking);closeModal('confirmModal');openModal('successModal');startTracking();show('')
  }catch(e){show(e.message||'送單失敗',true);closeModal('confirmModal');openModal('checkoutModal')}
  finally{submitting=false;$('#submitOrder').disabled=false;$('#submitOrder').textContent='確定送出訂單'}
};
function resetOrdering(){stopTracking();tracking=null;currentOrder=null;cart.clear();$$('[data-qty]').forEach(x=>x.textContent='0');$('#orderNote').value='';$('#tableNo').value='';dining='外帶';$$('.dining-btn').forEach(x=>x.classList.toggle('active',x.dataset.dining==='外帶'));$('#tableNo').disabled=true;$('#tableBox').classList.add('disabled');$('#tableHint').textContent='外帶免填桌號';renderCartBar()}
$('#newOrderBtn').onclick=()=>{closeModal('successModal');resetOrdering();scrollTo({top:0,behavior:'smooth'})};

async function loadHistory(){
  const refs=historyRefs().filter(x=>x.storeSlug===storeSlug);updateHistoryBadge();
  if(!refs.length){$('#historyList').innerHTML='<div class="empty-state">這台裝置目前沒有歷史訂單。</div>';return}
  $('#historyList').innerHTML='<div class="loading">訂單讀取中…</div>';
  const rows=[];
  for(const ref of refs){try{const d=await rpc('smallshop_public_order_status',{p_store_slug:storeSlug,p_order_no:ref.orderNo,p_public_token:ref.publicToken});if(d.ok)rows.push({ref,order:d.order})}catch{}}
  $('#historyList').innerHTML=rows.length?rows.map(({ref,order:o})=>`<button class="history-order" data-order-no="${esc(ref.orderNo)}" type="button"><div><b>${esc(o.order_no)}</b><span>${fmt(o.created_at)}</span></div><div class="history-order-middle"><span>${esc(o.customer_name||'')} · ${esc(o.dining_type)}${o.table_no?' · 桌 '+esc(o.table_no):''}</span><small>${esc((o.items||[]).map(i=>i.name+'×'+i.qty).join('、'))}</small></div><div><b>${money(o.total)}</b><span>${esc(o.status)}</span></div></button>`).join(''):'<div class="empty-state">目前無法讀取歷史訂單。</div>';
  $('#historyList').dataset.rows=JSON.stringify(rows.map(x=>({ref:x.ref,order:x.order})));
}
$('#myOrdersBtn').onclick=async()=>{openModal('historyModal');await loadHistory()};
$('#showHistoryFromSuccess').onclick=async()=>{closeModal('successModal');openModal('historyModal');await loadHistory()};
$('#historyList').addEventListener('click',e=>{const b=e.target.closest('.history-order');if(!b)return;let rows=[];try{rows=JSON.parse($('#historyList').dataset.rows||'[]')}catch{}const row=rows.find(x=>x.ref.orderNo===b.dataset.orderNo);if(!row)return;tracking={orderNo:row.ref.orderNo,publicToken:row.ref.publicToken};renderOrderDetail(row.order,tracking);closeModal('historyModal');openModal('successModal');startTracking()});

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tracking)refreshTracking(false)});
init();
