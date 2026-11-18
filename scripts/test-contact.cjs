const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../shared/contact.js'), 'utf8');
function setup(fetch, valid = true) {
  const label = {textContent:'Send Message'};
  const button = {disabled:false, querySelector:()=>label, setAttribute(){}, removeAttribute(){}};
  const status = {textContent:''};
  const message = {disabled:false, style:{}, addEventListener(){}};
  const input = {disabled:false};
  let handler, resets=0;
  const form = {
    action:'https://formspree.io/f/xeagandk',
    querySelector:s=>s==='button[type="submit"]'?button:s==='textarea'?message:status,
    querySelectorAll:()=>[input,message,button],
    reportValidity:()=>valid,
    addEventListener:(name,fn)=>{handler=fn;},
    reset:()=>resets++
  };
  vm.runInNewContext(source, {
    document:{querySelectorAll:()=>[form]}, window:{addEventListener(){}}, location:{hash:''},
    fetch, FormData:class {constructor(value){assert.equal(value,form); assert.equal(input.disabled,false);}},
    AbortController, setTimeout, clearTimeout
  });
  return {submit:()=>handler({preventDefault(){}}),button,input,message,label,status,resets:()=>resets};
}
test('successful POST resets only after confirmed success',async()=>{
 let calls=0;const app=setup(async(url,request)=>{calls++;assert.equal(url,'https://formspree.io/f/xeagandk');assert.equal(request.method,'POST');assert.equal(request.headers.Accept,'application/json');return {ok:true};});
 await app.submit();assert.equal(calls,1);assert.equal(app.resets(),1);assert.match(app.status.textContent,/sent to Joe/);assert.equal(app.button.disabled,false);
});
test('pending submission blocks duplicates and edits',async()=>{
 let resolve,calls=0;const app=setup(()=>{calls++;return new Promise(r=>{resolve=r;});});
 const first=app.submit();assert.equal(app.button.disabled,true);assert.equal(app.input.disabled,true);await app.submit();assert.equal(calls,1);resolve({ok:true});await first;assert.equal(app.input.disabled,false);
});
for(const [name,response] of [['validation',{ok:false,status:422,json:async()=>({errors:[{message:'Please check your email.'}]})}],['rate limit',{ok:false,status:429,json:async()=>({})}],['non-JSON failure',{ok:false,status:500,json:async()=>{throw Error();}}]]){
 test(name+' retains data and permits retry',async()=>{const app=setup(async()=>response);await app.submit();assert.equal(app.resets(),0);assert.match(app.status.textContent,/details are still here/);assert.equal(app.button.disabled,false);});
}
test('network failure does not claim delivery or discard data',async()=>{const app=setup(async()=>{throw Error('offline');});await app.submit();assert.equal(app.resets(),0);assert.match(app.status.textContent,/couldn’t confirm/);assert.equal(app.button.disabled,false);});
test('invalid fields do not post',async()=>{let calls=0;const app=setup(async()=>{calls++;},false);await app.submit();assert.equal(calls,0);});
