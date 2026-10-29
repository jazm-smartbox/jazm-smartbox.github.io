/* MySmartBox – Sicherheitskern wie in MyBelegBox und MyGesundBox:
   Tresor (AES-256, Schlüssel aus dem Passwort), Sperre, Fingerabdruck, GitHub-Sicherung, App-Update per Zip. */
'use strict';
const APP_VERSION='1.2.1';
const BOX=(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NS='mysmartbox',VKEY=NS+'_vault',BKEY=NS+'_bio',GHS=NS+'-gh-status',ITER=310000;
const DEF_BK={owner:'jazm-smartbox',repo:'smartbox-daten'};
const defaultRepo=()=>{const h=location.hostname;return h.endsWith('.github.io')?h.split('.')[0]+'/'+h:'jazm-smartbox/jazm-smartbox.github.io'};
const safeUrl=u=>/^https?:\/\//i.test(u||'')?u:'';
const lsGet=k=>{try{return localStorage.getItem(k)}catch{return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch{}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const toast=t=>{try{window.toast?window.toast(t):alert(t)}catch{}};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch{}};

/* ---------- Verschlüsselung ---------- */
const te=new TextEncoder(),td=new TextDecoder(),rnd=n=>crypto.getRandomValues(new Uint8Array(n));
function b64(buf){const u=buf instanceof Uint8Array?buf:new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function unb64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function derive(pw,salt){const base=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptObj(obj,k,s){const iv=rnd(12);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,te.encode(typeof obj==='string'?obj:JSON.stringify(obj)));return{app:NS,v:1,iter:ITER,salt:b64(s),iv:b64(iv),ct:b64(ct)}}
async function decryptObj(p,k){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p.iv)},k,unb64(p.ct));return JSON.parse(td.decode(pt))}

/* ---------- Speicher: Tresor in IndexedDB (+ Kopie in localStorage, wenn er hineinpasst) ---------- */
const idb=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open(NS,1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction('kv',mode);const rq=fn(t.objectStore('kv'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}));
  return{get:k=>tx('readonly',st=>st.get(k)),put:(k,v)=>tx('readwrite',st=>st.put(v,k)),del:k=>tx('readwrite',st=>st.delete(k))}})();
const vaultOk=j=>{try{const v=JSON.parse(j);return !!(v&&typeof v.salt==='string'&&typeof v.iv==='string'&&typeof v.ct==='string')}catch{return false}};
const vaultTime=j=>{try{return Number(JSON.parse(j).saved)||0}catch{return 0}};
let GO=(()=>{try{const u=new URL(location.href),g=u.searchParams.get('go');if(g){u.searchParams.delete('go');history.replaceState(null,'',u.pathname+u.search+u.hash)}return /^[a-z]{2,20}$/.test(g||'')?g:null}catch{return null}})();
let hooks={},KEY=null,SALT=null,VID=null,vaultJson=null,META={},STATE=null,PENDING=null;
let saving=Promise.resolve();
async function writeVaultStr(json){
  let a=false;try{await idb.put('vault',json);a=true}catch{}
  const b=json.length<3.5e6&&lsSet(VKEY,json);if(!b)lsDel(VKEY);
  if(!a&&!b)throw new Error('store');
  vaultJson=json;
}
async function loadVault(){
  try{
    const raw=lsGet(VKEY);let m=null;try{m=await idb.get('vault')}catch{}
    const ok=!!raw&&vaultOk(raw),mOk=typeof m==='string'&&vaultOk(m);
    if(mOk&&(!ok||vaultTime(m)>=vaultTime(raw)))vaultJson=m;
    else if(ok){vaultJson=raw;idb.put('vault',raw).catch(()=>{})}
  }catch{}
}
function save(opt){
  const k=KEY,salt=SALT,vid=VID;
  if(!k||!STATE)return saving;
  if(!opt?.clean)META.dirty=(META.dirty||0)+1;
  const body=JSON.stringify({s:STATE,m:META});
  saving=saving.then(async()=>{
    const p=await encryptObj(body,k,salt);p.vid=vid;p.saved=Date.now();
    await writeVaultStr(JSON.stringify(p));bkQueue();
  }).catch(()=>toast('Speichern fehlgeschlagen – Speicher voll?'));
  return saving;
}
function persist(state){STATE=JSON.parse(JSON.stringify(state));return save()}

/* ---------- Fingerabdruck (Passkey + PRF, Google Passwortmanager) ---------- */
const bioSupported=()=>!!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext);
async function keyFromPrf(r,prfSalt){const base=await crypto.subtle.importKey('raw',r,'HKDF',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:prfSalt,info:te.encode('mysmartbox-bio-v1')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function prfKey(credId,prfSalt){
  const a=await navigator.credentials.get({publicKey:{challenge:rnd(32),rpId:location.hostname,allowCredentials:[{type:'public-key',id:credId}],userVerification:'required',timeout:60000,extensions:{prf:{eval:{first:prfSalt}}}}});
  const r=a.getClientExtensionResults()?.prf?.results?.first;if(!r)throw new Error('noprf');return keyFromPrf(r,prfSalt)}
async function enableBio(pw){
  try{
    const prfSalt=rnd(32);
    const cred=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'MySmartBox',id:location.hostname},
      user:{id:rnd(16),name:'MySmartBox',displayName:'MySmartBox'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},timeout:60000,extensions:{prf:{eval:{first:prfSalt}}}}});
    const credId=new Uint8Array(cred.rawId),ext=cred.getClientExtensionResults()?.prf;
    if(ext&&ext.enabled===false)throw new Error('noprf');
    let k;if(ext?.results?.first)k=await keyFromPrf(ext.results.first,prfSalt);
    else{toast('Jetzt zur Bestätigung den Passkey „MySmartBox“ wählen …');k=await prfKey(credId,prfSalt)}
    const iv=rnd(12),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,te.encode(pw));
    lsSet(BKEY,JSON.stringify({cred:b64(credId),salt:b64(prfSalt),iv:b64(iv),ct:b64(ct)}));
    toast('Fingerabdruck eingerichtet ✓');refresh();
  }catch(err){
    if(err.message==='noprf')alert('Dein Passkey-Anbieter unterstützt diese Funktion nicht. Bitte beim Einrichten den Google Passwortmanager als Speicherort wählen und erneut versuchen.');
    else if(err.name==='NotAllowedError')alert('Einrichtung abgebrochen oder Passkey nicht gefunden. Bitte erneut versuchen und beim Speichern den Google Passwortmanager wählen.');
    else toast('Fehler: '+err.message);
  }
}
async function bioGetPassword(){const b=JSON.parse(lsGet(BKEY));const k=await prfKey(unb64(b.cred),unb64(b.salt));
  try{return td.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(b.iv)},k,unb64(b.ct)))}catch{throw new Error('nopw')}}
