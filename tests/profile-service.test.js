'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawnSync}=require('node:child_process');
const {configProfile,parseDeviceResponse}=require('../certificates-profile-service');
const {build}=require('../certificate-orders');

test('profile service includes only agreed attributes and rejects invalid CMS',()=>{
  const order={id:'00000000-0000-4000-8000-000000000001'};
  const xml=configProfile(order,'a'.repeat(64),'https://ham-plus-udid-staging.onrender.com');
  assert.match(xml,/Profile Service/);
  for(const key of ['UDID','PRODUCT','VERSION'])assert.match(xml,new RegExp('<string>'+key+'</string>'));
  for(const unwanted of ['IMEI','SERIAL','MEID','ICCID','MDM'])assert.doesNotMatch(xml,new RegExp('<string>'+unwanted+'</string>'));
  assert.match(xml,/profile-response/);
  assert.throws(()=>parseDeviceResponse(Buffer.from('unsigned'),crypto.createHash('sha256').update('test').digest('hex')));
});

test('opt-in profile: creates order, downloads with cookie, verifies signed callback, rejects replay',async t=>{
  const original={HAM_CERT_ORDERS_ENABLED:process.env.HAM_CERT_ORDERS_ENABLED,HAM_CERT_STORAGE_READY:process.env.HAM_CERT_STORAGE_READY,HAM_PROFILE_TEST_ENABLED:process.env.HAM_PROFILE_TEST_ENABLED,HAM_PUBLIC_ORIGIN:process.env.HAM_PUBLIC_ORIGIN};
  t.after(()=>{for(const [k,v] of Object.entries(original))if(v===undefined)delete process.env[k];else process.env[k]=v;});
  process.env.HAM_CERT_ORDERS_ENABLED='true';
  process.env.HAM_CERT_STORAGE_READY='true';
  process.env.HAM_PROFILE_TEST_ENABLED='true';
  process.env.HAM_PUBLIC_ORIGIN='https://ham-plus-udid-staging.onrender.com';
  const records=new Map();
  const store={
    async create(order){records.set(order.id,{...order,source:null,udid:null,createdAt:new Date().toISOString()});},
    async get(id){return records.get(id)||null;},
    async list(){return [...records.values()];},
    async update(id,patch){records.set(id,{...records.get(id),...patch});},
    async remove(id){records.delete(id);}
  };
  const service=build({store,getSession:()=>null});
  const server=http.createServer((req,res)=>service.handle(req,res,new URL(req.url,'http://localhost').pathname));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  const create=await fetch(base+'/api/certificates/orders',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true})});
  assert.equal(create.status,201);
  const {id,token}=await create.json();
  const cookie=create.headers.get('set-cookie').split(';')[0];
  let profile=await fetch(base+'/api/certificates/orders/'+id+'/profile.mobileconfig');
  assert.equal(profile.status,403);
  profile=await fetch(base+'/api/certificates/orders/'+id+'/profile.mobileconfig',{headers:{Cookie:cookie}});
  assert.equal(profile.status,200);
  assert.match(profile.headers.get('content-type'),/application\/x-apple-aspen-config/);
  const xml=await profile.text();
  assert.ok(xml.includes('Challenge'));
  assert.ok(xml.includes('https://ham-plus-udid-staging.onrender.com'));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ham-signed-profile-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const cert=path.join(temp,'cert.pem'),key=path.join(temp,'key.pem'),xmlPath=path.join(temp,'attributes.plist'),der=path.join(temp,'signed.der');
  const attrs='<?xml version="1.0"?><plist version="1.0"><dict>'+
    '<key>CHALLENGE</key><string>'+token+'</string>'+
    '<key>UDID</key><string>00008030-001C195E1232002E</string>'+
    '<key>PRODUCT</key><string>iPhone17,3</string>'+
    '<key>VERSION</key><string>22A555</string></dict></plist>';
  fs.writeFileSync(xmlPath,attrs);
  const first=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
    '-keyout',key,'-out',cert,'-days','1','-subj','/CN=TEST'],{encoding:'utf8',timeout:15000});
  assert.equal(first.status,0,first.stderr?.slice(-400));
  const signed=spawnSync('openssl',['cms','-sign','-binary','-in',xmlPath,'-signer',cert,
    '-inkey',key,'-outform','DER','-nodetach','-out',der],{encoding:'utf8',timeout:10000});
  assert.equal(signed.status,0,signed.stderr?.slice(-400));
  const signedBody=fs.readFileSync(der);
  const received=await fetch(base+'/api/certificates/profile-response/'+id,{
    method:'POST',headers:{'Content-Type':'application/pkcs7-signature'},body:signedBody});
  assert.equal(received.status,200);
  assert.equal(records.get(id).source,'profile-signature-untrusted');
  assert.equal(records.get(id).productCode,'iPhone17,3');
  assert.equal(records.get(id).iosBuild,'22A555');
  const returned=await fetch(base+'/api/certificates/orders/'+id,{
    headers:{Authorization:'Bearer '+token}});
  assert.equal((await returned.json()).udidReceived,true);
  const replay=await fetch(base+'/api/certificates/profile-response/'+id,{
    method:'POST',headers:{'Content-Type':'application/pkcs7-signature'},body:signedBody});
  assert.equal(replay.status,404);
});
