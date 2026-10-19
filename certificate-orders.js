'use strict';
// HAM customer requests, with explicit consent. Manual UDID input only.
// No profiles, signing credentials, or Apple certificate issuance.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function build({dataDir,getSession}){
 const file=path.join(dataDir,'certificate-orders.json'),hits=new Map();
 const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
 const respond=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(JSON.stringify(obj));};
 const bad=(res,status,error)=>respond(res,status,{error});
 const clean=(x,max)=>typeof x==='string'?x.trim().slice(0,max):'';
 function read(){try{const data=JSON.parse(fs.readFileSync(file,'utf8'));return Array.isArray(data)?data:[];}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 function save(rows){fs.mkdirSync(dataDir,{recursive:true,mode:0o700});const tmp=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';fs.writeFileSync(tmp,JSON.stringify(rows),{mode:0o600,flag:'wx'});fs.renameSync(tmp,file);}
 async function json(req){if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('JSON required');let n=0,a=[];for await(const c of req){n+=c.length;if(n>8192)throw Error('Request too large');a.push(c);}return JSON.parse(Buffer.concat(a).toString('utf8'));}
 function mayCreate(req){const ip=String(req.socket.remoteAddress||'unknown'),now=Date.now();let x=hits.get(ip);if(!x||x.until<now)x={until:now+3600000,count:0};x.count++;hits.set(ip,x);return x.count<=5;}
 function owns(req,o){const h=String(req.headers.authorization||'');if(!h.startsWith('Bearer '))return false;const token=h.slice(7);const hash=digest(token);return hash.length===o.tokenHash.length&&crypto.timingSafeEqual(Buffer.from(hash),Buffer.from(o.tokenHash));}
 const uuid='[0-9a-f-]{36}';
 async function handle(req,res,p){
  const m=req.method,admin=p.match(new RegExp('^/api/admin/certificates/orders(?:/('+uuid+'))?$')),own=p.match(new RegExp('^/api/certificates/orders/('+uuid+')(?:/(udid))?$'));
  if(p==='/api/certificates/orders'&&m==='POST'){
    if(process.env.HAM_CERT_ORDERS_ENABLED!=='true'||process.env.HAM_CERT_STORAGE_READY!=='true')return bad(res,503,'الطلبات غير متاحة بعد');
    if(!mayCreate(req))return bad(res,429,'عدد طلبات كبير، حاول لاحقًا');
    let b;try{b=await json(req);}catch{return bad(res,400,'بيانات غير صالحة');}
    const name=clean(b?.name,70),deviceName=clean(b?.deviceName,70);
    if(!name||!deviceName||b?.consent!==true)return bad(res,400,'الاسم والجهاز والموافقة مطلوبة');
    const rows=read();if(rows.length>=2000)return bad(res,503,'طلبات كثيرة');
    const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex');
    rows.push({id,name,deviceName,tokenHash:digest(token),status:'pending',udid:null,source:null,createdAt:new Date().toISOString()});save(rows);
    return respond(res,201,{id,token,status:'pending'});
  }
  if(admin){
    if(!getSession(req))return bad(res,401,'يلزم دخول المدير');
    const rows=read();
    if(m==='GET'&&!admin[1])return respond(res,200,{orders:rows.map(({id,name,deviceName,status,udid,source,createdAt})=>({id,name,deviceName,status,udid,source,createdAt}))});
    const index=rows.findIndex(x=>x.id===admin[1]);if(index<0)return bad(res,404,'الطلب غير موجود');
    if(m==='PUT'){let b;try{b=await json(req);}catch{return bad(res,400,'بيانات غير صالحة');}if(!['pending','processing','ready','delivered','cancelled'].includes(b?.status))return bad(res,400,'حالة غير صحيحة');rows[index].status=b.status;save(rows);return respond(res,200,{ok:true});}
    if(m==='DELETE'){rows.splice(index,1);save(rows);return respond(res,200,{ok:true});}
    return bad(res,405,'Method not allowed');
  }
  if(own){
    const o=read().find(x=>x.id===own[1]);if(!o||!owns(req,o))return bad(res,404,'الطلب غير موجود');
    if(m==='GET'&&!own[2])return respond(res,200,{id:o.id,status:o.status,deviceName:o.deviceName,udidReceived:!!o.udid});
    if(m==='POST'&&own[2]==='udid'){
      let b;try{b=await json(req);}catch{return bad(res,400,'بيانات غير صالحة');}
      const udid=clean(b?.udid,60).toUpperCase();
      if(!/^(?:[0-9A-F]{40}|[0-9A-F]{8}-[0-9A-F]{16})$/.test(udid))return bad(res,400,'تنسيق UDID غير صحيح');
      const rows=read(),i=rows.findIndex(x=>x.id===o.id);
      rows[i].udid=udid;rows[i].source='manual-unverified';save(rows);return respond(res,200,{ok:true});
    }
    return bad(res,405,'Method not allowed');
  }
  return bad(res,404,'Not found');
 }
 return {handle};
}
module.exports={build};