async function checkPw(pw){const p=JSON.parse(vaultJson);await decryptObj(p,await derive(pw,unb64(p.salt)))}

/* ---------- Kleine Formulare ---------- */
function form(title,fields,onSave,o={}){
  const d=$('#bxdlg'),f=$('#bxform');
  f.innerHTML=`<h2>${esc(title)}</h2>${o.html||''}${fields.map((x,i)=>`<label class="bxfl" for="bxf${i}">${esc(x.l)}</label><input id="bxf${i}" name="${x.k}" type="${x.t||'text'}" value="${esc(x.v||'')}" ${x.req?'required':''} autocomplete="${x.t==='password'?'off':'off'}" autocapitalize="off" spellcheck="false">`).join('')}
    <div class="bxerr" id="bxferr"></div><div class="bxrow"><button type="button" class="btn" data-x="c">Abbrechen</button><button class="btn primary" id="bxok">${esc(o.ok||'Speichern')}</button></div>`;
  f.querySelector('[data-x=c]').onclick=()=>d.close();
  f.onsubmit=async e=>{e.preventDefault();const v={};fields.forEach(x=>v[x.k]=f.elements[x.k].value);const b=$('#bxok');b.disabled=true;
    try{const r=await onSave(v);if(r!==false)d.close()}catch(err){$('#bxferr').textContent=err.message}finally{b.disabled=false}};
  d.showModal();setTimeout(()=>f.querySelector('input')?.focus(),50);
}
const ferr=t=>{const e=$('#bxferr');if(e)e.textContent=t;return false};

/* ---------- Sperrbildschirm ---------- */
let pickingUntil=0,idleT=0,hiddenAt=0,bioBusy=false;
function showLock(auto){
  const was=!!KEY;
  if(was){try{hooks.flush&&hooks.flush()}catch{}try{const dr=hooks.stash&&hooks.stash();if(dr){META.draft=dr;save({clean:true})}}catch{}}
  KEY=null;STATE=null;try{$('#bxdlg').open&&$('#bxdlg').close()}catch{}
  setFan(false);try{const sh=$('#bxsheet');sh.classList.remove('show');sh.hidden=true;document.body.classList.remove('bxsheet-open')}catch{}
  if(was&&hooks.close)hooks.close();
  const has=!!vaultJson,L=$('#lock');
  $('#verLock').textContent='Version '+APP_VERSION;
  $('#restoreBox').hidden=has;$('#lgh').hidden=true;$('#lgh_msg').textContent='';
  $('#pw2').hidden=has;$('#pw2').required=!has;
  $('#lockGo').textContent=has?'Entsperren':(PENDING?'Übernehmen & verschlüsseln':'MySmartBox anlegen');
  $('#lockHint').textContent=has?'Deine Smart-Home-Daten, verschlüsselt auf diesem Gerät.':'Lege ein Passwort fest (mind. 8 Zeichen). Ohne Passwort sind die Daten nicht wiederherstellbar.';
  $('#pw').autocomplete=has?'current-password':'new-password';$('#pw').value='';$('#pw2').value='';$('#lockErr').textContent='';
  impInfo();
  $('#bioBtn').hidden=!(has&&lsGet(BKEY)&&bioSupported());
  L.hidden=false;document.body.classList.add('bxlocked');
  if($('#bioBtn').hidden)setTimeout(()=>$('#pw').focus(),50);else if(auto===true)setTimeout(tryBio,300);
}
function impInfo(){const i=$('#impInfo');if(!PENDING){i.hidden=true;return}
  i.hidden=false;i.innerHTML=`✓ Bereit zur Übernahme: <b>${PENDING.data.devices.length} Geräte</b>, ${PENDING.data.routines?.length||0} Routinen, ${PENDING.data.floors?.length||0} Etagen (Stand ${esc(PENDING.when)}). Jetzt ein Passwort festlegen.`;
  $('#lockGo').textContent='Übernehmen & verschlüsseln'}
async function unlockWith(pw){
  const p=JSON.parse(vaultJson),k=await derive(pw,unb64(p.salt)),o=await decryptObj(p,k);
  SALT=unb64(p.salt);KEY=k;VID=p.vid||b64(rnd(12));
  STATE=o&&o.s?o.s:{};META=o&&o.m&&typeof o.m==='object'?o.m:{};
  if(!p.vid)save({clean:true});
  $('#lock').hidden=true;document.body.classList.remove('bxlocked');
  try{navigator.storage?.persist?.()}catch{}
  resetIdle();
  hooks.open&&hooks.open(JSON.parse(JSON.stringify(STATE)));
  if(GO){const g=GO;GO=null;setTimeout(()=>{try{hooks.shortcut&&hooks.shortcut(g)}catch{}},250)}
  const dr=META.draft;if(dr){META.draft=null;save({clean:true});setTimeout(()=>{try{hooks.restore&&hooks.restore(dr);toast('Deine letzte Eingabe wurde wiederhergestellt.')}catch{}},250)}
  setTimeout(()=>bkQueue(0),3000);
}
async function tryBio(){
  if(bioBusy||KEY||$('#bioBtn').hidden||document.hidden)return;bioBusy=true;
  const btn=$('#bioBtn');$('#lockErr').textContent='';btn.disabled=true;
  try{await unlockWith(await bioGetPassword())}
  catch(err){KEY=null;$('#lockErr').textContent=err.message==='nopw'?'Fingerabdruck passt nicht mehr zum Passwort – bitte mit Passwort entsperren und neu einrichten.':(err.name==='NotAllowedError'?'Abgebrochen. Du kannst auch das Passwort nutzen.':'Fingerabdruck fehlgeschlagen – bitte Passwort nutzen.')}
  finally{btn.disabled=false;bioBusy=false}
}
function resetIdle(){clearTimeout(idleT);if(KEY)idleT=setTimeout(()=>showLock(false),5*60*1000)}

