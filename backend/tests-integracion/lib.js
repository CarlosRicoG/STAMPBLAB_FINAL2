/**
 * Utilidades compartidas de las pruebas de integracion
 * Requisitos: backend corriendo (API_URL, por defecto http://127.0.0.1:3000/api) y base con los datos
 * de demostracion:  npm run db:reset  &&  node scripts/seed-demo-flujo.js
 * Cuentas: admin@stamplab.com / Admin123*  y  cliente@stamplab.com / Cliente123* (ver README).
 */
const U=process.env.API_URL || 'http://127.0.0.1:3000/api';
let token='';
exports.setToken=t=>token=t;
exports.call=async(m,p,b)=>{const r=await fetch(U+p,{method:m,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:b?JSON.stringify(b):undefined});
 let t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t}return{s:r.status,j}};
exports.show=(n,r)=>console.log((r.s<300?'OK  ':'FAIL')+' '+n+' ['+r.s+'] '+(r.s<300?'':JSON.stringify(r.j).slice(0,250)));
exports.id=(r,...ks)=>{const d=r.j?.datos??r.j?.data??r.j;for(const k of ks){if(d?.[k]!=null)return d[k];if(d?.dato?.[k]!=null)return d.dato[k]}return undefined};
