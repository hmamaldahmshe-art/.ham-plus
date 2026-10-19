'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildStore}=require('../certificates-supabase');
test('Supabase backend uses modern secret key only in server-side apikey header',async t=>{
  const old={url:process.env.SUPABASE_URL,secret:process.env.SUPABASE_SECRET_KEY,legacy:process.env.SUPABASE_SERVICE_ROLE_KEY};
  t.after(()=>{for(const [k,v] of Object.entries({SUPABASE_URL:old.url,SUPABASE_SECRET_KEY:old.secret,SUPABASE_SERVICE_ROLE_KEY:old.legacy}))
    if(v===undefined)delete process.env[k];else process.env[k]=v;});
  process.env.SUPABASE_URL='https://example-ref.supabase.co';
  process.env.SUPABASE_SECRET_KEY='sb_secret_test_only_not_real';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const observed=[];
  const transport=async(url,opts)=>{
    observed.push({url:String(url),headers:opts.headers,method:opts.method,body:opts.body});
    return new Response(JSON.stringify([{id:'123',customer_name:'Client',device_name:'iPhone',
      token_hash:'a'.repeat(64),status:'pending',created_at:'2026-10-19T00:00:00Z',udid:null,source:null}]),
      {status:200,headers:{'Content-Type':'application/json'}});
  };
  const db=buildStore({transport});assert.ok(db);
  await db.create({id:'123',name:'Client',deviceName:'iPhone',tokenHash:'a'.repeat(64),status:'pending'});
  assert.equal(observed[0].method,'POST');
  assert.equal(observed[0].headers.apikey,'sb_secret_test_only_not_real');
  assert.equal(observed[0].headers.Authorization,undefined);
  assert.equal(observed[0].url.includes('sb_secret'),false);
  const row=await db.get('123');assert.equal(row.name,'Client');
  assert.equal(observed[1].method,'GET');
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY='eyJ_legacy_example_only';
  let legacyHeaders;
  const legacy=buildStore({transport:async(_,opts)=>{
    legacyHeaders=opts.headers;
    return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});
  }});
  await legacy.list();
  assert.equal(legacyHeaders.Authorization,'Bearer eyJ_legacy_example_only');
});
