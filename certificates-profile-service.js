'use strict';
// Experimental Apple Profile Service step-1/step-2 ONLY.
// Does not enroll MDM, provision applications, or establish signer trust.
// Signer integrity is checked by openssl, but NOT its Apple device CA chain.
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const pick=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const item=(key,value,type='string')=>'<key>'+pick(key)+'</key><'+type+'>'+pick(value)+'</'+type+'>';
function configProfile(order,challenge,origin){
  const target=origin+'/api/certificates/profile-response/'+order.id;
  const body='<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'+
    '<plist version="1.0"><dict>'+
    item('PayloadType','Profile Service')+item('PayloadVersion','1','integer')+
    item('PayloadIdentifier','com.ham.plus.profile-service')+
    item('PayloadUUID',crypto.randomUUID())+
    item('PayloadDisplayName','HAM - Read iOS Device ID (Test)')+
    item('PayloadOrganization','HAM')+
    item('PayloadDescription','Test: with consent, sends UDID, hardware model code and OS build to HAM. Does not install MDM or device restrictions.')+
    '<key>PayloadContent</key><dict>'+
    item('URL',target)+
    '<key>DeviceAttributes</key><array><string>UDID</string><string>PRODUCT</string><string>VERSION</string></array>'+
    item('Challenge',challenge)+
    '</dict></dict></plist>';
  return body;
}
function parseDeviceResponse(bytes,expectedChallengeHash){
  if(!Buffer.isBuffer(bytes)||bytes.length<100||bytes.length>100000)throw Error('CMS body size invalid');
  const output=spawnSync('openssl',['cms','-verify','-inform','DER','-noverify'],{
    input:bytes,timeout:7000,maxBuffer:60000,windowsHide:true
  });
  if(output.status!==0||output.error||!output.stdout||output.stdout.length>50000)
    throw Error('CMS signature integrity check failed');
  const xml=output.stdout.toString('utf8');
  if(!xml.includes('<plist')||/<!ENTITY/i.test(xml))throw Error('Invalid plist');
  const attribute=key=>{
    const rx=new RegExp('<key>\\s*'+key+'\\s*</key>\\s*<string>\\s*([^<]*?)\\s*</string>','gi');
    const values=Array.from(xml.matchAll(rx),m=>m[1]);
    return values.length===1?values[0]:null;
  };
  const challenge=attribute('CHALLENGE');
  const receivedHash=typeof challenge==='string'?crypto.createHash('sha256').update(challenge).digest('hex'):'';
  if(typeof challenge!=='string'||receivedHash.length!==expectedChallengeHash.length||
    !crypto.timingSafeEqual(Buffer.from(receivedHash),Buffer.from(expectedChallengeHash)))
    throw Error('Challenge not verified');
  const udid=attribute('UDID')?.toUpperCase();
  if(!udid||!/^(?:[0-9A-F]{40}|[0-9A-F]{8}-[0-9A-F]{16})$/.test(udid))
    throw Error('UDID format invalid');
  const product=attribute('PRODUCT')||null,build=attribute('VERSION')||null;
  if(product&&!/^[A-Za-z0-9,._-]{1,50}$/.test(product))throw Error('Device PRODUCT invalid');
  if(build&&!/^[A-Za-z0-9._-]{1,30}$/.test(build))throw Error('Device VERSION invalid');
  return {udid,productCode:product,iosBuild:build,
    proof:'signature-integrity-only; Apple signer chain NOT verified'};
}
function emptyAcknowledgement(){
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'+
    '<plist version="1.0"><dict>'+item('PayloadType','Configuration')+
    item('PayloadVersion','1','integer')+item('PayloadIdentifier','com.ham.plus.profile-service-response')+
    item('PayloadUUID',crypto.randomUUID())+
    item('PayloadDisplayName','HAM test complete')+
    '<key>PayloadContent</key><array></array></dict></plist>';
}
module.exports={configProfile,parseDeviceResponse,emptyAcknowledgement};
