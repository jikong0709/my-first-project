/* ORDER_SYSTEM browser adapter for qrcode-terminal vendor/QRCode. See qr-vendor.LICENSE.txt. */
(function(g){
  "use strict";
  const M=g.ORDER_SYSTEM_QR_MODULES,C=Object.create(null);
  function req(id){if(C[id])return C[id].exports;const fn=M&&M[id];if(!fn)throw new Error('QR module not found: '+id);const module={exports:{}};C[id]=module;fn(module,module.exports,req);return module.exports}
  const QRCode=req('./index'),levels=req('./QRErrorCorrectLevel');
  g.ORDER_SYSTEM_QR_GENERATOR=Object.freeze({makeMatrix(text,level='M'){const value=String(text??'');if(!value)throw new Error('QR payload required');const ec=levels[String(level||'M').toUpperCase()];if(ec===undefined)throw new Error('invalid QR error level');const qr=new QRCode(-1,ec);qr.addData(value);qr.make();return qr.modules.map(row=>row.map(Boolean))}});
})(typeof window!=='undefined'?window:globalThis);
