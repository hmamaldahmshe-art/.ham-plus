'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {build}=require('../certificate-orders');
test('order creation consent, token access, admin controls, deletion and default-disable',async t=>{
  const original={enabled:process.env.HAM_CERT_ORDERS_ENABLED,storage:process.env.HAM_CERT_STORAGE_READY};
  t.after(()=>{for(const [key,value] of Object.entries({HAM_CERT_ORDERS_ENABLED:original.enabled,HAM_CERT_STORAGE_READY:original.storage})){
    if(value===undefined)delete process.env[key];else process.env[key]=value;}});
  const records=new Map();
  const store={
    async create(o){records.set(o.id,{...o,udid:null,source:null,createdAt:new Date().toISOString()});},
    async list(){return [...records.values()];},
    async get(id){return records.get(id)||null;},
    async update(id,p){records.set(id,{...records.get(id),...p});},
    async remove(id){records.delete(id);}
  };
  const service=build({store,getSession:req=>req.headers.cookie==='ham_sid=test'});
  const server=http.createServer((req,res)=>{
    service.handle(req,res,new URL(req.url,'http://localhost').pathname)
      .catch(()=>{res.writeHead(500);res.end();});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  const call=async(p,method='GET',data,headers={})=>{
    const r=await fetch(base+p,{method,headers:data!==undefined?{'Content-Type':'application/json',...headers}:headers,
      body:data!==undefined?JSON.stringify(data):undefined});
    return {status:r.status,data:await r.json()};
  };
  const form={name:'Client',deviceName:'iPhone',consent:true};
  delete process.env.HAM_CERT_ORDERS_ENABLED;delete process.env.HAM_CERT_STORAGE_READY;
  assert.equal((await call('/api/certificates/orders','POST',form)).status,503);
  process.env.HAM_CERT_ORDERS_ENABLED='true';process.env.HAM_CERT_STORAGE_READY='true';
  assert.equal((await call('/api/certificates/orders','POST',{...form,consent:false})).status,400);
  let r=await call('/api/certificates/orders','POST',form);
  assert.equal(r.status,201);
  const {id,token}=r.data,auth={Authorization:'Bearer '+token};
  assert.match(id,/^[0-9a-f-]{36}$/);assert.equal(records.size,1);
  assert.equal((await call('/api/admin/certificates/orders')).status,401);
  assert.equal((await call('/api/certificates/orders/'+id)).status,404);
  assert.equal((await call('/api/certificates/orders/'+id,'GET',undefined,auth)).status,200);
  const sendUdid='/api/certificates/orders/'+id+'/udid';
  assert.equal((await call(sendUdid,'POST',{udid:'nonsense'},auth)).status,400);
  assert.equal((await call(sendUdid,'POST',{udid:'00008030-001C195E1232002E'},auth)).status,200);
  r=await call('/api/admin/certificates/orders','GET',undefined,{cookie:'ham_sid=test'});
  assert.equal(r.status,200);assert.equal(r.data.orders[0].source,'manual-unverified');
  r=await call('/api/admin/certificates/orders/'+id,'PUT',{status:'processing'},{cookie:'ham_sid=test'});
  assert.equal(r.status,200);
  r=await call('/api/certificates/orders/'+id,'GET',undefined,auth);
  assert.equal(r.data.status,'processing');
  assert.equal((await call('/api/admin/certificates/orders/'+id+'/delete','POST',{confirm:'DELETE'})).status,401);
  assert.equal((await call('/api/admin/certificates/orders/'+id+'/delete','POST',{confirm:'DELETE'},{cookie:'ham_sid=test'})).status,200);
  assert.equal(records.size,0);
});
