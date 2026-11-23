// Test the actual contact handler without contacting Formspree or Kit.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=readFileSync('shared/contact.js','utf8');
class Element {
 constructor(){this.children=[];this.textContent='';this.disabled=false;this.style={};this.classList={add(){}};this.tagName='H3';}
 append(...els){this.children.push(...els)}
 setAttribute(){} removeAttribute(){} focus(){} scrollIntoView(){} addEventListener(){}
}
async function scenario({checked=false,messageOK=true,kit='success'}){
 const button=new Element(),label=new Element(),status=new Element(),message=new Element(),container=new Element(),form=new Element();
 button.querySelector=()=>label;container.querySelector=()=>new Element();
 form.action='https://formspree.io/f/xeagandk';form.reportValidity=()=>true;form.reset=()=>{};form.closest=()=>container;
 form.querySelector=s=>s.startsWith('button')?button:s==='textarea'?message:status;
 form.querySelectorAll=()=>[button,message];let submit;form.addEventListener=(type,fn)=>{if(type==='submit')submit=fn};
 class Data {constructor(f){this.values=new Map(f?[['email','test@example.com'],['message','Private enquiry'],...(checked?[['newsletter_consent','Yes']]:[])]:[])}get(k){return this.values.get(k)}append(k,v){this.values.set(k,v)}}
 const calls=[];
 const context={document:{querySelectorAll:()=>[form],querySelector:()=>({action:'https://app.kit.com/forms/10230985/subscriptions'}),createElement:()=>new Element()},window:{addEventListener(){}},location:{hash:''},FormData:Data,AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{
  calls.push({url,data:opts.body.values});
  if(url===form.action)return{ok:messageOK,status:messageOK?200:400,json:async()=>({errors:[]})};
  if(kit==='network-error')throw Error('offline');
  return{ok:true,json:async()=>kit==='consent'?{status:'success',consent:{enabled:true}}:{status:kit}};
 }};
 vm.runInNewContext(code,context);await submit({preventDefault(){}});
 return {calls,container,status,button};
}
(async()=>{
 let r=await scenario({});assert.equal(r.calls.length,1,'Unticked must never call Kit');
 r=await scenario({checked:true});assert.equal(r.calls.length,2);assert.deepEqual([...r.calls[1].data.keys()],['email_address'],'Only email goes to Kit');assert.match(r.container.children[0].children.at(-1).textContent,/Check your email/);
 r=await scenario({checked:true,messageOK:false});assert.equal(r.calls.length,1,'Failed enquiry must not trigger signup');assert.equal(r.container.children.length,0);
 for(const kit of ['network-error','quarantined','error','consent']){
  r=await scenario({checked:true,kit});const notice=r.container.children[0].children.at(-1);assert.match(notice.textContent,/message was sent, but/);assert.equal(notice.children[0].href,'#newsletter-title');assert.equal(r.button.disabled,false);
 }
 console.log('PASS: optional opt-in, email-only Kit request, independent failures, verification/consent recovery and restored controls (7 scenarios).');
})().catch(e=>{console.error(e);process.exitCode=1});
