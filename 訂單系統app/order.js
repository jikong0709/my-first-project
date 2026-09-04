const CFG=window.CRISP_CONFIG;
const RPC=CFG.supabaseUrl+'/rest/v1/rpc/';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'NT$ '+Number(n||0).toLocaleString('zh-TW');
const storeSlug=new URLSearchParams(location.search).get('store')||CFG.defaultStore;
let menu=[],store=null,cart=new Map(),dining='外帶',payment='現金',submitting=false,tracking=null,trackTimer=null;

async function rpc(name,body={}){
  const r=await fetch(RPC+name,{method:'POST',headers:{apikey:CFG.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const text=await r.text();let data={};
  try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if(!r.ok)throw new Error(data.message||data.error||'連線失敗');
  return data;
}
function show(msg,bad=false){$('#orderStatus').innerHTML=msg?`<div class="status${bad?' bad':''}">${esc(msg)}</div>`:''}
async function init(){
  try{
    const d=await rpc('smallshop_get_menu',{p_store_slug:storeSlug});
    store=d.store||{};menu=Array.isArray(d.menu)?d.menu:[];
    applyStore();renderMenu();renderPayment();renderCart();
  }catch(e){$('#menuRoot').innerHTML='';show(e.message||'菜單載入失敗',true)}
}
function applyStore(){
  $('#storeName').textContent=store.name||'脆日炸雞';
  $('#storeEn').textContent=store.brand_en||'CRISP DAY';
  $('#storePhone').textContent=store.phone||'電話未設定';
  $('#storeAddress').textContent=store.address||'忠孝夜市';
  document.title=(store.name||'脆日炸雞')+'｜手機點餐';
  $('#closedBanner').classList.toggle('hidden',!!store.business_open);
}
function renderMenu(){
  const groups={};for(const x of menu)(groups[x.category]??=[]).push(x);
  const cats=Object.keys(groups);
  $('#categoryNav').innerHTML=cats.map((c,i)=>`<button class="category-chip${i===0?' active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $('#menuRoot').innerHTML=cats.map(c=>`<section class="menu-section" id="cat-${encodeURIComponent(c)}"><h2>${esc(c)}</h2><div class="menu-grid">${groups[c].map(x=>`<article class="product-card"><div><div class="product-name">${esc(x.name)}</div><div class="product-price">${money(x.price)}</div></div><div class="qty"><button data-id="${x.id}" data-delta="-1">−</button><b data-qty="${x.id}">0</b><button data-id="${x.id}" data-delta="1">＋</button></div></article>`).join('')}</div></section>`).join('')||'<div class="loading">目前沒有上架商品</div>';
}
$('#categoryNav').addEventListener('click',e=>{
  const b=e.target.closest('.category-chip');if(!b)return;
  $$('.category-chip').forEach(x=>x.classList.toggle('active',x===b));
  document.getElementById('cat-'+encodeURIComponent(b.dataset.cat))?.scrollIntoView({behavior:'smooth',block:'start'});
});
$('#menuRoot').addEventListener('click',e=>{
  const b=e.target.closest('button[data-id]');if(!b||submitting)return;
  const id=Number(b.dataset.id),delta=Number(b.dataset.delta),next=Math.max(0,Math.min(99,(cart.get(id)||0)+delta));
  if(next)cart.set(id,next);else cart.delete(id);
  const q=document.querySelector(`[data-qty="${id}"]`);if(q)q.textContent=next;
  renderCart();
});
$$('.dining-btn').forEach(b=>b.onclick=()=>{
  dining=b.dataset.dining;
  $$('.dining-btn').forEach(x=>x.classList.toggle('active',x===b));
  const inside=dining==='內用';
  $('#tableNo').disabled=!inside;$('#tableBox').classList.toggle('disabled',!inside);
  $('#tableNo').placeholder=inside?'例如：A3、12':'選擇內用後填寫';
  $('#tableHint').textContent=inside?'請填桌號':'外帶免填桌號';
  if(inside)setTimeout(()=>$('#tableNo').focus(),80);else $('#tableNo').value='';
  renderCart();
});
function renderPayment(){
  const opts=[];
  if(store.cash_enabled)opts.push({v:'現金',label:'現金'});
  if(store.linepay_enabled)opts.push({v:'LINE Pay',label:store.linepay_live?'LINE Pay':'LINE Pay（測試）'});
  if(!opts.length){$('#paymentOptions').innerHTML='<div class="status bad">目前沒有可用付款方式</div>';payment='';return}
  if(!opts.some(x=>x.v===payment))payment=opts[0].v;
  $('#paymentOptions').innerHTML=opts.map(x=>`<button class="pay-btn${x.v===payment?' active':''}" data-pay="${x.v}">${x.label}</button>`).join('');
  $('#paymentNote').textContent=!store.linepay_live&&store.linepay_enabled?'LINE Pay 尚未串接正式金流，送單後仍由店家確認收款。':'';
}
$('#paymentOptions').addEventListener('click',e=>{const b=e.target.closest('.pay-btn');if(!b)return;payment=b.dataset.pay;renderPayment()});
function cartState(){
  let total=0,count=0,items=[];
  for(const [id,qty] of cart){const m=menu.find(x=>Number(x.id)===Number(id));if(!m)continue;total+=Number(m.price)*qty;count+=qty;items.push({id:Number(id),qty})}
  return{total,count,items};
}
function renderCart(){
  const c=cartState();
  $('#orderTotal').textContent=money(c.total);$('#cartCount').textContent=c.count?`${c.count} 件商品`:'尚未選擇商品';
  const tableOk=dining!=='內用'||$('#tableNo').value.trim();
  $('#submitOrder').disabled=!store?.business_open||!c.count||!payment||!tableOk||submitting;
}
$('#tableNo').addEventListener('input',renderCart);

function stopTracking(){if(trackTimer){clearInterval(trackTimer);trackTimer=null}}
function renderTrackedOrder(o){
  if(!o)return;
  $('#trackPay').textContent=`${o.payment_method} · ${o.payment_status}`;
  if(o.status==='已取消'){
    $('#trackBody').className='track-cancel';
    $('#trackBody').innerHTML='此訂單已取消';
    $('#trackNote').textContent='如有疑問請直接聯絡店家。';
    stopTracking();return;
  }
  const stages=['新訂單','製作中','已完成'];
  const labels=['已接單','製作中','已完成'];
  const idx=Math.max(0,stages.indexOf(o.status));
  $('#trackBody').className='track-steps';
  $('#trackBody').innerHTML=labels.map((label,i)=>`<div class="track-step${i<idx?' done':''}${i===idx?' on':''}">${label}</div>`).join('');
  $('#trackNote').textContent=o.status==='已完成'?'餐點已完成，請依現場指示取餐。':'頁面開著時會自動更新訂單狀態。';
  if(o.status==='已完成')stopTracking();
}
async function refreshTracking(manual=false){
  if(!tracking)return;
  try{
    const d=await rpc('smallshop_public_order_status',{p_store_slug:storeSlug,p_order_no:tracking.orderNo,p_public_token:tracking.publicToken});
    if(!d.ok)throw new Error(d.error||'找不到訂單');
    renderTrackedOrder(d.order);
  }catch(e){if(manual)$('#trackNote').textContent=e.message||'暫時無法更新訂單狀態';}
}
function startTracking(){
  stopTracking();refreshTracking();
  trackTimer=setInterval(()=>{if(!document.hidden&&tracking)refreshTracking(false)},5000);
}
$('#refreshTrackBtn').onclick=()=>refreshTracking(true);

$('#submitOrder').onclick=async()=>{
  const c=cartState();if(!c.count)return;
  if(dining==='內用'&&!$('#tableNo').value.trim()){show('內用請先填寫桌號。',true);$('#tableNo').focus();return}
  submitting=true;renderCart();$('#submitOrder').textContent='送出中…';
  try{
    const d=await rpc('smallshop_create_order',{p_store_slug:storeSlug,p_items:c.items,p_dining_type:dining,p_payment_method:payment,p_note:$('#orderNote').value.trim(),p_table_no:$('#tableNo').value.trim()});
    const o=d.order;
    tracking={orderNo:o.order_no,publicToken:o.public_token};
    $('#successNo').textContent=o.order_no;
    $('#successInfo').innerHTML=`${esc(o.dining_type)}${o.table_no?' · 桌 '+esc(o.table_no):''}<br>${esc(o.payment_method)} · ${money(o.total)}<br>${o.payment_status==='已收款'?'已收款':'等待店家確認收款'}`;
    renderTrackedOrder(o);$('#successModal').classList.remove('hidden');startTracking();show('');
  }catch(e){show(e.message||'送單失敗',true)}
  finally{submitting=false;$('#submitOrder').textContent='送出訂單';renderCart()}
};
$('#newOrderBtn').onclick=()=>{
  stopTracking();tracking=null;cart.clear();$$('[data-qty]').forEach(x=>x.textContent='0');$('#orderNote').value='';$('#successModal').classList.add('hidden');renderCart();scrollTo({top:0,behavior:'smooth'});
};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tracking)refreshTracking(false)});
init();
