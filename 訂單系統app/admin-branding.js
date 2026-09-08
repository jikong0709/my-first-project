/* P1-2B tenant branding admin UI. Theme palette authority remains Supabase Theme Catalog. */
const BRANDING_HEX=/^#[0-9A-Fa-f]{6}$/;
const BRANDING_LOGO_URL=/^(?:https:\/\/|\/|\.\/)/;
const BRANDING_THEME_LABELS=Object.freeze({
  'default':'預設','cream-yellow':'奶茶黃','orange-black':'橘黑',
  'red-white':'紅白','forest-green':'墨綠','blue-white':'藍白'
});
const BRANDING_THEME_ORDER=Object.freeze(['default','cream-yellow','orange-black','red-white','forest-green','blue-white']);
const BRANDING_PREVIEW_VARS=Object.freeze([
  '--brand-primary','--brand-secondary','--brand-bg','--brand-surface','--brand-text',
  '--brand-muted','--brand-line','--brand-accent','--brand-button','--brand-button-text',
  '--brand-soft','--brand-danger','--brand-radius'
]);
let brandingThemeCatalog=[];

function brandingThemeByKey(key){return brandingThemeCatalog.find(x=>x.theme_key===key)||null}
function brandingThemeLabel(theme){return BRANDING_THEME_LABELS[theme?.theme_key]||theme?.name||theme?.theme_key||''}
function brandingValue(id){return ($(id)?.value||'').trim()}
function brandingHex(value){const v=String(value||'').trim().toUpperCase();return v&&BRANDING_HEX.test(v)?v:''}
function brandingMessage(message=''){
  const el=$('#brandingValidation');if(!el)return;
  el.textContent=message||'顏色僅接受 #RRGGBB；留空時使用 Theme 模板預設值。';
  el.classList.toggle('bad',!!message)
}
function renderBrandingThemes(selected='default'){
  const select=$('#brandTheme');if(!select)return;
  const order=new Map(BRANDING_THEME_ORDER.map((key,i)=>[key,i]));
  const themes=[...brandingThemeCatalog].sort((a,b)=>(order.get(a.theme_key)??99)-(order.get(b.theme_key)??99));
  select.innerHTML=themes.map(t=>`<option value="${esc(t.theme_key)}">${esc(brandingThemeLabel(t))}</option>`).join('');
  select.value=themes.some(t=>t.theme_key===selected)?selected:(themes[0]?.theme_key||'default')
}
async function loadBrandingThemeCatalog(){
  const d=await rpc('smallshop_admin_theme_catalog',{p_token:token});
  if(!d?.ok||!Array.isArray(d.themes))throw new Error('Theme Catalog 讀取失敗');
  brandingThemeCatalog=d.themes.filter(t=>t&&t.theme_key&&t.css_vars&&typeof t.css_vars==='object');
  if(!brandingThemeCatalog.some(t=>t.theme_key==='default'))throw new Error('Default Theme 不可用');
}
function restoreBrandingOverrides(){
  const b=store?.branding||{};
  $('#brandPrimary').value=b.brand_color||'';
  $('#brandAccent').value=b.accent_color||'';
  $('#brandBackground').value=b.background_color||'';
  $('#brandButton').value=b.button_color||''
}
function previewBranding(){
  const preview=$('#brandingPreview');if(!preview)return;
  const theme=brandingThemeByKey($('#brandTheme')?.value)||brandingThemeByKey('default');
  const vars={...(theme?.css_vars||{})};
  const overrides={
    '--brand-primary':brandingValue('#brandPrimary'),
    '--brand-accent':brandingValue('#brandAccent'),
    '--brand-bg':brandingValue('#brandBackground'),
    '--brand-button':brandingValue('#brandButton')
  };
  let error='';
  for(const [key,value] of Object.entries(overrides)){
    if(!value)continue;
    if(!BRANDING_HEX.test(value)){error='品牌色格式錯誤，請使用 #RRGGBB。';continue}
    vars[key]=value.toUpperCase()
  }
  for(const key of BRANDING_PREVIEW_VARS){
    const value=String(vars[key]||'').trim();
    if(value)preview.style.setProperty(key,value);else preview.style.removeProperty(key)
  }
  const logo=brandingValue('#brandLogoUrl'),logoEl=$('#brandingPreviewLogo');
  if(logo&&(!BRANDING_LOGO_URL.test(logo)||logo.length>1024))error='Logo URL 只接受 https://、/ 或 ./ 開頭，最長 1024 字元。';
  if(logo&&BRANDING_LOGO_URL.test(logo)&&logo.length<=1024){logoEl.src=logo;logoEl.classList.remove('hidden')}
  else{logoEl.removeAttribute('src');logoEl.classList.add('hidden')}
  $('#brandingPreviewName').textContent=($('#setName')?.value||store?.name||'店家').trim()||'店家';
  brandingMessage(error)
}
function syncBrandingForm(){
  if(!store||!$('#brandTheme'))return;
  const b=store.branding||{};
  renderBrandingThemes(b.theme_key||'default');
  $('#brandLogoUrl').value=b.logo_url||'';
  restoreBrandingOverrides();
  brandingMessage('');
  previewBranding()
}
function validateBranding(){
  const theme=$('#brandTheme').value;
  if(!brandingThemeByKey(theme))throw new Error('Theme 不在允許清單中。');
  for(const id of ['#brandPrimary','#brandAccent','#brandBackground','#brandButton']){
    const value=brandingValue(id);if(value&&!BRANDING_HEX.test(value))throw new Error('品牌色只接受 #RRGGBB 格式。')
  }
  const logo=brandingValue('#brandLogoUrl');
  if(logo&&(!BRANDING_LOGO_URL.test(logo)||logo.length>1024))throw new Error('Logo URL 只接受 https://、/ 或 ./ 開頭，最長 1024 字元。');
  return{theme,logo}
}
async function loadBrandingSettings(){
  await loadBrandingThemeCatalog();
  syncBrandingForm()
}

