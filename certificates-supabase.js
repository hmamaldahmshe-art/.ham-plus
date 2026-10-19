'use strict';
// This adapter runs ONLY in the Node server. Never bundle its environment key into HTML.
const TABLE='ham_certificate_orders';
function config(){
  const raw=process.env.SUPABASE_URL||'';
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
  let base;
  try{base=new URL(raw);}catch{return null;}
  if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')||base.pathname!=='/'||!key)return null;
  return {base,key};
}
const fields='id,customer_name,device_name,token_hash,status,udid,source,consent_at,created_at,updated_at';
function normalize(x){
  if(!x)return null;
  return {id:x.id,name:x.customer_name,deviceName:x.device_name,tokenHash:x.token_hash,
    status:x.status,udid:x.udid,source:x.source,consentAt:x.consent_at,
    createdAt:x.created_at,updatedAt:x.updated_at};
}
function buildStore({transport=fetch}={}){
  const setup=config();
  if(!setup)return null;
  const endpoint=new URL('/rest/v1/'+TABLE,setup.base);
  async function call(query='',options={}){
    const url=new URL(endpoint);
    if(query)url.search=query;
    const headers={apikey:setup.key,
      'Content-Type':'application/json',Accept:'application/json',Prefer:'return=representation'};
    if(!setup.key.startsWith('sb_secret_'))headers.Authorization='Bearer '+setup.key;
    let res;
    try{res=await transport(url,{method:options.method||'GET',headers,
      body:options.body?JSON.stringify(options.body):undefined,
      signal:AbortSignal.timeout(9000)});}
    catch{throw new Error('Database temporarily unavailable');}
    if(!res.ok)throw new Error('Database request failed ('+res.status+')');
    if(res.status===204)return [];
    try{return await res.json();}catch{throw new Error('Unexpected database response');}
  }
  return {
    async list(){
      const rows=await call('select='+fields+'&order=created_at.desc&limit=500');
      return rows.map(normalize);
    },
    async get(id){
      const rows=await call('select='+fields+'&id=eq.'+encodeURIComponent(id)+'&limit=1');
      return normalize(rows[0]);
    },
    async create(order){
      const row={id:order.id,customer_name:order.name,device_name:order.deviceName,
        token_hash:order.tokenHash,status:order.status,udid:null,source:null,
        consent_at:new Date().toISOString()};
      const rows=await call('select='+fields,{method:'POST',body:row});
      return normalize(rows[0]);
    },
    async update(id,patch){
      const values={updated_at:new Date().toISOString()};
      if(Object.hasOwn(patch,'status'))values.status=patch.status;
      if(Object.hasOwn(patch,'udid'))values.udid=patch.udid;
      if(Object.hasOwn(patch,'source'))values.source=patch.source;
      const rows=await call('id=eq.'+encodeURIComponent(id)+'&select='+fields,
        {method:'PATCH',body:values});
      return normalize(rows[0]);
    },
    async remove(id){
      await call('id=eq.'+encodeURIComponent(id),{method:'DELETE'});
    }
  };
}
module.exports={buildStore};