/* ---------- Datei-Sicherung (verschlüsselt) und Übernahme aus der bisherigen MySmartBox ---------- */
async function deliver(name,blob,share){
  const file=new File([blob],name,{type:blob.type||'application/octet-stream'});
  if(share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return true}catch(e){if(e.name==='AbortError')return false}}
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return true;
}
const downloads={save:async({filename,data})=>{const ok=await deliver(filename,data instanceof Blob?data:new Blob([data]),false);if(!ok){const e=new Error('declined');e.code='declined';throw e}}};
async function exportBackup(){
  await saving;META.lastFile=today();META.dirty=0;await save({clean:true});await saving;
  if(!vaultJson){toast('Es gibt noch nichts zu sichern.');return}
  const payload=JSON.stringify({app:NS,format:1,exported:new Date().toISOString(),version:APP_VERSION,vault:JSON.parse(vaultJson)});
  if(await deliver(`mysmartbox-sicherung-${today()}.mysmartbox`,new Blob([payload],{type:'application/json'}),true)){toast('Sicherung erstellt. Leg die Datei an einem zweiten Ort ab, z. B. in deiner Cloud.');hooks.markBackup&&hooks.markBackup();refresh()}
}
/* Bisherige Sicherung (app „JAZM Meine Geräte“): Bilder direkt in die Daten übernehmen */
function inlineOld(j){
  const d=JSON.parse(JSON.stringify(j.data||j)),files=j.files&&typeof j.files==='object'?j.files:{};
  if(!d||!Array.isArray(d.devices)||!Array.isArray(d.apps))throw new Error('Das ist keine gültige MySmartBox-Sicherung.');
  for(const f of d.floors||[]){if(f.planAsset){if(files[f.planAsset])f.planData=files[f.planAsset];f.planAsset=null}}
  for(const a of [...(d.apps||[]),...(d.links||[])]){if(a.iconAsset){if(files[a.iconAsset])a.iconData=files[a.iconAsset];a.iconAsset=null}}
  return d;
}
async function readAnyBackup(file){
  if(file.size>200e6)throw new Error('Die Datei ist zu groß.');
  let o;try{o=JSON.parse(await file.text())}catch{throw new Error('Diese Datei ist keine MySmartBox-Sicherung.')}
  if(o&&o.app===NS&&o.vault&&vaultOk(JSON.stringify(o.vault)))return{kind:'vault',vault:JSON.stringify(o.vault)};
  if(o&&(o.app==='JAZM Meine Geräte'||(o.data&&Array.isArray(o.data.devices))||Array.isArray(o.devices)))return{kind:'old',data:inlineOld(o),when:o.saved?new Date(o.saved).toLocaleDateString('de-DE'):'unbekannt'};
  throw new Error('Diese Datei ist keine MySmartBox-Sicherung.');
}
async function restoreVault(json){
  await saving;
  try{await writeVaultStr(json)}catch{toast('Die Sicherung passt nicht in den Speicher des Handys.');return}
  lsDel(BKEY);clearTimeout(bkTimer);bkPending=null;setBk({err:'',conflict:false});PENDING=null;
  showLock(false);toast('Sicherung geladen. Entsperre sie mit dem Passwort, das beim Sichern galt.');
}

