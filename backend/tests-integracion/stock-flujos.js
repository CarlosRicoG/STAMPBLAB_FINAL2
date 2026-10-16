/**
 * Stock: ventas, compras y cotizaciones (descuentos, devoluciones, validaciones)
 * Requisitos: backend corriendo (API_URL, por defecto http://127.0.0.1:3000/api) y base con los datos
 * de demostracion:  npm run db:reset  &&  node scripts/seed-demo-flujo.js
 * Cuentas: admin@stamplab.com / Admin123*  y  cliente@stamplab.com / Cliente123* (ver README).
 */
const {call,show,setToken}=require('./lib');
const pk=(r,k)=>{const f=o=>{if(!o||typeof o!=='object')return;if(o[k]!=null)return o[k];for(const v of Object.values(o)){const x=f(v);if(x!=null)return x}};return f(r.j)};
let bad=0;const eq=(n,a,b)=>{const ok=a===b;if(!ok)bad++;console.log((ok?'OK   ':'FAIL ')+n+': '+a+(ok?'':' (esperado '+b+')'))};
const st=(c)=>(c.s>=200&&c.s<300)?'':' ['+c.s+' '+JSON.stringify(c.j).slice(0,160)+']';
(async()=>{
 const TOKEN=(await call('POST','/login',{Correo:'admin@stamplab.com','Contraseña':'Admin123*'})).j.token;setToken(TOKEN);
 const P=1,C=1,T=1,Tela=1,IID=1;
 const stock=async()=>pk(await call('GET','/inventarioproducto/'+IID),'Stock');
 const ins=async id=>pk(await call('GET','/insumos/'+id),'Stock');
 await call('PUT','/inventarioproducto/'+IID,{Stock:20,TelaID:Tela,Estado:true});eq('stock base',await stock(),20);
 const det=q=>[{ProductoID:P,ColorID:C,TallaID:T,TelaID:Tela,Cantidad:q,PrecioUnitario:25000,InventarioID:IID}];
 // VENTAS
 let v=await call('POST','/ventas',{DocumentoID:'1000000002',Subtotal:75000,Total:75000,EstadoID:8,detalles:det(3)});const V=pk(v,'VentaID');if(!V)console.log('venta crear',st(v));eq('venta de 3',await stock(),17);
 let e=await call('PUT','/ventas/'+V,{EstadoID:8,Subtotal:125000,Total:125000,detalles:det(5)});if(e.s>=300)console.log('editar',st(e));eq('editar 3->5',await stock(),15);
 e=await call('PUT','/ventas/'+V,{EstadoID:8,Subtotal:1,Total:1,detalles:det(999)});eq('editar a 999 -> 400',e.s,400);eq('stock intacto',await stock(),15);
 await call('PATCH','/ventas/'+V+'/estado',{EstadoID:12});eq('cancelar pendiente devuelve',await stock(),20);
 v=await call('POST','/ventas',{DocumentoID:'1000000002',Subtotal:50000,Total:50000,EstadoID:8,detalles:det(2)});const V2=pk(v,'VentaID');eq('venta de 2',await stock(),18);
 await call('DELETE','/ventas/'+V2);eq('borrar pendiente devuelve',await stock(),20);
 eq('venta sin stock -> 400',(await call('POST','/ventas',{DocumentoID:'1000000002',Subtotal:1,Total:1,EstadoID:9,detalles:det(9999)})).s,400);
 eq('venta cliente inexistente -> 4xx',(await call('POST','/ventas',{DocumentoID:'99999',Subtotal:1,Total:1,EstadoID:8,detalles:det(1)})).s>=400,true);
 // COMPRAS
 const cd=(q,p=9000)=>[{TipoSeleccion:'producto',ProductoID:P,ColorID:C,TallaID:T,TelaID:Tela,Cantidad:q,PrecioUnitario:p,PrecioVenta:25000}];
 let c=await call('POST','/compras',{ProveedorRefId:1,detalles:cd(10)});const CID=pk(c,'CompraID');if(!CID)console.log('compra crear',st(c));eq('compra +10',await stock(),30);
 e=await call('PUT','/compras/'+CID,{ProveedorRefId:1,detalles:cd(4)});if(e.s>=300)console.log('compra editar',st(e));eq('editar 10->4',await stock(),24);
 e=await call('DELETE','/compras/'+CID);if(e.s>=300)console.log('compra borrar',st(e));eq('borrar compra',await stock(),20);
 const i0=await ins(4);c=await call('POST','/compras',{ProveedorRefId:1,detalles:[{TipoSeleccion:'insumo',InsumoID:4,Cantidad:7,PrecioUnitario:1000}]});const CI=pk(c,'CompraID');eq('insumo +7',await ins(4),i0+7);
 await call('DELETE','/compras/'+CI);eq('insumo tras borrar',await ins(4),i0);
 eq('compra sin detalles -> 400',(await call('POST','/compras',{ProveedorRefId:1,detalles:[]})).s,400);
 eq('compra proveedor inexistente -> 404',(await call('POST','/compras',{ProveedorRefId:999,detalles:cd(1)})).s,404);
 eq('compra cantidad 0 -> 400',(await call('POST','/compras',{ProveedorRefId:1,detalles:cd(0)})).s,400);
 // COTIZACIONES
 const te=pk(await call('GET','/tecnicas'),'TecnicaID'),pa=pk(await call('GET','/partes'),'ParteID');
 const body=q=>({DocumentoID:1000000002,FechaCotizacion:new Date().toISOString(),ValorTotal:0,EstadoID:1,detalles:[{ProductoID:P,Cantidad:q,TraePrenda:false,PrendaDescripcion:'',tallas:[{TallaID:T,Cantidad:q,PrecioTalla:0}],colores:[{ColorID:C,Cantidad:q}],insumos:[{InsumoID:Tela,CantidadRequerida:q}],tecnicas:[{TecnicaID:te,ParteID:pa,ImagenDiseño:'',Observaciones:'ZZ',CostoTecnica:0}]}]});
 const z=await call('POST','/cotizaciones/completa',body(2));const Z=pk(z,'CotizacionID');if(!Z)console.log('cot crear',st(z));
 let g=await call('GET','/cotizaciones/'+Z);for(const d of g.j.detalles||[])for(const t of d.tecnicas||[])await call('PUT','/cotizaciontecnicas/'+t.CotizacionTecnicaID,{CostoTecnica:8000});
 eq('aprobar',(await call('PUT','/cotizaciones/'+Z,{EstadoID:2})).s,200);eq('aprobar no toca stock',await stock(),20);
 const pdf=await fetch('http://127.0.0.1:3000/api/cotizaciones/'+Z+'/pdf',{headers:{Authorization:'Bearer '+TOKEN}});eq('pdf',pdf.status+' '+pdf.headers.get('content-type'),'200 application/pdf');
 await call('PUT','/inventarioproducto/'+IID,{Stock:1,TelaID:Tela,Estado:true});
 eq('convertir sin stock -> 400',(await call('POST','/cotizaciones/'+Z+'/convertir-a-venta')).s,400);
 await call('PUT','/inventarioproducto/'+IID,{Stock:20,TelaID:Tela,Estado:true});
 const cv=await call('POST','/cotizaciones/'+Z+'/convertir-a-venta');eq('convertir con stock -> 201',cv.s,201);if(cv.s!==201)console.log(st(cv));eq('stock tras convertir (20-2)',await stock(),18);
 const z2=await call('POST','/cotizaciones/completa',body(1));const Z2=pk(z2,'CotizacionID');
 eq('cancelar cotizacion',(await call('PUT','/cotizaciones/'+Z2+'/cancelar')).s,200);eq('cancelar no infla stock',await stock(),18);
 // limpiar: restaurar
 await call('PUT','/inventarioproducto/'+IID,{Stock:31,TelaID:Tela,Estado:true});
 console.log(bad?('\n'+bad+' FALLOS'):'\nTODO OK');
})().catch(e=>console.log('EXC',e));
