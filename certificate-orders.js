'use strict';
// HAM customer requests: manual UDID submission, explicit consent, no Apple profile or signing.
const crypto=require('node:crypto');
const {buildStore}=require('./certificates-supabase');
const {configProfile,parseDeviceResponse,emptyAcknowledgement}=require('./certificates-profile-service');
function build({getSession,store}){
 const db=store||buildStore(),attempts=new Map();
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 const text=(x,max)=>typeof x==='string'?x.trim().slice(0,max):'';
 function response(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(JSON.stringify(obj));}
 const fail=(res,status,error)=>response(res,status,{error});
 async function body(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('Expected JSON');
  let size=0,parts=[];for await(const part of req){size+=part.length;if(size>8192)throw Error('Too large');parts.push(part);}
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
 }
 function rate(req){
  const ip=String(req.socket.remoteAddress||'unknown'),now=Date.now();
  for(const [key,value] of attempts)if(value.until<now)attempts.delete(key);
  let value=attempts.get(ip);
  if(!value||value.until<now)value={until:now+3600000,count:0};
  value.count++;attempts.set(ip,value);
  return value.count<=5;
 }
 function owner(req,order){
  const h=String(req.headers.authorization||'');
  if(!h.startsWith('Bearer '))return false;
  const given=hash(h.slice(7)),saved=order.tokenHash;
  return typeof saved==='string'&&given.length===saved.length&&
    crypto.timingSafeEqual(Buffer.from(given),Buffer.from(saved));
 }
 const uuid='[0-9a-f-]{36}';
 async function handle(req,res,pathname){
  const method=req.method;
  const admin=pathname.match(new RegExp('^/api/admin/certificates/orders(?:/('+uuid+'))?$'));
  const deleteRoute=pathname.match(new RegExp('^/api/admin/certificates/orders/('+uuid+')/delete$'));
  const personal=pathname.match(new RegExp('^/api/certificates/orders/('+uuid+')(?:/(udid|profile\\.mobileconfig))?$'));
  const callback=pathname.match(new RegExp('^/api/certificates/profile-response/('+uuid+')$'));
  if(pathname==='/api/admin/certificates/status'&&method==='GET'){
    if(!getSession(req))return fail(res,401,'يلزم تسجيل دخول المدير');
    if(!db)return fail(res,503,'قاعدة بيانات الطلبات غير مرتبطة بعد');
    try{
      await db.health();
      return response(res,200,{connected:true,ordersEnabled:process.env.HAM_CERT_ORDERS_ENABLED==='true'});
    }catch{
      return fail(res,503,'تعذر الاتصال بقاعدة بيانات الطلبات');
    }
  }
  if(!db)return fail(res,503,'قاعدة بيانات الطلبات غير مرتبطة بعد');
  try{
    if(method==='POST'&&pathname==='/api/certificates/orders'){
      if(process.env.HAM_CERT_ORDERS_ENABLED!=='true'||process.env.HAM_CERT_STORAGE_READY!=='true')
        return fail(res,503,'استقبال طلبات الشهادات غير مفعّل');
      if(!rate(req))return fail(res,429,'طلبات كثيرة، حاول لاحقًا');
      let data;try{data=await body(req);}catch{return fail(res,400,'بيانات الطلب غير صحيحة');}
      const name=text(data?.name,70)||'طلب جهاز تجريبي',deviceName=text(data?.deviceName,70)||'بانتظار بيانات الجهاز';
      if(data?.consent!==true)return fail(res,400,'الموافقة مطلوبة');
      const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex');
      await db.create({id,name,deviceName,tokenHash:hash(token),status:'pending'});
      res.setHeader('Set-Cookie','ham_profile='+token+'; Path=/api/certificates/orders/'+id+'/profile.mobileconfig; Secure; HttpOnly; SameSite=Lax; Max-Age=1800');
      return response(res,201,{id,token,status:'pending'});
    }
    if(admin||deleteRoute){
      if(!getSession(req))return fail(res,401,'يلزم تسجيل دخول المدير');
      if(deleteRoute){
        if(method!=='POST')return fail(res,405,'Method not allowed');
        let data;try{data=await body(req);}catch{return fail(res,400,'بيانات غير صحيحة');}
        if(data?.confirm!=='DELETE')return fail(res,400,'تأكيد الحذف مطلوب');
        const found=await db.get(deleteRoute[1]);
        if(!found)return fail(res,404,'الطلب غير موجود');
        await db.remove(found.id);return response(res,200,{ok:true});
      }
      if(method==='GET'&&!admin[1]){
        const rows=await db.list();
        return response(res,200,{orders:rows.map(o=>({
          id:o.id,name:o.name,deviceName:o.deviceName,status:o.status,
          udid:o.udid,source:o.source,productCode:o.productCode,iosBuild:o.iosBuild,createdAt:o.createdAt
        }))});
      }
      const record=admin[1]?await db.get(admin[1]):null;
      if(!record)return fail(res,404,'الطلب غير موجود');
      if(method==='PUT'){
        let data;try{data=await body(req);}catch{return fail(res,400,'بيانات غير صحيحة');}
        if(!['pending','processing','ready','delivered','cancelled'].includes(data?.status))
          return fail(res,400,'حالة غير صحيحة');
        await db.update(record.id,{status:data.status});
        return response(res,200,{ok:true,status:data.status});
      }
      return fail(res,405,'Method not allowed');
    }
    if(callback&&method==='POST'){
      if(process.env.HAM_PROFILE_TEST_ENABLED!=='true')return fail(res,404,'Not found');
      const record=await db.get(callback[1]);
      if(!record||record.source==='profile-signature-untrusted')
        return fail(res,404,'Order missing or already processed');
      const created=Date.parse(record.createdAt||'');
      if(!Number.isFinite(created)||Date.now()-created>60*60*1000)
        return fail(res,410,'Profile request expired');
      let size=0,chunks=[];
      try{
        for await(const chunk of req){
          size+=chunk.length;
          if(size>100000)throw Error('Large request');
          chunks.push(chunk);
        }
      }catch{return fail(res,413,'Request too large');}
      let attrs;
      try{attrs=parseDeviceResponse(Buffer.concat(chunks),record.tokenHash);}
      catch{return fail(res,400,'Unable to validate signed profile response');}
      await db.update(record.id,{
        udid:attrs.udid,productCode:attrs.productCode,iosBuild:attrs.iosBuild,
        deviceName:attrs.productCode||record.deviceName,
        source:'profile-signature-untrusted'
      });
      res.writeHead(200,{'Content-Type':'application/x-apple-aspen-config',
        'Cache-Control':'no-store','X-Robots-Tag':'noindex'});
      return res.end(emptyAcknowledgement());
    }
    if(personal){
      const record=await db.get(personal[1]);
      if(!record||!owner(req,record))return fail(res,404,'الطلب غير موجود');
      if(method==='GET'&&!personal[2])
        return response(res,200,{id:record.id,status:record.status,
          deviceName:record.deviceName,udidReceived:!!record.udid,productCode:record.productCode||null,iosBuild:record.iosBuild||null,source:record.source||null});
      if(method==='GET'&&personal[2]==='profile.mobileconfig'){
        if(process.env.HAM_PROFILE_TEST_ENABLED!=='true')return fail(res,404,'Feature disabled');
        const base=process.env.HAM_PUBLIC_ORIGIN||'';
        if(base!=='https://ham-plus-udid-staging.onrender.com')return fail(res,503,'Profile public origin is not configured');
        const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim())
          .find(x=>x.startsWith('ham_profile='));
        const token=cookie?cookie.slice('ham_profile='.length):'';
        const digest=token?hash(token):'';
        if(digest.length!==record.tokenHash.length||
          !crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(record.tokenHash)))
          return fail(res,403,'Profile download is restricted to this device session');
        const created=Date.parse(record.createdAt||'');
        if(!Number.isFinite(created)||Date.now()-created>60*60*1000)
          return fail(res,410,'Profile download expired');
        const payload=configProfile(record,token,base);
        res.writeHead(200,{'Content-Type':'application/x-apple-aspen-config',
          'Content-Disposition':'attachment; filename="HAM-UDID-TEST.mobileconfig"',
          'Cache-Control':'no-store','X-Robots-Tag':'noindex','Referrer-Policy':'no-referrer'});
        return res.end(payload);
      }
      if(method==='POST'&&personal[2]==='udid'){
        let data;try{data=await body(req);}catch{return fail(res,400,'بيانات غير صحيحة');}
        const udid=text(data?.udid,60).toUpperCase();
        if(!/^(?:[0-9A-F]{40}|[0-9A-F]{8}-[0-9A-F]{16})$/.test(udid))
          return fail(res,400,'تنسيق UDID غير صحيح');
        await db.update(record.id,{udid,source:'manual-unverified'});
        return response(res,200,{ok:true});
      }
      return fail(res,405,'Method not allowed');
    }
    return fail(res,404,'Not found');
  }catch(e){
    console.error('Certificate orders database operation failed:',e.message);
    return fail(res,503,'خدمة الطلبات غير متاحة مؤقتًا');
  }
 }
 return {handle};
}
module.exports={build};