/* ---------- Automatische Sicherung in ein privates GitHub-Repo (nur der verschlüsselte Tresor) ---------- */
let bkTimer=0,bkBusy=false,bkAgain=null,bkPending=null;
let bkStat=(()=>{try{return JSON.parse(lsGet(GHS))||{}}catch{return{}}})();
function setBk(o){bkStat={...bkStat,...o};lsSet(GHS,JSON.stringify(bkStat));const el=document.getElementById('bxBkStatus');if(el)el.innerHTML=bkText()}
const bkCfg=()=>META.backupGh?{...META.backupGh}:null;
async function bkFetch(g,method,path,body,raw){
  const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(g.owner)}/${encodeURIComponent(g.repo)}${path}`,{method,cache:'no-store',
    headers:{'Authorization':'Bearer '+g.token,'Accept':raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined});
  if(r.status===404&&method==='GET')return null;
  if(!r.ok){const e=new Error('GitHub '+r.status);e.status=r.status;throw e}
  return raw?r.arrayBuffer():r.status===204?null:r.json();
}
const bkErrText=e=>e&&e.conflict?'Im Repo liegt ein anderer Tresor. Unter Datensicherung entscheiden.'
  :e&&e.status===401?'Der GitHub-Zugangsschlüssel ist ungültig oder abgelaufen.'
  :e&&(e.status===403||e.status===404)?'Kein Zugriff auf das Repo. Name und Rechte des Schlüssels prüfen (Contents: Read and write).'
  :e&&e.status===422?'GitHub hat die Datei abgelehnt.':'Keine Verbindung zu GitHub. Es wird später erneut versucht.';
function bkText(){
  if(bkBusy)return '⏳ Wird gesichert …';
  if(bkStat.err)return `<span class="bxbad">${esc(bkStat.err)}</span>`;
  if(bkStat.at){const m=Math.round((Date.now()-bkStat.at)/60000);return '✓ Zuletzt gesichert '+(m<1?'gerade eben':m<60?'vor '+m+' Min.':m<1440?'vor '+Math.round(m/60)+' Std.':'am '+new Date(bkStat.at).toLocaleDateString('de-DE'))+'.'}
  return 'Noch nicht gesichert.';
}
async function bkRemote(g){
  const cur=await bkFetch(g,'GET','/contents/vault.json');if(!cur)return{cur:null,json:null};
  let json=null;try{json=td.decode(new Uint8Array(await bkFetch(g,'GET','/contents/vault.json',null,true)))}catch{}
  return{cur,json};
}
function bkQueue(delay){const g=bkCfg();if(!g)return;bkPending=g;clearTimeout(bkTimer);bkTimer=setTimeout(()=>bkSync(),delay==null?4000:delay)}
async function bkSync(force){
  const g=bkPending||bkCfg();if(!g)return;
  if(bkBusy){bkAgain={force};return}
  bkBusy=true;clearTimeout(bkTimer);bkTimer=0;bkPending=null;
  const el=document.getElementById('bxBkStatus');if(el)el.innerHTML=bkText();
  try{
    await saving;const local=vaultJson;if(!local||!vaultOk(local))throw new Error('local');
    const lv=JSON.parse(local);
    for(let attempt=0;attempt<2;attempt++){
      const{cur,json}=await bkRemote(g);
      if(json===local)break;
      if(cur&&!force){let rv=null;try{rv=JSON.parse(json)}catch{}
        if(!rv||rv.vid!==lv.vid){const e=new Error('conflict');e.conflict=true;throw e}}
      try{await bkFetch(g,'PUT','/contents/vault.json',{message:'MySmartBox-Sicherung '+new Date().toLocaleString('de-DE'),content:b64(te.encode(local)),...(cur?{sha:cur.sha}:{})});break}
      catch(e){if(e.status!==409||attempt)throw e}
    }
    bkBusy=false;setBk({at:Date.now(),err:'',conflict:false});
  }catch(e){
    bkBusy=false;
    if(e.message!=='local'){setBk({err:bkErrText(e),conflict:!!e.conflict});if(e.conflict)refresh();
      if(!e.conflict&&!(e.status>=400&&e.status<500))setTimeout(()=>bkQueue(0),5*60e3)}
  }finally{
    const el2=document.getElementById('bxBkStatus');if(el2)el2.innerHTML=bkText();
    if(bkAgain){const a=bkAgain;bkAgain=null;bkSync(a.force)}
  }
}
async function bkRestore(g){const{json}=await bkRemote(g);if(!json||!vaultOk(json))throw new Error('Im Repo wurde keine MySmartBox-Sicherung gefunden.');return json}
function bkSetup(){
  form('GitHub-Sicherung einrichten',[{k:'owner',l:'Konto / Organisation',req:true,v:DEF_BK.owner},{k:'repo',l:'Privates Repo',req:true,v:DEF_BK.repo},{k:'token',l:'Zugangsschlüssel (github_pat_…)',t:'password',req:true}],async v=>{
    const g={owner:v.owner.trim(),repo:v.repo.trim(),token:v.token.trim()};
    try{const info=await bkFetch(g,'GET','');
      if(!info)return ferr(bkErrText({status:404}));
      if(!info.private)return ferr('Dieses Repo ist öffentlich. Gesichert wird nur in private Repos.');
      if(info.permissions&&info.permissions.push===false)return ferr('Der Schlüssel darf nicht in dieses Repo schreiben (Contents: Read and write).');
    }catch(e){return ferr(bkErrText(e))}
    META.backupGh=g;setBk({err:'',at:0,conflict:false});await save({clean:true});refresh();
    setTimeout(async()=>{await bkSync();if(!bkStat.err)toast('Automatische Sicherung ist aktiv ✓');refresh()},50);
  },{ok:'Verbinden & sichern',html:'<p class="bxnote">Sichert den verschlüsselten Tresor nach jeder Änderung in ein <b>privates</b> GitHub-Repo. GitHub sieht nur verschlüsselte Daten. Schlüssel: nur dieses Repo, <b>Contents: Read and write</b>.</p>'});
}

/* ---------- App-Update direkt aus der App ---------- */
let UPD='',UPBUSY=false;
/* Fortschritt sichtbar machen: im Blatt und als Leiste oben, auch wenn das Blatt zu ist */
function setUpd(html,done){UPD=html;const el=document.getElementById('bxUpd');if(el){el.innerHTML=html;el.hidden=!html}
  let bar=document.getElementById('bxprog');
  if(!bar){bar=document.createElement('div');bar.id='bxprog';bar.className='bxprog';bar.setAttribute('role','status');document.body.appendChild(bar)}
  bar.innerHTML=`<span>${html}</span>`+(done?'<button type="button" class="bxx" aria-label="Schließen">✕</button>':'');bar.hidden=!html;bar.classList.toggle('busy',!done);
  const x=bar.querySelector('.bxx');if(x)x.onclick=()=>{bar.hidden=true};
  clearTimeout(setUpd.t);if(done==='auto')setUpd.t=setTimeout(()=>{bar.hidden=true},8000);
  const btn=document.querySelector('[data-box="gh-upload"]');if(btn){btn.disabled=UPBUSY;btn.textContent=UPBUSY?'Update läuft …':'Update-Zip hochladen'}}
async function gh(path,opt={},tok){
  const t=tok||META.github?.token;if(!t)throw new Error('Kein GitHub-Token hinterlegt.');
  const r=await fetch('https://api.github.com'+path,{...opt,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+t,'X-GitHub-Api-Version':'2022-11-28',...(opt.body?{'Content-Type':'application/json'}:{})}});
  if(r.status===404&&opt.allow404)return null;
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(r.status===401?'Token ungültig oder abgelaufen.':r.status===403?'Keine Berechtigung (Token-Rechte prüfen).':r.status===404?'Repo nicht gefunden oder kein Zugriff.':(j.message||('Fehler '+r.status)));
  return j;
}
function ghSetup(){
  form('Updates: GitHub verbinden',[{k:'token',l:'Fine-grained Token (github_pat_…)',t:'password',req:true},{k:'repo',l:'Repo (Besitzer/Name)',req:true,v:META.github?.repo||defaultRepo()}],async v=>{
    const repo=v.repo.trim().replace(/^https:\/\/github\.com\//,'').replace(/\/$/,''),token=v.token.trim();
    try{const j=await gh('/repos/'+repo,{},token);if(j.permissions&&!j.permissions.push)return ferr('Token hat keine Schreibrechte für das Repo.')}catch(e){return ferr(e.message)}
    META.github={token,repo};await save({clean:true});toast('GitHub verbunden ✓');refresh();
  },{ok:'Prüfen & speichern',html:'<p class="bxnote">Der Token wird verschlüsselt in der MySmartBox gespeichert und nur für Updates genutzt. Rechte: <b>Contents: Read and write</b> und <b>Actions: Read</b>, nur für das App-Repo.</p>'});
}
function pickFile(accept){return new Promise(res=>{const i=$('#bxFile');i.value='';i.accept=accept;pickingUntil=Date.now()+10*60e3;i.onchange=()=>res(i.files[0]||null);i.click()})}
async function ghUpload(){
  if(UPBUSY){toast('Ein Update läuft schon – bitte kurz warten.');return}
  const file=await pickFile('.zip,application/zip');if(!file)return;
  if(!/\.zip$/i.test(file.name)){toast('Bitte eine .zip-Datei wählen.');return}
  const name=file.name.replace(/[^\w.\-]/g,'_'),repo=META.github.repo,tok=META.github.token;
  if(!confirm(`„${name}“ (${Math.round(file.size/1024)} KB) ins Repo hochladen und veröffentlichen?`))return;
  UPBUSY=true;setUpd('⏳ Lade Zip hoch …');buzz(8);
  try{
    const old=await gh(`/repos/${repo}/contents/${encodeURIComponent(name)}`,{allow404:true},tok);
    const res=await gh(`/repos/${repo}/contents/${encodeURIComponent(name)}`,{method:'PUT',body:JSON.stringify({message:'Paket '+name+' (aus der MySmartBox)',content:b64(await file.arrayBuffer()),branch:'main',...(old?.sha?{sha:old.sha}:{})})},tok);
    setUpd('⚙️ Hochgeladen – GitHub entpackt und prüft das Paket …');
    await watchRun(repo,tok,res.commit.sha);
  }catch(e){UPBUSY=false;setUpd('❌ '+esc(e.message),true)}
  UPBUSY=false;const b=document.querySelector('[data-box="gh-upload"]');if(b){b.disabled=false;b.textContent='Update-Zip hochladen'}
}
async function watchRun(repo,tok,sha){
  const t0=Date.now();let run=null;
  while(Date.now()-t0<5*60e3){
    await new Promise(r=>setTimeout(r,3000));
    try{const j=await gh(`/repos/${repo}/actions/runs?head_sha=${sha}&per_page=5`,{},tok);run=j.workflow_runs?.[0]||run}catch(e){}
    if(run&&run.status==='completed')break;
  }
  if(!run){UPBUSY=false;setUpd('⚠️ Kein Ablauf gefunden. Ist <b>.github/workflows/paket.yml</b> im Repo angelegt?',true);return}
  const link=safeUrl(run.html_url)?` <a href="${esc(run.html_url)}" target="_blank" rel="noopener noreferrer">Details</a>`:'';
  if(run.status!=='completed'){UPBUSY=false;setUpd('⏳ Ablauf läuft noch länger als üblich.'+link,true);return}
  if(run.conclusion!=='success'){
    let msg='';try{const jobs=await gh(`/repos/${repo}/actions/runs/${run.id}/jobs`,{},tok);const id=jobs.jobs?.[0]?.id;
      if(id){const ann=await gh(`/repos/${repo}/check-runs/${id}/annotations`,{},tok);msg=(ann.find(a=>a.annotation_level==='failure')||ann[0])?.message||''}}catch(e){}
    UPBUSY=false;setUpd('❌ Paket abgelehnt'+(msg?': '+esc(msg):'.')+link,true);return;
  }
  setUpd('✅ Paket übernommen – GitHub veröffentlicht (meist unter 1 Minute) …'+link);
  const t1=Date.now();
  while(Date.now()-t1<5*60e3){
    await new Promise(r=>setTimeout(r,5000));
    try{const js=await (await fetch('./box.js?v='+Date.now(),{cache:'no-store'})).text();const v=(js.match(/APP_VERSION='([\d.]+)'/)||[])[1];
      if(v&&v!==APP_VERSION){UPBUSY=false;setUpd(`🎉 Version ${esc(v)} ist online. <button class="btn small primary" data-box="reload">Jetzt neu laden</button>`,true);try{swReg&&swReg.update()}catch{}buzz([20,40,20]);return}}catch(e){}
  }
  UPBUSY=false;setUpd('✅ Paket übernommen. Die Seite ist noch nicht aktualisiert (gleiche Version oder GitHub braucht länger) – später neu laden.'+link,true);
}

/* ---------- Bereiche in „Haus & Daten“ ---------- */
function securityHtml(){
  const bio=bioSupported()&&lsGet(BKEY);
  return `<h2 class="sec">Sicherheit</h2><div class="list"><div class="roomrow"><span class="n">Passwort gesetzt · Fingerabdruck ${bio?'an':'aus'}</span></div>
    <div class="roomrow bkrow">${bioSupported()?(bio?'<button class="btn small" data-box="bio-off">Fingerabdruck aus</button>':'<button class="btn small primary" data-box="bio-on">Fingerabdruck einrichten</button>'):''}<button class="btn small" data-box="pw">Passwort ändern</button><button class="btn small" data-box="lock">Jetzt sperren</button><button class="btn small danger" data-box="wipe">Alle Daten löschen</button></div></div>
    <p class="note">Alle Daten liegen verschlüsselt auf diesem Gerät. Ohne dein Passwort kann sie niemand lesen – auch nicht in der GitHub-Sicherung.</p>`;
}
function backupHtml(){
  const g=bkCfg();
  return `<div class="list"><div class="roomrow"><span class="n"><b>GitHub</b> · <span id="bxBkStatus">${g?bkText():'nicht eingerichtet'}</span></span></div>
    ${g&&bkStat.conflict?`<div class="roomrow confirm2"><span>Im Repo liegt ein anderer Tresor (z. B. von einem früheren Gerät). Er bleibt in der Versionsgeschichte von GitHub erhalten, wenn du ihn ersetzt.</span><span class="r2"><button class="btn small" data-box="bk-pull">GitHub-Stand laden</button><button class="btn small danger" data-box="bk-force">Durch diesen ersetzen</button></span></div>`:''}
    <div class="roomrow bkrow">${g?'<button class="btn small primary" data-box="bk-now">Jetzt sichern</button><button class="btn small" data-box="bk-off">Trennen</button>':'<button class="btn small primary" data-box="bk-setup">GitHub einrichten</button>'}<button class="btn small" data-box="bk-file">Verschlüsselte Datei</button><button class="btn small" data-box="bk-restore">Datei laden</button></div></div>
    <p class="note">${g?`Sichert nach jeder Änderung automatisch in <b>${esc(g.owner)}/${esc(g.repo)}</b>.`:'Mit GitHub wird nach jeder Änderung automatisch gesichert – verschlüsselt, in dein privates Repo.'} Die verschlüsselte Datei ist eine zusätzliche Kopie${META.lastFile?` (zuletzt ${new Date(META.lastFile+'T00:00').toLocaleDateString('de-DE')})`:''}.</p>
    <div class="autohd"><span class="l">Lesbare Datei (ohne Verschlüsselung)</span></div>`;
}
function updateHtml(){
  return `<h2 class="sec">App-Update</h2><div class="list"><div class="roomrow"><span class="n">MySmartBox · Version ${APP_VERSION}${META.github?` · verbunden mit ${esc(META.github.repo)}`:''}</span></div>
    <div class="roomrow bkrow">${META.github?'<button class="btn small primary" data-box="gh-upload"'+(UPBUSY?' disabled':'')+'>'+(UPBUSY?'Update läuft …':'Update-Zip hochladen')+'</button><button class="btn small" data-box="gh-setup">Verbindung ändern</button><button class="btn small" data-box="gh-off">Trennen</button>':'<button class="btn small primary" data-box="gh-setup">GitHub verbinden</button>'}</div>
    <div class="roomrow" id="bxUpd"${UPD?'':' hidden'}>${UPD}</div></div>
    <p class="note">Neue Versionen kommen als Zip. Hier hochladen – GitHub prüft und veröffentlicht sie in 1–2 Minuten.</p>`;
}
function refresh(){try{hooks.refresh&&hooks.refresh()}catch{}}

/* ---------- Menü „Daten & Sicherheit“ als Blatt von unten (wie MyBelegBox / MyGesundBox) ---------- */
const SVG=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SHEET_META={
  'Sicherheit':[SVG('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),()=>'Passwort · Fingerabdruck '+(bioSupported()&&lsGet(BKEY)?'an':'aus')],
  'Datensicherung':[SVG('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),()=>(bkCfg()?(bkStat.err?'GitHub ⚠️ Problem':'GitHub an'):'GitHub aus')+' · '+(META.lastFile?'Datei '+new Date(META.lastFile+'T00:00').toLocaleDateString('de-DE'):'keine Datei')],
  'App-Update':[SVG('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),()=>'Version '+APP_VERSION+' · '+(META.github?'GitHub verbunden':'nicht verbunden')],
  'Darstellung':[SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),()=>'Muster, Animationen, Vibration'],
  'Drucken & Exportieren':[SVG('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),()=>'Geräteliste als PDF, Tabelle, QR-Aufkleber'],
  'Änderungsverlauf':[SVG('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),()=>'Was wann geändert wurde']};
const sheetOpen=()=>!$('#bxsheet').hidden;
function sheetFill(){
  const b=$('#bxsbody');if(!b)return;b.innerHTML=hooks.sheetHtml?hooks.sheetHtml():'';
  try{hooks.decorate&&hooks.decorate(b)}catch{}
  b.querySelectorAll('.acchd').forEach(h=>{const m=SHEET_META[h.dataset.k];if(!m)return;const t=h.querySelector('span');
    h.insertAdjacentHTML('afterbegin',`<span class="ai">${m[0]}</span>`);if(t)t.outerHTML=`<span class="at">${esc(h.dataset.k)}<small>${esc(m[1]())}</small></span>`});
  $('#bxver2').textContent='MySmartBox · Version '+APP_VERSION;
}
function openSheet(){setFan(false);const sh=$('#bxsheet');sheetFill();sh.hidden=false;$('#bxspanel').scrollTop=0;document.body.classList.add('bxsheet-open');
  requestAnimationFrame(()=>requestAnimationFrame(()=>sh.classList.add('show')));buzz(6)}
function closeSheet(){const sh=$('#bxsheet');if(!sh||sh.hidden)return;sh.classList.remove('show');document.body.classList.remove('bxsheet-open');
  const p=$('#bxspanel');p.style.transform='';setTimeout(()=>{if(!sh.classList.contains('show'))sh.hidden=true},matchMedia('(prefers-reduced-motion: reduce)').matches?0:300)}
function sheetRefresh(){if(!sheetOpen())return;const p=$('#bxspanel'),y=p.scrollTop;sheetFill();p.scrollTop=y}
const seg=v=>`<div class="bxseg" role="tablist"><button type="button" role="tab" data-box="seg" data-v="home" aria-selected="${v==='home'}">Übersicht</button><button type="button" role="tab" data-box="seg" data-v="stats" aria-selected="${v==='stats'}">Statistik</button></div>`;
/* Blatt nach unten wegwischen */
(()=>{let y0=0,dy=0,on=false;const p=()=>$('#bxspanel');
  document.addEventListener('touchstart',e=>{const pn=p();on=false;if(!pn||!sheetOpen()||!pn.contains(e.target)||e.touches.length!==1)return;
    if(pn.scrollTop>0||e.target.closest('input,textarea,select'))return;on=true;y0=e.touches[0].clientY;dy=0},{passive:true});
  document.addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;if(dy<0){dy=0}p().style.transform=dy?`translateY(${dy}px)`:''},{passive:true});
  document.addEventListener('touchend',()=>{if(!on)return;on=false;const pn=p();if(dy>120){buzz(6);closeSheet()}else{pn.style.transform=''}});
})();

/* ---------- Oben nach unten ziehen: aktualisieren (Update prüfen, Sicherung abgleichen) ---------- */
let swReg=null,refreshing=false;
(()=>{let P=null;const ptr=()=>$('#bxptr');
  const skip=t=>t.closest('#bxsheet,.bxfan,.bxlock,dialog,input,textarea,select,#cwrap,#canvas,#s3d,.canvaswrap,.stack3d')||document.querySelector('#modal .panel,#rmodal .panel');
  document.addEventListener('touchstart',e=>{P=null;if(!KEY||refreshing||e.touches.length!==1||window.scrollY>2||sheetOpen()||skip(e.target))return;P={x:e.touches[0].clientX,y:e.touches[0].clientY,mode:null,pull:0,hit:false}},{passive:true});
  document.addEventListener('touchmove',e=>{if(!P)return;const t=e.touches[0],dx=t.clientX-P.x,dy=t.clientY-P.y;
    if(!P.mode){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(dy>0&&Math.abs(dy)>Math.abs(dx)*1.5)P.mode='v';else{P=null;return}}
    const pull=Math.min(110,dy*.5),el=ptr();P.pull=pull;el.style.opacity=String(Math.min(1,pull/28));el.style.transform=`translateY(${pull-52}px) rotate(${Math.min(1,pull/72)*300}deg)`;
    const hit=pull>=70;if(hit!==P.hit){P.hit=hit;el.classList.toggle('armed',hit);if(hit)buzz(8)}},{passive:true});
  const end=()=>{if(!P)return;const hit=P.hit&&P.mode==='v';P=null;if(hit)doRefresh();else hidePtr()};
  document.addEventListener('touchend',end);document.addEventListener('touchcancel',end);
})();
function hidePtr(){const el=$('#bxptr');el.style.transform='';el.style.opacity='';el.classList.remove('armed','spin')}
async function doRefresh(){
  refreshing=true;const el=$('#bxptr');el.classList.add('armed','spin');el.style.transform='translateY(16px)';el.style.opacity='1';buzz(10);
  const t0=Date.now();let upd=false;
  try{if(swReg){await swReg.update();upd=!!(swReg.waiting||swReg.installing)}}catch{}
  try{const js=await (await fetch('./box.js?v='+Date.now(),{cache:'no-store'})).text();const v=(js.match(/APP_VERSION='([\d.]+)'/)||[])[1];if(v&&v!==APP_VERSION)upd=true}catch{}
  if(bkCfg())bkQueue(0);
  await new Promise(r=>setTimeout(r,Math.max(0,750-(Date.now()-t0))));
  refreshing=false;hidePtr();refresh();
  if(upd){if(confirm('Eine neue Version der MySmartBox ist da. Jetzt neu laden?')){try{hooks.flush&&hooks.flush()}catch{}await saving;location.reload()}}
  else toast(bkCfg()?'Alles aktuell – Sicherung wird abgeglichen.':'Alles aktuell.');
}

/* ---------- Hinweis: neue Version ---------- */
function showUpd(){if($('#bxupd'))return;const b=document.createElement('div');b.id='bxupd';b.className='bxupd';b.setAttribute('role','status');
  b.innerHTML='<span>Neue Version der MySmartBox ist da.</span><button type="button">Aktualisieren</button>';
  b.querySelector('button').onclick=async()=>{b.querySelector('button').disabled=true;try{hooks.flush&&hooks.flush()}catch{}try{await saving}catch{}location.reload()};
  document.body.appendChild(b);buzz(8)}

/* ---------- Neu-Auswahl (wie MyBelegBox) ---------- */
function setFan(on){const f=$('#bxfan'),b=$('#fab');if(!f||!b)return;b.classList.toggle('open',on);b.setAttribute('aria-expanded',on);
  if(on){f.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.add('show')));buzz(6)}
  else{f.classList.remove('show');setTimeout(()=>{if(!f.classList.contains('show'))f.hidden=true},200)}}

/* ---------- Klicks ---------- */
document.addEventListener('click',async e=>{
  const fi=e.target.closest('input[type=file],label');if(fi&&(fi.matches('input[type=file]')||fi.querySelector('input[type=file]')))pickingUntil=Date.now()+10*60e3;
  const b=e.target.closest('[data-box]');if(!b)return;
  e.preventDefault();e.stopPropagation();
  const a=b.dataset.box;
  switch(a){
    case 'lock':showLock(false);break;
    case 'menu':setFan(false);sheetOpen()?closeSheet():openSheet();break;
    case 'sheet-x':closeSheet();break;
    case 'seg':hooks.go&&hooks.go(b.dataset.v);buzz(6);break;
    case 'search':setFan(false);closeSheet();hooks.search&&hooks.search();break;
    case 'fan':setFan(!$('#fab').classList.contains('open'));break;
    case 'fanbg':setFan(false);break;
    case 'new':setFan(false);closeSheet();hooks.create&&hooks.create(b.dataset.k);break;
    case 'reload':location.reload();break;
    case 'bio-on':form('Fingerabdruck einrichten',[{k:'pw',l:'Zur Bestätigung dein Passwort',t:'password',req:true}],async v=>{
        try{await checkPw(v.pw)}catch{return ferr('Passwort falsch.')}setTimeout(()=>enableBio(v.pw),50)},
        {ok:'Weiter',html:'<p class="bxnote">Danach fragt dein Handy nach dem Fingerabdruck. Als Speicherort unbedingt den Google Passwortmanager wählen.</p>'});break;
    case 'bio-off':if(confirm('Fingerabdruck-Entsperrung deaktivieren?')){lsDel(BKEY);refresh();toast('Fingerabdruck deaktiviert. Den Passkey kannst du im Google Passwortmanager löschen.')}break;
    case 'pw':form('Passwort ändern',[{k:'old',l:'Aktuelles Passwort',t:'password',req:true},{k:'n1',l:'Neues Passwort (mind. 8 Zeichen)',t:'password',req:true},{k:'n2',l:'Neues Passwort wiederholen',t:'password',req:true}],async v=>{
        try{await checkPw(v.old)}catch{return ferr('Aktuelles Passwort falsch.')}
        if(v.n1.length<8)return ferr('Mindestens 8 Zeichen.');if(v.n1!==v.n2)return ferr('Die neuen Passwörter stimmen nicht überein.');
        SALT=rnd(16);KEY=await derive(v.n1,SALT);await save({clean:true});await saving;
        if(lsGet(BKEY)){lsDel(BKEY);toast('Passwort geändert. Bitte den Fingerabdruck neu einrichten.')}else toast('Passwort geändert ✓');refresh()},{ok:'Ändern'});break;
    case 'wipe':if(confirm('Wirklich ALLE Daten auf diesem Gerät löschen? Das lässt sich nicht rückgängig machen.')&&confirm('Ganz sicher? Ohne Sicherung sind die Daten weg.')){
        try{await idb.del('vault')}catch{}lsDel(VKEY);lsDel(BKEY);lsDel(GHS);location.reload()}break;
    case 'bk-setup':bkSetup();break;
    case 'bk-now':await bkSync();refresh();if(!bkStat.err)toast('Gesichert ✓');break;
    case 'bk-off':if(confirm('GitHub-Sicherung trennen? Im Repo bleibt alles liegen.')){delete META.backupGh;setBk({err:'',at:0,conflict:false});await save({clean:true});refresh();toast('GitHub-Sicherung getrennt.')}break;
    case 'bk-force':if(confirm('Den Tresor im Repo durch diesen ersetzen? Der alte bleibt in der GitHub-Versionsgeschichte.')){await bkSync(true);refresh()}break;
    case 'bk-pull':if(confirm('Die Daten auf diesem Gerät durch den GitHub-Stand ersetzen?')){try{await restoreVault(await bkRestore(bkCfg()))}catch(x){toast(x.status?bkErrText(x):x.message)}}break;
    case 'bk-file':exportBackup();break;
    case 'bk-restore':{const f=await pickFile('.mysmartbox,.json,application/json');if(!f)break;
        try{const r=await readAnyBackup(f);
          if(r.kind==='vault'){if(confirm('Die Daten auf diesem Gerät werden durch die Sicherung ersetzt. Fortfahren?'))restoreVault(r.vault)}
          else if(confirm(`Sicherung vom ${r.when} mit ${r.data.devices.length} Geräten einlesen? Deine jetzigen Daten werden ersetzt.`)){hooks.replace&&hooks.replace(r.data);toast('Sicherung eingelesen ✓')}
        }catch(x){toast(x.message)}break}
    case 'gh-setup':ghSetup();break;
    case 'gh-upload':ghUpload();break;
    case 'gh-off':if(confirm('GitHub-Verbindung für Updates entfernen?')){delete META.github;await save({clean:true});refresh()}break;
  }
},true);

/* ---------- Start ---------- */
async function start(h){
  hooks=h||{};
  await loadVault();
  showLock(true);
  $('#lockForm').onsubmit=async e=>{
    e.preventDefault();
    const pw=$('#pw').value,btn=$('#lockGo');$('#lockErr').textContent='';
    const stored=vaultJson;
    if(!stored){
      if(pw.length<8){$('#lockErr').textContent='Mindestens 8 Zeichen.';return}
      if(pw!==$('#pw2').value){$('#lockErr').textContent='Passwörter stimmen nicht überein.';return}
    }
    btn.disabled=true;btn.textContent='Bitte warten …';
    try{
      if(!stored){SALT=rnd(16);KEY=await derive(pw,SALT);VID=b64(rnd(12));STATE=PENDING?PENDING.data:{};META={};PENDING=null;await save({clean:true});await saving}
      await unlockWith(pw);
      if(!stored&&bioSupported())setTimeout(()=>{if(confirm('Möchtest du künftig per Fingerabdruck entsperren?'))enableBio(pw)},500);
    }catch(err){KEY=null;$('#lockErr').textContent=stored?'Falsches Passwort.':'Fehler: '+err.message}
    finally{btn.disabled=false;btn.textContent=vaultJson?'Entsperren':(PENDING?'Übernehmen & verschlüsseln':'MySmartBox anlegen')}
  };
  $('#bioBtn').onclick=tryBio;
  $('#lfile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
    try{const r=await readAnyBackup(f);if(r.kind==='vault')await restoreVault(r.vault);else{PENDING={data:r.data,when:r.when};impInfo();$('#pw').focus()}}
    catch(x){$('#lockErr').textContent=x.message}});
  $('#lghOpen').onclick=()=>{const b=$('#lgh');b.hidden=!b.hidden;if(!b.hidden)$('#lgh_t').focus()};
  $('#lgh_go').onclick=async()=>{const m=$('#lgh_msg'),bt=$('#lgh_go');
    const g={owner:$('#lgh_o').value.trim(),repo:$('#lgh_r').value.trim(),token:$('#lgh_t').value.trim()};
    if(!g.owner||!g.repo||!g.token){m.textContent='Bitte alle drei Felder ausfüllen.';return}
    bt.disabled=true;m.textContent='Lade Tresor …';
    try{await restoreVault(await bkRestore(g))}catch(x){m.textContent=x.status?bkErrText(x):x.message}finally{bt.disabled=false}};
  ['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,resetIdle,{passive:true}));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=Date.now();
      if(KEY){try{const dr=hooks.stash&&hooks.stash();if(dr){META.draft=dr;save({clean:true})}}catch{}}
      if(bkTimer&&bkPending)bkSync();return}
    if(Date.now()<pickingUntil){pickingUntil=0;return}
    if(KEY&&hiddenAt&&Date.now()-hiddenAt>60000)showLock(true);
    else if(KEY&&META.draft){META.draft=null;save({clean:true})}
    else if(!KEY&&!$('#lock').hidden)setTimeout(tryBio,300);
  });
  if('serviceWorker' in navigator){
    const hadCtl=!!navigator.serviceWorker.controller;let lastChk=0;
    const chk=()=>{if(!swReg||Date.now()-lastChk<60000)return;lastChk=Date.now();swReg.update().catch(()=>{})};
    navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{swReg=r;setTimeout(chk,4000)}).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl&&!refreshing)showUpd()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)chk()});
  }
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('#bxfan').hidden)setFan(false);else if(sheetOpen()&&!$('#bxdlg').open)closeSheet()});
}
return{start,persist,downloads,securityHtml,backupHtml,updateHtml,openSheet,closeSheet,sheetRefresh,seg,backupOk:()=>!!(bkCfg()&&bkStat.at&&!bkStat.err),flush:()=>saving,lock:()=>showLock(false)};
})();