// Preserve the existing settings workflow; add branding only after the store session is resolved.
const baseLoadStore=loadStore;
loadStore=async function(){
  await baseLoadStore();
  if(!store||!token)return;
  try{await loadBrandingSettings()}catch(e){brandingMessage(e.message||'品牌設定讀取失敗');status(e.message||'品牌設定讀取失敗',true)}
};

['#brandLogoUrl','#brandPrimary','#brandAccent','#brandBackground','#brandButton'].forEach(id=>$(id)?.addEventListener('input',previewBranding));
$('#setName')?.addEventListener('input',previewBranding);
$('#brandTheme')?.addEventListener('change',()=>{
  const persisted=store?.branding?.theme_key||'default';
  if($('#brandTheme').value===persisted)restoreBrandingOverrides();
  else{
    $('#brandPrimary').value='';$('#brandAccent').value='';$('#brandBackground').value='';$('#brandButton').value=''
  }
  previewBranding()
});
$('#clearBrandLogo')?.addEventListener('click',()=>{$('#brandLogoUrl').value='';previewBranding()});
$('#brandingPreviewLogo')?.addEventListener('error',()=>{$('#brandingPreviewLogo').classList.add('hidden')});
$('#saveBrandingBtn')?.addEventListener('click',async()=>{
  const button=$('#saveBrandingBtn');button.disabled=true;
  try{
    const {theme,logo}=validateBranding();
    const b=store?.branding||{},themeChanged=theme!==(b.theme_key||'default');
    const d=await rpc('smallshop_admin_branding_save',{
      p_token:token,
      p_theme_key:theme,
      p_logo_url:logo||null,
      p_icon_url:b.icon_url||null,
      p_brand_color:brandingHex(brandingValue('#brandPrimary'))||null,
      p_accent_color:brandingHex(brandingValue('#brandAccent'))||null,
      p_background_color:brandingHex(brandingValue('#brandBackground'))||null,
      p_surface_color:themeChanged?null:(b.surface_color||null),
      p_text_color:themeChanged?null:(b.text_color||null),
      p_button_color:brandingHex(brandingValue('#brandButton'))||null,
      p_button_text_color:themeChanged?null:(b.button_text_color||null),
      p_border_radius:themeChanged?null:(b.border_radius||null)
    });
    if(!d?.ok||!d.branding)throw new Error('品牌設定儲存失敗');
    store={...store,branding:d.branding};
    window.ORDER_SYSTEM_THEME?.apply(d.branding);
    syncBrandingForm();
    status('品牌設定已儲存，並立即套用。')
  }catch(e){brandingMessage(e.message||'品牌設定儲存失敗');status(e.message||'品牌設定儲存失敗',true)}
  finally{button.disabled=false}
});
