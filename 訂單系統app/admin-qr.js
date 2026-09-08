(()=>{
  const URLS=window.ORDER_SYSTEM_URLS;
  const GENERATOR=window.ORDER_SYSTEM_QR_GENERATOR;
  let currentUrl='';

  const el=id=>document.getElementById(id);
  const currentStore=()=>typeof store!=='undefined'&&store?.slug?store:null;
  const notify=(message,bad=false)=>{if(typeof status==='function')status(message,bad)};
  const buildUrl=slug=>{
    if(!URLS?.buildCustomerOrderUrl)throw new Error('canonical customer URL builder unavailable');
    return URLS.buildCustomerOrderUrl(slug);
  };
  const setEnabled=enabled=>{
    const copy=el('copyQrUrl'),download=el('downloadQr'),open=el('openQrUrl');
    if(copy)copy.disabled=!enabled;
    if(download)download.disabled=!enabled;
    if(open){open.setAttribute('aria-disabled',enabled?'false':'true');open.tabIndex=enabled?0:-1}
  };
  function drawCanvas(target,url){
    if(!GENERATOR?.makeMatrix)throw new Error('QR generator unavailable');
    const matrix=GENERATOR.makeMatrix(url,'M'),quiet=4,modules=matrix.length,total=modules+quiet*2,scale=Math.max(4,Math.floor(320/total)),size=total*scale;
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;canvas.dataset.payload=url;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,size,size);ctx.fillStyle='#000000';
    for(let row=0;row<modules;row++)for(let col=0;col<modules;col++)if(matrix[row][col])ctx.fillRect((col+quiet)*scale,(row+quiet)*scale,scale,scale);
    target.replaceChildren(canvas);target.dataset.payload=url;return canvas;
  }
  function refresh(){
    const resolved=currentStore(),urlBox=el('qrUrl'),open=el('openQrUrl'),target=el('qrCode'),name=el('qrStoreName'),customerLink=el('customerLink'),download=el('downloadQr');
    if(!resolved||!urlBox||!open||!target||!download){currentUrl='';setEnabled(false);return ''}
    const url=buildUrl(resolved.slug);currentUrl=url;urlBox.textContent=url;open.href=url;if(customerLink)customerLink.href=url;if(name)name.textContent=resolved.name||'店家';
    download.dataset.filename=`${resolved.slug}-order-qr.png`;download.dataset.payload=url;drawCanvas(target,url);setEnabled(true);return url;
  }
  async function copyText(text){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
    const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('copy failed');
  }
  function download(){
    const resolved=currentStore(),canvas=el('qrCode')?.querySelector('canvas');if(!resolved||!currentUrl||!canvas)return;
    if(canvas.dataset.payload!==currentUrl){notify('QR payload 驗證失敗，請重新整理。',true);return}
    canvas.toBlob(blob=>{if(!blob){notify('QR 下載失敗。',true);return}const a=document.createElement('a'),blobUrl=URL.createObjectURL(blob);a.href=blobUrl;a.download=`${resolved.slug}-order-qr.png`;a.click();setTimeout(()=>URL.revokeObjectURL(blobUrl),1000)},'image/png');
  }
  const copy=el('copyQrUrl');if(copy)copy.onclick=async()=>{try{if(!currentUrl)refresh();await copyText(currentUrl);notify('點餐網址已複製。')}catch{notify('無法自動複製，請長按網址複製。',true)}};
  const downloadBtn=el('downloadQr');if(downloadBtn)downloadBtn.onclick=download;
  if(typeof refreshQr==='function')refreshQr=refresh;
  window.ORDER_SYSTEM_QR=Object.freeze({refresh,buildCustomerOrderUrl:buildUrl,getCurrentPayload:()=>currentUrl});
  setEnabled(false);queueMicrotask(()=>{if(currentStore())refresh()});
})();
