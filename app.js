const DEFAULT_APPS = [
  {id:"sl", name:"Smart Life", color:"sl", link:"https://play.google.com/store/apps/details?id=com.tuya.smartlife"},
  {id:"ew", name:"eWeLink", color:"ew", link:"https://play.google.com/store/apps/details?id=com.coolkit"},
  {id:"other", name:"Andere App", color:"other", link:""}];
const DEFAULT_LINKS = [{id:"wifi",name:"WLAN",short:"WLAN"},{id:"zigbee",name:"Zigbee",short:"ZB"},{id:"matter",name:"Matter",short:"MT"},{id:"thread",name:"Thread",short:"TH"},{id:"bt",name:"Bluetooth",short:"BT"},{id:"zwave",name:"Z-Wave",short:"ZW"},{id:"lan",name:"LAN-Kabel",short:"LAN"}];
const COLORS = ["sl","ew","other","c4","c5","c6","c7","c8","c9","c10","c11","c12","c13","c14","c15","c16","c17","c18","c19","c20","c21","c22","c23","c24"];
const appById = id => state.apps.find(a => a.id === id) || state.apps.find(a => a.id === "other") || {id:"other",name:"Andere App",color:"other",link:""};
const sortedApps = () => [...state.apps].sort((a, b) => (a.id === "other") - (b.id === "other") || a.name.localeCompare(b.name, "de", {sensitivity: "base"}));
/* ---------- Sicherungen ---------- */
const circByNo = no => (state.circuits || []).find(c => c.no === no);
const circuitOf = d => d.circuit || state.roomCircuits?.[d.room] || "";
const circInherited = d => !d.circuit && !!state.roomCircuits?.[d.room];
const circLabel = no => { const c = circByNo(no); return no ? `F${no}${c && c.name ? " · " + c.name : ""}` : ""; };
const sortedCircuits = () => [...(state.circuits || [])].sort((a, b) => (parseFloat(a.no) || 0) - (parseFloat(b.no) || 0) || String(a.no).localeCompare(String(b.no)));
const linkById = id => (state.links || []).find(l => l.id === id);
function linkBadge(l, cls = "lbadge"){ if (!l) return ""; const src = l.iconAsset ? "/_blob/" + l.iconAsset : (l.iconData || ""); return src ? `<img class="${cls} limg" src="${esc(src)}" alt="${esc(l.name)}" title="${esc(l.name)}">` : `<span class="${cls}" title="${esc(l.name)}">${esc(l.short || l.name.slice(0,3))}</span>`; }
const appColor = id => appById(id).color;
const safeLink = l => /^(https?:\/\/|[a-z][a-z0-9+.-]*:\/\/)/i.test(l||"") && !/^(javascript|data|vbscript):/i.test(l) ? l : "";
const extIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const micIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function openBtn(appId){
  const a = appById(appId), l = safeLink(a.link);
  return l ? `<a class="open" data-c="${a.color}" href="${esc(l)}" target="_blank" rel="noopener">${extIcon}Öffnen</a>` : "";
}
/* Standard-Sprachbefehle aus Vorlage, z. B. „Alexa, {Name} an“ */
const stdApplies = d => !!state.voiceStd?.on && (state.voiceStd.types || []).includes(d.type);
const stdVoice = d => stdApplies(d) && !d.noStd && !d.noVoice ? (state.voiceStd.tpl || []).map(t => t.replace(/\{name\}/gi, d.name || "…")) : [];
const allVoice = d => { const own = d.voice || [], low = new Set(own.map(v => v.toLowerCase())); return [...own, ...stdVoice(d).filter(v => !low.has(v.toLowerCase()))]; };
const TYPES = {
  light:["Licht",'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>'],
  plug:["Steckdose",'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9.5 9v2M14.5 9v2M9 15h6"/>'],
  switch:["Schalter",'<rect x="6" y="3" width="12" height="18" rx="3"/><rect x="9" y="6" width="6" height="7" rx="1.5"/>'],
  sensor:["Sensor",'<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>'],
  camera:["Kamera",'<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3"/>'],
  climate:["Heizung/Klima",'<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>'],
  alexa:["Alexa-Gerät",'<path d="M7 6c0-1.7 2.2-3 5-3s5 1.3 5 3v12c0 1.7-2.2 3-5 3s-5-1.3-5-3z"/><path d="M7 6c0 1.7 2.2 3 5 3s5-1.3 5-3"/><path d="M10 15h4"/>'],
  console:["Spielekonsole",'<path d="M7 8h10a4 4 0 0 1 3.9 4.9l-.8 3.6a2.4 2.4 0 0 1-4.1 1.1L14 15.5h-4l-2 2.1a2.4 2.4 0 0 1-4.1-1.1l-.8-3.6A4 4 0 0 1 7 8z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>'],
  bridge:["Bridge/Switch",'<rect x="3" y="13" width="18" height="6" rx="1.5"/><path d="M7 16h.01M10 16h.01M13 16h.01M12 13V9M12 9a3 3 0 0 0-3-3M12 9a3 3 0 0 1 3-3M8 3.5a6 6 0 0 1 8 0"/>'],
  other:["Sonstiges",'<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>']
};
const icon = t => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${(TYPES[t]||TYPES.other)[1]}</svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => "d" + Math.random().toString(36).slice(2, 9);

let state = {groups:[], rooms:[], devices:[], apps:DEFAULT_APPS.map(a=>({...a})), floors:[{id:"eg",name:"Erdgeschoss",planAsset:null,planData:null}]};
let circFilter = "", missFilter = "";
let filterOpen = null, filterGroup = "", sortBy = "room", layout = "list", collapsed = {};
try { if (localStorage.getItem("smarthome-geraete-layout") === "tiles") layout = "tiles"; collapsed = JSON.parse(localStorage.getItem("smarthome-geraete-collapsed") || "{}") || {}; } catch(_){}
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
try { if (localStorage.getItem("smarthome-geraete-sort") === "group") sortBy = "group"; } catch(_){}
const groupIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/></svg>';
const grpName = id => (state.groups.find(g => g.id === id) || {}).name;
// Gruppen eines Geräts: von Hand gewählt plus automatisch über die Geräteart (z. B. „alle Steckdosen“)
const autoGroups = d => (state.groups || []).filter(g => (g.autoTypes || []).includes(d.type)).map(g => g.id);
const devGroups = d => [...new Set([...(d.groups || []).filter(grpName), ...autoGroups(d)])];
let planFilter = "", flashPin = "";
let curFloor = "eg", zoom = 1, showLabels = false, planMenu = false, editMode = false, fs = false;
let outage = "", outTab = "", stack3d = false, dlHour = null, view3d = false;
const arCache = {};
let ready = false, view = "list", filterApp = null, query = "", roomFilter = "", placingId = "", activePin = null;
let saveFn = null, db = null, assets = null, downloads = BOX.downloads, docRef = null, saveTimer = null, dirty = false, mode = "local";

const LS = "smarthome-geraete";
function lsGet(){ return null; }
function lsSet(v){ BOX.persist(v); }

function normalize(d){
  d = JSON.parse(JSON.stringify(d || {}));
  const apps = Array.isArray(d.apps) && d.apps.length ? d.apps : DEFAULT_APPS.map(a=>({...a}));
  const links = Array.isArray(d.links) && d.links.length ? d.links : DEFAULT_LINKS.map(l => ({...l}));
  const circuits = Array.isArray(d.circuits) ? d.circuits : [];
  const roomCircuits = (d.roomCircuits && typeof d.roomCircuits === "object") ? d.roomCircuits : {};
  const vs = d.voiceStd && typeof d.voiceStd === "object" ? d.voiceStd : {};
  const voiceStd = {on: vs.on !== false, tpl: Array.isArray(vs.tpl) && vs.tpl.length ? vs.tpl : ["Alexa, {Name} an", "Alexa, {Name} aus"], types: Array.isArray(vs.types) ? vs.types : ["plug", "light", "switch"]};
  const routines = Array.isArray(d.routines) ? d.routines : [];
  const historyOff = d.historyOff === true, history = Array.isArray(d.history) ? d.history.slice(-150) : [], lastBackup = d.lastBackup || null, typoIgnore = Array.isArray(d.typoIgnore) ? d.typoIgnore : [];
  const wifi = d.wifi && typeof d.wifi === "object" ? d.wifi : {ssid: "", pass: "", enc: "WPA"};
  const accounts = d.accounts && typeof d.accounts === "object" ? d.accounts : {};
  return {voiceStd, routines, history, historyOff, accounts, lastBackup, typoIgnore, wifi, apps, links, circuits, roomCircuits, roomFloors:(d.roomFloors && typeof d.roomFloors === "object") ? d.roomFloors : {}, groups:Array.isArray(d.groups)?d.groups:[], rooms:Array.isArray(d?.rooms)?d.rooms:[], devices:Array.isArray(d?.devices)?d.devices:[],
    floors: Array.isArray(d.floors) && d.floors.length ? d.floors : [{id:"eg", name:"Erdgeschoss", planAsset:d.planAsset||null, planData:d.planData||null}]};
}

let lastSaved = null, undoStack = [], undoing = false, readOnly = false, histDel = false;
function save(){
  if (readOnly) { toast("Nur-Lese-Ansicht: Änderungen werden nicht gespeichert."); if (lastSaved) { state = normalize(JSON.parse(JSON.stringify(lastSaved))); setTimeout(render, 0); } return; }
  dirty = true; setSync("Speichert …");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveFn = async () => { saveFn = null;
    if (lastSaved) {
      const lines = diffText(lastSaved, state);
      if (lines.length && !state.historyOff) {
        if (!undoing) { undoStack.push({snap: JSON.stringify(lastSaved), text: lines[0]}); if (undoStack.length > 15) undoStack.shift(); }
        state.history = [...(state.history || []), {t: new Date().toISOString(), text: (undoing ? "Rückgängig: " : "") + lines.slice(0, 3).join(" · ") + (lines.length > 3 ? ` · und ${lines.length - 3} weitere` : "")}].slice(-150);
      }
      undoing = false;
    }
    const data = JSON.parse(JSON.stringify(state));
    const prevSaved = lastSaved;
    lastSaved = data;
    if (mode === "db") {
      try { await docRef.set(data); dirty = false; setSync("Gespeichert"); dataPulse(); autoSnap(prevSaved); }
      catch(e){ dirty = false; setSync("Nicht gespeichert"); toast("Speichern fehlgeschlagen. Bitte erneut versuchen."); }
    } else { lsSet(data); dirty = false; setSync("Verschlüsselt gespeichert"); dataPulse(); }
  }, 350);
}
function setSync(t){ document.getElementById("sync").textContent = t; }
function toast(t){
  const b = document.getElementById("toastbox");
  b.innerHTML = `<div class="toast" role="status">${esc(t)}</div>`;
  clearTimeout(toast._t); toast._t = setTimeout(() => b.innerHTML = "", 2400);
}

function appClass(a){ return appById(a).id; }
/* ---------- Etagen der Räume ---------- */
const roomFloor = r => state.roomFloors?.[r] || "";
function roomsByFloor(rooms){
  const out = state.floors.map(f => ({f, rooms: rooms.filter(r => roomFloor(r) === f.id)})).filter(x => x.rooms.length);
  const rest = rooms.filter(r => !state.floors.some(f => f.id === roomFloor(r)));
  if (rest.length) out.push({f: {id:"", name:"Ohne Etage"}, rooms: rest});
  return out;
}
/* ---------- Raum aus Grundriss ---------- */
function inPoly(x, y, poly){ let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function roomAt(floorId, x, y){
  const f = state.floors.find(f => f.id === floorId); if (!f || !Array.isArray(f.zones)) return null;
  const z = f.zones.find(z => inPoly(x, y, z.poly)); return z ? z.room : null;
}
function autoRoom(dev){
  const r = roomAt(dev.floor, dev.x, dev.y);
  if (r && r !== dev.room) { dev.room = r; if (!state.rooms.includes(r)) state.rooms.push(r); if (!state.roomFloors[r]) state.roomFloors[r] = dev.floor; return r; }
  return null;
}
function roomsInUse(){
  const set = new Set(state.rooms);
  state.devices.forEach(d => d.room && set.add(d.room));
  return [...set];
}

/* ---------- Render ---------- */
let lastView = null, lastFloorR = null;
function render(){
  const enter = ready && view !== lastView, floorEnter = ready && view === "plan" && (enter || curFloor !== lastFloorR);
  if (ready) { lastView = view; lastFloorR = curFloor; }
  queueMicrotask(() => afterRender(enter, floorEnter));
  const n = state.devices.length;
  document.getElementById("stats").innerHTML = "";
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.view === (view === "stats" ? "home" : view)));
  document.getElementById("fab").hidden = view === "plan";
  const v = document.getElementById("view");
  if (!ready) { v.innerHTML = `<div class="empty"><strong>Geräte werden geladen</strong>Gleich siehst du hier alle Geräte aus Smart Life, eWeLink und anderen Apps.</div>`; return; }
  if (view === "list") v.innerHTML = renderList();
  if (view !== "plan") { editMode = false; if (fs) { fs = false; document.body.classList.remove("fs-open"); } }
  if (view === "list") {} 
  else if (view === "plan") {
    const w = document.getElementById("cwrap"), sl = w?.scrollLeft || 0, st = w?.scrollTop || 0;
    v.innerHTML = renderPlan();
    const w2 = document.getElementById("cwrap"); if (w2) { w2.scrollLeft = sl; w2.scrollTop = st; }
    fitPins(); requestAnimationFrame(fitPins);
    const s3 = document.getElementById("s3d"); if (s3) { if (s3.dataset.house) initHouse(); else init3d(); }
  }
  else if (view === "home") { v.innerHTML = BOX.seg("home") + renderHome(); }
  else if (view === "cmds") { v.innerHTML = renderCmds(); }
  else if (view === "stats") { v.innerHTML = BOX.seg("stats") + renderStats(); makeAccordions(v); }
  else { v.innerHTML = `<div class="vtitle"><h2>Haus</h2><p>Räume, Apps, Automatik und Notfall</p></div>` + renderRooms(); makeAccordions(v); }
  BOX.sheetRefresh();
}
let accOpen = {};
try { accOpen = JSON.parse(localStorage.getItem(LS + "-acc") || "{}") || {}; } catch(_){}
function makeAccordions(root){
  const counts = {"Routinen": state.routines.length, "Räume": roomsInUse().length, "Gruppen": state.groups.length, "Sicherungskasten": (state.circuits||[]).length, "Verbindungen": (state.links||[]).length, "Etagen": state.floors.length, "Apps": state.apps.length};
  const heads = [...root.querySelectorAll(":scope > h2.sec")];
  for (const h of heads) {
    const title = h.textContent.trim(), sec = document.createElement("section"), body = document.createElement("div");
    sec.className = "acc" + (accOpen[title] ? " open" : ""); body.className = "accbody";
    let n = h.nextSibling; const move = [];
    while (n && !(n.nodeType === 1 && (n.matches("h2.sec") || n.classList.contains("accstop")))) { move.push(n); n = n.nextSibling; }
    h.replaceWith(sec);
    const btn = document.createElement("button");
    btn.className = "acchd"; btn.dataset.act = "acc"; btn.dataset.k = title; btn.setAttribute("aria-expanded", !!accOpen[title]);
    const cnt = h.dataset.cnt ?? counts[title];
    btn.innerHTML = `<span>${esc(title)}</span>${cnt != null ? `<span class="acnt">${cnt}</span>` : ""}${CHEV}`;
    sec.appendChild(btn); move.forEach(m => body.appendChild(m)); sec.appendChild(body);
  }
  // Nur ein Bereich gleichzeitig offen
  const opened = [...root.querySelectorAll(":scope > .acc.open")];
  opened.slice(1).forEach(o => { o.classList.remove("open"); const b = o.querySelector(".acchd"); b?.setAttribute("aria-expanded", false); if (b) accOpen[b.dataset.k] = false; });
}

function renderStats(){
  const D = state.devices, n = D.length;
  if (!n) return `<div class="empty"><strong>Noch keine Geräte</strong>Sobald du Geräte einträgst, siehst du hier, wie sie sich auf Apps, Räume und Etagen verteilen.</div>`;
  const placed = D.filter(d => typeof d.x === "number").length;
  const withVoice = D.filter(d => allVoice(d).length).length;
  const tile = (v, l) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
  let h = `<div class="kpis">${tile(n, n===1?"Gerät":"Geräte")}${tile(roomsInUse().filter(r=>D.some(d=>d.room===r)).length,"Räume mit Geräten")}${tile(state.apps.filter(a=>D.some(d=>appClass(d.app)===a.id)).length,"Apps im Einsatz")}${tile(placed+" / "+n,"im Grundriss")}</div>`;
  const block = (title, rows, act) => {
    rows = rows.filter(r => r.c).sort((a,b) => b.c - a.c);
    if (!rows.length) return "";
    const max = rows[0].c;
    return `<h2 class="sec" data-cnt="${rows.length}">${title}</h2><div class="sbars">${rows.map(r=>`<button class="sbar" ${act?`data-act="${act}" data-v="${esc(r.v)}"`:""} ${r.color?`data-c="${r.color}"`:""}>
      <span class="sl">${r.icon||""}${esc(r.l)}</span><span class="sv">${r.c}</span><span class="st"><i style="width:${Math.max(3, r.c/max*100)}%"></i></span></button>`).join("")}</div>`;
  };
  h += `<div class="sdist">${sortedApps().map(a=>{const c=D.filter(d=>appClass(d.app)===a.id).length;return c?`<i data-c="${a.color}" style="flex:${c}" title="${esc(a.name)} ${c}"></i>`:"";}).join("")}</div>`;
  h += block("Nach App", state.apps.map(a => ({l:a.name, v:a.id, c:D.filter(d=>appClass(d.app)===a.id).length, color:a.color, icon:appIcon(a,"aimg")})), "stat-app");
  h += block("Nach Raum", [...roomsInUse(), ""].map(r => ({l:r||"Ohne Raum", v:r, c:D.filter(d=>(d.room||"")===r).length})), "stat-room");
  const circs = [...new Set(D.map(circuitOf).filter(Boolean))].sort((a,b)=>(parseFloat(a)||0)-(parseFloat(b)||0));
  if (circs.length) h += block("Nach Sicherung", [...circs, ""].map(c => ({l: c ? circLabel(c) : "Ohne Angabe", v: c ? "F"+c : "", c: D.filter(d => circuitOf(d) === c).length, icon: c ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>' : ""})), "stat-circ");
  h += block("Nach Verbindung", [...(state.links||[]).map(l => ({l:l.name, v:l.id, c:D.filter(d=>d.link===l.id).length})), {l:"Keine Angabe", v:"", c:D.filter(d=>!linkById(d.link)).length}], "");
  h += block("Nach Art", Object.entries(TYPES).map(([k,[l]]) => ({l, v:k, c:D.filter(d=>(TYPES[d.type]?d.type:"other")===k).length, icon:icon(k)})), "");
  if (state.floors.length > 1) h += block("Nach Etage (im Grundriss)", state.floors.map(f => ({l:f.name, v:f.id, c:D.filter(d=>typeof d.x==="number"&&floorOf(d)===f.id).length})), "");
  if (state.groups.length) h += block("Nach Gruppe", state.groups.map(g => ({l:g.name, v:g.id, c:D.filter(d=>devGroups(d).includes(g.id)).length, icon:groupIcon})), "stat-group");
  h += `<p class="note accstop">${n - placed ? `${n - placed} ${n-placed===1?"Gerät ist":"Geräte sind"} noch in keinem Grundriss. ` : "Alle Geräte sind im Grundriss platziert. "}${withVoice} ${withVoice===1?"Gerät hat":"Geräte haben"} Sprachbefehle. Tippe auf eine App, einen Raum oder eine Gruppe, um die passenden Geräte zu sehen.</p>`;
  return h;
}
function exampleBanner(){
  const ex = state.devices.filter(d => d.example).length;
  if (!ex) return "";
  return `<div class="banner"><span>${ex} Beispielgeräte sind eingetragen, damit du siehst, wie es aussieht.</span>
    <button class="btn small" data-act="clear-examples">Beispiele löschen</button></div>`;
}

function renderList(){
  if (!state.devices.length) return `<div class="empty"><strong>Noch keine Geräte</strong>Tippe unten rechts auf „Gerät“, um dein erstes Gerät mit App und Raum einzutragen.</div>`;
  let h = exampleBanner();
  const rc = roomsInUse().map(r => [r, state.devices.filter(d => d.room === r).length]).filter(x => x[1]);
  const ac = sortedApps().map(a => [a, state.devices.filter(d => appClass(d.app) === a.id).length]).filter(x => x[1]);
  const fa = filterApp ? appById(filterApp) : null;
  const gc = state.groups.map(g => [g, state.devices.filter(d => devGroups(d).includes(g.id)).length]);
  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  h += `<div class="search sbig"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="q" type="search" placeholder="Gerät, Notiz oder Befehl suchen" value="${esc(query)}" aria-label="Geräte suchen"><label class="qrscan" title="QR-Aufkleber scannen" aria-label="QR-Aufkleber scannen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3"/></svg><input type="file" id="qrFile" accept="image/*" capture="environment"></label></div>`;
  h += `<div class="fbar">
    <button class="fbtn ${roomFilter?"on":""}" data-act="fopen" data-f="room" aria-expanded="${filterOpen==="room"}"><span class="fl">Raum</span><span class="fv">${roomFilter?esc(roomFilter):"Alle"}</span>${chev}</button>
    <button class="fbtn ${fa?"on":""}" data-act="fopen" data-f="app" aria-expanded="${filterOpen==="app"}" ${fa?`data-c="${fa.color}"`:""}><span class="fl">App</span><span class="fv">${fa?(appIcon(fa,"aimg")||'<span class="dot"></span>')+esc(fa.name):"Alle"}</span>${chev}</button>
    ${state.groups.length?`<button class="fbtn ${filterGroup?"on":""}" data-act="fopen" data-f="group" aria-expanded="${filterOpen==="group"}"><span class="fl">Gruppe</span><span class="fv">${filterGroup?esc(grpName(filterGroup)||"Alle"):"Alle"}</span>${chev}</button>`:""}
    ${roomFilter||filterApp||filterGroup?`<button class="fclear" data-act="fclear" aria-label="Filter zurücksetzen" title="Filter zurücksetzen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`:""}
  </div>`;
  if (filterOpen === "room") { const cnt = Object.fromEntries(rc); h += `<div class="fpanel fpg" role="group" aria-label="Raum wählen"><div class="fprow"><button class="rchip" data-act="room" data-room="" aria-pressed="${!roomFilter}">Alle <span>${state.devices.length}</span></button></div>${roomsByFloor(rc.map(x=>x[0])).map(g=>`<div class="fpl">${esc(g.f.name)}</div><div class="fprow">${g.rooms.map(r=>`<button class="rchip" data-act="room" data-room="${esc(r)}" aria-pressed="${roomFilter===r}">${esc(r)} <span>${cnt[r]}</span></button>`).join("")}</div>`).join("")}</div>`; }
  if (filterOpen === "group") h += `<div class="fpanel" role="group" aria-label="Gruppe wählen"><button class="rchip" data-act="fgroup" data-g="" aria-pressed="${!filterGroup}">Alle <span>${state.devices.length}</span></button>${gc.map(([g,c])=>`<button class="rchip" data-act="fgroup" data-g="${g.id}" aria-pressed="${filterGroup===g.id}">${groupIcon}${esc(g.name)} <span>${c}</span></button>`).join("")}</div>`;
  if (filterOpen === "app") h += `<div class="fpanel" role="group" aria-label="App wählen"><button class="rchip" data-act="filter" data-app="" aria-pressed="${!filterApp}">Alle <span>${state.devices.length}</span></button>${ac.map(([a,c])=>`<button class="rchip" data-c="${a.color}" data-act="filter" data-app="${a.id}" aria-pressed="${filterApp===a.id}">${appIcon(a,"aimg")||'<span class="dot"></span>'}${esc(a.name)} <span>${c}</span></button>`).join("")}</div>`;
  const q = query.trim().toLowerCase();
  const list = state.devices.filter(d =>
    (!filterApp || appClass(d.app) === filterApp) &&
    (!roomFilter || d.room === roomFilter) &&
    (!filterGroup || devGroups(d).includes(filterGroup)) &&
    (!circFilter || (circFilter === "-" ? !circuitOf(d) : circuitOf(d) === circFilter)) &&
    (!missFilter || MISS[missFilter].test(d)) &&
    (!q || [d.name,d.note,d.ip,d.mac,d.room,circuitOf(d)?"F"+circuitOf(d):"",circByNo(circuitOf(d))?.name,linkById(d.link)?.name,(TYPES[d.type]||[])[0],...allVoice(d),...devGroups(d).map(grpName),...routinesOf(d.id).map(r => r.name)].join(" ").toLowerCase().includes(q)));
  if (!list.length) return h + `<div class="empty"><strong>Nichts gefunden</strong>Ändere die Suche oder den Filter.</div>`;
  const byGroup = sortBy === "group" && state.groups.length;
  const filtering = !!(query.trim() || roomFilter || filterApp || filterGroup || circFilter || missFilter);
  if (missFilter) h += `<div class="placehint pfhint"><span>Nur: ${esc(MISS[missFilter].label)}</span><button data-act="clear-miss">Alle zeigen</button></div>`;
  if (circFilter) h += `<div class="placehint pfhint"><span>Sicherung: ${esc(circFilter === "-" ? "ohne Angabe" : circLabel(circFilter))}</span><button data-act="clear-circ">Alle zeigen</button></div>`;
  h += `<div class="sortrow">${state.groups.length?`<div class="segsw" role="group" aria-label="Sortierung"><button data-act="sort" data-s="room" aria-pressed="${!byGroup}">Raum</button><button data-act="sort" data-s="group" aria-pressed="${!!byGroup}">Gruppe</button></div>`:"<span></span>"}
    <span class="sortr"><button class="lnk" data-act="collapse-all">${Object.values(collapsed).some(Boolean)?"Alle aufklappen":"Alle zuklappen"}</button>
    <div class="segsw ico2" role="group" aria-label="Darstellung"><button data-act="layout" data-l="list" aria-pressed="${layout==="list"}" aria-label="Liste" title="Liste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg></button><button data-act="layout" data-l="tiles" aria-pressed="${layout==="tiles"}" aria-label="Kacheln" title="Kacheln"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg></button></div></span></div>`;
  const groups = {};
  let order;
  if (byGroup) {
    list.forEach(d => { const gs = devGroups(d); if (!gs.length) (groups["Ohne Gruppe"] ||= []).push(d); else gs.forEach(g => (groups[grpName(g)] ||= []).push(d)); });
    order = [...state.groups.map(g => g.name), "Ohne Gruppe"].filter(r => groups[r]);
  } else {
    list.forEach(d => (groups[d.room || "Ohne Raum"] ||= []).push(d));
    order = [...roomsInUse(), "Ohne Raum"].filter(r => groups[r]);
  }
  for (const r of order) {
    const key = (byGroup ? "g:" : "r:") + r, closed = !filtering && collapsed[key];
    const devs = groups[r].sort((a,b)=>a.name.localeCompare(b.name,"de",{numeric:true}));
    const typeSum = Object.entries(devs.reduce((m,d)=>{ const t=(TYPES[d.type]||TYPES.other)[0]; m[t]=(m[t]||0)+1; return m; },{})).map(([t,c])=>`${c} ${c>1?({Licht:"Lichter",Steckdose:"Steckdosen",Sensor:"Sensoren",Kamera:"Kameras",Spielekonsole:"Spielekonsolen","Bridge/Switch":"Bridges/Switches",Sonstiges:"Sonstige","Alexa-Gerät":"Alexa-Geräte"}[t]||t):t}`).join(" · ");
    h += `<section class="room ${closed?"closed":""}"><h2><button class="sechd" data-act="collapse" data-k="${esc(key)}" aria-expanded="${!closed}"><span class="sect">${byGroup && r !== "Ohne Gruppe" ? `<i class="hgi">${groupIcon}</i>` : ""}${esc(r)}</span><span class="cnt">${devs.length} ${devs.length===1?"Gerät":"Geräte"}</span>${CHEV}</button></h2>`;
    if (closed) { h += `<button class="secsum" data-act="collapse" data-k="${esc(key)}">${esc(typeSum)}</button></section>`; continue; }
    if (byGroup) { const gv = (state.groups.find(g => g.name === r) || {}).voice || []; if (gv.length) h += `<div class="gvoice">${gv.map(v=>`<button class="voice" data-act="copy" data-text="${esc(v)}" title="Kopieren">${micIcon}<span>${esc(v)}</span></button>`).join("")}</div>`; }
    h += `<div class="list ${layout==="list"?"rows":""}">`;
    for (const d of devs) {
      const a = appById(d.app), voice = allVoice(d);
      if (layout === "list") {
        const lk = linkById(d.link);
        const hb = hubOf(d), ch = channelsOf(d).length, br = !hb && bridgeOf(d), bn = bridgedBy(d).length;
        const sub = [d.inactive ? `<span class="inacttag">inaktiv</span>` : "", esc(a.name) + (lk ? " " + linkBadge(lk) : ""), hb ? `<span class="hubtag">↳ ${esc(hb.name)}</span>` : br ? `<span class="hubtag">↳ über ${esc(br.name)}</span>` : "", ch ? `<span class="hubtag">${ch} Kanäle</span>` : "", bn ? `<span class="hubtag">verbindet ${bn} ${bn === 1 ? "Gerät" : "Geräte"}</span>` : "", byGroup ? esc(d.room||"Ohne Raum") : "", circuitOf(d) ? `<span class="circ ${circInherited(d)?"inh":""}" title="${esc(circLabel(circuitOf(d)))}${circInherited(d)?" (über Raum)":""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>F${esc(circuitOf(d))}</span>` : "", d.note ? esc(d.note) : ""].filter(Boolean).join(" · ");
        h += `<div class="row ${d.inactive ? "inact" : ""}" data-c="${a.color}">
          <button class="rowmain" data-act="edit" data-id="${d.id}">
            <span class="rico" data-c="${a.color}">${icon(d.type)}${appIcon(a,"abadge")}</span>
            <span class="rtxt"><span class="rname">${esc(d.name)}${d.example?' <span class="ex">Beispiel</span>':""}</span><span class="rsub">${sub}</span></span>
            ${!byGroup&&devGroups(d).length?`<span class="rg" title="${esc(devGroups(d).map(grpName).join(", "))}">${groupIcon}${devGroups(d).length>1?devGroups(d).length:""}</span>`:""}
            ${voice.length?`<span class="rg" title="${voice.length} Sprachbefehle">${micIcon}</span>`:""}
          </button>${onPlan(d) ? `<button class="mapbtn" data-act="show-plan" data-id="${d.id}" aria-label="Im Grundriss zeigen" title="Im Grundriss zeigen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg></button>` : ""}${openBtn(a.id)}</div>`;
        continue;
      }
      h += `<div class="dev tile ${d.inactive ? "inact" : ""}" data-c="${a.color}">
        <button class="devmain" data-act="edit" data-id="${d.id}">
          <span class="ico" data-c="${a.color}">${icon(d.type)}${appIcon(a,"abadge")}</span>
          <span class="txt"><span class="name">${esc(d.name)}</span>${d.example?'<span class="ex">Beispiel</span>':""}
          <span class="meta">${esc(a.name)} · ${esc((TYPES[d.type]||TYPES.other)[0])} ${linkBadge(linkById(d.link))}</span>
          ${byGroup?`<span class="meta">${esc(d.room||"Ohne Raum")}</span>`:""}
          ${!byGroup&&devGroups(d).length?`<span class="gtags">${devGroups(d).map(g=>`<span class="gtag">${groupIcon}${esc(grpName(g))}</span>`).join("")}</span>`:""}
          ${d.note?`<span class="note2">${esc(d.note)}</span>`:""}</span></button>
        ${openBtn(a.id)}
        ${voice.length?`<div class="voices">${voice.map(v=>`<button class="voice" data-act="copy" data-text="${esc(v)}" title="Kopieren">${micIcon}<span>${esc(v)}</span></button>`).join("")}</div>`:""}</div>`;
    }
    h += `</div></section>`;
  }
  return h;
}

function curF(){
  let f = state.floors.find(x => x.id === curFloor);
  if (!f) { f = state.floors[0]; curFloor = f.id; }
  return f;
}
const floorOf = d => d.floor || state.floors[0].id;
function planUrl(){
  const f = curF();
  if (f.planAsset) return "/_blob/" + f.planAsset;
  return f.planData || null;
}

function renderPlan(){
  if (stack3d && canHouse()) return renderHouse();
  if (stack3d && stackFloors().length > 1) return renderStack();
  const url = planUrl();
  let h = exampleBanner();
  h += `<div class="mapwrap ${fs&&url?"fs":""}" id="mapwrap">`;
  if (state.floors.length > 1) h += floorBar();
  h += `<div class="sheet">`;
  if (url) {
    const placed = state.devices.filter(d => onPlan(d) && floorOf(d) === curFloor && (!planFilter || (planFilter.startsWith("a:") ? appClass(d.app) === planFilter.slice(2) : devGroups(d).includes(planFilter.slice(2)))));
    const unplaced = state.devices.filter(d => typeof d.x !== "number");
    h += `<div class="mapbar">
      <label class="mb-place"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><path d="M12 8v5M9.5 10.5h5"/></svg>
        <select id="placeSel" aria-label="Gerät zum Platzieren wählen"><option value="">Gerät platzieren</option>
        ${(()=>{ const byName=(a,b)=>a.name.localeCompare(b.name,"de",{numeric:true}); const un=state.devices.filter(d=>typeof d.x!=="number").sort(byName), pl=state.devices.filter(d=>onPlan(d)).sort(byName);
          const opt=d=>`<option value="${d.id}" ${d.id===placingId?"selected":""}>${esc(d.name)}${d.room?` · ${esc(d.room)}`:""}${typeof d.x==="number"&&state.floors.length>1?` (${esc((state.floors.find(f=>f.id===floorOf(d))||{}).name||"")})`:""}</option>`;
          return (un.length?`<optgroup label="Noch nicht platziert (${un.length})">${un.map(opt).join("")}</optgroup>`:`<option disabled>Alle Geräte sind platziert</option>`)+(pl.length?`<optgroup label="Bereits platziert – versetzen">${pl.map(opt).join("")}</optgroup>`:""); })()}</select></label>
      <button class="mb-btn mb-zoom" data-act="zoom" data-z="${zoom%3+1}" aria-label="Zoom ${zoom}-fach, tippen für ${zoom%3+1}-fach" title="Zoom" aria-pressed="${zoom>1}">${zoom}×</button>
      <button class="mb-btn mb-edit" data-act="toggle-edit" aria-pressed="${editMode}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button>
      <button class="mb-btn" data-act="toggle-labels" aria-pressed="${showLabels}" aria-label="Namen anzeigen" title="Namen anzeigen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg></button>
      ${modelFor(curF())?`<button class="mb-btn mb-3d" data-act="view3d" aria-pressed="${view3d}" aria-label="Räume in 3D" title="Räume in 3D"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg></button>`:""}
      <button class="mb-btn" data-act="fs" aria-pressed="${fs}" aria-label="${fs?"Vollbild beenden":"Vollbild"}" title="${fs?"Vollbild beenden":"Vollbild"}">${fs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'}</button>
      <button class="mb-btn" data-act="plan-menu" aria-expanded="${planMenu}" aria-label="Weitere Optionen" title="Weitere Optionen"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></div>
      ${planMenu?`<div class="mb-menu"><label class="pfl">Anzeigen<select id="planFilterSel"><option value="">Alle Geräte</option><optgroup label="App">${sortedApps().filter(a=>state.devices.some(d=>appClass(d.app)===a.id&&typeof d.x==="number")).map(a=>`<option value="a:${a.id}" ${planFilter==="a:"+a.id?"selected":""}>${esc(a.name)}</option>`).join("")}</optgroup>${state.groups.length?`<optgroup label="Gruppe">${state.groups.map(g=>`<option value="g:${g.id}" ${planFilter==="g:"+g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</optgroup>`:""}</select></label><label class="pfl">Wo ist …?<select id="whereSel"><option value="">Gerät suchen</option>${state.devices.filter(d=>onPlan(d)).sort((a,b)=>a.name.localeCompare(b.name,"de",{numeric:true})).map(d=>`<option value="${d.id}">${esc(d.name)}${state.floors.length>1?` · ${esc((state.floors.find(f=>f.id===floorOf(d))||{}).name||"")}`:""}</option>`).join("")}</select></label>${(state.circuits||[]).length?`<label class="pfl">Stromausfall<select id="outSel"><option value="">Sicherung wählen</option>${sortedCircuits().map(c=>`<option value="${esc(c.no)}" ${outage===c.no?"selected":""}>${esc(circLabel(c.no))}</option>`).join("")}</select></label>`:""}${downloads?`<button class="btn small" data-act="export-plan">Als Bild speichern</button>`:""}<label class="btn small filebtn">Grundriss ersetzen<input type="file" class="planFile" accept="image/*"></label><button class="btn small danger" data-act="remove-plan">Grundriss entfernen</button></div>`:""}
      ${outage?outageBanner():""}
      ${editMode&&!placingId?`<div class="placehint"><span>Geräte ziehen zum Verschieben</span><button data-act="toggle-edit">Fertig</button></div>`:""}
      ${planFilter?`<div class="placehint pfhint"><span>Nur: ${esc(planFilter.startsWith("a:")?appById(planFilter.slice(2)).name:(grpName(planFilter.slice(2))||""))}</span><button data-act="clear-planfilter">Alle zeigen</button></div>`:""}
      ${placingId?`<div class="placehint"><span>Tippe auf die Stelle im Plan</span><button data-act="cancel-place">Abbrechen</button></div>`:""}
      ${fs?`<div class="fsbar"><button class="fsfloor" data-act="fs-next-floor" aria-label="Nächste Etage">${esc(curF().name)}${state.floors.length>1?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>':""}</button><span class="fsr">${downloads?`<button class="fsbtn" data-act="export-plan" aria-label="Als Bild speichern" title="Als Bild speichern"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></button>`:""}<button class="fsbtn" data-act="fs" aria-label="Vollbild beenden" title="Vollbild beenden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></div>`:""}
      ${view3d && modelFor(curF()) ? render3d() : `<div class="canvaswrap" id="cwrap" style="max-height:${zoom>1&&!fs?"70vh":"none"}"><div class="canvas ${placingId?"placing":""} ${editMode?"editing":""} ${showLabels?"labels":""} ${flashPin?"finding":""} ${outage?"outage":""}" id="canvas" style="--z:${zoom};--ar:${arCache[url]||0.77}"><img src="${esc(url)}" alt="Dein Grundriss" draggable="false" onload="setAr(this)">${fx.daylight?daylightHtml():""}${outage?outageZones():""}${flashPin?radarHtml():""}
      ${clusterPins(placed, arCache[url]||0.77).map(cl => cl.length === 1 ? pinHtml(cl[0], `left:${cl[0].x}%;top:${cl[0].y}%`) :
        `<div class="pgrp" style="left:${(Math.min(...cl.map(d=>d.x))+Math.max(...cl.map(d=>d.x)))/2}%;top:${(Math.min(...cl.map(d=>d.y))+Math.max(...cl.map(d=>d.y)))/2}%">${cl.map(d=>pinHtml(d,`grid-row:${G.get(d.id)[0]};grid-column:${G.get(d.id)[1]}`)).join("")}<span class="glbl">${cl.map(d=>esc(d.name)).join(" · ")}</span></div>`).join("")}
      </div></div>`}`;
    h += `</div>`;
    if (unplaced.length) h += `<div class="unplaced"><h3>Noch in keinem Grundriss (${unplaced.length})</h3><div class="minis">${unplaced.map(d=>`<button class="mini" data-c="${appColor(d.app)}" data-act="place" data-id="${d.id}">${esc(d.name)}</button>`).join("")}</div></div>`;
  } else {
    h += `</div>`;
    const rooms = roomsInUse();
    h += `<div class="planbar"><label class="btn small primary filebtn">Eigenen Grundriss hochladen<input type="file" class="planFile" accept="image/*"></label>
      <span class="hint" style="margin:0">Foto oder Skizze deiner Wohnung. Dann kannst du jedes Gerät genau platzieren.</span></div>`;
    if (!rooms.length) h += `<div class="empty"><strong>Noch keine Räume</strong>Lege im Tab „Räume“ deine Räume an oder lade einen Grundriss hoch.</div>`;
    else {
      h += `<p class="hint">Raumübersicht: Jeder Raum zeigt seine Geräte.</p><div class="rooms">`;
      for (const r of rooms) {
        const ds = state.devices.filter(d => d.room === r);
        h += `<div class="rtile"><span class="rn">${esc(r)}</span><span class="cnt">${ds.length} ${ds.length===1?"Gerät":"Geräte"}</span>
          <div class="minis">${ds.map(d=>`<button class="mini" data-c="${appColor(d.app)}" data-act="edit" data-id="${d.id}">${esc(d.name)}</button>`).join("")}</div></div>`;
      }
      h += `</div>`;
    }
  }
  h += `</div>`;
  
  return h;
}

/* Räume & Apps in Bereiche gliedern, innerhalb alphabetisch */
const ROOM_CATS = [
  ["Haus", "Etagen, Räume, Stromkreise und WLAN", ["Etagen", "Gäste-WLAN", "Räume", "Sicherungskasten"]],
  ["Geräte", "Wie deine Geräte verbunden und gebündelt sind", ["Apps", "Gruppen", "IP-Adressen", "Verbindungen"]],
  ["Automatik", "Was von selbst oder per Sprache passiert", ["Routinen", "Sprachbefehle", "Zeitstrahl"]],
  ["Notfall & Hilfe", "Wenn etwas nicht geht und du nicht da bist", ["Konten", "Netzwerkplan", "Neustart-Reihenfolge", "Störungshilfe"]],
  ];
const SHEET_SECS = ["Sicherheit", "Datensicherung", "App-Update", "Darstellung", "Drucken & Exportieren", "Änderungsverlauf"];
function roomSecs(){
  const raw = renderRoomsRaw(), parts = raw.split('<h2 class="sec"'), map = {};
  const lead = parts.shift() || "";
  for (const p of parts) { const t = p.slice(p.indexOf(">") + 1, p.indexOf("</h2>")).replace(/&amp;/g, "&").trim(); map[t] = '<h2 class="sec"' + p; }
  return {lead, map};
}
function renderRooms(){
  const {lead, map} = roomSecs();
  SHEET_SECS.forEach(n => delete map[n]);
  let h = lead;
  for (const [cat, sub, names] of ROOM_CATS) {
    const got = names.filter(n => map[n]); if (!got.length) continue;
    h += `<div class="rcat accstop"><h3>${esc(cat)}</h3><p>${esc(sub)}</p></div>` + got.map(n => { const x = map[n]; delete map[n]; return x; }).join("");
  }
  const rest = Object.values(map); if (rest.length) h += `<div class="rcat accstop"><h3>Weiteres</h3></div>` + rest.join("");
  return h;
}
function renderSheet(){ const {map} = roomSecs(); return SHEET_SECS.filter(n => map[n]).map(n => map[n]).join(""); }
function renderRoomsRaw(){
  const rooms = roomsInUse().sort((a, b) => a.localeCompare(b, "de", {numeric: true}));
  let h = BOX.securityHtml() + BOX.updateHtml() + `<h2 class="sec">Räume</h2>`;
  if (!rooms.length) h += `<div class="list"><div class="roomrow"><span class="n">Noch keine Räume angelegt.</span></div>`;
  else h += `<div class="list">`;
  let i = 0;
  for (const g of roomsByFloor(rooms)) {
    h += `<div class="rfhd">${esc(g.f.name)}</div>`;
    for (const r of g.rooms) {
      const c = state.devices.filter(d=>d.room===r).length;
      h += `<div class="roomrow rrow"><input id="room-${i++}" value="${esc(r)}" data-old="${esc(r)}" aria-label="Raumname">
        <select class="roomFloorSel" data-room="${esc(r)}" aria-label="Etage von ${esc(r)}"><option value="">Ohne Etage</option>${state.floors.map(f=>`<option value="${f.id}" ${roomFloor(r)===f.id?"selected":""}>${esc(f.name)}</option>`).join("")}</select>
        <span class="n">${c} ${c===1?"Gerät":"Geräte"}</span>
        <select class="roomCircSel" data-room="${esc(r)}" aria-label="Sicherung von ${esc(r)}"><option value="">Sicherung –</option>${sortedCircuits().map(cc=>`<option value="${esc(cc.no)}" ${state.roomCircuits?.[r]===cc.no?"selected":""}>F${esc(cc.no)}${cc.name?" "+esc(cc.name):""}</option>`).join("")}</select>
        <button class="btn small danger" data-act="del-room" data-room="${esc(r)}" aria-label="Raum ${esc(r)} löschen">Löschen</button></div>`;
    }
  }
  h += `</div><form class="addroom" id="addRoom"><input id="newRoom" placeholder="Neuer Raum, z. B. Flur" aria-label="Neuer Raum"><button class="btn primary">Hinzufügen</button></form>
  <p class="note">Ein Raum umbenennen ändert ihn bei allen Geräten. Beim Löschen behalten die Geräte ihre Daten und landen unter „Ohne Raum“.</p>`;
  h += `<h2 class="sec">Darstellung</h2><div class="list">
    <label class="roomrow optrow"><span>Platinen-Muster im Hintergrund</span><input type="checkbox" id="optPattern" ${fx.pattern?"checked":""}></label>
    <label class="roomrow optrow"><span>Wandernde Lichtpunkte</span><input type="checkbox" id="optAnim" ${fx.anim?"checked":""} ${fx.pattern?"":"disabled"}></label>
    <label class="roomrow optrow"><span>Datenpuls beim Speichern</span><input type="checkbox" id="optPulse" ${fx.pulse?"checked":""} ${fx.pattern?"":"disabled"}></label>
    <label class="roomrow optrow"><span>Tageszeit im Grundriss</span><input type="checkbox" id="optDaylight" ${fx.daylight?"checked":""}></label>
    <label class="roomrow optrow"><span>Animationen</span><input type="checkbox" id="optMotion" ${fx.motion?"checked":""}></label>
    <label class="roomrow optrow"><span>Vibration beim Verschieben</span><input type="checkbox" id="optHaptic" ${fx.haptic?"checked":""}></label></div>
  <p class="note">Gilt nur auf diesem Gerät.</p>
  <p class="note"><b>Gesten:</b></p><ul class="gesturelist"><li>Zur Seite wischen: nächster oder vorheriger Tab</li><li>Auf dem Grundriss zur Seite wischen: Etage wechseln</li><li>Doppelt auf den Grundriss tippen: hinein- und herauszoomen</li><li>Gerät in der Liste lange drücken: im Grundriss zeigen</li><li>Gerätefenster nach unten wischen: schließen</li><li>3D: ein Finger dreht, zwei schieben und zoomen, doppelt tippen setzt zurück</li></ul>`;
  h += `<h2 class="sec">Drucken &amp; Exportieren</h2><div class="list"><div class="roomrow bkrow">
    ${downloads?`<button class="btn small primary" data-act="export-pdf">Geräteliste als PDF</button><button class="btn small" data-act="export-csv">Als Tabelle (CSV)</button><button class="btn small" data-act="export-guide">Hausanleitung für Gäste (PDF)</button><button class="btn small" data-act="export-cheat">Spickzettel-Poster (PDF)</button>`:`<span class="n">Speichern als Datei ist hier nicht möglich.</span>`}</div>
    ${downloads?`<div class="roomrow bkrow qrrow"><select id="qrRoom" aria-label="Aufkleber für Raum"><option value="">Alle Räume</option>${roomsInUse().map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join("")}</select><button class="btn small" data-act="export-qr">QR-Aufkleber (PDF)</button></div>`:""}</div>
  <p class="note">Die PDF enthält alle Geräte nach Etage und Raum mit App, Verbindung, Art, Gruppen, Sicherung, Sprachbefehlen, Notiz und IP, dazu die Gruppen mit ihren Sprachbefehlen. Du kannst sie danach am Handy drucken oder teilen. Die CSV öffnest du in Excel.</p>
  <p class="note">QR-Aufkleber: 3 × 8 Etiketten à 70 × 37 mm pro A4-Bogen. Klebe sie aufs Gerät. Mit dem QR-Knopf neben der Suche fotografierst du einen Aufkleber und landest direkt beim Gerät.</p>`;
  h += `<h2 class="sec">Datensicherung</h2>${BOX.backupHtml()}<div class="list"><div class="roomrow bkrow">
    ${downloads?`<button class="btn small" data-act="backup-save">Als JSON sichern</button>`:""}${state.wifi?.pass ? `<label class="bkopt"><input type="checkbox" id="optBkWifi" ${bkWifi() ? "checked" : ""}> WLAN-Passwort mitsichern</label>` : ""}
    <label class="btn small filebtn">Sicherung einlesen<input type="file" id="backupFile" accept=".json,application/json"></label></div>
    ${pendingBackup?`<div class="roomrow confirm2"><span>Sicherung vom ${esc(pendingBackup.when)} mit ${pendingBackup.data.devices.length} Geräten einlesen? Deine jetzigen Daten werden dabei ersetzt.</span><span class="r2"><button class="btn small danger" data-act="backup-load-yes">Ersetzen</button><button class="btn small" data-act="backup-load-no">Abbrechen</button></span></div>`:""}</div>
  ${autoHtml()}
  <p class="note">Die Datei enthält alle Geräte, Räume, Apps, Gruppen, Etagen und Bilder. Grundrisse und App-Symbole sind mit drin. Fehlen sie beim Einlesen in der App, werden sie aus der Datei wiederhergestellt.${downloads?"":" Speichern als Datei ist hier nicht möglich."}</p>`;
  h += `<h2 class="sec">Routinen</h2><div class="list">${state.routines.length ? sortedRoutines().map(r => `<button class="roomrow rtrow ${r.on === false ? "rtoff" : ""}" data-act="open-routine" data-r="${r.id}"><span class="rtico">${rtIcon(r)}</span><span class="rtx"><b>${esc(r.name)}</b><small>${esc(trigText(r))} · ${(r.devices || []).length} ${(r.devices || []).length === 1 ? "Gerät" : "Geräte"}${r.on === false ? " · pausiert" : ""}</small></span>${appIcon(appById(r.app), "abadge rtapp")}</button>`).join("") : `<div class="roomrow"><span class="n">Noch keine Routinen. Trag hier ein, was in Alexa, Smart Life oder eWeLink automatisch passiert.</span></div>`}</div>
  <div class="addroom"><button class="btn primary" data-act="new-routine">+ Neue Routine</button><button class="btn" data-act="open-cmds">Spickzettel öffnen</button></div>
  ${state.routines.length > 1 ? `<p class="rcklbl">Prüfung: ${(() => { const c = routineChecks(), n = c.filter(x => x.lvl !== "info").length; return n ? `${n} ${n === 1 ? "Problem" : "Probleme"}` : "alles in Ordnung"; })()}</p><div class="list">${checksHtml(routineChecks())}</div>` : ""}
  <p class="note">Routinen laufen weiter in ihrer App. Hier hältst du fest, was wann passiert und welche Geräte beteiligt sind.</p>`;
  { const V = state.voiceStd, ex = state.devices.find(d => stdApplies(d)) || {name: "Stehlampe"};
    h += `<h2 class="sec">Sprachbefehle</h2><div class="list">
    <label class="roomrow optrow"><span>Standard-Sprachbefehle automatisch</span><input type="checkbox" id="vsOn" ${V.on ? "checked" : ""}></label>
    <div class="roomrow vsrow"><label for="vsTpl" class="n">Vorlage, ein Befehl pro Zeile. {Name} wird durch den Gerätenamen ersetzt.</label><textarea id="vsTpl" rows="2">${esc(V.tpl.join("\n"))}</textarea>
    <span class="vsex">Beispiel: ${V.tpl.map(t => esc(t.replace(/\{name\}/gi, ex.name))).join(" · ")}</span></div>
    <div class="roomrow vsrow"><span class="n">Gilt für</span><span class="vstypes">${Object.entries(TYPES).map(([k, [l]]) => `<label class="vst"><input type="checkbox" class="vsType" data-type="${k}" ${V.types.includes(k) ? "checked" : ""}>${esc(l)}</label>`).join("")}</span></div></div>
    <p class="note">Gilt für alle Geräte dieser Arten. Beim einzelnen Gerät kannst du den Standard abschalten. Eigene Befehle kommen zusätzlich dazu.</p>`; }
  h += `<h2 class="sec">Gruppen</h2><div class="list">`;
  if (!state.groups.length) h += `<div class="roomrow"><span class="n">Noch keine Gruppen. Lege unten eine an oder direkt beim Bearbeiten eines Geräts.</span></div>`;
  [...state.groups].sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).forEach((g,i) => {
    const c = state.devices.filter(d => devGroups(d).includes(g.id)).length;
    h += `<div class="roomrow"><span class="gico">${groupIcon}</span><input id="grp-${i}" value="${esc(g.name)}" data-g="${g.id}" aria-label="Name der Gruppe">
      <button class="btn small gmbtn" data-act="grp-members" data-g="${g.id}">${c} ${c===1?"Gerät":"Geräte"} wählen</button>${(g.autoTypes||[]).length ? `<span class="n gauto">automatisch: ${esc(g.autoTypes.map(k => (TYPES[k]||TYPES.other)[0]).join(", "))}</span>` : ""}
      <button class="btn small danger" data-act="del-group" data-g="${g.id}">Löschen</button>
      <textarea id="grpv-${i}" class="grpv" data-g="${g.id}" rows="2" placeholder="Sprachbefehle der Gruppe, einer pro Zeile, z. B. Alexa, Fernsehzimmer aus" aria-label="Sprachbefehle für ${esc(g.name)}">${esc((g.voice||[]).join("\n"))}</textarea></div>`;
  });
  h += `</div><form class="addroom" id="addGroup"><input id="newGroup" placeholder="Neue Gruppe, z. B. Außenbeleuchtung" aria-label="Neue Gruppe"><button class="btn primary">Hinzufügen</button></form>
  <p class="note">Ein Gerät kann zu mehreren Gruppen gehören. Beim Löschen einer Gruppe bleiben die Geräte erhalten.</p>`;
  h += `<h2 class="sec">Sicherungskasten</h2><div class="list">`;
  if (!(state.circuits||[]).length) h += `<div class="roomrow"><span class="n">Noch keine Sicherungen. Trage unten Nummer und Bezeichnung aus deinem Sicherungskasten ein.</span></div>`;
  sortedCircuits().forEach((c,i) => {
    const rs = Object.entries(state.roomCircuits||{}).filter(([,no]) => no === c.no).map(([r]) => r);
    const ds = state.devices.filter(d => d.circuit === c.no).map(d => d.name);
    h += `<div class="roomrow crow"><span class="cno">F${esc(c.no)}</span><input id="circ-${i}" value="${esc(c.name||"")}" data-no="${esc(c.no)}" aria-label="Bezeichnung von F${esc(c.no)}" placeholder="Bezeichnung">
      <button class="btn small outbtn" data-act="outage" data-no="${esc(c.no)}" title="Zeigt im Grundriss, was ohne Strom ist">Was fällt aus?</button><button class="btn small danger" data-act="del-circ" data-no="${esc(c.no)}">Löschen</button>
      <span class="n">${rs.length || ds.length ? esc([...rs.map(r=>r), ...ds.map(n=>n+" (Gerät)")].join(", ")) : "nicht zugeordnet"}</span></div>`;
  });
  h += `</div><form class="addroom" id="addCirc"><input id="newCircNo" class="cnoin" placeholder="Nr." inputmode="numeric" aria-label="Nummer"><input id="newCircName" placeholder="Bezeichnung, z. B. Küche" aria-label="Bezeichnung"><button class="btn primary">Hinzufügen</button></form>
  <p class="note">Ordne jedem Raum oben in der Raumliste seine Sicherung zu. Alle Geräte im Raum übernehmen sie automatisch. Hängt ein Gerät an einer eigenen Sicherung, z. B. Geschirrspüler oder Herd, stellst du das direkt beim Gerät ein.</p>`;
  h += `<h2 class="sec">Verbindungen</h2><div class="list">`;
  [...(state.links||[])].sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).forEach((l,i) => {
    const c = state.devices.filter(d => d.link === l.id).length;
    h += `<div class="roomrow lrow">${linkBadge(l, "lbadge big")}<input id="lnk-${i}" value="${esc(l.name)}" data-l="${l.id}" aria-label="Name der Verbindung">
      <span class="n">${c} ${c===1?"Gerät":"Geräte"}</span>
      ${RADIO.test(l.name + " " + l.id) ? `<select class="linkBridgeSel" data-l="${l.id}" aria-label="Bridge für ${esc(l.name)}"><option value="">Bridge: keine</option>${[...state.devices].sort((a, b) => (/bridge|hub|gateway|zentrale/i.test(b.name) - /bridge|hub|gateway|zentrale/i.test(a.name)) || a.name.localeCompare(b.name, "de", {numeric: true})).map(d => `<option value="${d.id}" ${l.bridge === d.id ? "selected" : ""}>Bridge: ${esc(d.name)}</option>`).join("")}</select>` : ""}
      <label class="btn small filebtn">${l.iconAsset||l.iconData?"Logo ändern":"Logo"}<input type="file" class="linkIconFile" data-l="${l.id}" accept="image/*"></label>
      ${l.iconAsset||l.iconData?`<button class="btn small" data-act="del-linkicon" data-l="${l.id}" aria-label="Logo entfernen">✕</button>`:""}
      <button class="btn small danger" data-act="del-link" data-l="${l.id}">Löschen</button></div>`;
  });
  h += `</div><form class="addroom" id="addLink"><input id="newLink" placeholder="Neue Verbindung, z. B. Hue-Bridge" aria-label="Neue Verbindung"><button class="btn primary">Hinzufügen</button></form>
  <p class="note">Hier hinterlegst du, wie ein Gerät funkt, unabhängig von der App. Mit „Logo“ lädst du z. B. das Zigbee-Logo hoch, es erscheint dann bei allen Zigbee-Geräten.</p>`;
  h += `<h2 class="sec">Etagen</h2><div class="list">`;
  state.floors.forEach((f,i) => {
    h += `<div class="roomrow"><input id="floor-${i}" value="${esc(f.name)}" data-floor="${f.id}" aria-label="Name der Etage">
      <span class="n">${f.planAsset||f.planData?"mit Grundriss":"ohne Grundriss"}</span>
      ${state.floors.length>1?`<button class="btn small danger" data-act="del-floor" data-floor="${f.id}">Löschen</button>`:""}</div>`;
  });
  h += `</div><form class="addroom" id="addFloor"><input id="newFloor" placeholder="Neue Etage, z. B. Keller" aria-label="Neue Etage"><button class="btn primary">Hinzufügen</button></form>`;
  h += `<h2 class="sec">Apps</h2><div class="list applist">`;
  sortedApps().forEach((a,i) => {
    const c = state.devices.filter(d=>appClass(d.app)===a.id).length;
    h += `<div class="roomrow"><input id="app-name-${i}" value="${esc(a.name)}" data-app="${a.id}" aria-label="App-Name">
      <span class="n">${c} ${c===1?"Gerät":"Geräte"}</span>
      ${a.id==="other"?"":`<button class="btn small danger" data-act="del-app" data-app="${a.id}">Löschen</button>`}
      <div class="swatches" role="group" aria-label="Farbe">${COLORS.map(k=>`<button class="sw" data-c="${k}" data-act="app-color" data-app="${a.id}" data-color="${k}" aria-pressed="${a.color===k}" aria-label="Farbe ${k}"></button>`).join("")}</div>
      <div class="appiconrow">${appIcon(a,"aprev")||`<span class="aprev ph" data-c="${a.color}"></span>`}<label class="btn small filebtn">${a.iconAsset||a.iconData?"Symbol ändern":"Symbol hochladen"}<input type="file" class="appIconFile" data-app="${a.id}" accept="image/*"></label>${a.iconAsset||a.iconData?`<button class="btn small" data-act="del-appicon" data-app="${a.id}">Entfernen</button>`:""}</div>
      <input id="app-link-${i}" class="linkin" value="${esc(a.link)}" data-app="${a.id}" placeholder="Link zum Öffnen, z. B. Play-Store-Link der App" aria-label="Link für ${esc(a.name)}"></div>`;
  });
  h += `</div><form class="addroom" id="addApp"><input id="newApp" placeholder="Neue App, z. B. Tapo oder Philips Hue" aria-label="Neue App"><button class="btn primary">Hinzufügen</button></form>
  <p class="note">Der Knopf „Öffnen“ ruft den hinterlegten Link auf. Ein Play-Store- oder App-Store-Link öffnet die Seite der App, dort tippst du auf „Öffnen“. Auf dem iPhone ersetzt du die vorgegebenen Links durch die App-Store-Links.</p>`;
  h += extraRoomSections();
  return h;
}

/* ---------- Editor ---------- */
let draft = null, confirmDel = false, newGroupOpen = false, newRoomOpen = false, hubNewOpen = false, bridgeNewOpen = false;
function openEditor(id){
  const d = state.devices.find(x => x.id === id);
  draft = d ? {...d, voice:[...(d.voice||[])]} : {id:uid(), name:"", type:"light", app:filterApp || state.apps[0]?.id || "other", room:roomFilter || roomsInUse()[0] || "", note:"", ip:"", voice:[]};
  draft.groups = [...(draft.groups || [])].filter(grpName);
  draft._new = !d; confirmDel = false; newGroupOpen = false; newRoomOpen = false; hubNewOpen = false; bridgeNewOpen = false;
  renderEditor();
  setTimeout(()=>document.getElementById("f-name")?.focus(), 30);
}
function renderEditor(){
  const m = document.getElementById("modal");
  if (!draft) { closeSheet(m); return; }
  const rooms = roomsInUse();
  m.innerHTML = `<div class="overlay" data-act="close-bg"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="ed-h">
    <div class="edhd"><h2 id="ed-h">${draft._new ? "Neues Gerät" : "Gerät bearbeiten"}</h2><label class="actsw" title="Aktiv oder inaktiv"><input type="checkbox" id="f-active" ${draft.inactive ? "" : "checked"}><span class="sw" aria-hidden="true"></span><span class="swl">${draft.inactive ? "Inaktiv" : "Aktiv"}</span></label></div>
    ${draft.inactive ? `<p class="note hubnote">Inaktiv: Das Gerät bleibt gespeichert, zählt aber nicht mehr bei „Zu erledigen“, Stromausfall und Hausanleitung. Im Grundriss wird es ausgeblendet, sein Platz bleibt gespeichert. In der Liste ist es blass.</p>` : ""}
    <form class="form" id="edForm">
      <div class="field"><label for="f-name">Name</label><input id="f-name" required value="${esc(draft.name)}" placeholder="z. B. Stehlampe Sofa"></div>
      <div class="field"><label for="f-app">App</label><select id="f-app">${sortedApps().map(a=>`<option value="${a.id}" ${appClass(draft.app)===a.id?"selected":""}>${esc(a.name)}</option>`).join("")}</select></div>
      <div class="two">
        <div class="field"><label for="f-type">Art</label><select id="f-type">${Object.entries(TYPES).map(([k,[l]])=>`<option value="${k}" ${draft.type===k?"selected":""}>${l}</option>`).join("")}</select></div>
        <div class="field"><label for="f-room">Raum</label>${newRoomOpen?`<span class="gnew"><input id="f-roomnew" placeholder="Name des Raums" value="${esc(draft._roomnew||"")}" aria-label="Neuer Raum"><button type="button" class="btn small" data-act="cancel-newroom" aria-label="Abbrechen">✕</button></span>`:`<select id="f-room"><option value="" ${!draft.room?"selected":""}>Ohne Raum</option>${roomsByFloor(rooms.includes(draft.room)||!draft.room?rooms:[...rooms,draft.room]).map(g=>`<optgroup label="${esc(g.f.name)}">${g.rooms.map(r=>`<option ${r===draft.room?"selected":""}>${esc(r)}</option>`).join("")}</optgroup>`).join("")}<option value="__new">+ Neuer Raum …</option></select>`}</div>
      </div>
      ${draft.type!=="light"?`<label class="lampopt"><input type="checkbox" id="f-lamp" ${draft.lamp?"checked":""}><span>Lampe angeschlossen<small>Leuchtet im Dunkeln im Grundriss, z. B. Steckdose mit Stehlampe</small></span></label>`:""}
      <div class="field"><label>Gruppen</label><div class="gpick">${state.groups.map(g=>`<button type="button" class="rchip" data-act="tgl-group" data-g="${g.id}" aria-pressed="${draft.groups.includes(g.id) || (g.autoTypes || []).includes(draft.type)}" ${(g.autoTypes || []).includes(draft.type) ? `disabled title="Automatisch: alle ${esc((TYPES[draft.type] || TYPES.other)[0])}-Geräte gehören dazu"` : ""}>${groupIcon}${esc(g.name)}</button>`).join("")}
        ${newGroupOpen?`<span class="gnew"><input id="f-newgroup" placeholder="z. B. Weihnachtsdeko" aria-label="Name der neuen Gruppe"><button type="button" class="btn small primary" data-act="add-group-ed">Anlegen</button></span>`:`<button type="button" class="rchip gadd" data-act="new-group-ed">+ Neue Gruppe</button>`}</div></div>
      <div class="field"><label for="f-note">Notiz</label><input id="f-note" value="${esc(draft.note)}" placeholder="z. B. hinter dem Schrank, Szene „Abends“"></div>
      ${(() => { const hp = draft.help || {}, sg = helpSuggest(draft), has = hp.manual || hp.pair || hp.reset;
        return `<details class="helpbox" ${has ? "open" : ""}><summary>Störungshilfe${has ? " ✓" : ""}</summary>
        <div class="field"><label for="f-hman">Von Hand bedienen</label><textarea id="f-hman" rows="2" placeholder="${esc(sg?.manual || "z. B. Taste am Gerät kurz drücken")}">${esc(hp.manual || "")}</textarea></div>
        <div class="field"><label for="f-hpair">Neu koppeln</label><textarea id="f-hpair" rows="2" placeholder="${esc(sg?.pair || "z. B. Taste 5 Sekunden halten, bis die LED schnell blinkt")}">${esc(hp.pair || "")}</textarea></div>
        <div class="field"><label for="f-hreset">Zurücksetzen</label><textarea id="f-hreset" rows="2" placeholder="${esc(sg?.reset || "z. B. Taste 10 Sekunden halten")}">${esc(hp.reset || "")}</textarea></div>
        ${sg && !has ? `<button type="button" class="btn small" data-act="help-suggest">Vorschlag für ${esc(sg.label)} übernehmen</button><p class="note">Typische Werte. Bitte einmal mit der Anleitung des Geräts vergleichen.</p>` : ""}</details>`; })()}
      <label class="lampopt"><input type="checkbox" id="f-guide" ${guideHidden(draft) ? "checked" : ""}><span>Nicht in der Gäste-Anleitung<small>${["camera", "sensor"].includes(draft.type) ? "Kameras und Sensoren sind dort standardmäßig ausgeblendet." : "Das Gerät erscheint dann nicht in der Hausanleitung für Gäste."}</small></span></label>
      <label class="lampopt"><input type="checkbox" id="f-novoice" ${draft.noVoice ? "checked" : ""}><span>Keine Sprachsteuerung<small>Das Gerät lässt sich nicht per Sprache steuern. Es zählt dann nicht mehr als „ohne Sprachbefehl“.</small></span></label>
      <div class="field" ${draft.noVoice ? "hidden" : ""}><label for="f-voice">Sprachbefehle (einer pro Zeile)</label><textarea id="f-voice" rows="3" placeholder="Alexa, schalte die Stehlampe ein&#10;Hey Google, Wohnzimmer aus">${esc((draft.voice||[]).join("\n"))}</textarea>
        ${stdApplies(draft) ? `<label class="stdopt"><input type="checkbox" id="f-std" ${draft.noStd ? "" : "checked"}><span>Standard-Befehle<small>${(state.voiceStd.tpl || []).map(t => esc(t.replace(/\{name\}/gi, draft.name || "Name"))).join(" · ")}</small></span></label>` : ""}</div>
      <div class="field"><label for="f-link">Verbindung</label><select id="f-link"><option value="">Keine Angabe</option>${(state.links||[]).map(l=>`<option value="${l.id}" ${draft.link===l.id?"selected":""}>${esc(l.name)}</option>`).join("")}</select></div>
      <div class="field"><label for="f-circuit">Sicherung</label><select id="f-circuit"><option value="">${state.roomCircuits?.[draft.room] ? `Wie Raum (${esc(circLabel(state.roomCircuits[draft.room]))})` : "Keine Angabe"}</option>${sortedCircuits().map(c=>`<option value="${esc(c.no)}" ${draft.circuit===c.no?"selected":""}>${esc(circLabel(c.no))}</option>`).join("")}${draft.circuit && !circByNo(draft.circuit) ? `<option value="${esc(draft.circuit)}" selected>${esc(draft.circuit)}</option>` : ""}</select></div>
      <div class="field"><label for="f-hub">Gehört zu (Mehrfachsteckdose)</label>${hubNewOpen ? `<span class="gnew"><input id="f-hubnew" placeholder="Name, z. B. Steckdosentower" value="${esc(draft._hubnew || "")}" aria-label="Neues Hauptgerät"><button type="button" class="btn small" data-act="cancel-newhub">Abbrechen</button></span>` : `<select id="f-hub"><option value="">Eigenständiges Gerät</option>${state.devices.filter(x => x.id !== draft.id && !x.hub).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).map(x => `<option value="${x.id}" ${draft.hub === x.id ? "selected" : ""}>${esc(x.name)}${channelsOf(x).length ? ` (${channelsOf(x).length} Kanäle)` : ""}</option>`).join("")}<option value="__new">+ Neues Hauptgerät …</option></select>`}</div>
      ${(() => { const lk = linkById(draft.link), radio = lk && RADIO.test(lk.name + " " + lk.id), auto = lk?.bridge && lk.bridge !== draft.id ? state.devices.find(x => x.id === lk.bridge) : null;
        const lan = lk && /lan|kabel|ethernet/i.test(lk.name + " " + lk.id);
        if (!radio && !lan && !draft.bridge) return "";
        if (bridgeNewOpen) return `<div class="field"><label for="f-bridgenew">Neuer ${lan ? "Switch" : "Bridge"}</label><span class="gnew"><input id="f-bridgenew" placeholder="${lan ? "z. B. Switch Wohnzimmer" : "z. B. Zigbee Bridge"}" value="${esc(draft._bridgenew || "")}"><button type="button" class="btn small" data-act="cancel-newbridge">Abbrechen</button></span></div>`;
        return `<div class="field"><label for="f-bridge">Verbunden über (${lan ? "Switch / LAN-Verteiler" : "Bridge"})</label><select id="f-bridge"><option value="">${auto ? `Wie alle ${esc(lk.name)}-Geräte: ${esc(auto.name)}` : "Keine Bridge"}</option>${state.devices.filter(x => x.id !== draft.id).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).map(x => `<option value="${x.id}" ${draft.bridge === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}<option value="__new">+ ${lan ? "Neuen Switch" : "Neue Bridge"} anlegen …</option></select>${lan && draft.bridge ? `<small class="muted">Hat eigene IP und MAC. Fällt der Switch aus, ist das Gerät offline.</small>` : ""}</div>`; })()}
      ${!draft._new && bridgedBy(draft).length ? `<p class="note hubnote">Verbindet ${bridgedBy(draft).length} ${bridgedBy(draft).length === 1 ? "Gerät" : "Geräte"}: ${esc(bridgedBy(draft).map(x => x.name).join(", "))}. Fällt es aus, sind diese nicht mehr erreichbar.</p>` : ""}
      ${!draft._new && channelsOf(draft).length ? `<p class="note hubnote">Hauptgerät mit ${channelsOf(draft).length} Kanälen: ${esc(channelsOf(draft).map(x => x.name).join(", "))}. Sie nutzen diese IP und MAC.</p>` : ""}
      ${hubOf(draft) || hubNewOpen ? `<p class="note hubnote">IP und MAC kommen vom Hauptgerät${hubOf(draft) ? ` „${esc(hubOf(draft).name)}“: ${esc([hubOf(draft).ip, devMac(hubOf(draft))].filter(Boolean).join(" · ") || "noch nicht eingetragen")}` : ""}.</p>` : bridgeOf(draft) && isRadio(draft) ? `<p class="note hubnote">Funkt über „${esc(bridgeOf(draft).name)}“ und hat keine eigene IP. Im Netzwerk erreichbar über ${esc([bridgeOf(draft).ip, devMac(bridgeOf(draft))].filter(Boolean).join(" · ") || "die Bridge")}.</p>` : `<div class="two"><div class="field"><label for="f-ip">IP-Adresse (optional)</label><input id="f-ip" class="mono" value="${esc(draft.ip)}" placeholder="192.168.178.42" inputmode="decimal"></div>
      <div class="field"><label for="f-mac">MAC-Adresse (optional)</label><input id="f-mac" class="mono" value="${esc(draft.mac || "")}" placeholder="A4:CF:12:34:56:78" autocapitalize="characters" spellcheck="false"></div></div>`}
      ${!draft._new && routinesOf(draft.id).length ? `<div class="field"><label>In Routinen</label><div class="gpick">${routinesOf(draft.id).map(r => `<button type="button" class="rchip" data-act="open-routine" data-r="${r.id}">${rtIcon(r)}${esc(r.name)}</button>`).join("")}</div></div>` : ""}
      ${confirmDel ? `<div class="confirm">„${esc(draft.name)}“ wirklich löschen? <button type="button" class="btn small danger" data-act="del-yes">Löschen</button><button type="button" class="btn small" data-act="del-no">Abbrechen</button></div>` : ""}
      <div class="actions">
        ${draft._new ? "" : `<button type="button" class="btn danger" data-act="del-ask">Löschen</button>`}
        ${draft._new ? "" : `<button type="button" class="btn" data-act="dup">Duplizieren</button>`}
        ${!draft._new && onPlan(draft) ? `<button type="button" class="btn" data-act="show-plan" data-id="${draft.id}">Im Grundriss</button>` : ""}${!draft._new && downloads ? `<button type="button" class="btn" data-act="qr-one" data-id="${draft.id}">QR-Aufkleber</button>` : ""}
        <div class="r">${draft._new?"":openBtn(draft.app)}<button type="button" class="btn" data-act="close">Abbrechen</button><button class="btn primary">Speichern</button></div>
      </div>
    </form></div></div>`;
}
function readDraftFields(){
  draft.name = document.getElementById("f-name").value.trim();
  draft.type = document.getElementById("f-type").value;
  const fr = document.getElementById("f-room"), frn = document.getElementById("f-roomnew");
  if (frn) { draft._roomnew = frn.value; draft.room = frn.value.trim() || draft.room; }
  else if (fr && fr.value !== "__new") draft.room = fr.value;
  const fa = document.getElementById("f-app"); if (fa) draft.app = fa.value;
  draft.note = document.getElementById("f-note").value.trim();
  { const g = id => document.getElementById(id)?.value.trim() || ""; if (document.getElementById("f-hman")) { const hp = {manual: g("f-hman"), pair: g("f-hpair"), reset: g("f-hreset")}; if (hp.manual || hp.pair || hp.reset) draft.help = hp; else delete draft.help; } }
  { const fi = document.getElementById("f-ip"); if (fi) draft.ip = fi.value.trim(); }
  { const fb = document.getElementById("f-bridge"), fbn = document.getElementById("f-bridgenew"); if (fbn) draft._bridgenew = fbn.value; else if (fb && fb.value !== "__new") { if (fb.value) draft.bridge = fb.value; else delete draft.bridge; } }
  { const fh = document.getElementById("f-hub"), fn = document.getElementById("f-hubnew"); if (fn) draft._hubnew = fn.value; else if (fh && fh.value !== "__new") { if (fh.value) draft.hub = fh.value; else delete draft.hub; } }
  { const fm = document.getElementById("f-mac"); if (fm) { const m = normMac(fm.value); if (m) draft.mac = m; else delete draft.mac; } }
  const flp = document.getElementById("f-lamp"); if (flp) { if (flp.checked && draft.type !== "light") draft.lamp = true; else delete draft.lamp; }
  const fc = document.getElementById("f-circuit"); if (fc) draft.circuit = fc.value;
  const fl = document.getElementById("f-link"); if (fl) draft.link = fl.value;
  draft.voice = document.getElementById("f-voice").value.split("\n").map(x=>x.trim()).filter(Boolean);
  { const fg = document.getElementById("f-guide"); if (fg) { const def = ["camera", "sensor"].includes(draft.type); if (fg.checked === def) delete draft.guideHide; else draft.guideHide = fg.checked; } }
  { const fa2 = document.getElementById("f-active"); if (fa2) { if (fa2.checked) delete draft.inactive; else draft.inactive = true; } }
  const fnv = document.getElementById("f-novoice"); if (fnv) { if (fnv.checked) draft.noVoice = true; else delete draft.noVoice; }
  const fs2 = document.getElementById("f-std"); if (fs2) { if (fs2.checked) delete draft.noStd; else draft.noStd = true; }
}
function commitDraft(){
  readDraftFields();
  if (!draft.name) { document.getElementById("f-name").focus(); toast("Bitte gib dem Gerät einen Namen."); return; }
  const {_new, _roomnew, _hubnew, _bridgenew, ...d} = draft;
  if (bridgeNewOpen && (_bridgenew || "").trim()) {
    const nm = _bridgenew.trim(), ex = state.devices.find(x => x.name.toLowerCase() === nm.toLowerCase());
    const lanL = (state.links || []).find(l => /lan|kabel/i.test(l.name + " " + l.id));
    const b = ex || {id: uid(), name: nm, type: "other", app: "other", room: d.room, note: "", ip: "", voice: [], groups: [], noVoice: true, ...(lanL ? {link: lanL.id} : {}), ...(typeof d.x === "number" ? {x: d.x, y: d.y, floor: d.floor} : {})};
    if (!ex) state.devices.push(b);
    d.bridge = b.id;
  }
  bridgeNewOpen = false;
  delete d.example;
  if (hubNewOpen && (_hubnew || "").trim()) {
    const nm = _hubnew.trim(), ex = state.devices.find(x => x.name.toLowerCase() === nm.toLowerCase() && !x.hub);
    const h = ex || {id: uid(), name: nm, type: "plug", app: d.app, room: d.room, note: "Hauptgerät", ip: d.ip || "", voice: [], groups: [], noVoice: true, ...(d.mac ? {mac: d.mac} : {}), ...(typeof d.x === "number" ? {x: d.x, y: d.y, floor: d.floor} : {})};
    if (!ex) state.devices.push(h);
    d.hub = h.id; d.ip = ""; delete d.mac;
  }
  hubNewOpen = false;
  if (d.room && !state.rooms.includes(d.room)) state.rooms.push(d.room);
  const i = state.devices.findIndex(x => x.id === d.id);
  if (i >= 0) state.devices[i] = d; else state.devices.push(d);
  draft = null; renderEditor(); save(); render(); showCheck();
  toast(_new ? "Gerät hinzugefügt" : "Gespeichert");
}

/* ---------- Events ---------- */
let drag = null, suppressClick = false, snapWaiting = false;
function pinHtml(d, style){
  const a = appById(d.app), im = appIcon(a, "pimg");
  return `<button class="pin ${activePin===d.id?"active":""} ${flashPin===d.id?"flash":""} ${offState(d)} ${d.inactive ? "inact" : ""}" data-c="${a.color}" style="${style}" data-act="edit" data-id="${d.id}" aria-label="${esc(d.name)}"><span class="head ${im?"hasimg":""}">${im||icon(d.type)}</span><span class="lbl">${esc(d.name)}</span></button>`;
}
/* Geräte, die sich fast überdecken, werden zu einer Reihe zusammengefasst */
const G = new Map();
function clusterPins(list, ar){
  G.clear();
  // Nahe Geräte (horizontal UND vertikal) zu Gruppen verbinden, dann im Raster anordnen
  const TH = 6, cx = v => Math.min(97, Math.max(3, v)), n = list.length, par = list.map((_, i) => i);
  const f = i => par[i] === i ? i : (par[i] = f(par[i]));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = list[i], b = list[j];
    if (Math.abs(cx(a.x) - cx(b.x)) < TH && Math.abs(cx(a.y) - cx(b.y)) / ar < TH) par[f(i)] = f(j);
  }
  const m = new Map();
  list.forEach((d, i) => { const k = f(i); if (!m.has(k)) m.set(k, []); m.get(k).push(d); });
  return [...m.values()].map(cl => {
    if (cl.length === 1) return cl;
    const CELL = 4, minX = Math.min(...cl.map(d => d.x)), minY = Math.min(...cl.map(d => d.y / ar)), used = new Map();
    for (const d of [...cl].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const fx = (d.x - minX) / CELL, fy = (d.y / ar - minY) / CELL;
      let c = Math.round(fx), r = Math.round(fy);
      const horiz = Math.abs(fx - c) >= Math.abs(fy - r);
      while (used.has(r + "," + c)) { if (horiz) c++; else r++; }
      used.set(r + "," + c, d); G.set(d.id, [r, c]);
    }
    // leere Zeilen/Spalten entfernen
    const rows = [...new Set(cl.map(d => G.get(d.id)[0]))].sort((a, b) => a - b), cols = [...new Set(cl.map(d => G.get(d.id)[1]))].sort((a, b) => a - b);
    cl.forEach(d => { const [r, c] = G.get(d.id); G.set(d.id, [rows.indexOf(r) + 1, cols.indexOf(c) + 1]); });
    return cl.sort((a, b) => G.get(a.id)[0] - G.get(b.id)[0] || G.get(a.id)[1] - G.get(b.id)[1]);
  });
}
function dragStart(pin, x, y, id){
  if (!editMode || !document.getElementById("canvas") || placingId) return false;
  const grp = pin.parentElement;
  if (grp && grp.classList.contains("pgrp")) {
    const c = document.getElementById("canvas").getBoundingClientRect(), r = pin.querySelector(".head").getBoundingClientRect();
    pin.style.left = ((r.left + r.width / 2 - c.left) / c.width * 100) + "%";
    pin.style.top = ((r.top + r.height / 2 - c.top) / c.height * 100) + "%";
    grp.parentElement.appendChild(pin);
  }
  drag = {pin, id:pin.dataset.id, sx:x, sy:y, moved:false, pid:id};
  return true;
}
function dragMove(x, y){
  if (!drag) return;
  if (!drag.moved && Math.hypot(x - drag.sx, y - drag.sy) < 5) return;
  if (!drag.moved) buzz(8);
  drag.moved = true; drag.pin.classList.add("dragging","active"); drag.pin.style.translate = "";
  const r = document.getElementById("canvas").getBoundingClientRect();
  drag.x = Math.round(Math.max(0, Math.min(100, (x - r.left) / r.width * 100)) * 10) / 10;
  drag.y = Math.round(Math.max(0, Math.min(100, (y - r.top) / r.height * 100)) * 10) / 10;
  drag.pin.style.left = drag.x + "%"; drag.pin.style.top = drag.y + "%";
}
function pinTap(pin){
  const id = pin.dataset.id;
  if (showLabels || activePin === id) { openEditor(id); return; }
  activePin = id;
  document.querySelectorAll(".pin.active").forEach(p => p.classList.remove("active"));
  pin.classList.add("active");
}
function dragEnd(tapped){
  const d = drag; drag = null;
  if (!d) return;
  if (!d.moved) { if (tapped) pinTap(d.pin); }
  else {
    const dev = state.devices.find(x => x.id === d.id);
    if (dev && typeof d.x === "number") { dev.x = d.x; dev.y = d.y; dev.floor = curFloor; activePin = dev.id; const nr = autoRoom(dev); save(); toast(`„${dev.name}“ verschoben${nr ? ` · Raum: ${nr}` : ""}`); }
  }
  if (snapWaiting) { snapWaiting = false; }
  render();
  if (d.moved) buzz(document.querySelector(`.pgrp .pin[data-id="${d.id}"]`) ? [12, 50, 12] : 14);
}
/* Finger: Touch-Events, damit der Browser nicht scrollt oder ein Kontextmenü öffnet */
document.addEventListener("touchstart", e => {
  const pin = e.target.closest(".pin"); if (!pin || e.touches.length > 1) return;
  const t = e.changedTouches[0];
  if (dragStart(pin, t.clientX, t.clientY, t.identifier)) e.preventDefault();
}, {passive:false});
document.addEventListener("touchmove", e => {
  if (!drag || drag.pid === "mouse") return;
  const t = [...e.changedTouches].find(t => t.identifier === drag.pid); if (!t) return;
  e.preventDefault(); dragMove(t.clientX, t.clientY);
}, {passive:false});
document.addEventListener("touchend", e => {
  if (!drag || drag.pid === "mouse") return;
  if (![...e.changedTouches].some(t => t.identifier === drag.pid)) return;
  e.preventDefault(); dragEnd(true);
}, {passive:false});
document.addEventListener("touchcancel", () => { if (drag && drag.pid !== "mouse") dragEnd(false); });
/* Maus und Stift */
document.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch") return;
  const pin = e.target.closest(".pin"); if (!pin || e.button > 0) return;
  if (dragStart(pin, e.clientX, e.clientY, "mouse")) { e.preventDefault(); suppressClick = true; }
});
document.addEventListener("pointermove", e => { if (e.pointerType !== "touch" && drag && drag.pid === "mouse") dragMove(e.clientX, e.clientY); });
document.addEventListener("pointerup", e => {
  if (e.pointerType === "touch" || !drag || drag.pid !== "mouse") return;
  dragEnd(true); setTimeout(() => suppressClick = false, 0);
});
document.addEventListener("contextmenu", e => { if (e.target.closest("#canvas")) e.preventDefault(); });

document.addEventListener("click", e => {
  if (e.target.closest(".pin")) { e.preventDefault(); if (!suppressClick) pinTap(e.target.closest(".pin")); return; }
  const t = e.target.closest("[data-act],[data-view]");
  if (!t) {
    return;
  }
  if (t.dataset.view && t.classList.contains("tab")) { view = t.dataset.view; placingId = ""; render(); try{localStorage.setItem(LS+"-tab",view)}catch(_){} return; }
  const a = t.dataset.act;
  if (a === "close-bg") { if (e.target === t) { draft = null; renderEditor(); } return; }
  if (a === "fs-next-floor") { const i = state.floors.findIndex(f => f.id === curFloor); curFloor = state.floors[(i + 1) % state.floors.length].id; try{localStorage.setItem(LS+"-floor",curFloor)}catch(_){} render(); return; }
  if (a === "export-plan") { exportPlan(); return; }
  if (a === "fs") { fs = !fs; planMenu = false; document.body.classList.toggle("fs-open", fs); render(); return; }
  if (a === "toggle-edit") { editMode = !editMode; activePin = null; render(); if (editMode) toast("Bearbeiten an"); return; }
  if (a === "help-suggest") { readDraftFields(); const sg = helpSuggest(draft); if (sg) draft.help = {manual: sg.manual, pair: sg.pair, reset: sg.reset}; renderEditor(); setTimeout(() => document.querySelector(".helpbox")?.setAttribute("open", ""), 0); return; }
  if (a === "cancel-newbridge") { readDraftFields(); bridgeNewOpen = false; draft._bridgenew = ""; renderEditor(); return; }
  if (a === "cancel-newhub") { readDraftFields(); hubNewOpen = false; draft._hubnew = ""; renderEditor(); return; }
  if (a === "cancel-newroom") { readDraftFields(); newRoomOpen = false; draft._roomnew = ""; renderEditor(); return; }
  if (a === "stat-circ") { roomFilter = ""; filterApp = null; filterGroup = ""; filterOpen = null; query = ""; circFilter = (t.dataset.v || "").replace(/^F/, "") || "-"; view = "list"; render(); window.scrollTo(0,0); return; }
  if (a === "clear-circ") { circFilter = ""; render(); return; }
  if (a === "clear-miss") { missFilter = ""; render(); return; }
  if (a === "home-miss") { roomFilter = ""; filterApp = null; filterGroup = ""; filterOpen = null; query = ""; circFilter = ""; missFilter = t.dataset.k; view = "list"; render(); window.scrollTo(0, 0); return; }
  if (a === "home-room") { filterApp = null; filterGroup = ""; filterOpen = null; query = ""; circFilter = ""; missFilter = ""; roomFilter = t.dataset.room; view = "list"; render(); window.scrollTo(0, 0); return; }
  if (a === "home-floor") { curFloor = t.dataset.floor; view = "plan"; stack3d = false; view3d = false; try { localStorage.setItem(LS+"-floor", curFloor); } catch(_){} render(); window.scrollTo(0, 0); return; }
  if (a === "home-where" || a === "home-out") { view = "plan"; stack3d = false; planMenu = true; render(); window.scrollTo(0, 0); const sel = document.getElementById(a === "home-where" ? "whereSel" : "outSel"); if (sel) { sel.focus(); try { sel.showPicker(); } catch(_){} } return; }
  if (a === "home-3d") { view = "plan"; view3d = false; stack3d = true; introHouse = false; camHome(); render(); window.scrollTo(0, 0); return; }
  if (a === "home-acc") { view = "rooms"; accOpen = {[t.dataset.sec]: true}; try { localStorage.setItem(LS + "-acc", JSON.stringify(accOpen)); } catch(_){} render(); setTimeout(() => document.querySelector(`.acchd[data-k="${t.dataset.sec}"]`)?.scrollIntoView({block: "start", behavior: "smooth"}), 60); return; }
  if (a === "home-backup") { accOpen = {...accOpen, "Datensicherung": true}; try { localStorage.setItem(LS + "-acc", JSON.stringify(accOpen)); } catch(_){} BOX.openSheet(); return; }
  if (a === "typo-open") { typoOpen = true; renderTypo(); return; }
  if (a === "typo-close" || (a === "typo-close-bg" && e.target === t)) { typoOpen = false; renderTypo(); return; }
  if (a === "typo-close-bg") return;
  if (a === "typo-fix") { applyTypo(+t.dataset.i, true); return; }
  if (a === "typo-ign") { applyTypo(+t.dataset.i, false); return; }
  if (a === "typo-dev") { typoOpen = false; renderTypo(); openEditor(t.dataset.id); return; }
  if (a === "wifi-show") { showWifi(); return; }
  if (a === "wifi-close" || (a === "wifi-close-bg" && e.target === t)) { closeSheet(document.getElementById("rmodal")); return; }
  if (a === "wifi-close-bg") return;
  if (a === "wifi-save") { const g = id => document.getElementById(id); state.wifi = {ssid: g("wfSsid").value.trim(), pass: g("wfPass").value, enc: g("wfEnc").value}; save(); render(); toast(state.wifi.ssid ? "Gäste-WLAN gespeichert" : "Gäste-WLAN entfernt"); return; }
  if (a === "export-guide") { exportGuide(); return; }
  if (a === "export-cheat") { exportCheat(); return; }
  if (a === "ip-parse") { ipPreview = parseIpList(document.getElementById("ipPaste").value); render(); if (!ipPreview.length) toast("Keine IP-Adressen im Text gefunden."); return; }
  if (a === "ip-apply") { applyIps(); return; }
  if (a === "ip-clear") { ipPreview = []; render(); return; }
  if (a === "undo") { doUndo(); return; }
  if (a === "hist-clear") { histDel = true; render(); return; }
  if (a === "hist-clear-no") { histDel = false; render(); return; }
  if (a === "hist-clear-yes") { histDel = false; state.history = []; undoStack = []; save(); render(); toast("Verlauf gelöscht"); return; }
  if (a === "home-rtcheck") { view = "rooms"; accOpen["Routinen"] = true; try { localStorage.setItem(LS + "-acc", JSON.stringify(accOpen)); } catch(_){} render(); setTimeout(() => document.querySelector(".rcklbl")?.scrollIntoView({block: "start", behavior: "smooth"}), 60); return; }
  if (a === "open-cmds") { cmdsBack = view; view = "cmds"; render(); window.scrollTo(0, 0); return; }
  if (a === "cmds-back") { view = cmdsBack && cmdsBack !== "cmds" ? cmdsBack : "home"; render(); window.scrollTo(0, 0); return; }
  if (a === "cmds-tab") { cmdsTab = t.dataset.t; render(); return; }
  if (a === "copy-cmd") { const txt = t.dataset.c; try { navigator.clipboard.writeText(txt).then(() => toast(`Kopiert: ${txt}`), () => toast(txt)); } catch (_) { toast(txt); } buzz(8); t.classList.remove("copied"); void t.offsetWidth; t.classList.add("copied"); return; }
  if (a === "home-rt-all") { homeRtAll = !homeRtAll; render(); return; }
  if (a === "home-index") { homeIdx = !homeIdx; render(); return; }
  if (a === "stat-app" || a === "stat-room" || a === "stat-group") {
    roomFilter = ""; filterApp = null; filterGroup = ""; query = ""; filterOpen = null;
    if (a === "stat-app") filterApp = t.dataset.v; else if (a === "stat-room") roomFilter = t.dataset.v; else filterGroup = t.dataset.v;
    view = "list"; render(); window.scrollTo(0, 0); return;
  }
  if (a === "del-circ") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich?"; return; }
    const no = t.dataset.no; state.circuits = state.circuits.filter(c => c.no !== no);
    for (const [r, v] of Object.entries(state.roomCircuits)) if (v === no) delete state.roomCircuits[r];
    state.devices.forEach(d => { if (d.circuit === no) delete d.circuit; });
    save(); render(); toast(`F${no} gelöscht`); return;
  }
  if (a === "del-link") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich?"; return; }
    const id = t.dataset.l, l = linkById(id); state.links = state.links.filter(x => x.id !== id);
    state.devices.forEach(d => { if (d.link === id) delete d.link; });
    if (l?.iconAsset && assets) assets.delete(l.iconAsset).catch(()=>{});
    save(); render(); toast(`„${l?.name||""}“ gelöscht`); return;
  }
  if (a === "del-linkicon") {
    const l = linkById(t.dataset.l); if (!l) return; const old = l.iconAsset; l.iconAsset = null; l.iconData = null;
    if (old && assets) assets.delete(old).catch(()=>{}); save(); render(); toast("Logo entfernt"); return;
  }
  if (a === "export-pdf") { exportPdf(); return; }
  if (a === "export-csv") { exportCsv(); return; }
  if (a === "dup") {
    readDraftFields();
    const {_new, _roomnew, id, x, y, floor, example, ...rest} = draft;
    const base = (rest.name || "Gerät").replace(/\s+\d+$/, "");
    let k = 2; while (state.devices.some(d => d.name === `${base} ${k}`)) k++;
    draft = {...rest, id: uid(), name: `${base} ${k}`, voice: [...(rest.voice||[])], groups: [...(rest.groups||[])], _new: true};
    confirmDel = false; newGroupOpen = false; newRoomOpen = false; renderEditor();
    setTimeout(() => { const i = document.getElementById("f-name"); i?.focus(); i?.select(); }, 30);
    toast("Kopie angelegt. Name anpassen und speichern."); return;
  }
  if (a === "show-plan") {
    const d = state.devices.find(x => x.id === t.dataset.id); if (!d || typeof d.x !== "number") return;
    findOnPlan(d); return;
  }
  if (a === "outage") { startOutage(t.dataset.no); return; }
  if (a === "outage-off") { endOutage(); return; }
  if (a === "out-tab") { outTab = outTab === t.dataset.k ? "" : t.dataset.k; render(); return; }
  if (a === "view3d") { view3d = !view3d; camHome(); editMode = false; placingId = ""; cam3d.auto = false; buzz(10); render(); return; }
  if (a === "cam-reset") { camHome(); applyCam(true); return; }
  if (a === "cam-auto") { cam3d.auto = !cam3d.auto; t.setAttribute("aria-pressed", cam3d.auto); if (cam3d.auto) spin3d(); return; }
  if (a === "new-routine") { openRoutine(null); return; }
  if (a === "open-routine") { draft = null; renderEditor(); openRoutine(t.dataset.r); return; }
  if (a === "rclose" || (a === "rclose-bg" && e.target === t)) { rdraft = null; renderRoutine(); return; }
  if (a === "rclose-bg") return;
  if (a === "rt-trig") { readRoutine(); rdraft.trigger = {kind: t.dataset.k, value: ""}; renderRoutine(); return; }
  if (a === "rt-day") { readRoutine(); const dd = +t.dataset.d, ds = new Set(rdraft.days || []); ds.has(dd) ? ds.delete(dd) : ds.add(dd); rdraft.days = [...ds].sort(); renderRoutine(); return; }
  if (a === "grp-members") { openMembers(t.dataset.g); return; }
  if (a === "gm-close" || (a === "gm-close-bg" && e.target === t)) { gmId = ""; renderMembers(); return; }
  if (a === "gm-close-bg") return;
  if (a === "gm-auto") {
    const on = t.getAttribute("aria-pressed") !== "true", k = t.dataset.type; t.setAttribute("aria-pressed", on);
    document.querySelectorAll(`.gm-d[data-type="${k}"]`).forEach(b => { b.disabled = on; if (on) b.checked = true; const sm = b.nextElementSibling?.querySelector("small"); if (sm) sm.textContent = sm.textContent.replace(/ · automatisch$/, "") + (on ? " · automatisch" : ""); });
    const c = document.getElementById("rt-cnt"); if (c) c.textContent = document.querySelectorAll(".gm-d:checked").length + " gewählt";
    buzz(8); return;
  }
  if (a === "gm-save") {
    const g = gmId, grp = state.groups.find(x => x.id === g), autoT = [...document.querySelectorAll('[data-act="gm-auto"][aria-pressed="true"]')].map(b => b.dataset.type);
    if (grp) { if (autoT.length) grp.autoTypes = autoT; else delete grp.autoTypes; }
    const on = new Set([...document.querySelectorAll(".gm-d:checked:not(:disabled)")].map(x => x.value));
    for (const d of state.devices) { const gs = new Set((d.groups || []).filter(grpName)); on.has(d.id) ? gs.add(g) : gs.delete(g); d.groups = [...gs]; }
    const total = state.devices.filter(d => devGroups(d).includes(g)).length;
    gmId = ""; renderMembers(); save(); render(); buzz(10); toast(`${grpName(g)}: ${total} ${total === 1 ? "Gerät" : "Geräte"}${autoT.length ? " (automatisch erweitert)" : ""}`); return;
  }
  if (a === "rt-sign") { document.querySelectorAll('[data-act="rt-sign"]').forEach(b => b.setAttribute("aria-pressed", b === t)); buzz(6); return; }
  if (a === "rt-grp") {
    const ids = (t.dataset.ids || "").split(",").filter(Boolean), boxes = ids.map(id => document.querySelector(`.rt-d[value="${id}"]`)).filter(Boolean);
    const all = boxes.length && boxes.every(b => b.checked);
    boxes.forEach(b => b.checked = !all);
    document.querySelectorAll('[data-act="rt-grp"]').forEach(b => { const bx = (b.dataset.ids || "").split(",").filter(Boolean).map(id => document.querySelector(`.rt-d[value="${id}"]`)).filter(Boolean); b.setAttribute("aria-pressed", bx.length > 0 && bx.every(x => x.checked)); });
    const c = document.getElementById("rt-cnt"); if (c) c.textContent = document.querySelectorAll(".rt-d:checked").length + " gewählt";
    buzz(8); return;
  }
  if (a === "rt-del") { readRoutine(); rdraft._del = true; renderRoutine(); return; }
  if (a === "rt-del-no") { readRoutine(); rdraft._del = false; renderRoutine(); return; }
  if (a === "rt-del-yes") { const id = rdraft.id; rdraft = null; renderRoutine(); shrinkOut(document.querySelector(`.rtrow[data-r="${id}"]`), () => { state.routines = state.routines.filter(r => r.id !== id); save(); render(); toast("Routine gelöscht"); }); return; }
  if (a === "house-roof") { houseRoof = !houseRoof; render(); return; }
  if (a === "house-devs") { houseDevs = !houseDevs; render(); return; }
  if (a === "stack3d") { stack3d = !stack3d; introHouse = false; view3d = false; camHome(); planMenu = false; buzz(10); render(); return; }
  if (a === "stack-pick") { pickStack(t); return; }
  if (a === "sun-info") { sunInfo(); return; }
  if (a === "export-qr") { const r = document.getElementById("qrRoom")?.value || ""; exportQrPdf(state.devices.filter(d => !r || d.room === r)); return; }
  if (a === "qr-one") { const d = state.devices.find(x => x.id === t.dataset.id); if (d) exportQrPdf([d]); return; }
  if (a === "clear-planfilter") { planFilter = ""; render(); return; }
  if (a === "backup-save") { saveBackup(); return; }
  if (a === "backup-load-yes") { applyBackup(); return; }
  if (a === "backup-load-no") { pendingBackup = null; render(); return; }
  if (a === "auto-pick") { pendingAuto = {id: t.dataset.id}; render(); return; }
  if (a === "auto-no") { pendingAuto = null; render(); return; }
  if (a === "auto-yes") { autoRestore(); return; }
  if (a === "auto-now") { autoManual(); return; }
  if (a === "acc") {
    const k = t.dataset.k, sec = t.closest(".acc"), open = !sec.classList.contains("open");
    if (open) for (const o of (sec.parentElement || document).querySelectorAll(":scope > .acc.open")) { if (o === sec) continue; accAnim(o, false); o.classList.remove("open"); const b = o.querySelector(".acchd"); b?.setAttribute("aria-expanded", false); if (b) accOpen[b.dataset.k] = false; }
    if (!open) accAnim(sec, false);
    sec.classList.toggle("open", open); t.setAttribute("aria-expanded", open); accOpen[k] = open;
    if (open && k === "Datensicherung" && autoList === null) autoLoad();
    if (open) accAnim(sec, true);
    if (open) setTimeout(() => sec.scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}), motionOn() ? 230 : 0);
    try { localStorage.setItem(LS + "-acc", JSON.stringify(accOpen)); } catch(_){}
    return;
  }
  if (a === "toggle-labels") { showLabels = !showLabels; try{localStorage.setItem(LS+"-labels", showLabels?"1":"")}catch(_){} render(); return; }
  if (a === "plan-menu") { planMenu = !planMenu; render(); return; }
  if (a === "cancel-place") { placingId = ""; render(); return; }
  if (a === "del-appicon") {
    const ap = state.apps.find(x => x.id === t.dataset.app); if (!ap) return;
    const old = ap.iconAsset; ap.iconAsset = null; ap.iconData = null;
    if (old && assets) assets.delete(old).catch(()=>{});
    save(); render(); toast("Symbol entfernt");
  }
  else if (a === "room") { roomFilter = t.dataset.room; filterOpen = null; render(); }
  else if (a === "fopen") { filterOpen = filterOpen === t.dataset.f ? null : t.dataset.f; render(); }
  else if (a === "fclear") { roomFilter = ""; filterApp = null; filterGroup = ""; filterOpen = null; render(); }
  else if (a === "layout") { layout = t.dataset.l; try { localStorage.setItem("smarthome-geraete-layout", layout); } catch(_){} render(); }
  else if (a === "collapse") { collapsed[t.dataset.k] = !collapsed[t.dataset.k]; try { localStorage.setItem("smarthome-geraete-collapsed", JSON.stringify(collapsed)); } catch(_){} render(); }
  else if (a === "collapse-all") {
    const any = Object.values(collapsed).some(Boolean); collapsed = {};
    if (!any) document.querySelectorAll(".sechd").forEach(b => collapsed[b.dataset.k] = true);
    try { localStorage.setItem("smarthome-geraete-collapsed", JSON.stringify(collapsed)); } catch(_){} render();
  }
  else if (a === "sort") { sortBy = t.dataset.s; try { localStorage.setItem("smarthome-geraete-sort", sortBy); } catch(_){} render(); }
  else if (a === "fgroup") { filterGroup = t.dataset.g; filterOpen = null; render(); }
  else if (a === "tgl-group") { readDraftFields(); const g = t.dataset.g; draft.groups = draft.groups.includes(g) ? draft.groups.filter(x => x !== g) : [...draft.groups, g]; renderEditor(); }
  else if (a === "new-group-ed") { readDraftFields(); newGroupOpen = true; renderEditor(); setTimeout(()=>document.getElementById("f-newgroup")?.focus(), 20); }
  else if (a === "add-group-ed") {
    readDraftFields(); const v = (document.getElementById("f-newgroup")?.value || "").trim();
    if (!v) { newGroupOpen = false; renderEditor(); return; }
    let g = state.groups.find(x => x.name.toLowerCase() === v.toLowerCase());
    if (!g) { g = {id:"g"+Math.random().toString(36).slice(2,8), name:v}; state.groups.push(g); save(); }
    if (!draft.groups.includes(g.id)) draft.groups.push(g.id);
    newGroupOpen = false; renderEditor(); toast(`Gruppe „${g.name}“ angelegt`);
  }
  else if (a === "del-group") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich?"; return; }
    const id = t.dataset.g, n = grpName(id);
    state.groups = state.groups.filter(g => g.id !== id);
    state.devices.forEach(d => { if (d.groups) d.groups = d.groups.filter(x => x !== id); });
    if (filterGroup === id) filterGroup = "";
    save(); render(); toast(`Gruppe „${n}“ gelöscht`);
  }
  else if (a === "filter") { filterApp = t.dataset.app || null; filterOpen = null; render(); }
  else if (a === "edit") {
    if (placingId && t.classList.contains("pin")) return;
    if (t.classList.contains("pin") && !showLabels && activePin !== t.dataset.id) { activePin = t.dataset.id; document.querySelectorAll(".pin.active").forEach(p=>p.classList.remove("active")); t.classList.add("active"); return; }
    openEditor(t.dataset.id);
  }
  else if (a === "close") { draft = null; renderEditor(); }
  else if (a === "zoom") {
    const w = document.getElementById("cwrap"), fx = w ? (w.scrollLeft + w.clientWidth/2) / w.scrollWidth : .5, fy = w ? (w.scrollTop + w.clientHeight/2) / w.scrollHeight : .5;
    zoom = +t.dataset.z; render();
    const w2 = document.getElementById("cwrap");
    if (w2) { w2.scrollLeft = fx * w2.scrollWidth - w2.clientWidth/2; w2.scrollTop = fy * w2.scrollHeight - w2.clientHeight/2; }
  }
  else if (a === "floor") { curFloor = t.dataset.floor; placingId = ""; stack3d = false; if (view3d && !modelFor(curF())) { view3d = false; toast("Für diese Etage gibt es noch kein 3D-Modell."); } try{localStorage.setItem(LS+"-floor",curFloor)}catch(_){} render(); }
  else if (a === "del-floor") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich?"; return; }
    const id = t.dataset.floor, f = state.floors.find(x=>x.id===id);
    state.floors = state.floors.filter(x => x.id !== id);
    state.devices.forEach(d => { if (d.floor === id) { delete d.floor; delete d.x; delete d.y; } });
    if (f?.planAsset && assets) assets.delete(f.planAsset).catch(()=>{});
    save(); render(); toast(`Etage „${f?.name||""}“ gelöscht`);
  }
  else if (a === "copy") {
    const txt = t.dataset.text;
    navigator.clipboard?.writeText(txt).then(()=>toast("Sprachbefehl kopiert"), ()=>toast(`„${txt}“`)) ?? toast(`„${txt}“`);
  }
  else if (a === "app-color") { const ap = state.apps.find(x=>x.id===t.dataset.app); if (ap) { ap.color = t.dataset.color; save(); render(); } }
  else if (a === "del-app") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich?"; return; }
    const id = t.dataset.app, name = appById(id).name;
    state.apps = state.apps.filter(x => x.id !== id);
    state.devices.forEach(d => { if (d.app === id) d.app = "other"; });
    if (filterApp === id) filterApp = null;
    save(); render(); toast(`„${name}“ gelöscht. Die Geräte stehen jetzt unter „Andere App“.`);
  }
  else if (a === "set-app") { readDraftFields(); draft.app = t.dataset.app; renderEditor(); }
  else if (a === "del-ask") { readDraftFields(); confirmDel = true; renderEditor(); }
  else if (a === "del-no") { readDraftFields(); confirmDel = false; renderEditor(); }
  else if (a === "del-yes") { const id = draft.id; draft = null; renderEditor(); shrinkOut(document.querySelector(`.rowmain[data-id="${id}"]`)?.closest(".row") || document.querySelector(`.devmain[data-id="${id}"]`)?.closest(".dev"), () => { state.devices = state.devices.filter(d => d.id !== id); save(); render(); toast("Gerät gelöscht"); }); }
  else if (a === "clear-examples") { state.devices = state.devices.filter(d => !d.example); save(); render(); toast("Beispiele gelöscht"); }
  else if (a === "place") { placingId = t.dataset.id; render(); document.getElementById("canvas")?.scrollIntoView({block:"center",behavior:"smooth"}); }
  else if (a === "remove-plan") {
    if (!t.dataset.sure) { t.dataset.sure = "1"; t.textContent = "Wirklich entfernen?"; return; }
    const f = curF(), old = f.planAsset;
    f.planAsset = null; f.planData = null; state.devices.forEach(d => { if (floorOf(d) === f.id) { delete d.x; delete d.y; } });
    save(); render(); toast("Grundriss entfernt");
    if (old && assets) assets.delete(old).catch(()=>{});
  }
  else if (a === "del-room") {
    const r = t.dataset.room;
    state.rooms = state.rooms.filter(x => x !== r);
    state.devices.forEach(d => { if (d.room === r) d.room = ""; });
    save(); render(); toast(`Raum „${r}“ gelöscht`);
  }
});

document.addEventListener("click", e => {
  const c = e.target.closest("#canvas");
  if (!c || !placingId || e.target.closest(".pin")) return;
  const r = c.getBoundingClientRect();
  const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
  const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
  const d = state.devices.find(d => d.id === placingId);
  if (d) { d.x = Math.max(0,Math.min(100,x)); d.y = Math.max(0,Math.min(100,y)); d.floor = curFloor; activePin = d.id; const nr = autoRoom(d); buzz(14); toast(`„${d.name}“ platziert${nr ? ` · Raum: ${nr}` : ""}`); }
  placingId = ""; save(); render();
});

document.addEventListener("input", e => {
  if (e.target.id === "cmdQ") { cmdsQ = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("cmdQ"); q?.focus(); q?.setSelectionRange(pos, pos); return; }
  if (e.target.id === "rt-filter") { const q = e.target.value.trim().toLowerCase(); document.querySelectorAll(".rtdev").forEach(l => l.hidden = q && !l.dataset.s.includes(q)); return; }
  if (e.target.id === "gapH") { houseGap = +e.target.value; document.getElementById("w3d")?.style.setProperty("--gap", houseGap + "px"); placeMarkers(); return; }
  if (e.target.id === "wallH") { wall3d = +e.target.value; try { localStorage.setItem(LS + "-wall", wall3d); } catch(_){} const w = document.getElementById("w3d"); if (w) { w.innerHTML = world3d(wall3d); placeMarkers(); } return; }
  if (e.target.id === "q") { query = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("q"); q.focus(); q.setSelectionRange(pos,pos); }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "rf") { roomFilter = t.value; render(); }
  else if (t.id === "f-bridge" && t.value === "__new") { readDraftFields(); bridgeNewOpen = true; renderEditor(); setTimeout(() => document.getElementById("f-bridgenew")?.focus(), 20); }
  else if (t.id === "f-hub") { readDraftFields(); if (t.value === "__new") { hubNewOpen = true; renderEditor(); setTimeout(() => document.getElementById("f-hubnew")?.focus(), 20); } else { if (t.value) { draft.ip = ""; delete draft.mac; } renderEditor(); } }
  else if (t.id === "f-room" && t.value === "__new") { readDraftFields(); newRoomOpen = true; renderEditor(); setTimeout(()=>document.getElementById("f-roomnew")?.focus(), 20); }
  else if (t.id === "f-app" || t.id === "f-room" || t.id === "f-type" || t.id === "f-novoice" || t.id === "f-link" || t.id === "f-active") { readDraftFields(); renderEditor(); }
  else if (t.id === "planFilterSel") { planFilter = t.value; planMenu = false; render(); }
  else if (t.classList?.contains("linkBridgeSel")) { const l = linkById(t.dataset.l); if (!l) return; if (t.value) l.bridge = t.value; else delete l.bridge; save(); render(); const n = state.devices.filter(d => d.link === l.id && d.id !== t.value).length; toast(t.value ? `Alle ${n} ${l.name}-Geräte laufen über „${state.devices.find(d => d.id === t.value)?.name}“` : `${l.name}: keine Bridge`); }
  else if (t.classList?.contains("roomCircSel")) { const r = t.dataset.room; if (t.value) state.roomCircuits[r] = t.value; else delete state.roomCircuits[r]; save(); render(); toast(t.value ? `${r} → ${circLabel(t.value)}` : `${r}: keine Sicherung`); }
  else if (t.classList?.contains("roomFloorSel")) { const r = t.dataset.room; if (t.value) state.roomFloors[r] = t.value; else delete state.roomFloors[r]; save(); render(); toast(`„${r}“ → ${t.value ? (state.floors.find(f=>f.id===t.value)||{}).name : "ohne Etage"}`); }
  else if (t.id === "backupFile" && t.files[0]) { const f = t.files[0]; t.value = ""; readBackup(f); }
  else if (t.id === "optAnim" || t.id === "optPattern") { setFx(t.id === "optAnim" ? "anim" : "pattern", t.checked); }
  else if (["optDaylight","optPulse","optHaptic","optMotion"].includes(t.id)) { const k = t.id.slice(3).toLowerCase(); setFx(k, t.checked); if (k === "haptic" && t.checked) buzz([20, 60, 20]); if (k === "pulse" && t.checked) dataPulse(true); }
  else if (t.id === "whereSel") { const d = state.devices.find(x => x.id === t.value); planMenu = false; if (d) findOnPlan(d); }
  else if (t.id === "outSel") { planMenu = false; if (t.value) startOutage(t.value); else { outage = ""; render(); } }
  else if (t.id === "vsOn") { state.voiceStd.on = t.checked; save(); render(); toast(t.checked ? "Standard-Sprachbefehle an" : "Standard-Sprachbefehle aus"); }
  else if (t.id === "vsTpl") { const v = t.value.split("\n").map(x => x.trim()).filter(Boolean); if (v.length) { state.voiceStd.tpl = v; save(); render(); toast("Vorlage gespeichert"); } }
  else if (t.classList?.contains("vsType")) { const k = t.dataset.type, ty = new Set(state.voiceStd.types); t.checked ? ty.add(k) : ty.delete(k); state.voiceStd.types = [...ty]; save(); render(); }
  else if (t.classList?.contains("acc-in")) { const id = t.dataset.app, k = t.dataset.k; state.accounts[id] = {...(state.accounts[id] || {}), [k]: t.value.trim()}; if (!Object.values(state.accounts[id]).some(Boolean)) delete state.accounts[id]; save(); if (/passw|kennw/i.test(t.value) && k !== "pw" && /[:=]\s*\S{4,}/.test(t.value)) toast("Bitte hier keine Passwörter eintragen, nur wo sie liegen."); }
  else if (t.id === "optHist") { state.historyOff = !t.checked; if (!t.checked) undoStack = []; save(); render(); toast(t.checked ? "Änderungen werden aufgezeichnet" : "Aufzeichnung aus. Bisherige Einträge bleiben, bis du sie löschst."); }
  else if (t.id === "optBkWifi") { try { localStorage.setItem(LS + "-bkwifi", t.checked ? "1" : "0"); } catch(_){} }
  else if (t.id === "ipFile") { const f = t.files && t.files[0]; t.value = ""; if (f) f.text().then(tx => { const ta = document.getElementById("ipPaste"); if (ta) ta.value = tx; ipPreview = parseIpList(tx); render(); }); }
  else if (t.id === "qrFile2") { const f = t.files && t.files[0]; t.value = ""; if (f) scanQrFile(f); }
  else if (t.id === "qrFile") { const f = t.files && t.files[0]; t.value = ""; if (f) scanQrFile(f); }
  else if (t.id === "lblToggle") { showLabels = t.checked; try{localStorage.setItem(LS+"-labels", showLabels?"1":"")}catch(_){} render(); }
  else if (t.id === "placeSel") { placingId = t.value; render(); }
  else if (t.classList?.contains("linkIconFile") && t.files[0]) { const f = t.files[0], id = t.dataset.l; t.value = ""; uploadAppIcon(f, id, "link"); }
  else if (t.classList?.contains("appIconFile") && t.files[0]) { const f = t.files[0], id = t.dataset.app; t.value = ""; uploadAppIcon(f, id); }
  else if (t.classList?.contains("planFile") && t.files[0]) { const f = t.files[0]; t.value = ""; uploadPlan(f); }
  else if (!t.id) return;
  else if (t.id.startsWith("grpv-")) {
    const g = state.groups.find(x => x.id === t.dataset.g); if (!g) return;
    g.voice = t.value.split("\n").map(x => x.trim()).filter(Boolean); save(); toast("Sprachbefehle der Gruppe gespeichert");
  }
  else if (t.id.startsWith("circ-")) { const c = circByNo(t.dataset.no); if (!c) return; c.name = t.value.trim(); save(); render(); toast(`F${c.no} gespeichert`); }
  else if (t.id.startsWith("lnk-")) {
    const l = (state.links||[]).find(x => x.id === t.dataset.l); const v = t.value.trim();
    if (!l || !v) { if (l) t.value = l.name; return; }
    l.name = v; save(); render(); toast("Verbindung umbenannt");
  }
  else if (t.id.startsWith("grp-")) {
    const g = state.groups.find(x => x.id === t.dataset.g); const v = t.value.trim();
    if (!g || !v) { if (g) t.value = g.name; return; }
    g.name = v; save(); render(); toast("Gruppe umbenannt");
  }
  else if (t.id.startsWith("floor-")) {
    const f = state.floors.find(x=>x.id===t.dataset.floor); const v = t.value.trim();
    if (!f || !v) { if (f) t.value = f.name; return; }
    f.name = v; save(); render(); toast("Etage umbenannt");
  }
  else if (t.id.startsWith("app-name-") || t.id.startsWith("app-link-")) {
    const ap = state.apps.find(x=>x.id===t.dataset.app); if (!ap) return;
    if (t.id.startsWith("app-name-")) { const v = t.value.trim(); if (!v) { t.value = ap.name; return; } ap.name = v; toast("App umbenannt"); }
    else { const v = t.value.trim(); if (v && !safeLink(v)) { toast("Der Link muss mit https:// oder einem App-Schema wie xyz:// beginnen."); t.value = ap.link; return; } ap.link = v; toast("Link gespeichert"); }
    save(); render();
  }
  else if (t.id.startsWith("room-")) {
    const old = t.dataset.old, nu = t.value.trim();
    if (!nu || nu === old) { t.value = old; return; }
    state.rooms = state.rooms.map(r => r === old ? nu : r);
    if (!state.rooms.includes(nu)) state.rooms.push(nu);
    state.devices.forEach(d => { if (d.room === old) d.room = nu; });
    if (state.roomCircuits?.[old]) { if (!state.roomCircuits[nu]) state.roomCircuits[nu] = state.roomCircuits[old]; delete state.roomCircuits[old]; }
    if (state.roomFloors[old]) { if (!state.roomFloors[nu]) state.roomFloors[nu] = state.roomFloors[old]; delete state.roomFloors[old]; }
    state.floors.forEach(f => (f.zones||[]).forEach(z => { if (z.room === old) z.room = nu; }));
    save(); render(); toast("Raum umbenannt");
  }
});
document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "rtForm") { commitRoutine(); return; }
  if (e.target.id === "edForm") { const ng = document.getElementById("f-newgroup"); if (ng && document.activeElement === ng) { document.querySelector('[data-act="add-group-ed"]')?.click(); return; } commitDraft(); }
  if (e.target.id === "addCirc") {
    const no = document.getElementById("newCircNo").value.trim().replace(/^F/i, ""), nm = document.getElementById("newCircName").value.trim();
    if (!no) { toast("Bitte gib die Nummer der Sicherung ein."); return; }
    if (circByNo(no)) { toast(`F${no} gibt es schon.`); return; }
    state.circuits = [...(state.circuits||[]), {no, name: nm}]; save(); render(); toast(`F${no} angelegt`);
    setTimeout(() => document.getElementById("newCircNo")?.focus(), 30); return;
  }
  if (e.target.id === "addLink") {
    const v = document.getElementById("newLink").value.trim(); if (!v) return;
    if ((state.links||[]).some(l => l.name.toLowerCase() === v.toLowerCase())) { toast("Diese Verbindung gibt es schon."); return; }
    state.links = [...(state.links||[]), {id:"l"+Math.random().toString(36).slice(2,8), name:v, short:v.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()}];
    save(); render(); toast(`Verbindung „${v}“ angelegt`); return;
  }
  if (e.target.id === "addGroup") {
    const v = document.getElementById("newGroup").value.trim(); if (!v) return;
    if (state.groups.some(g => g.name.toLowerCase() === v.toLowerCase())) { toast("Diese Gruppe gibt es schon."); return; }
    state.groups.push({id:"g"+Math.random().toString(36).slice(2,8), name:v}); save(); render(); toast(`Gruppe „${v}“ angelegt`); return;
  }
  if (e.target.id === "addFloor") {
    const v = document.getElementById("newFloor").value.trim();
    if (!v) return;
    const id = "f" + Math.random().toString(36).slice(2,8);
    state.floors.push({id, name:v, planAsset:null, planData:null});
    save(); render(); toast(`Etage „${v}“ angelegt. Im Tab „Grundriss“ kannst du einen Plan hochladen.`);
    return;
  }
  if (e.target.id === "addApp") {
    const v = document.getElementById("newApp").value.trim();
    if (!v) return;
    if (state.apps.some(a => a.name.toLowerCase() === v.toLowerCase())) { toast("Diese App gibt es schon."); return; }
    const used = state.apps.map(a=>a.color), color = COLORS.find(c=>!used.includes(c)) || COLORS[state.apps.length % COLORS.length];
    state.apps.splice(state.apps.length - (state.apps.at(-1)?.id==="other"?1:0), 0, {id:"a"+Math.random().toString(36).slice(2,8), name:v, color, link:""});
    save(); render(); toast(`App „${v}“ angelegt`);
    document.getElementById("newApp")?.focus();
    return;
  }
  if (e.target.id === "addRoom") {
    const v = document.getElementById("newRoom").value.trim();
    if (!v) return;
    if (roomsInUse().includes(v)) { toast("Diesen Raum gibt es schon."); return; }
    state.rooms.push(v); save(); render(); toast(`Raum „${v}“ angelegt`);
    document.getElementById("newRoom")?.focus();
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && draft) { draft = null; renderEditor(); } else if (e.key === "Escape" && fs) { fs = false; document.body.classList.remove("fs-open"); render(); } });
const imgEl = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
/* Bilder über fetch laden, damit die Zeichenfläche nicht gesperrt wird (sonst kein Export möglich) */
async function loadImg(src){
  if (src.startsWith("data:")) return imgEl(src);
  const r = await fetch(src); if (!r.ok) throw new Error("img");
  return imgEl(await blobToDataUrl(await r.blob()));
}
const floorUrl = f => f.planAsset ? "/_blob/" + f.planAsset : (f.planData || null);
function colorOfKey(k){ const p = document.createElement("span"); document.body.appendChild(p); p.setAttribute("data-c", k); p.style.color = "var(--c)"; const c = getComputedStyle(p).color; p.remove(); return c; }
const iconCache = {};
async function appIconImg(ap){
  const src = ap.iconAsset ? "/_blob/" + ap.iconAsset : ap.iconData;
  if (!src) return null;
  if (!(src in iconCache)) { try { iconCache[src] = await loadImg(src); } catch (_) { iconCache[src] = null; } }
  return iconCache[src];
}
async function appIconPng(ap, size = 96){
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d");
  g.fillStyle = colorOfKey(appColor(ap.id)); g.fillRect(0, 0, size, size);
  const im = await appIconImg(ap);
  if (im) g.drawImage(im, 0, 0, size, size);
  else { g.fillStyle = "#fff"; g.font = `700 ${size * .5}px system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText((ap.name || "?").slice(0, 1).toUpperCase(), size / 2, size / 2 + size * .03); }
  return c.toDataURL("image/png");
}
/* Grundriss mit Geräten als Bild zeichnen (für PNG und PDF) */
async function planCanvas(f, W = 1600){
  const url = floorUrl(f); if (!url) return null;
  const img = await loadImg(url);
  const H = Math.round(W * img.naturalHeight / img.naturalWidth);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H);
  g.drawImage(img, 0, 0, W, H);
  const r = Math.round(W / 70), sz = r * 1.6, gap = Math.max(2, r * .15);
  const list = state.devices.filter(d => onPlan(d) && floorOf(d) === f.id);
  const font = `600 ${Math.round(r * 1.05)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const label = (text, cx, top) => {
    g.font = font; const maxW = W * .42, words = text.split(" "), lines = [];
    let ln = "";
    for (const w of words) { const t = ln ? ln + " " + w : w; if (g.measureText(t).width > maxW && ln) { lines.push(ln); ln = w; } else ln = t; }
    if (ln) lines.push(ln);
    const lh = r * 1.3, tw = Math.max(...lines.map(l => g.measureText(l).width)) + r, th = lines.length * lh + r * .4;
    if (top + th > H - 4) top = top - th - sz - r * .9;
    const x0 = Math.min(W - tw - 4, Math.max(4, cx - tw / 2));
    g.fillStyle = "rgba(43,42,39,.88)"; g.fillRect(x0, top, tw, th);
    g.fillStyle = "#FFFFFF"; g.textAlign = "center"; g.textBaseline = "top";
    lines.forEach((l, i) => g.fillText(l, x0 + tw / 2, top + r * .2 + i * lh));
  };
  const drawPin = async (d, x, y) => {
    const ap = appById(d.app);
    g.fillStyle = colorOfKey(appColor(d.app)); g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    const im = await appIconImg(ap); if (im) g.drawImage(im, x - sz / 2, y - sz / 2, sz, sz);
    g.lineWidth = Math.max(2, r / 5); g.strokeStyle = "#FFFFFF"; g.strokeRect(x - sz / 2, y - sz / 2, sz, sz);
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  for (const cl of clusterPins(list, img.naturalWidth / img.naturalHeight)) {
    if (cl.length === 1) {
      const d = cl[0], x = clamp(d.x / 100 * W, sz, W - sz), y = clamp(d.y / 100 * H, sz, H - sz);
      await drawPin(d, x, y); label(d.name, x, y + sz / 2 + r * .3);
      continue;
    }
    const pos = cl.map(d => G.get(d.id)), nr = Math.max(...pos.map(p => p[0])), nc = Math.max(...pos.map(p => p[1]));
    const gw = nc * (sz + gap) - gap, gh = nr * (sz + gap) - gap;
    const cx = clamp((Math.min(...cl.map(d => d.x)) + Math.max(...cl.map(d => d.x))) / 200 * W, gw / 2 + 6, W - gw / 2 - 6);
    const cy = clamp((Math.min(...cl.map(d => d.y)) + Math.max(...cl.map(d => d.y))) / 200 * H, gh / 2 + 6, H - gh / 2 - 6);
    g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(cx - gw / 2 - gap * 2, cy - gh / 2 - gap * 2, gw + gap * 4, gh + gap * 4);
    for (let i = 0; i < cl.length; i++) await drawPin(cl[i], cx - gw / 2 + (pos[i][1] - 1) * (sz + gap) + sz / 2, cy - gh / 2 + (pos[i][0] - 1) * (sz + gap) + sz / 2);
    label(cl.map(d => d.name).join(" · "), cx, cy + gh / 2 + gap * 2 + r * .3);
  }
  return c;
}
async function exportPlan(){
  if (!downloads) return;
  toast("Bild wird erstellt …");
  try {
    const c = await planCanvas(curF()); if (!c) return;
    const g = c.getContext("2d"), r = Math.round(c.width / 70);
    g.font = `700 ${Math.round(r * 1.3)}px system-ui, sans-serif`; g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = "#131C2B";
    g.fillText(curF().name, r, c.height - r * 2.2);
    const blob = await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("blob")), "image/png"));
    await downloads.save({filename: `Grundriss ${curF().name}.png`, data: blob});
    toast("Bild gespeichert. Du kannst es jetzt teilen oder drucken.");
  } catch (e) {
    if (e && e.code === "declined") return;
    toast(e && (e.code === "unavailable" || e.code === "not_granted") ? "Speichern ist hier nicht möglich." : "Das Bild konnte nicht erstellt werden.");
  }
}
let pendingBackup = null;
/* Automatische Sicherungen: einmal am Tag vor der ersten Änderung, nur für den Besitzer lesbar */
let autoList = null, autoLoading = false, autoBusy = false, autoErr = false, pendingAuto = null;
const AUTO_KEEP = 20;
const autoCol = () => db && db.collection("backups");
const dayId = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const autoKind = {a: "Tagesstand", m: "Von dir gesetzt", r: "Vor dem Zurückholen"};
async function autoWrite(id, kind, data){
  const body = {t: new Date().toISOString(), kind, n: (data.devices || []).length, data};
  const ref = autoCol().doc(id);
  try { await ref.set(body); }
  catch (e) { if (e && e.code === "invalid_argument") await ref.set({...body, data: {...data, history: []}}); else throw e; }
}
async function autoPrune(){
  const q = await autoCol().orderBy("t", "desc").limit(60).get();
  for (const d of q.docs.slice(AUTO_KEEP)) { try { await autoCol().doc(d.id).delete(); } catch (_) {} }
}
async function autoLoad(){
  if (!db || readOnly || autoLoading) return;
  autoLoading = true;
  try {
    const q = await autoCol().orderBy("t", "desc").limit(AUTO_KEEP).get();
    autoList = q.docs.map(d => { const x = d.data() || {}; return {id: d.id, t: x.t, kind: x.kind || "a", n: x.n || 0}; });
    autoErr = false;
  } catch (_) { autoErr = true; autoList = autoList || []; }
  autoLoading = false;
  if (!draft) render();
}
async function autoSnap(prev){
  if (!db || readOnly || !prev || autoBusy) return;
  const id = "a-" + dayId();
  if (autoSnap.done === id) return;
  autoBusy = true;
  try {
    const s = await autoCol().doc(id).get();
    if (!s.exists) { await autoWrite(id, "a", prev); await autoPrune(); if (autoList) await autoLoad(); }
    autoSnap.done = id; autoErr = false;
  } catch (_) { autoErr = true; }
  autoBusy = false;
}
async function autoManual(){
  if (!db || readOnly) return;
  try { await autoWrite("m-" + Date.now(), "m", JSON.parse(JSON.stringify(state))); await autoPrune(); toast("Sicherungspunkt gesetzt"); showCheck(); }
  catch (_) { toast("Der Sicherungspunkt konnte nicht gesetzt werden."); }
  autoLoad();
}
async function autoRestore(){
  if (!pendingAuto) return;
  const id = pendingAuto.id; pendingAuto = null;
  toast("Stand wird zurückgeholt …");
  try {
    const s = await autoCol().doc(id).get();
    const d = s.exists && s.data();
    if (!d || !d.data || !Array.isArray(d.data.devices)) throw 0;
    await autoWrite("r-" + Date.now(), "r", JSON.parse(JSON.stringify(state)));
    state = normalize(d.data); save(); render(); showCheck();
    toast("Stand vom " + autoWhen(d.t) + " zurückgeholt");
    autoPrune().then(autoLoad).catch(() => {});
  } catch (_) { toast("Das Zurückholen hat nicht geklappt."); render(); }
}
const autoWhen = t => { const d = new Date(t); return isNaN(d) ? "?" : d.toLocaleDateString("de-DE", {weekday: "short", day: "2-digit", month: "2-digit"}) + ", " + d.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"}) + " Uhr"; };
function autoHtml(){
  if (mode !== "db" || readOnly) return "";
  if (autoList === null) { if (accOpen["Datensicherung"]) setTimeout(autoLoad, 0); return `<div class="autohd"><span class="l">Automatische Sicherungen</span></div><p class="note" style="margin-top:0">Wird geladen …</p>`; }
  const rows = autoList.map(b => `<div class="roomrow autorow"><span class="at"><b>${esc(autoWhen(b.t))}</b><span>${esc(autoKind[b.kind] || "Sicherung")} · ${b.n} Geräte</span></span><button class="btn small" data-act="auto-pick" data-id="${esc(b.id)}">Zurückholen</button></div>`
    + (pendingAuto && pendingAuto.id === b.id ? `<div class="roomrow confirm2"><span>Diesen Stand zurückholen? Dein jetziger Stand wird vorher selbst gesichert, du kannst also jederzeit zurück.</span><span class="r2"><button class="btn small danger" data-act="auto-yes">Zurückholen</button><button class="btn small" data-act="auto-no">Abbrechen</button></span></div>` : "")).join("");
  return `<div class="autohd"><span class="l">Automatische Sicherungen</span><button class="btn small" data-act="auto-now">Jetzt sichern</button></div>
  ${autoList.length ? `<div class="list">${rows}</div>` : `<p class="note" style="margin-top:0">Noch keine. Sobald du etwas änderst, wird der Stand von vorher gesichert.</p>`}
  <p class="note">${autoErr ? "Die letzte automatische Sicherung hat nicht geklappt. " : ""}Vor der ersten Änderung eines Tages sichert die App den bisherigen Stand. Es bleiben die letzten ${AUTO_KEEP} Stände. Nur du kannst sie sehen. Die Bilder bleiben in der App gespeichert, die Sicherungen verweisen darauf. Für den Notfall außerhalb von Claude ist die Datei-Sicherung oben weiterhin sinnvoll.</p>`;
}
async function loadAny(urls){ let err; for (const u of urls) { try { await loadScript(u); return; } catch (e) { err = e; } } throw err; }
function loadScript(src){ return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const sc = document.createElement("script"); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
function exportRows(){
  const out = [], fl = id => (state.floors.find(f => f.id === id) || {}).name || "Ohne Etage";
  const rooms = [...roomsInUse(), ""];
  for (const g of [...state.floors.map(f => f.id), ""]) {
    for (const r of rooms.filter(r => (r ? (roomFloor(r) || "") : "") === g || (!r && g === ""))) {
      const ds = state.devices.filter(d => (d.room || "") === r).sort((a,b) => a.name.localeCompare(b.name, "de", {numeric:true}));
      for (const d of ds) out.push({floor: g ? fl(g) : "Ohne Etage", room: r || "Ohne Raum", name: d.name, appId: d.app, app: appById(d.app).name, link: linkById(d.link)?.name || "", type: (TYPES[d.type]||TYPES.other)[0], groups: devGroups(d).map(grpName).join(", "), circuit: circLabel(circuitOf(d)), voice: allVoice(d).join("\n"), note: d.note || "", ip: (n => [n.ip, n.mac, n.via ? "über " + n.via.name : ""].filter(Boolean).join(" · "))(devNet(d)), plan: typeof d.x === "number" ? "ja" : "nein"});
    }
  }
  return out;
}
const pdfText = t => String(t ?? "").replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x00-\xFF\n]/g, "");
async function exportPdf(){
  if (!downloads) return;
  toast("PDF wird erstellt …");
  try {
    try {
      if (!window.jspdf) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"]);
      if (!window.jspdf?.jsPDF?.API?.autoTable) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"]);
    } catch (_) { return exportHtml(true); }
    const { jsPDF } = window.jspdf, doc = new jsPDF({orientation: "landscape", unit: "mm", format: "a4"});
    const now = new Date(), rows = exportRows();
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(pdfText("MySmartBox – Geräteliste"), 14, 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(110);
    doc.text(pdfText(`Stand ${now.toLocaleDateString("de-DE")} · ${state.devices.length} Geräte`), 14, 21);
    doc.setTextColor(0);
    let y = 26, lastFloor = null;
    const icons = {};
    for (const ap of state.apps) { try { icons[ap.id] = await appIconPng(ap); } catch (_) {} }
    const head = [["","Gerät","Raum","App","Verbindung","Art","Gruppen","Sicherung","Sprachbefehle","Notiz / IP"]];
    for (const fname of [...new Set(rows.map(r => r.floor))]) {
      const part = rows.filter(r => r.floor === fname);
      if (y > 180) { doc.addPage(); y = 16; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(pdfText(fname), 14, y + 4);
      doc.autoTable({startY: y + 6, head, body: part.map(r => [{content: "", appId: r.appId}, r.name, r.room, r.app, r.link, r.type, r.groups, r.circuit, r.voice, [r.note, r.ip].filter(Boolean).join("\n")].map(v => typeof v === "string" ? pdfText(v) : v)),
        didDrawCell: h => { if (h.section === "body" && h.column.index === 0) { const raw = h.cell.raw || (h.row.raw && h.row.raw[0]), im = raw && icons[raw.appId]; if (im) try { doc.addImage(im, "PNG", h.cell.x + 1.2, h.cell.y + 1.2, 5, 5); } catch (_) {} } },
        styles: {font: "helvetica", fontSize: 8, cellPadding: 1.6, valign: "top", lineColor: [228,223,214], lineWidth: .2},
        headStyles: {fillColor: [43,42,39], textColor: 255, fontStyle: "bold"}, alternateRowStyles: {fillColor: [246,244,240]},
        columnStyles: {0:{cellWidth: 8, minCellHeight: 7.4}, 1:{cellWidth: 36, fontStyle: "bold"}, 2:{cellWidth: 24}, 3:{cellWidth: 22}, 4:{cellWidth: 18}, 5:{cellWidth: 18}, 6:{cellWidth: 24}, 7:{cellWidth: 32}, 8:{cellWidth: 54}, 9:{cellWidth: 33}},
        margin: {left: 14, right: 14}});
      y = doc.lastAutoTable.finalY + 8;
    }
    const gs = state.groups.filter(g => true);
    if (gs.length) {
      if (y > 170) { doc.addPage(); y = 16; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Gruppen", 14, y + 4);
      doc.autoTable({startY: y + 6, head: [["Gruppe","Geräte","Sprachbefehle der Gruppe"]],
        body: gs.map(g => [g.name, state.devices.filter(d => devGroups(d).includes(g.id)).map(d => d.name).join(", "), (g.voice||[]).join("\n")].map(pdfText)),
        styles: {font: "helvetica", fontSize: 8, cellPadding: 1.6, valign: "top", lineColor: [228,223,214], lineWidth: .2},
        headStyles: {fillColor: [43,42,39], textColor: 255}, columnStyles: {0:{cellWidth: 45, fontStyle: "bold"}, 1:{cellWidth: 110}}, margin: {left: 14, right: 14}});
    }
    for (const f of state.floors) {
      let c = null, data = null; try { c = await planCanvas(f, 1800); data = c && c.toDataURL("image/jpeg", .9); } catch (_) {}
      if (!data) continue;
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(0); doc.text(pdfText("Grundriss " + f.name), 14, 14);
      const maxW = 269, maxH = 180, k = Math.min(maxW / c.width, maxH / c.height), w = c.width * k, h = c.height * k;
      doc.addImage(data, "JPEG", 14 + (maxW - w) / 2, 19, w, h);
    }
    if (state.routines.length) {
      doc.addPage(); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0); doc.text("Routinen", 14, 16);
      doc.autoTable({startY: 20, head: [["Routine", "App", "Auslöser", "Geräte", "Aktion / Notiz"]],
        body: sortedRoutines().map(r => [r.name + (r.on === false ? " (pausiert)" : ""), appById(r.app).name, trigText(r), (r.devices || []).map(id => state.devices.find(d => d.id === id)?.name).filter(Boolean).join(", "), [r.action, r.note].filter(Boolean).join("\n")].map(pdfText)),
        styles: {font: "helvetica", fontSize: 8, cellPadding: 1.6, valign: "top", lineColor: [228,223,214], lineWidth: .2},
        headStyles: {fillColor: [43,42,39], textColor: 255}, columnStyles: {0: {cellWidth: 45, fontStyle: "bold"}, 1: {cellWidth: 28}, 2: {cellWidth: 55}, 3: {cellWidth: 90}}, margin: {left: 14, right: 14}});
    }
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140); doc.text(`Seite ${i} von ${pages}`, 283, 203, {align: "right"}); }
    const blob = doc.output("blob");
    await downloads.save({filename: `MySmartBox Geräteliste ${now.toISOString().slice(0,10)}.pdf`, data: blob});
    toast("PDF gespeichert. Du kannst sie jetzt drucken oder teilen.");
  } catch (e) {
    if (e && e.code === "declined") return;
    toast(e && e.code ? "Die PDF konnte nicht gespeichert werden." : "Die PDF konnte nicht erstellt werden" + (e && e.message ? ` (${String(e.message).slice(0, 80)})` : "") + ".");
  }
}
async function exportHtml(fallback){
  const rows = exportRows(), now = new Date();
  const e = esc, floors = [...new Set(rows.map(r => r.floor))], icons = {};
  for (const ap of state.apps) { try { icons[ap.id] = await appIconPng(ap, 48); } catch (_) {} }
  let body = `<h1>MySmartBox – Geräteliste</h1><p class="m">Stand ${now.toLocaleDateString("de-DE")} · ${state.devices.length} Geräte</p>`;
  for (const f of floors) {
    body += `<h2>${e(f)}</h2><table><thead><tr><th>Gerät</th><th>Raum</th><th>App</th><th>Verbindung</th><th>Art</th><th>Gruppen</th><th>Sicherung</th><th>Sprachbefehle</th><th>Notiz / IP</th></tr></thead><tbody>`;
    for (const r of rows.filter(r => r.floor === f)) body += `<tr><td>${icons[r.appId]?`<img src="${icons[r.appId]}" style="width:14px;height:14px;vertical-align:-3px;margin-right:5px">`:""}<b>${e(r.name)}</b></td><td>${e(r.room)}</td><td>${e(r.app)}</td><td>${e(r.link)}</td><td>${e(r.type)}</td><td>${e(r.groups)}</td><td>${e(r.circuit)}</td><td>${e(r.voice).replace(/\n/g,"<br>")}</td><td>${e([r.note, r.ip].filter(Boolean).join(" · "))}</td></tr>`;
    body += `</tbody></table>`;
  }
  if (state.groups.length) { body += `<h2>Gruppen</h2><table><thead><tr><th>Gruppe</th><th>Geräte</th><th>Sprachbefehle der Gruppe</th></tr></thead><tbody>${state.groups.map(g => `<tr><td><b>${e(g.name)}</b></td><td>${e(state.devices.filter(d => devGroups(d).includes(g.id)).map(d => d.name).join(", "))}</td><td>${(g.voice||[]).map(e).join("<br>")}</td></tr>`).join("")}</tbody></table>`; }
  for (const f of state.floors) { try { const c = await planCanvas(f, 1400); if (c) body += `<h2 style="page-break-before:always">Grundriss ${e(f.name)}</h2><img src="${c.toDataURL("image/jpeg", .85)}" style="max-width:100%;max-height:92vh">`; } catch (_) {} }
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MySmartBox – Geräteliste</title><style>body{font:11px/1.4 system-ui,sans-serif;color:#131C2B;margin:16px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px}.m{color:#777;margin:2px 0 10px}table{width:100%;border-collapse:collapse}th{background:#131C2B;color:#fff;text-align:left;padding:4px 6px}td{border-bottom:1px solid #E4DFD6;padding:4px 6px;vertical-align:top}tr:nth-child(even) td{background:#F6F4F0}@page{size:A4 landscape;margin:12mm}@media print{h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>${body}</body></html>`;
  try { await downloads.save({filename: `MySmartBox Geräteliste ${now.toISOString().slice(0,10)}.html`, data: new Blob([html], {type: "text/html"})}); toast(fallback ? "PDF ging nicht, Druckversion als Webseite gespeichert" : "Druckversion gespeichert"); }
  catch (er) { if (er && er.code === "declined") return; toast("Die Druckversion konnte nicht gespeichert werden."); }
}
async function exportCsv(){
  if (!downloads) return;
  const rows = exportRows(), cols = [["floor","Etage"],["room","Raum"],["name","Gerät"],["app","App"],["link","Verbindung"],["type","Art"],["groups","Gruppen"],["circuit","Sicherung"],["voice","Sprachbefehle"],["note","Notiz"],["ip","IP/MAC"],["plan","Im Grundriss"]];
  const q = v => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " | ")}"`;
  const csv = "\uFEFF" + [cols.map(c => q(c[1])).join(";"), ...rows.map(r => cols.map(c => q(r[c[0]])).join(";"))].join("\r\n");
  try { await downloads.save({filename: `MySmartBox Geräteliste ${new Date().toISOString().slice(0,10)}.csv`, data: new Blob([csv], {type: "text/csv"})}); toast("Tabelle gespeichert"); }
  catch (e) { if (e && e.code === "declined") return; toast("Die Tabelle konnte nicht gespeichert werden."); }
}
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
function assetIds(st){ return [...new Set([...st.floors.map(f => f.planAsset), ...st.apps.map(a => a.iconAsset), ...(st.links||[]).map(l => l.iconAsset)].filter(Boolean))]; }
async function saveBackup(){
  if (!downloads) return;
  toast("Sicherung wird erstellt …");
  const data = JSON.parse(JSON.stringify(state)), now = new Date(), files = {};
  if (!bkWifi() && data.wifi) data.wifi.pass = "";
  let missing = 0;
  for (const id of assetIds(data)) {
    try { const r = await fetch("/_blob/" + id); if (!r.ok) throw 0; files[id] = await blobToDataUrl(await r.blob()); }
    catch (_) { missing++; }
  }
  const payload = {app: "JAZM Meine Geräte", version: 2, saved: now.toISOString(), data, files};
  const ymd = now.toISOString().slice(0, 10);
  try {
    await downloads.save({filename: `MySmartBox-Sicherung ${ymd}.json`, data: new Blob([JSON.stringify(payload)], {type: "application/json"})});
    toast(missing ? `Sicherung gespeichert, ${missing} Bild(er) fehlten` : "Sicherung mit allen Bildern gespeichert");
    if (!readOnly) { state.lastBackup = new Date().toISOString(); save(); }
  } catch (e) { if (e && e.code === "declined") return; toast("Die Sicherung konnte nicht gespeichert werden."); }
}
async function readBackup(file){
  try {
    const j = JSON.parse(await file.text()), d = j && (j.data || j);
    if (!d || !Array.isArray(d.devices) || !Array.isArray(d.apps)) throw new Error("format");
    pendingBackup = {data: normalize(d), files: (j.files && typeof j.files === "object") ? j.files : {}, when: j.saved ? new Date(j.saved).toLocaleDateString("de-DE") : "unbekannt"};
    render();
  } catch (e) { toast("Diese Datei ist keine gültige Sicherung."); }
}
async function applyBackup(){
  if (!pendingBackup) return;
  const {data, files} = pendingBackup; pendingBackup = null;
  toast("Sicherung wird eingelesen …");
  const remap = {};
  for (const id of assetIds(data)) {
    let ok = false;
    try { const r = await fetch("/_blob/" + id, {method: "HEAD"}); ok = r.ok; } catch (_) {}
    if (ok || !files[id]) continue;
    try {
      const blob = await (await fetch(files[id])).blob();
      if (assets) { const res = await assets.upload(blob); remap[id] = {asset: res.id}; }
      else remap[id] = {data: files[id]};
    } catch (_) { remap[id] = {data: files[id]}; }
  }
  for (const f of data.floors) { const m = remap[f.planAsset]; if (m) { f.planAsset = m.asset || null; if (m.data) f.planData = m.data; } }
  for (const a of [...data.apps, ...(data.links||[])]) { const m = remap[a.iconAsset]; if (m) { a.iconAsset = m.asset || null; if (m.data) a.iconData = m.data; } }
  // WLAN-Passwort ohne Inhalt in der Sicherung: vorhandenes behalten
  if (data.wifi && !data.wifi.pass && state.wifi?.pass && (!data.wifi.ssid || data.wifi.ssid === state.wifi.ssid)) data.wifi = {...data.wifi, ssid: data.wifi.ssid || state.wifi.ssid, pass: state.wifi.pass};
  state = normalize(data); save(); render();
  const n = Object.keys(remap).length;
  toast(n ? `Sicherung eingelesen, ${n} Bild(er) wiederhergestellt` : "Sicherung eingelesen");
}
const fx = {pattern: false, anim: true, daylight: true, pulse: true, haptic: true, motion: true};
try { const v = JSON.parse(localStorage.getItem(LS + "-fx") || "{}"); if (typeof v.pattern === "boolean") fx.pattern = v.pattern; if (typeof v.anim === "boolean") fx.anim = v.anim; for (const k of ["daylight","pulse","haptic","motion"]) if (typeof v[k] === "boolean") fx[k] = v[k]; } catch(_){}
function applyFx(){ document.body.classList.toggle("motion", motionOn()); document.body.classList.toggle("no-pattern", !fx.pattern); document.body.classList.toggle("no-anim", !fx.anim); }
function setFx(k, v){ fx[k] = v; try { localStorage.setItem(LS + "-fx", JSON.stringify(fx)); } catch(_){} applyFx(); render(); }
applyFx();
/* Markierungen und Reihen am Rand nach innen schieben, damit sie nicht abgeschnitten werden */
function fitPins(){
  const c = document.getElementById("canvas"); if (!c) return;
  const cr = c.getBoundingClientRect(); if (!cr.width) return;
  for (const el of c.querySelectorAll(":scope > .pgrp, :scope > .pin")) {
    el.style.translate = "";
    const r = (el.classList.contains("pin") ? el.querySelector(".head") : el).getBoundingClientRect();
    let dx = 0, dy = 0; const m = 3;
    if (r.left < cr.left + m) dx = cr.left + m - r.left; else if (r.right > cr.right - m) dx = cr.right - m - r.right;
    if (r.top < cr.top + m) dy = cr.top + m - r.top; else if (r.bottom > cr.bottom - m) dy = cr.bottom - m - r.bottom;
    if (dx || dy) el.style.translate = `${dx}px ${dy}px`;
  }
  // Beschriftungen innerhalb des Grundrisses halten
  for (const l of c.querySelectorAll(".lbl, .glbl")) {
    l.style.translate = "";
    const r = l.getBoundingClientRect(); if (!r.width) continue;
    let dx = 0; const m = 2;
    if (r.left < cr.left + m) dx = cr.left + m - r.left; else if (r.right > cr.right - m) dx = cr.right - m - r.right;
    let dy = r.bottom > cr.bottom - m ? -(r.height + l.parentElement.getBoundingClientRect().height + 8) : 0;
    if (dx || dy) l.style.translate = `${dx}px ${dy}px`;
  }
}
window.addEventListener("resize", () => fitPins());
function setAr(img){ const ar = img.naturalWidth / img.naturalHeight; if (!ar) return; arCache[img.getAttribute("src")] = ar; img.parentElement.style.setProperty("--ar", ar); requestAnimationFrame(fitPins); }


function loadImage(file){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(Object.assign(new Error("decode"), {code:"decode"}));
    i.src = url;
  });
}
function toCanvas(img, max){
  const s = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round((img.naturalWidth || img.width) * s));
  c.height = Math.max(1, Math.round((img.naturalHeight || img.height) * s));
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0,0,c.width,c.height); g.drawImage(img,0,0,c.width,c.height);
  return c;
}
function appIcon(a, cls){
  const src = a.iconAsset ? "/_blob/" + a.iconAsset : (a.iconData || "");
  return src ? `<img class="${cls}" src="${esc(src)}" alt="" draggable="false">` : "";
}
async function uploadAppIcon(file, id, kind){
  const ap = (kind === "link" ? (state.links||[]) : state.apps).find(x => x.id === id); if (!ap) return;
  let img; try { img = await loadImage(file); } catch(e) { toast("Das Bild lässt sich nicht öffnen. Versuche ein PNG oder JPG."); return; }
  const c = document.createElement("canvas"), size = 160, sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height, m = Math.min(sw, sh);
  c.width = c.height = size;
  c.getContext("2d").drawImage(img, (sw - m) / 2, (sh - m) / 2, m, m, 0, 0, size, size);
  const old = ap.iconAsset; let done = false;
  if (assets) {
    try { const blob = await new Promise((r, j) => c.toBlob(b => b ? r(b) : j(new Error("blob")), "image/png")); const res = await assets.upload(blob); ap.iconAsset = res.id; ap.iconData = null; done = true; } catch(e) {}
  }
  if (!done) { ap.iconData = c.toDataURL("image/png"); ap.iconAsset = null; }
  if (old && old !== ap.iconAsset && assets) assets.delete(old).catch(()=>{});
  save(); render(); toast(`Symbol für „${ap.name}“ gespeichert`);
}
let uploading = false;
async function uploadPlan(file){
  if (uploading) return;
  if (file.type && !file.type.startsWith("image/")) { toast("Bitte wähle ein Bild aus, zum Beispiel ein JPG oder PNG."); return; }
  uploading = true; toast("Grundriss wird geladen …");
  let img;
  try { img = await loadImage(file); }
  catch(e) {
    uploading = false;
    toast(/heic|heif/i.test(file.type + file.name) ? "HEIC-Fotos kann der Browser nicht lesen. Mach einen Screenshot vom Foto und lade den hoch." : "Das Bild lässt sich nicht öffnen. Versuche ein JPG oder PNG.");
    return;
  }
  const f = curF(), old = f.planAsset;
  let done = false, why = "";
  if (assets) {
    try {
      const blob = await new Promise((r, j) => toCanvas(img, 1600).toBlob(b => b ? r(b) : j(new Error("blob")), "image/jpeg", .85));
      const res = await assets.upload(blob);
      f.planAsset = res.id; f.planData = null; f.zones = null; done = true;
      if (old) assets.delete(old).catch(()=>{});
    } catch(e) { why = e?.code || e?.message || "unbekannt"; }
  }
  if (!done) {
    // Fallback: kleines Bild direkt in den gespeicherten Daten
    let q = .72, max = 1200, data = toCanvas(img, max).toDataURL("image/jpeg", q);
    while (data.length > 450000 && max > 500) { max -= 200; q -= .06; data = toCanvas(img, max).toDataURL("image/jpeg", q); }
    f.planData = data; f.planAsset = null; f.zones = null; done = true;
    if (old && assets) assets.delete(old).catch(()=>{});
  }
  uploading = false;
  save(); render();
  toast(why ? "Grundriss gespeichert (verkleinert). Jetzt Geräte platzieren." : "Grundriss gespeichert. Jetzt Geräte platzieren.");
  if (why) console.warn("Asset-Upload fehlgeschlagen:", why);
}


/* ================= Spielereien ================= */
const APP_LINK = "https://jazm-smartbox.github.io/";
function buzz(p){ if (!fx.haptic || !navigator.vibrate) return; try { navigator.vibrate(p); } catch(_){} }

/* --- Datenpuls über die Leiterbahnen --- */
let lastPulse = 0;
function dataPulse(force){
  if (!force && (!fx.pulse || !fx.pattern)) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const now = Date.now(); if (!force && now - lastPulse < 1500) return; lastPulse = now;
  const svg = document.querySelector(".pcb"); if (!svg) return;
  const NS = "http://www.w3.org/2000/svg", g = document.createElementNS(NS, "g");
  g.setAttribute("class", "pulse");
  const paths = [...svg.querySelectorAll('path[id^="bt"]')].sort(() => Math.random() - .5).slice(0, 16);
  for (const pth of paths) {
    let len = 0; try { len = pth.getTotalLength(); } catch(_){}
    if (!len) continue;
    const t = pth.cloneNode(); t.removeAttribute("id");
    t.setAttribute("stroke", "#E2691F"); t.setAttribute("stroke-opacity", "1"); t.setAttribute("stroke-width", "3");
    const seg = Math.min(90, len * .4);
    t.style.strokeDasharray = `${seg} ${len + seg}`;
    t.animate([{strokeDashoffset: seg}, {strokeDashoffset: -len}], {duration: 700 + len * .9, easing: "cubic-bezier(.35,0,.25,1)", fill: "forwards", delay: Math.random() * 180});
    g.appendChild(t);
  }
  svg.appendChild(g); setTimeout(() => g.remove(), 3200);
  const sy = document.getElementById("sync"); sy?.classList.remove("blip"); void sy?.offsetWidth; sy?.classList.add("blip");
}

/* --- Tageszeit: Sonne von der Straßenseite (oben im Plan) --- */
function sunTimes(d = new Date()){
  const rad = Math.PI / 180, lat = 51, lon = 10;
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const B = rad * 360 / 365 * (doy - 81), decl = 23.44 * Math.sin(B);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const tz = -d.getTimezoneOffset() / 60, noon = 12 + (tz * 15 - lon) / 15 - eot / 60;
  const ha = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * rad) * Math.tan(decl * rad)))) / rad / 15;
  return {rise: noon - ha, set: noon + ha, noon};
}
const fmtH = h => { const m = Math.round((((h % 24) + 24) % 24) * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
function nowHour(){ const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
const isLamp = d => d.type === "light" || !!d.lamp;
function daylightHtml(noGlow){
  const h = dlHour ?? nowHour(), {rise, set} = sunTimes(), TW = .8;
  let night = 0, p = .5, dusk = 0, day = h >= rise && h <= set;
  if (day) { p = (h - rise) / (set - rise); dusk = Math.max(0, 1 - Math.min(h - rise, set - h) / 1.3); }
  else { const dist = h < rise ? rise - h : h - set; night = Math.min(1, dist / TW); p = h < rise ? 0 : 1; }
  const layers = [];
  if (day) {
    const ang = 135 + 90 * p, a = .32 + .18 * dusk, g2 = Math.round(214 - 70 * dusk), b2 = Math.round(150 - 90 * dusk);
    layers.push(`linear-gradient(${ang}deg, rgba(255,${g2},${b2},${a}) 0%, rgba(255,${g2},${b2},${a * .35}) 30%, rgba(255,255,255,0) 58%, rgba(70,80,120,${.05 + .08 * dusk}) 100%)`);
  } else {
    if (night < 1) layers.push(`linear-gradient(180deg, rgba(255,120,70,${.4 * (1 - night)}) 0%, rgba(255,255,255,0) 60%)`);
    layers.push(`linear-gradient(rgba(28,36,88,${.18 + .4 * night}), rgba(20,26,70,${.24 + .44 * night}))`);
  }
  let glow = "";
  if (!day && !noGlow) {
    const ar = arCache[planUrl()] || .77, k = .25 + .75 * night;
    const lights = state.devices.filter(d => onPlan(d) && floorOf(d) === curFloor && (isLamp(d) || d.type === "alexa"));
    glow = lights.map((d, i) => { const k = (.25 + .75 * night) * Math.max(0, Math.min(1, (night - Math.min(.6, i * .08)) / .3 + (night >= 1 ? 1 : 0))); return isLamp(d)
      ? `radial-gradient(ellipse ${4}% ${4 * ar}% at ${d.x}% ${d.y}%, rgba(255,246,214,${k}) 0%, rgba(255,226,160,${.9 * k}) 45%, rgba(255,210,130,0) 100%), radial-gradient(ellipse ${19}% ${19 * ar}% at ${d.x}% ${d.y}%, rgba(255,205,120,${k}) 0%, rgba(255,186,95,${.8 * k}) 22%, rgba(255,170,80,${.38 * k}) 55%, rgba(255,160,70,0) 100%)`
      : `radial-gradient(ellipse ${4}% ${4 * ar}% at ${d.x}% ${d.y}%, rgba(90,200,255,${.75 * k}) 0%, rgba(90,200,255,0) 100%)`; });
  }
  const sunX = day ? 6 + 88 * p : 88;
  const icon = day
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`;
  return `<div class="dl" aria-hidden="true"><div class="dl-tint" style="background:${layers.join(",")}"></div>${glow ? glow.map((g, i) => `<div class="dl-glow" style="background:${g};--i:${i}"></div>`).join("") : ""}</div>
    <button class="sunb ${day ? "day" : "night"}" data-act="sun-info" style="left:${sunX}%" aria-label="Tageszeit" title="Tageszeit">${icon}${dlHour != null ? `<span>${fmtH(h)}</span>` : ""}</button>`;
}
function updateDaylight(){
  if (!fx.daylight) return;
  const s3 = document.getElementById("s3d");
  if (s3) { s3.querySelector(".dl")?.remove(); s3.querySelector(".sunb")?.remove(); s3.insertAdjacentHTML("beforeend", daylightHtml(true)); return; }
  const c = document.getElementById("canvas"); if (!c) return;
  c.querySelector(".dl")?.remove(); c.querySelector(".sunb")?.remove();
  c.querySelector("img")?.insertAdjacentHTML("afterend", daylightHtml());
}
let dlRun = 0;
function sunInfo(){
  const {rise, set} = sunTimes();
  if (dlHour != null) { dlHour = null; cancelAnimationFrame(dlRun); updateDaylight(); return; }
  toast(`Sonnenaufgang ${fmtH(rise)} · Sonnenuntergang ${fmtH(set)}`);
  buzz(10);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = performance.now(), from = nowHour(), DUR = 9000;
  const step = t => {
    const k = Math.min(1, (t - start) / DUR); dlHour = (from + 24 * k) % 24; updateDaylight();
    if (k < 1 && (document.getElementById("canvas") || document.getElementById("s3d"))) dlRun = requestAnimationFrame(step); else { dlHour = null; updateDaylight(); }
  };
  dlRun = requestAnimationFrame(step);
}
setInterval(() => { if (view === "plan" && dlHour == null) updateDaylight(); }, 120000);

/* --- Wo ist …? Radar --- */
function radarHtml(){
  const d = state.devices.find(x => x.id === flashPin); if (!d || floorOf(d) !== curFloor) return "";
  return `<div class="radarclip" aria-hidden="true"><div class="radar" style="left:${d.x}%;top:${d.y}%"><i></i></div></div>`;
}
let findTimer = 0;
function findOnPlan(d){
  if (d.inactive) { toast(`„${d.name}“ ist inaktiv und im Grundriss ausgeblendet.`); return; }
  draft = null; renderEditor();
  view = "plan"; stack3d = false; curFloor = floorOf(d); planFilter = ""; activePin = d.id; flashPin = d.id; placingId = "";
  try { localStorage.setItem(LS+"-floor", curFloor); localStorage.setItem(LS+"-tab", view); } catch(_){}
  render(); buzz([10, 80, 10, 80, 10]);
  setTimeout(() => { document.querySelector(`.pin[data-id="${d.id}"]`)?.scrollIntoView({block:"center", inline:"center", behavior:"smooth"}); }, 60);
  clearTimeout(findTimer);
  findTimer = setTimeout(() => { flashPin = ""; document.querySelector(".pin.flash")?.classList.remove("flash"); document.getElementById("canvas")?.classList.remove("finding"); document.querySelector(".radarclip")?.remove(); }, 3400);
}

/* --- Was fällt aus? --- */
const outRooms = no => new Set(Object.entries(state.roomCircuits || {}).filter(([, n]) => n === no).map(([r]) => r));
const outDevices = no => state.devices.filter(d => !d.inactive && circuitOf(d) === no);
const unreachDevices = no => state.devices.filter(d => !d.inactive && circuitOf(d) !== no && [hubOf(d), bridgeOf(d)].some(b => b && circuitOf(b) === no));
const offState = d => !outage ? "" : circuitOf(d) === outage ? "off" : [hubOf(d), bridgeOf(d)].some(b => b && circuitOf(b) === outage) ? "unreach" : "";
function startOutage(no){
  outage = no; outTab = ""; view = "plan"; stack3d = false; planMenu = false; draft = null; renderEditor();
  const ds = outDevices(no).filter(d => typeof d.x === "number");
  if (ds.length) { const cnt = {}; ds.forEach(d => cnt[floorOf(d)] = (cnt[floorOf(d)] || 0) + 1); curFloor = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]; }
  try { localStorage.setItem(LS+"-tab", view); localStorage.setItem(LS+"-floor", curFloor); } catch(_){}
  render(); buzz([40, 50, 40]);
  window.scrollTo({top: 0, behavior: "smooth"});
}
function endOutage(){
  const polys = [...document.querySelectorAll(".ozones polygon")];
  if (motionOn() && polys.length) {
    polys.forEach((p, i) => p.animate([{opacity: 1}, {opacity: .2}, {opacity: .9}, {opacity: 0}], {duration: 420, delay: i * 220, fill: "forwards", easing: "steps(4)"}));
    document.querySelectorAll(".pin.off, .pin.unreach").forEach((p, i) => setTimeout(() => p.classList.remove("off", "unreach"), 200 + i * 60));
    buzz(12); setTimeout(() => { outage = ""; render(); buzz(20); const c = document.getElementById("canvas"); c?.classList.add("poweron"); setTimeout(() => c?.classList.remove("poweron"), 900); toast("Strom ist wieder da"); }, polys.length * 220 + 450);
    return;
  }
  outage = ""; render(); buzz(20);
  const c = document.getElementById("canvas"); c?.classList.add("poweron"); setTimeout(() => c?.classList.remove("poweron"), 900);
  toast("Strom ist wieder da");
}
function outageZones(){
  const rooms = outRooms(outage), zs = (curF().zones || []).filter(z => rooms.has(z.room) && Array.isArray(z.poly));
  if (!zs.length) return "";
  return `<svg class="ozones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${zs.map(z => `<polygon points="${z.poly.map(p => p.join(",")).join(" ")}"/>`).join("")}</svg>`;
}
function outageBanner(){
  const ds = outDevices(outage), rooms = [...outRooms(outage)], un = unreachDevices(outage), c = circByNo(outage);
  const here = ds.filter(d => typeof d.x === "number" && floorOf(d) === curFloor).length;
  const ids = new Set([...ds, ...un].map(d => d.id)), rs = state.routines.filter(r => (r.devices || []).some(id => ids.has(id)));
  const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  const bolt = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>';
  const clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const chip = (d, cls) => { const onP = typeof d.x === "number"; return `<button class="oc-chip ${cls || ""} ${onP ? "" : "np"}" data-act="${onP ? "show-plan" : "edit"}" data-id="${esc(d.id)}" data-c="${appColor(d.app)}" title="${onP ? "Im Grundriss zeigen" : "Nicht im Grundriss – Gerät öffnen"}"><i></i>${esc(d.name)}</button>`; };
  const tiles = [{k: "off", n: ds.length, l: "ohne Strom"}];
  if (un.length) tiles.push({k: "un", n: un.length, l: "nicht erreichbar"});
  if (rs.length) tiles.push({k: "rt", n: rs.length, l: rs.length === 1 ? "Routine" : "Routinen"});
  let det = "";
  if (outTab === "off") {
    const byRoom = new Map(); ds.forEach(d => { const r = d.room || "Ohne Raum"; if (!byRoom.has(r)) byRoom.set(r, []); byRoom.get(r).push(d); });
    const quiet = rooms.filter(r => !byRoom.has(r));
    det = [...byRoom].map(([r, list]) => `<div class="oc-grp"><span class="oc-gl">${esc(r)}</span><span class="oc-chips">${list.map(d => chip(d)).join("")}</span></div>`).join("")
      + (quiet.length ? `<p class="oc-note">Ebenfalls an ${esc("F" + outage)}, aber ohne erfasste Geräte: ${esc(quiet.join(", "))}</p>` : "")
      + (ds.length ? "" : `<p class="oc-note">An dieser Sicherung hängen keine erfassten Geräte.</p>`);
  } else if (outTab === "un") {
    const byB = new Map(); un.forEach(d => { const b = (bridgeOf(d) && circuitOf(bridgeOf(d)) === outage) ? bridgeOf(d) : hubOf(d); const k = b ? b.name : "?"; if (!byB.has(k)) byB.set(k, []); byB.get(k).push(d); });
    det = [...byB].map(([b, list]) => `<div class="oc-grp"><span class="oc-gl">${esc(b)}<em>ist aus</em></span><span class="oc-chips">${list.map(d => chip(d, "un")).join("")}</span></div>`).join("")
      + `<p class="oc-note">Diese Geräte haben noch Strom, sind aber über die ausgefallene Verbindung nicht erreichbar.</p>`;
  } else if (outTab === "rt") {
    det = `<div class="oc-grp"><span class="oc-gl">Laufen nicht vollständig</span><span class="oc-chips">${rs.map(r => `<span class="oc-chip rt">${clock}${esc(r.name)}</span>`).join("")}</span></div>`;
  }
  return `<div class="outcard" role="status">
    <div class="oc-hd"><span class="oc-fuse" aria-hidden="true"><span class="oc-lever"></span><b>F${esc(outage)}</b></span>
      <span class="oc-tt"><small>Sicherung ist aus</small><b>${esc(c && c.name ? c.name : "F" + outage)}</b></span>
      <button class="oc-on" data-act="outage-off">${bolt}Strom an</button></div>
    <div class="oc-kpis" style="--n:${tiles.length}">${tiles.map(t => `<button class="oc-k ${t.k}" data-act="out-tab" data-k="${t.k}" aria-expanded="${outTab === t.k}"><b>${t.n}</b><span>${t.l}</span>${t.k === "off" && state.floors.length > 1 && ds.length ? `<span>davon ${here} hier</span>` : ""}${chev}</button>`).join("")}</div>
    ${det ? `<div class="oc-det">${det}</div>` : ""}
  </div>`;
}
function floorBar(){
  const sf = stackFloors().length > 1 || canHouse();
  return `<div class="floors ${sf ? "has3d" : ""}" role="group" aria-label="Etage" style="--n:${state.floors.length}">${state.floors.map(f => {
    const n = outage ? outDevices(outage).filter(d => typeof d.x === "number" && floorOf(d) === f.id).length : 0;
    return `<button class="floorbtn" data-act="floor" data-floor="${f.id}" aria-pressed="${!stack3d && f.id === curFloor}">${esc(f.name)}${n ? `<span class="obadge">${n}</span>` : ""}</button>`;
  }).join("")}${sf ? `<button class="floorbtn stkbtn" data-act="stack3d" aria-pressed="${stack3d}" title="Etagen in 3D" aria-label="Etagen in 3D">3D</button>` : ""}</div>`;
}

/* --- Etagen-Stapel in 3D --- */
const isGardenF = f => /garten|außen|aussen|grundst/i.test(f.name || "");
const stackFloors = () => { const fl = state.floors.filter(f => floorUrl(f)); return [...fl.filter(isGardenF), ...fl.filter(f => !isGardenF(f))]; };
const STACK_FIT = {l: 160 / 1060, t: 180 / 1100, w: 610 / 1060};
function renderStack(){
  const fl = stackFloors(), baseG = isGardenF(fl[0]);
  let h = exampleBanner() + `<div class="mapwrap" id="mapwrap">${floorBar()}<div class="sheet stksheet"><div class="stack3d"><div class="stk-scene">`;
  fl.forEach((f, i) => {
    const fit = i === 0 || !baseG ? {l: 0, t: 0, w: 1} : STACK_FIT, u = floorUrl(f), ar = arCache[u] || (isGardenF(f) ? 1060 / 1100 : .77);
    const dots = state.devices.filter(d => onPlan(d) && floorOf(d) === f.id).map(d => `<i data-c="${appColor(d.app)}" class="${outage && circuitOf(d) === outage ? "off" : ""}" style="left:${d.x}%;top:${d.y}%"></i>`).join("");
    h += `<button class="stk-layer ${f.id === curFloor ? "cur" : ""}" data-act="stack-pick" data-floor="${f.id}" style="--i:${i};${i ? `left:${fit.l * 100}%;top:${fit.t * 100}%;width:${fit.w * 100}%;` : ""}aspect-ratio:${ar}" aria-label="${esc(f.name)} öffnen"><img src="${esc(u)}" alt="" draggable="false" onload="this.parentElement.style.aspectRatio=this.naturalWidth/this.naturalHeight"><span class="stk-dots">${dots}</span><span class="stk-name">${esc(f.name)}</span></button>`;
  });
  h += `</div></div><p class="hint stk-hint">Tippe auf eine Etage, um sie zu öffnen.</p></div></div>`;
  return h;
}
function pickStack(t){
  const sc = t.closest(".stk-scene"); buzz(12);
  if (!sc || matchMedia("(prefers-reduced-motion: reduce)").matches) { stack3d = false; view3d = false; curFloor = t.dataset.floor; try { localStorage.setItem(LS+"-floor", curFloor); } catch(_){} render(); return; }
  sc.classList.add("pick"); t.classList.add("picked");
  setTimeout(() => { stack3d = false; curFloor = t.dataset.floor; try { localStorage.setItem(LS+"-floor", curFloor); } catch(_){} render(); }, 520);
}

/* --- QR-Aufkleber --- */
async function loadQr(){ if (!window.qrcode) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js", "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"]); return window.qrcode; }
const devLink = d => `${APP_LINK}#g=${encodeURIComponent(d.id)}`;
/* Logo-Plakette für die Mitte des QR-Codes: JAZM oben, App-Logo darunter */
async function jazmLogoImg(){
  const u = "jazm-logo.png"; // JAZM-Logo aus dem Seitenkopf
  try { return await loadImg(u); } catch (_) { return null; }
}
async function qrBadge(ap, jazm){
  const S = 240, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, S, S);
  g.strokeStyle = "#131C2B"; g.lineWidth = 8; g.strokeRect(4, 4, S - 8, S - 8);
  // JAZM-Schriftzug: Bild als Maske, in Tintenfarbe eingefärbt
  const lw = 196, lh = jazm ? Math.round(lw * jazm.naturalHeight / jazm.naturalWidth) : 56;
  if (jazm) {
    const t = document.createElement("canvas"); t.width = lw; t.height = lh; const tg = t.getContext("2d");
    tg.drawImage(jazm, 0, 0, lw, lh); tg.globalCompositeOperation = "source-in"; tg.fillStyle = "#131C2B"; tg.fillRect(0, 0, lw, lh);
    g.drawImage(t, (S - lw) / 2, 22);
  } else { g.fillStyle = "#131C2B"; g.font = "800 56px Manrope, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "top"; g.fillText("JAZM", S / 2, 20); }
  const isz = Math.min(S - 44 - lh - 30, 124), iy = 22 + lh + 14 + ((S - 22 - lh - 14 - 18) - isz) / 2;
  const icon = await appIconPng(ap, 160).then(loadImg).catch(() => null);
  if (icon) g.drawImage(icon, (S - isz) / 2, iy, isz, isz);
  return c.toDataURL("image/png");
}
async function exportQrPdf(list){
  if (!downloads) return;
  if (!list.length) { toast("Keine Geräte für Aufkleber."); return; }
  toast(list.length === 1 ? "Aufkleber wird erstellt …" : `${list.length} Aufkleber werden erstellt …`);
  try {
    try {
      if (!window.jspdf) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"]);
      await loadQr();
    } catch (_) { toast("Die Bausteine für die Aufkleber konnten nicht geladen werden. Prüfe deine Internetverbindung."); return; }
    const { jsPDF } = window.jspdf, doc = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});
    const icons = {};
    for (const ap of state.apps) { try { icons[ap.id] = await appIconPng(ap, 64); } catch (_) {} }
    const badges = {}, jazm = await jazmLogoImg();
    for (const ap of state.apps) { try { badges[ap.id] = await qrBadge(ap, jazm); } catch (_) {} }
    const W = 70, H = 37, COLS = 3, ROWS = 8, top = (297 - ROWS * H) / 2;
    const sorted = [...list].sort((a, b) => (a.room || "").localeCompare(b.room || "", "de") || a.name.localeCompare(b.name, "de", {numeric: true}));
    sorted.forEach((d, i) => {
      const k = i % (COLS * ROWS); if (i && !k) doc.addPage();
      const x = (k % COLS) * W, y = top + Math.floor(k / COLS) * H;
      doc.setDrawColor(225); doc.setLineWidth(.1); doc.rect(x + .6, y + .6, W - 1.2, H - 1.2);
      // Fehlerkorrektur H: bis 30 % des Codes dürfen verdeckt sein, die Mitte trägt die Logos
      const q = window.qrcode(0, "H"); q.addData(devLink(d)); q.make();
      const n = q.getModuleCount(), S = 29, cell = S / (n + 2), qx = x + 3, qy = y + (H - S) / 2;
      const bm = Math.round(n * .3) | 1, b0 = Math.floor((n - bm) / 2), inB = (r, c) => r >= b0 && r < b0 + bm && c >= b0 && c < b0 + bm;
      doc.setFillColor(43, 42, 39);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c) && !inB(r, c)) doc.rect(qx + (c + 1) * cell, qy + (r + 1) * cell, cell + .02, cell + .02, "F");
      if (badges[d.app]) try { doc.addImage(badges[d.app], "PNG", qx + (b0 + 1) * cell + cell * .3, qy + (b0 + 1) * cell + cell * .3, bm * cell - cell * .6, bm * cell - cell * .6); } catch (_) {}
      const tx = x + 34, tw = W - 37;
      if (icons[d.app]) try { doc.addImage(icons[d.app], "PNG", tx, y + 4.5, 5.5, 5.5); } catch (_) {}
      doc.setTextColor(120); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      doc.text(pdfText(appById(d.app).name), tx + 7, y + 8.4, {maxWidth: tw - 7});
      doc.setTextColor(30); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      const nm = doc.splitTextToSize(pdfText(d.name), tw).slice(0, 2);
      doc.text(nm, tx, y + 15);
      let ly = y + 15 + nm.length * 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(90);
      const fl = state.floors.length > 1 && typeof d.x === "number" ? (state.floors.find(f => f.id === floorOf(d)) || {}).name : "";
      for (const line of [[d.room, fl].filter(Boolean).join(" · "), circLabel(circuitOf(d)), linkById(d.link)?.name || ""].filter(Boolean)) {
        if (ly > y + H - 3) break;
        doc.text(doc.splitTextToSize(pdfText(line), tw)[0], tx, ly); ly += 3.4;
      }
    });
    const now = new Date();
    await downloads.save({filename: list.length === 1 ? `QR-Aufkleber ${list[0].name}.pdf` : `QR-Aufkleber ${now.toISOString().slice(0, 10)}.pdf`, data: doc.output("blob")});
    toast("Aufkleber gespeichert. Am besten auf Etiketten 70 × 37 mm drucken, Skalierung 100 %.");
  } catch (e) {
    if (e && e.code === "declined") return;
    toast("Die Aufkleber konnten nicht erstellt werden" + (e && e.message ? ` (${String(e.message).slice(0, 80)})` : "") + ".");
  }
}
async function scanQrFile(file){
  toast("Code wird gelesen …");
  let text = null;
  try {
    const bmp = await createImageBitmap(file);
    if ("BarcodeDetector" in window) { try { const r = await new BarcodeDetector({formats: ["qr_code"]}).detect(bmp); text = r[0]?.rawValue || null; } catch (_) {} }
    if (!text) {
      if (!window.jsQR) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js", "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"]);
      for (const max of [1000, 1600, 700]) {
        const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
        const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(bmp, 0, 0, w, h);
        const res = window.jsQR(g.getImageData(0, 0, w, h).data, w, h);
        if (res && res.data) { text = res.data; break; }
      }
    }
  } catch (_) {}
  const m = text && text.match(/[#?&]g=([^&#\s]+)/), d = m && state.devices.find(x => x.id === decodeURIComponent(m[1]));
  if (!d) { toast(text ? "Dieser Code gehört zu keinem Gerät." : "Kein QR-Code erkannt. Versuch es näher und mit mehr Licht."); return; }
  buzz([15, 60, 15]); openEditor(d.id); toast(`Gefunden: ${d.name}`);
}
function checkHash(){
  const m = (location.hash || "").match(/g=([^&]+)/); if (!m || !ready) return;
  const d = state.devices.find(x => x.id === decodeURIComponent(m[1]));
  try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
  if (d) { openEditor(d.id); toast(`Gefunden: ${d.name}`); }
}
window.addEventListener("hashchange", checkHash);


/* ================= 3D-Räume (CSS 3D, ohne Zusatzbibliothek) ================= */
let wall3d = 70, intro3d = "";
try { const v = +localStorage.getItem(LS + "-wall"); if (v >= 0 && v <= 130) wall3d = v || 70; } catch(_){}
// Start immer von der Straße (Haustür) aus: Straße liegt im Plan oben
const CAM0 = {rx: 58, rz: 180, k: 1, px: 0, py: 0};
const cam3d = {...CAM0, auto: false};
const camHome = () => Object.assign(cam3d, CAM0);
const W_IN = 5, W_OUT = 9, H_FULL = 120, DOOR_H = 96;
// Modelle in Plan-Koordinaten (wie die gezeichneten Grundrisse)
const EG_STEPS = (() => { const st = [], xs = [190,164,148,132,116,100,84];
  for (let i = 0; i < 6; i++) st.push([xs[i+1], 305, xs[i] - xs[i+1], 38]);
  st.push([44, 305, 40, 38], [44, 343, 40, 29], [44, 372, 40, 38]);
  const xb = [84,100,116,132,148,164,190];
  for (let i = 0; i < 6; i++) st.push([xb[i], 372, xb[i+1] - xb[i], 38]);
  return st; })();
const MODELS = {
  eg: { match: /erd|^eg$/i, vb: [0, 0, 610, 797],
    walls: [
      ["o", 40, 40, 570, 40, [[226, 278]]], ["o", 570, 40, 570, 757, [[478, 555]]], ["o", 40, 757, 570, 757, [[411, 488]]], ["o", 40, 40, 40, 757, []],
      ["i", 190, 40, 190, 305, [[68, 119]]], ["i", 40, 305, 190, 305, []], ["i", 308, 40, 308, 467, [[70, 121], [214, 265]]],
      ["i", 308, 147, 570, 147, []], ["i", 465, 40, 465, 147, []], ["i", 40, 467, 308, 467, [[245, 296]]] ],
    boxes: [
      [45,45,66,64,48,"#FFFFFF"], [45,109,66,65,48,"#FFFFFF"], [115,232,66,67,96,"#ECE7F2"],
      [308,147,157,56,46,"#E4DDD2"], [530,147,36,320,46,"#E4DDD2"], [412,410,154,57,46,"#E4DDD2"],
      [44,469,181,40,28,"#FFFFFF"], [92,485,86,3,38,"#131C2B",28],
      [45,613,66,74,22,"#DCE3EA"], [45,613,14,74,40,"#CDD6DF"], [271,616,68,74,22,"#DCE3EA"], [325,616,14,74,40,"#CDD6DF"],
      [112,693,148,59,22,"#DCE3EA"], [112,738,148,14,40,"#CDD6DF"],
      [412,581,66,105,4,"#FFFFFF",36], [414,583,4,4,36,"#B9B2A6"], [472,583,4,4,36,"#B9B2A6"], [414,680,4,4,36,"#B9B2A6"], [472,680,4,4,36,"#B9B2A6"],
      [398,596,12,18,22,"#FFFFFF"], [398,652,12,18,22,"#FFFFFF"], [480,596,12,18,22,"#FFFFFF"], [480,652,12,18,22,"#FFFFFF"],
      [515,564,51,189,110,"#FFFFFF"], [99,445,127,20,30,"#FFFFFF"],
      ...EG_STEPS.map((b, i) => [...b, Math.round((i + 1) * H_FULL / 15), "#E9DCCD"]) ] },
  og: { match: /ober|^og$/i, vb: [0, 0, 610, 797],
    walls: [
      ["o", 40, 40, 570, 40, []], ["o", 570, 40, 570, 757, []], ["o", 40, 757, 570, 757, []], ["o", 40, 40, 40, 757, []],
      ["i", 40, 298, 198, 298, []], ["i", 198, 298, 198, 345, []], ["i", 198, 345, 338, 345, [[203, 249], [281, 329]]],
      ["i", 266, 40, 266, 345, []], ["i", 338, 264, 570, 264, []], ["i", 338, 264, 338, 458, [[378, 426]]],
      ["i", 338, 458, 338, 558, []], ["i", 338, 558, 570, 558, []], ["i", 40, 458, 338, 458, [[200, 248], [284, 332]]], ["i", 279, 458, 279, 757, []] ],
    boxes: [
      [45,45,50,190,32,"#E3E8ED"], [135,45,38,14,40,"#FFFFFF"], [137,59,34,48,20,"#FFFFFF"], [230,119,34,56,45,"#FFFFFF"],
      [123,236,75,56,4,"#E2EDF2"], [123,236,2,56,95,"rgba(170,205,220,.35)"], [123,236,75,2,95,"rgba(170,205,220,.35)"],
      [45,460,99,43,30,"#E3E8ED"], [48,542,147,158,24,"#FFFFFF"], [48,542,147,8,46,"#D9D2C6"], [54,550,64,22,6,"#EFEDF3",24], [125,550,64,22,6,"#EFEDF3",24], [48,588,147,112,3,"#E9E4EF",24],
      [226,593,50,158,110,"#E4DDD2"], [340,266,49,106,110,"#E4DDD2"], [340,507,188,49,110,"#E4DDD2"],
      [418,266,131,63,22,"#DCE3EA"], [418,266,131,14,40,"#CDD6DF"],
      [80,338,118,3,36,"#B9A493"], [80,375,118,3,36,"#B9A493"] ] },
  ga: { match: /garten|außen|aussen/i, vb: [-160, -180, 1060, 1100], house: true,
    walls: [],
    boxes: [
      [40,40,530,717,H_FULL,"#F3F0EA",0,"#8E877C"], [-125,580,160,342,90,"#E9DFCE",0,"#8A7A62"],
      [890,-100,10,1020,34,"#A9C49A"], [35,910,865,10,34,"#A9C49A"],
      [776,236,10,10,46,"#8A6E52"], [756,216,50,50,44,"#9CBF8A",46,"#B3D1A3"],
      [796,606,10,10,46,"#8A6E52"], [776,586,50,50,44,"#9CBF8A",46,"#B3D1A3"],
      [-60,-60,10,10,40,"#8A6E52"], [-78,-78,46,46,40,"#9CBF8A",40,"#B3D1A3"] ] }
};
function modelFor(f){ if (!f || !floorUrl(f)) return null; for (const k in MODELS) if (MODELS[k].match.test(f.name || f.id || "")) return MODELS[k]; return null; }
function shade(c, f){
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (!m) { const r = c.match(/rgba?\(([^)]+)\)/); if (!r) return c; const v = r[1].split(",").map(Number); return `rgba(${Math.round(v[0]*f)},${Math.round(v[1]*f)},${Math.round(v[2]*f)},${v[3] ?? 1})`; }
  const n = parseInt(m[1], 16); return `rgb(${Math.round((n >> 16) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}
function box3d(M, x, y, w, d, h, col, z0 = 0, top, cls = ""){
  const ox = M.vb[0], oy = M.vb[1], X = x - ox, Y = y - oy, f = (l, t, W, H, bg, tr) => `<i class="f ${cls}" style="left:${l}px;top:${t}px;width:${W}px;height:${H}px;background:${bg};transform:${tr}"></i>`;
  if (h <= 0) return "";
  return f(X, Y, w, d, top || shade(col, 1), `translateZ(${z0 + h}px)`)
    + f(X, Y, w, h, shade(col, .9), `translateZ(${z0}px) rotateX(90deg)`)
    + f(X, Y + d, w, h, shade(col, .8), `translateZ(${z0}px) rotateX(90deg)`)
    + f(X, Y, h, d, shade(col, .76), `translateZ(${z0}px) rotateY(-90deg)`)
    + f(X + w, Y, h, d, shade(col, .86), `translateZ(${z0}px) rotateY(-90deg)`);
}
/* Geräte stehen auf dem, was darunter ist: Möbel oder Boden */
function surfaceZ(M, x, y){
  let z = 0;
  for (const [bx, by, w, d, hh, , z0] of M.boxes) if (w > 4 && d > 4 && x >= bx && x <= bx + w && y >= by && y <= by + d) z = Math.max(z, (z0 || 0) + hh);
  return z;
}
function markers3d(ids, dots){
  const night = fx.daylight && (() => { const {rise, set} = sunTimes(), hr = dlHour ?? nowHour(); return hr < rise - .3 || hr > set + .3; })();
  return state.devices.filter(d => onPlan(d) && (ids ? ids.has(floorOf(d)) : floorOf(d) === curFloor) && filtDev(d)).map(d => { const a = appById(d.app), im = appIcon(a, "pimg"); if (dots) return `<span class="m3d dot ${d.inactive ? "inact" : ""} ${outage && circuitOf(d) === outage ? "off" : ""} ${night && isLamp(d) ? "glow" : ""}" data-c="${a.color}" data-id="${d.id}"><i class="head"></i></span>`;
    return `<button class="m3d ${offState(d)} ${d.inactive ? "inact" : ""} ${night && isLamp(d) ? "glow" : ""} ${flashPin === d.id ? "flash" : ""}" data-c="${a.color}" data-act="edit" data-id="${d.id}" aria-label="${esc(d.name)}"><span class="head ${im ? "hasimg" : ""}">${im || icon(d.type)}</span>${showLabels ? `<span class="lbl3">${esc(d.name)}</span>` : ""}</button>`; }).join("");
}
/* Liegt eine Wand zwischen Betrachter und Gerät? Strahl vom Gerät Richtung Kamera gegen alle Wandquader */
function occluded(px, py, pz){
  const rx = cam3d.rx * Math.PI / 180, rz = cam3d.rz * Math.PI / 180;
  const v = [Math.sin(rx) * Math.sin(rz), Math.sin(rx) * Math.cos(rz), Math.cos(rx)], P = [px, py, pz];
  for (const [x0, y0, x1, y1, z0, z1, l] of wallBoxes) {
    const dz = lvlZ(l || 0), lo = [x0, y0, z0 + dz], hi = [x1, y1, z1 + dz];
    let tmin = -Infinity, tmax = Infinity, ok = true;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(v[i]) < 1e-9) { if (P[i] < lo[i] || P[i] > hi[i]) { ok = false; break; } continue; }
      let t1 = (lo[i] - P[i]) / v[i], t2 = (hi[i] - P[i]) / v[i]; if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) { ok = false; break; }
    }
    if (ok && tmin > 2 && tmax > tmin) return true;
  }
  return false;
}
/* Logos liegen über dem 3D-Modell, damit Wände sie nicht verdecken */
function placeMarkers(){
  const st = document.getElementById("s3d"), L = document.getElementById("m3l"); if (!st || !L) return;
  const sr = st.getBoundingClientRect();
  for (const m of L.children) {
    const a = st.querySelector(`.anc[data-id="${m.dataset.id}"]`); if (!a) { m.style.display = "none"; continue; }
    const r = a.getBoundingClientRect(), x = r.left + r.width / 2 - sr.left, y = r.top + r.height / 2 - sr.top;
    m.style.display = ""; m.style.left = x + "px"; m.style.top = y + "px";
    const [px, py, pz] = (a.dataset.p || "0,0,0").split(",").map(Number), behind = occluded(px, py, pz + lvlZ(+a.dataset.l || 0));
    m.classList.toggle("behind", behind);
    m.style.zIndex = (behind ? 5 : 1000) + Math.round(y);
  }
}
let wallBoxes = [], lvlBase = [0], houseGap = 0, houseRoof = true, introHouse = false, houseDevs = false;
const HOUSE_SLAB = 8;
const lvlZ = l => (lvlBase[l] || 0) + (stack3d ? houseGap * l : 0);
const filtDev = d => !planFilter || (planFilter.startsWith("a:") ? appClass(d.app) === planFilter.slice(2) : devGroups(d).includes(planFilter.slice(2)));
const isNight3d = () => fx.daylight && (() => { const {rise, set} = sunTimes(), hr = dlHour ?? nowHour(); return hr < rise - .3 || hr > set + .3; })();
/* Eine Etage: Grundriss, Wände, Möbel, Geräte-Anker. ox/oy = Ursprung der Welt in Plan-Koordinaten */
function levelHtml(M, f, ox, oy, wh, opt = {}){
  const [mx, my, vw, vh] = M.vb, Mo = {vb: [ox, oy]}, L = opt.lvl || 0;
  let h = `<img class="f floor ${opt.pick ? "pick" : ""}" ${opt.pick ? `data-act="stack-pick" data-floor="${f.id}"` : ""} src="${esc(floorUrl(f))}" alt="" draggable="false" style="left:${mx - ox}px;top:${my - oy}px;width:${vw}px;height:${vh}px">`;
  for (const [kind, x1, y1, x2, y2, gaps] of M.walls) {
    const glass = opt.glass && kind === "o", t = kind === "o" ? W_OUT : W_IN, hor = y1 === y2;
    const col = glass ? "rgba(205,222,232,.18)" : "#FBF9F5", top = kind === "o" ? "#131C2B" : "#8C857A", H = glass ? H_FULL : wh;
    const a = hor ? x1 : y1, b = hor ? x2 : y2, gs = [...gaps].sort((p, q) => p[0] - q[0]);
    const seg = (s0, s1, z0, hh) => { if (s1 - s0 <= 0 || hh <= 0) return;
      const bx = hor ? s0 - (s0 === a ? t / 2 : 0) : x1 - t / 2, by = hor ? y1 - t / 2 : s0, bw = hor ? s1 - s0 + (s0 === a ? t / 2 : 0) + (s1 === b ? t / 2 : 0) : t, bd = hor ? t : s1 - s0;
      if (!glass) wallBoxes.push([bx - ox, by - oy, bx - ox + bw, by - oy + bd, z0, z0 + hh, L]);
      h += box3d(Mo, bx, by, bw, bd, hh, col, z0, top, glass ? "wl glass" : "wl"); };
    let cur = a;
    for (const [g0, g1] of gs) { seg(cur, g0, 0, H); if (H > DOOR_H) seg(g0, g1, DOOR_H, H - DOOR_H); cur = g1; }
    seg(cur, b, 0, H);
  }
  M.boxes.forEach(([x, y, w, d, hh, col, z0, top], i) => { if (!(opt.skip || []).includes(i)) h += box3d(Mo, x, y, w, d, hh, col, z0 || 0, top); });
  const night = isNight3d();
  for (const d of state.devices.filter(d => onPlan(d) && floorOf(d) === f.id && filtDev(d))) {
    const px = mx + d.x / 100 * vw, py = my + d.y / 100 * vh, X = px - ox, Y = py - oy, sz = surfaceZ(M, px, py), z = sz + 18;
    if (night && isLamp(d)) h += `<i class="f pool" style="left:${X - 110}px;top:${Y - 110}px;width:220px;height:220px;transform:translateZ(${sz + 1}px)"></i>`;
    h += `<i class="f stick" style="left:${X - .6}px;top:${Y}px;width:1.2px;height:${z}px;transform:rotateX(90deg)"></i>`;
    h += `<i class="f stick" style="left:${X}px;top:${Y - .6}px;width:${z}px;height:1.2px;transform:rotateY(-90deg)"></i>`;
    h += `<i class="f anc" data-id="${d.id}" data-l="${L}" data-p="${X},${Y},${z}" style="left:${X}px;top:${Y}px;transform:translateZ(${z}px)"></i>`;
  }
  return h;
}
function world3d(wh){
  const M = modelFor(curF()); if (!M) return "";
  wallBoxes = []; lvlBase = [0];
  return levelHtml(M, curF(), M.vb[0], M.vb[1], wh);
}
/* ----- Ganzes Haus: Garten als Grundplatte, Etagen darüber, Außenwände und Dach aus Glas ----- */
function houseLevels(){ const fl = state.floors.filter(f => modelFor(f)); const g = fl.find(f => modelFor(f) === MODELS.ga); return {g, rest: fl.filter(f => f !== g)}; }
function canHouse(){ const {g, rest} = houseLevels(); return rest.length >= 1 && (rest.length + (g ? 1 : 0)) >= 2; }
function roofHtml(ox, oy){
  const x0 = 40 - ox, y0 = 40 - oy, W = 530, D = 717, R = 95, half = W / 2, sl = Math.hypot(half, R), th = Math.atan2(R, half) * 180 / Math.PI;
  return `<i class="f glass roof" style="left:${x0}px;top:${y0}px;width:${sl}px;height:${D}px;transform:translateZ(${H_FULL}px) rotateY(${-th}deg)"></i>`
    + `<i class="f glass roof" style="left:${x0 + W - sl}px;top:${y0}px;width:${sl}px;height:${D}px;transform-origin:100% 0;transform:translateZ(${H_FULL}px) rotateY(${th}deg)"></i>`
    + `<i class="f glass gable" style="left:${x0}px;top:${y0}px;width:${W}px;height:${R}px;transform:translateZ(${H_FULL}px) rotateX(90deg)"></i>`
    + `<i class="f glass gable" style="left:${x0}px;top:${y0 + D}px;width:${W}px;height:${R}px;transform:translateZ(${H_FULL}px) rotateX(90deg)"></i>`;
}
function renderHouse(){
  const {g, rest} = houseLevels(), base = g ? MODELS.ga : modelFor(rest[0]), [ox, oy, vw, vh] = base.vb;
  wallBoxes = []; lvlBase = [];
  let lv = "", i = 0;
  if (g) { lvlBase[i] = 0; lv += `<div class="lvl" style="--l:${i};--b:0px">${levelHtml(MODELS.ga, g, ox, oy, 0, {lvl: i, pick: true, skip: [0]})}</div>`; i++; }
  rest.forEach((f, k) => {
    const b = (g ? 1 : 0) + k * (H_FULL + HOUSE_SLAB); lvlBase[i] = b;
    lv += `<div class="lvl" style="--l:${i};--b:${b}px">${levelHtml(modelFor(f), f, ox, oy, wall3d, {lvl: i, pick: true, glass: true})}${k === rest.length - 1 && houseRoof ? roofHtml(ox, oy) : ""}</div>`; i++;
  });
  const ids = new Set([...(g ? [g.id] : []), ...rest.map(f => f.id)]);
  let h = exampleBanner() + `<div class="mapwrap" id="mapwrap">${floorBar()}<div class="sheet">`;
  h += `<div class="s3dbar"><button class="btn small" data-act="stack3d">2D</button><label class="wslider" title="Etagen auseinanderziehen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 12h16M4 19h16"/><path d="M12 7v3M12 14v3"/></svg><input type="range" id="gapH" min="0" max="260" step="5" value="${houseGap}" aria-label="Etagen auseinanderziehen"></label><button class="mb-btn" data-act="house-devs" aria-pressed="${houseDevs}" aria-label="Geräte-Logos zeigen" title="Geräte-Logos zeigen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg></button><button class="mb-btn" data-act="house-roof" aria-pressed="${houseRoof}" aria-label="Dach" title="Dach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg></button><button class="mb-btn" data-act="cam-auto" aria-pressed="${cam3d.auto}" aria-label="Rundflug" title="Rundflug"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/></svg></button><button class="mb-btn" data-act="cam-reset" aria-label="Ansicht zurücksetzen" title="Ansicht zurücksetzen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3"/></svg></button></div>`;
  h += `<div class="s3d house" id="s3d" data-house="1" data-vw="${vw}" data-vh="${vh}"><div class="s3d-cam" id="cam3d"><div class="s3d-world" id="w3d" style="width:${vw}px;height:${vh}px;left:${-vw / 2}px;top:${-vh / 2}px;--gap:${houseGap}px">${lv}</div></div>
  ${fx.daylight ? daylightHtml(true) : ""}<div class="m3layer" id="m3l">${markers3d(ids, !houseDevs)}</div><p class="s3dhint">Etage antippen öffnet sie mit allen Geräten · Regler zieht die Etagen auseinander</p></div></div></div>`;
  return h;
}
function initHouse(){
  applyCam(false);
  const w = document.getElementById("w3d"); if (!w) return;
  if (introHouse || matchMedia("(prefers-reduced-motion: reduce)").matches) { introHouse = true; return; }
  introHouse = true;
  const target = houseGap, from = 240, t0 = performance.now(), D = 1400, rx0 = cam3d.rx;
  const step = t => {
    const ww = document.getElementById("w3d"); if (!ww) { houseGap = target; return; }
    const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
    houseGap = from + (target - from) * e; ww.style.setProperty("--gap", houseGap + "px");
    cam3d.rx = 20 + (rx0 - 20) * e; applyCam(false);
    if (k < 1) requestAnimationFrame(step); else { houseGap = target; cam3d.rx = rx0; applyCam(false); }
  };
  requestAnimationFrame(step);
}
function render3d(){
  const M = modelFor(curF()), [, , vw, vh] = M.vb;
  return `<div class="s3dbar"><button class="btn small" data-act="view3d">2D</button><label class="wslider" title="Wandhöhe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h16M6 20V9h12v11M6 13h12M10 9v4M14 13v7"/></svg><input type="range" id="wallH" min="0" max="${H_FULL}" step="5" value="${wall3d}" aria-label="Wandhöhe"></label><button class="mb-btn" data-act="cam-auto" aria-pressed="${cam3d.auto}" aria-label="Rundflug" title="Rundflug"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/></svg></button><button class="mb-btn" data-act="cam-reset" aria-label="Ansicht zurücksetzen" title="Ansicht zurücksetzen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3"/></svg></button></div>
  <div class="s3d" id="s3d" data-vw="${vw}" data-vh="${vh}"><div class="s3d-cam" id="cam3d"><div class="s3d-world" id="w3d" style="width:${vw}px;height:${vh}px;left:${-vw / 2}px;top:${-vh / 2}px">${world3d(intro3d === curFloor ? wall3d : 0)}</div></div>
  ${fx.daylight ? daylightHtml(true) : ""}<div class="m3layer" id="m3l">${markers3d()}</div><p class="s3dhint">Ein Finger dreht · zwei Finger schieben und zoomen · Gerät antippen öffnet es</p></div>`;
}
function applyCam(smooth){
  const c = document.getElementById("cam3d"), st = document.getElementById("s3d"); if (!c || !st) return;
  const vw = +st.dataset.vw, vh = +st.dataset.vh; if (!vw) return;
  const base = Math.min(st.clientWidth * (st.dataset.house ? .8 : .74) / vw, st.clientHeight * (st.dataset.house ? .95 : .95) / vh);
  const k = base * cam3d.k;
  c.style.transition = smooth ? "transform .6s cubic-bezier(.2,.8,.2,1),left .6s cubic-bezier(.2,.8,.2,1),top .6s cubic-bezier(.2,.8,.2,1)" : "none";
  c.style.left = `calc(50% + ${cam3d.px}px)`; c.style.top = `calc(44% + ${cam3d.py}px)`;
  c.style.transform = `scale(${k}) rotateX(${cam3d.rx}deg) rotateZ(${cam3d.rz}deg)`;
  c.style.setProperty("--rx", cam3d.rx + "deg"); c.style.setProperty("--rz", cam3d.rz + "deg"); c.style.setProperty("--k", k);
  if (smooth) { const t0 = performance.now(); const f = t => { placeMarkers(); if (t - t0 < 700) requestAnimationFrame(f); }; requestAnimationFrame(f); } else placeMarkers();
}
function init3d(){
  applyCam(false);
  if (intro3d === curFloor || matchMedia("(prefers-reduced-motion: reduce)").matches) { intro3d = curFloor; const w = document.getElementById("w3d"); if (w && w.dataset.full !== "1") { w.innerHTML = world3d(wall3d); w.dataset.full = "1"; } placeMarkers(); return; }
  intro3d = curFloor;
  const target = {...cam3d}, t0 = performance.now(), D = 1100, from = {rx: 0, rz: target.rz - 50};
  const step = t => {
    const w = document.getElementById("w3d"); if (!w) return;
    const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
    cam3d.rx = from.rx + (target.rx - from.rx) * e; cam3d.rz = from.rz + (target.rz - from.rz) * e; applyCam(false);
    if (k > .3) { w.innerHTML = world3d(Math.round(wall3d * Math.min(1, (k - .3) / .7))); placeMarkers(); }
    if (k < 1) requestAnimationFrame(step); else { Object.assign(cam3d, {rx: target.rx, rz: target.rz}); w.innerHTML = world3d(wall3d); w.dataset.full = "1"; placeMarkers(); }
  };
  requestAnimationFrame(step);
}
function spin3d(){
  if (!cam3d.auto || !document.getElementById("cam3d")) { cam3d.auto = false; return; }
  cam3d.rz = (cam3d.rz + .25) % 360; applyCam(false); requestAnimationFrame(spin3d);
}
/* Drehen und Zoomen mit Finger oder Maus */
const ptr3 = new Map(); let g3 = null, moved3 = false;
document.addEventListener("pointerdown", e => {
  const st = e.target.closest("#s3d"); if (!st) return;
  ptr3.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (ptr3.size === 1) { moved3 = false; g3 = {x: e.clientX, y: e.clientY, rx: cam3d.rx, rz: cam3d.rz, px: cam3d.px, py: cam3d.py, pan: e.pointerType === "mouse" && (e.shiftKey || e.button === 2)}; }
  else if (ptr3.size === 2) { const [a, b] = [...ptr3.values()]; g3 = {pinch: Math.hypot(a.x - b.x, a.y - b.y), k: cam3d.k, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, px: cam3d.px, py: cam3d.py}; moved3 = true; cam3d.auto = false; }
});
document.addEventListener("pointermove", e => {
  if (!ptr3.has(e.pointerId) || !g3) return;
  ptr3.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (g3.pinch) { const [a, b] = [...ptr3.values()]; if (!b) return;
    cam3d.k = Math.max(.5, Math.min(3.5, g3.k * Math.hypot(a.x - b.x, a.y - b.y) / g3.pinch));
    cam3d.px = g3.px + (a.x + b.x) / 2 - g3.mx; cam3d.py = g3.py + (a.y + b.y) / 2 - g3.my; applyCam(false); return; }
  const dx = e.clientX - g3.x, dy = e.clientY - g3.y;
  if (g3.after2 && Math.hypot(dx, dy) < 30) return;
  if (!moved3 && Math.hypot(dx, dy) < 6) return;
  moved3 = true; cam3d.auto = false;
  if (g3.pan) { cam3d.px = g3.px + dx; cam3d.py = g3.py + dy; applyCam(false); return; }
  cam3d.rz = g3.rz - dx * .35; cam3d.rx = Math.max(0, Math.min(80, g3.rx - dy * .3)); applyCam(false);
});
const end3 = e => { ptr3.delete(e.pointerId); if (!ptr3.size) g3 = null; else if (ptr3.size === 1) { const [a] = [...ptr3.values()]; g3 = {x: a.x, y: a.y, rx: cam3d.rx, rz: cam3d.rz, px: cam3d.px, py: cam3d.py, after2: true}; } };
document.addEventListener("contextmenu", e => { if (e.target.closest("#s3d")) e.preventDefault(); });
document.addEventListener("pointerup", end3); document.addEventListener("pointercancel", end3);
document.addEventListener("click", e => { if (moved3 && e.target.closest("#s3d")) { e.stopPropagation(); e.preventDefault(); moved3 = false; } }, true);
document.addEventListener("wheel", e => { if (!e.target.closest("#s3d")) return; e.preventDefault(); cam3d.k = Math.max(.5, Math.min(3.5, cam3d.k * (e.deltaY < 0 ? 1.1 : .9))); applyCam(false); }, {passive: false});
window.addEventListener("resize", () => applyCam(false));


/* ================= Übersicht ================= */
let homeIdx = false, homeRtAll = false;
const hasVoice = d => allVoice(d).length > 0 || devGroups(d).some(g => (state.groups.find(x => x.id === g)?.voice || []).length);
const MISS = {
  voice: {label: "ohne Sprachbefehl", test: d => !d.noVoice && !hasVoice(d)},
  room:  {label: "ohne Raum", test: d => !d.room},
  plan:  {label: "nicht im Grundriss", test: d => typeof d.x !== "number"},
  circ:  {label: "ohne Sicherung", test: d => !circuitOf(d)},
  link:  {label: "ohne Verbindungsart", test: d => !d.link},
  ip:    {label: "ohne IP-Adresse", test: d => !devNet(d).ip},
  help:  {label: "ohne Störungshilfe", test: d => !hubOf(d) && !(d.help && (d.help.manual || d.help.pair || d.help.reset))},
  bridge:{label: "per Funk, aber ohne Bridge", test: d => isRadio(d) && !bridgeOf(d) && !hubOf(d) && !bridgedBy(d).length},
};
// Konten-Übersicht: Apps mit Geräten, bei denen weder Konto noch Passwort-Ort eingetragen ist
function accountsMissing(){
  return sortedApps().filter(a => a.id !== "other" && state.devices.some(d => !d.inactive && appClass(d.app) === a.id) && !((state.accounts[a.id] || {}).acc || (state.accounts[a.id] || {}).pw));
}
// Inaktive Geräte zählen nirgends als „fehlt noch“
for (const k in MISS) { const t = MISS[k].test; MISS[k].test = d => !d.inactive && t(d); }
function homeIndex(){
  const D = state.devices.filter(d => !d.inactive), n = D.length || 1;
  const parts = [["plan", "Im Grundriss"], ["room", "Raum"], ["circ", "Sicherung"], ["link", "Verbindung"], ["voice", "Sprachbefehl"]]
    .map(([k, l]) => ({k, l, ok: D.filter(d => !MISS[k].test(d)).length}));
  return {pct: Math.round(parts.reduce((a, p) => a + p.ok / n, 0) / parts.length * 100), parts, n: D.length};
}
function renderHome(){
  const D = state.devices.filter(d => !d.inactive), nInact = state.devices.length - D.length, hr = new Date().getHours(), {rise, set} = sunTimes(), nowH = nowHour(), day = nowH >= rise && nowH <= set;
  const greet = hr < 5 ? "Gute Nacht" : hr < 11 ? "Guten Morgen" : hr < 18 ? "Guten Tag" : hr < 22 ? "Guten Abend" : "Gute Nacht";
  const lamps = D.filter(isLamp).length;
  let h = exampleBanner();
  h += `<section class="hm-hello ${day ? "day" : "night"}"><span class="hm-sun" aria-hidden="true"></span>${day ? "" : [[62, 18], [70, 44], [80, 26], [55, 34], [88, 52]].map(([x, y], i) => `<i class="hm-star" style="left:${x}%;top:${y}%;--i:${i}"></i>`).join("")}<h2>${greet}</h2><p>Sonnenaufgang ${fmtH(rise)} · Sonnenuntergang ${fmtH(set)}</p><p class="hm-sub">${D.length} ${D.length === 1 ? "Gerät" : "Geräte"} in ${new Set(D.map(d => d.room).filter(Boolean)).size} Räumen${nInact ? ` · ${nInact} inaktiv` : ""}${!day && lamps ? ` · ${lamps} Lampen leuchten im Grundriss` : ""}</p></section>`;
  const I = homeIndex(), C = 97.4, dash = (I.pct / 100 * C).toFixed(1);
  h += `<button class="hm-card hm-score" data-act="home-index" aria-expanded="${homeIdx}"><svg class="hm-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="#1F5FAF" stroke-width="5" stroke-dasharray="${dash} ${C}" transform="rotate(-90 18 18)"/><text x="18" y="21.3" text-anchor="middle" font-size="8.5" font-weight="800" fill="currentColor">${I.pct}%</text></svg>
    <span><b>Smart-Home-Index</b><small>Wie vollständig dein Haus dokumentiert ist. ${homeIdx ? "" : "Tippen für Details."}</small></span></button>`;
  if (homeIdx) h += `<div class="hm-card hm-parts">${I.parts.map(p => `<button class="hm-prow" data-act="home-miss" data-k="${p.k}" ${p.ok === I.n ? "disabled" : ""}><span>${p.l}</span><em>${p.ok} / ${I.n}</em><span class="hm-bar"><i style="width:${I.n ? p.ok / I.n * 100 : 0}%;background:${p.ok === I.n ? "var(--ok,#3D8B5A)" : p.ok / I.n < .3 ? "#C8361D" : "#D08A1E"}"></i></span></button>`).join("")}</div>`;
  if (state.floors.length) {
    const max = Math.max(1, ...state.floors.map(f => D.filter(d => typeof d.x === "number" && floorOf(d) === f.id).length));
    h += `<div class="hm-floors" style="--n:${Math.min(3, state.floors.length)}">${state.floors.map(f => { const c = D.filter(d => typeof d.x === "number" && floorOf(d) === f.id).length;
      return `<button class="hm-fl" data-act="home-floor" data-floor="${f.id}"><span>${esc(f.name)}</span><b>${c}</b><span class="hm-mini"><i style="width:${c / max * 100}%"></i></span></button>`; }).join("")}</div>`;
  }
  const ic = {
    where: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M9 9h6v6H9z"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>'};
  h += `<div class="hm-acts">
    <button class="hm-act" data-act="home-where">${ic.where}Wo ist …?</button>
    ${state.wifi?.ssid ? `<button class="hm-act" data-act="wifi-show"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>WLAN</button>` : ""}
    <label class="hm-act">${ic.scan}Scannen<input type="file" id="qrFile2" accept="image/*" capture="environment"></label>
    ${(state.circuits || []).length ? `<button class="hm-act" data-act="home-out">${ic.out}Strom&shy;ausfall</button>` : ""}
    ${canHouse() || stackFloors().length > 1 ? `<button class="hm-act" data-act="home-3d">${ic.cube}Haus 3D</button>` : ""}</div>`;
  { const nv = state.devices.filter(d => !d.inactive).reduce((a, d) => a + allVoice(d).length, 0) + state.groups.reduce((a, g) => a + (g.voice || []).length, 0) + state.routines.filter(r => r.trigger?.kind === "voice" && r.trigger.value).length;
    if (nv || state.routines.length) h += `<button class="hm-card hm-cmds" data-act="open-cmds"><span class="hm-cmdico">${micIcon}</span><span><b>Spickzettel</b><small>${nv} Sprachbefehle · ${state.routines.length} Routinen</small></span><svg class="hm-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>`; }
  const today = routinesToday();
  if (state.routines.length) {
    const up = today.filter(x => !x.past), past = today.filter(x => x.past), other = state.routines.filter(r => r.on !== false && routineHour(r) == null);
    const row = x => `<button class="hm-rt ${x.past ? "past" : ""}" data-act="open-routine" data-r="${x.r.id}"><span class="hm-rtt">${fmtH(x.h)}</span><span class="hm-rtn">${rtIcon(x.r)}${esc(x.r.name)}</span><em>${x.past ? "erledigt" : x.next ? "als Nächstes" : ""}</em></button>`;
    const shown = homeRtAll ? [...up, ...past] : up.slice(0, 4);
    h += `<section class="hm-card"><p class="hm-lbl">Routinen heute · ${today.length} mit Uhrzeit</p>`;
    h += shown.length ? shown.map(row).join("") : `<p class="hm-done">${today.length ? "Für heute ist alles gelaufen." : "Heute ist keine Routine mit Uhrzeit geplant."}</p>`;
    if (homeRtAll && other.length) h += `<p class="hm-lbl hm-sub2">Auf Zuruf oder bei Bewegung</p>` + other.map(r => `<button class="hm-rt" data-act="open-routine" data-r="${r.id}"><span class="hm-rtt">${rtIcon(r)}</span><span class="hm-rtn">${esc(r.name)}</span><em class="muted">${esc(trigText(r))}</em></button>`).join("");
    const hidden = homeRtAll ? 0 : (up.length - shown.length) + past.length + other.length;
    h += `<button class="hm-more" data-act="home-rt-all">${homeRtAll ? "Weniger anzeigen" : `Alle ${state.routines.length} Routinen anzeigen${hidden ? ` (${hidden} weitere)` : ""}`}</button></section>`;
  }
  const todos = [["voice", "#C8361D"], ["plan", "#C8361D"], ["room", "#D08A1E"], ["circ", "#D08A1E"], ["link", "#D08A1E"], ["bridge", "#D08A1E"], ["help", "#8A857C"], ["ip", "#8A857C"]]
    .map(([k, c]) => ({k, c, n: D.filter(MISS[k].test).length})).filter(t => t.n);
  { const ck = routineChecks().filter(c => c.lvl !== "info"); if (ck.length) todos.unshift({k: "_rt", c: "#C8361D", n: ck.length}); }
  { const ty = typoFindings().length; if (ty && !readOnly) todos.unshift({k: "_typo", c: "#D08A1E", n: ty}); }
  { const am = readOnly ? [] : accountsMissing(); if (am.length) todos.push({k: "_acc", c: "#8A857C", n: am.length}); }
  { const bd = BOX.backupOk() ? 0 : backupAge(); if (!readOnly && (bd == null || bd > 30)) todos.unshift({k: "_bk", c: bd == null ? "#C8361D" : "#D08A1E", n: bd == null ? "!" : bd}); }
  h += `<section class="hm-card"><p class="hm-lbl">Zu erledigen</p>${todos.length ? `<div class="hm-todo">${todos.map(t => t.k === "_bk" ? `<button data-act="home-backup"><span class="hm-pill" style="background:${t.c}">${t.n === "!" ? "!" : t.n + " T"}</span><span class="hm-t">${t.n === "!" ? "Noch keine Datensicherung" : `Letzte Datensicherung vor ${t.n} Tagen`}</span><em>sichern</em></button>` : t.k === "_typo" ? `<button data-act="typo-open"><span class="hm-pill" style="background:${t.c}">${t.n}</span><span class="hm-t">${t.n === 1 ? "möglicher Tippfehler" : "mögliche Tippfehler"}</span><em>prüfen</em></button>` : t.k === "_acc" ? `<button data-act="home-acc" data-sec="Konten"><span class="hm-pill" style="background:${t.c}">${t.n}</span><span class="hm-t">${t.n === 1 ? "App" : "Apps"} ohne Konto-Eintrag</span><em>eintragen</em></button>` : t.k === "_rt" ? `<button data-act="home-rtcheck"><span class="hm-pill" style="background:${t.c}">${t.n}</span><span class="hm-t">${t.n === 1 ? "Routine prüfen" : "Routinen-Konflikte prüfen"}</span><em>ansehen</em></button>` : `<button data-act="home-miss" data-k="${t.k}"><span class="hm-pill" style="background:${t.c}">${t.n}</span><span class="hm-t">${t.n === 1 ? "Gerät" : "Geräte"} ${esc(MISS[t.k].label)}</span><em>${t.k === "ip" ? "optional" : t.k === "help" ? "eintragen" : "ansehen"}</em></button>`).join("")}</div>` : `<p class="hm-done">Alles erledigt. Jedes Gerät ist vollständig eingetragen.</p>`}</section>`;
  const rc = roomsInUse().map(r => [r, D.filter(d => d.room === r).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (rc.length) h += `<section class="hm-card"><p class="hm-lbl">Am meisten los</p>${rc.map(([r, c]) => `<button class="hm-prow" data-act="home-room" data-room="${esc(r)}"><span>${esc(r)}</span><em>${c}</em><span class="hm-bar"><i style="width:${c / rc[0][1] * 100}%;background:#1F5FAF"></i></span></button>`).join("")}</section>`;
  return h;
}


/* ================= Gesten ================= */
const TABS = ["home", "stats", "list", "plan", "rooms"];
function goTab(dir){
  const i = TABS.indexOf(view); if (i < 0) return; const n = TABS[i + dir]; if (!n) { buzz(6); return; }
  view = n; placingId = ""; planMenu = false;
  try { localStorage.setItem(LS + "-tab", view); } catch(_){}
  render(); window.scrollTo(0, 0); buzz(8);
  const se = document.scrollingElement; if (se) se.scrollLeft = 0; document.body.scrollLeft = 0;
  const v = document.getElementById("view"); v.addEventListener("animationend", () => { v.classList.remove("sw-l", "sw-r"); if (se) se.scrollLeft = 0; }, {once: true}); v.classList.remove("sw-l", "sw-r"); void v.offsetWidth; v.classList.add(dir > 0 ? "sw-l" : "sw-r");
}
function goFloor(dir){
  const i = state.floors.findIndex(f => f.id === curFloor), n = state.floors[i + dir]; if (!n) { buzz(6); return; }
  curFloor = n.id; view3d = view3d && !!modelFor(n); try { localStorage.setItem(LS + "-floor", curFloor); } catch(_){}
  render(); buzz(8);
  const c = document.getElementById("canvas") || document.getElementById("s3d"); c?.classList.add(dir > 0 ? "sw-l" : "sw-r");
}
let sw = null, lp = null, lastTap = {t: 0, x: 0, y: 0}, lpFired = false;
document.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) { sw = null; clearTimeout(lp); return; }
  const t = e.touches[0], tg = e.target;
  sw = {x: t.clientX, y: t.clientY, t: Date.now(), tg};
  // Lange drücken auf ein Gerät in der Liste: im Grundriss zeigen
  clearTimeout(lp); lpFired = false;
  const row = tg.closest(".rowmain, .tile");
  if (row && view === "list") {
    const id = row.dataset.id || row.querySelector("[data-id]")?.dataset.id;
    lp = setTimeout(() => { const d = state.devices.find(x => x.id === id); if (d && typeof d.x === "number") { lpFired = true; buzz([15, 40, 15]); findOnPlan(d); } }, 550);
  }
}, {passive: true});
document.addEventListener("touchmove", e => {
  if (!sw) return; const t = e.touches[0];
  if (Math.hypot(t.clientX - sw.x, t.clientY - sw.y) > 10) clearTimeout(lp);
  // Editor nach unten wischen zum Schließen
  const pnl = sw.tg.closest?.(".panel");
  if (pnl && pnl.scrollTop <= 0 && t.clientY - sw.y > 0 && Math.abs(t.clientX - sw.x) < 40) pnl.style.transform = `translateY(${Math.min(200, t.clientY - sw.y) * .6}px)`;
}, {passive: true});
document.addEventListener("click", e => { if (lpFired) { e.preventDefault(); e.stopPropagation(); lpFired = false; } }, true);
document.addEventListener("touchend", e => {
  clearTimeout(lp);
  if (!sw) return;
  const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y, dt = Date.now() - sw.t, tg = sw.tg; sw = null;
  const pnl = tg.closest?.(".panel");
  if (pnl) { if (dy > 110 && Math.abs(dx) < 60 && pnl.scrollTop <= 0) { if (pnl.closest("#rmodal")) { if (gmId) { gmId = ""; renderMembers(); } else if (typoOpen) { typoOpen = false; renderTypo(); } else if (rdraft) { rdraft = null; renderRoutine(); } else document.getElementById("rmodal").innerHTML = ""; } else { draft = null; renderEditor(); } buzz(8); } else pnl.style.transform = ""; return; }
  if (drag || tg.closest?.(".overlay, #bxsheet, .bxfan")) return;
  // Doppeltippen
  if (Math.hypot(dx, dy) < 12 && dt < 250) {
    const now = Date.now(), dbl = now - lastTap.t < 320 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30;
    lastTap = {t: dbl ? 0 : now, x: t.clientX, y: t.clientY};
    if (dbl && tg.closest?.("#s3d") && !tg.closest(".m3d")) { camHome(); applyCam(true); buzz(8); return; }
    if (dbl && tg.closest?.("#canvas") && !tg.closest(".pin, .pgrp, .sunb") && !placingId && !editMode) {
      const w = document.getElementById("cwrap"), r = w.getBoundingClientRect();
      const fx0 = (w.scrollLeft + t.clientX - r.left) / w.scrollWidth, fy0 = (w.scrollTop + t.clientY - r.top) / w.scrollHeight;
      zoom = zoom > 1 ? 1 : 2; render(); buzz(8);
      const w2 = document.getElementById("cwrap"); if (w2) { w2.scrollLeft = fx0 * w2.scrollWidth - w2.clientWidth / 2; w2.scrollTop = fy0 * w2.scrollHeight - w2.clientHeight / 2; }
      return;
    }
    return;
  }
  // Wischen zur Seite
  if (dt > 700 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
  if (tg.closest?.("input, select, textarea, .fbar, .fpanel, .chips, .acc-scroll, #s3d, .stack3d, .mb-menu")) return;
  const dir = dx < 0 ? 1 : -1;
  if (view === "plan" && tg.closest?.("#canvas")) { if (zoom === 1 && !editMode && !placingId && state.floors.length > 1) goFloor(dir); return; }
  if (tg.closest?.(".canvaswrap")) return;
  goTab(dir);
}, {passive: true});


/* ================= Routinen ================= */
let rdraft = null;
const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const TRIG = {voice: "Sprachbefehl", time: "Uhrzeit", sunset: "Sonnenuntergang", sunrise: "Sonnenaufgang", device: "Gerät / Sensor", manual: "Von Hand"};
const RT_ICONS = {
  voice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  sunset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 4v4M9.5 7.5L12 10l2.5-2.5"/></svg>',
  sunrise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 10V4M9.5 6.5L12 4l2.5 2.5"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></svg>',
  manual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5a2 2 0 0 1 4 0v6M13 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2-4a2 2 0 0 1 3-2l1 1"/></svg>'};
const rtIcon = r => `<span class="rti">${RT_ICONS[r.trigger?.kind] || RT_ICONS.manual}</span>`;
const routinesOf = id => state.routines.filter(r => (r.devices || []).includes(id));
const sortedRoutines = () => [...state.routines].sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}));
function dayText(r){ const ds = r.days || []; if (!ds.length || ds.length === 7) return "täglich"; if (ds.join() === "1,2,3,4,5") return "Mo–Fr"; if (ds.join() === "0,6") return "Sa, So"; return [1,2,3,4,5,6,0].filter(d => ds.includes(d)).map(d => DAYS[d]).join(", "); }
function trigText(r){
  const t = r.trigger || {}, v = t.value || "";
  if (t.kind === "voice") return v ? `„${v}“` : "Sprachbefehl";
  if (t.kind === "time") return `${v || "--:--"} Uhr, ${dayText(r)}`;
  if (t.kind === "sunset" || t.kind === "sunrise") { const o = +v || 0; return `${TRIG[t.kind]}${o ? ` ${o > 0 ? "+" : "−"}${Math.abs(o)} Min.` : ""}, ${dayText(r)}`; }
  if (t.kind === "device") { const d = state.devices.find(x => x.id === v); return d ? `wenn ${d.name} auslöst` : "Gerät / Sensor"; }
  return "von Hand";
}
function routineHour(r, date){
  const t = r.trigger || {};
  if (t.kind === "time" && /^\d{1,2}:\d{2}$/.test(t.value || "")) { const [hh, mm] = t.value.split(":").map(Number); return hh + mm / 60; }
  if (t.kind === "sunset" || t.kind === "sunrise") { const st = sunTimes(date); return (t.kind === "sunset" ? st.set : st.rise) + (+t.value || 0) / 60; }
  return null;
}
/* ----- Routinen prüfen: Widersprüche, Doppelungen, wechselnde Reihenfolge übers Jahr ----- */
function rtDir(r){
  const test = txt => { const t = " " + (txt || "").toLowerCase().replace(/[^a-zäöüß0-9 ]/g, " ") + " ";
    const off = /\s(aus|ausschalten|abschalten|stopp|stop|beenden)\s/.test(t), on = /\s(an|ein|einschalten|anschalten|start|starten|laden)\s/.test(t);
    return off && !on ? "aus" : on && !off ? "an" : null; };
  return test(r.action) || test(r.name);
}
/* Laufzeit aus dem Text lesen: „für 1,5 Stunden“, „von 6.30 bis 23 Uhr“, „zwischen 7 und 22 Uhr“ */
const parseClock = s => { const m = String(s).match(/^(\d{1,2})(?:[.:](\d{2}))?$/); return m && +m[1] < 25 ? +m[1] + (+(m[2] || 0)) / 60 : null; };
function rtWindow(r, h){
  const t = (r.action || "") + " " + (r.name || "");
  const vb = t.match(/(?:von|zwischen)\s+(\d{1,2}(?:[.:]\d{2})?)\s*(?:uhr)?\s+(?:bis|und)\s+(\d{1,2}(?:[.:]\d{2})?)/i);
  if (vb) { const a = parseClock(vb[1]), b = parseClock(vb[2]); if (a != null && b != null) return {from: a, to: b}; }
  const du = t.match(/(\d+(?:[.,]\d+)?)\s*(stunden|stunde|std|minuten|min)/i);
  if (du && h != null) { const n = parseFloat(du[1].replace(",", ".")), hrs = /^min/i.test(du[2]) ? n / 60 : n; return {from: h, to: h + hrs, dur: hrs}; }
  return null;
}
const inWin = (t, w) => { const to = w.to < w.from ? w.to + 24 : w.to, tt = t < w.from ? t + 24 : t; return tt > w.from + 1 / 60 && tt < to - 1 / 60; };
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
function routineChecks(){
  const out = [], act = state.routines.filter(r => r.on !== false), devName = id => state.devices.find(d => d.id === id)?.name;
  const daysOverlap = (a, b) => { const A = (a.days || []).length ? a.days : [0,1,2,3,4,5,6], B = (b.days || []).length ? b.days : [0,1,2,3,4,5,6]; return A.some(d => B.includes(d)); };
  const sample = []; { const y = new Date().getFullYear(); for (let m = 0; m < 12; m++) for (const dd of [1, 15]) sample.push(new Date(y, m, dd, 12)); }
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
    const A = act[i], B = act[j], shared = (A.devices || []).filter(id => (B.devices || []).includes(id));
    if (!shared.length || !daysOverlap(A, B)) continue;
    const names = shared.map(devName).filter(Boolean), dev = names.length > 2 ? `${names.slice(0, 2).join(", ")} und ${names.length - 2} weitere` : names.join(" und ");
    const dA = rtDir(A), dB = rtDir(B), opp = dA && dB && dA !== dB;
    const tA = sample.map(d => routineHour(A, d)), tB = sample.map(d => routineHour(B, d));
    if (tA[0] != null && tB[0] != null) {
      const diffs = tA.map((h, k) => h - tB[k]), close = diffs.map(x => Math.abs(x) * 60 <= 5);
      if (close.some(Boolean)) {
        const allYear = close.every(Boolean);
        out.push({lvl: opp ? "bad" : "warn", ids: [A.id, B.id], title: opp ? "Gleichzeitig an und aus" : "Doppelt zur selben Zeit",
          text: `${dev}: „${A.name}“ und „${B.name}“ laufen ${allYear ? "" : "zeitweise "}fast gleichzeitig${opp ? ", eine schaltet an, die andere aus. Welche gewinnt, ist Zufall." : "."}`});
      } else if (opp && diffs.some(x => x > 0) && diffs.some(x => x < 0)) {
        const flip = sample.filter((d, k) => Math.sign(diffs[k]) !== Math.sign(diffs[0])).map(d => d.getMonth());
        const mons = [...new Set(flip)].map(m => MONTHS[m]);
        out.push({lvl: "bad", ids: [A.id, B.id], title: "Reihenfolge kippt im Jahr",
          text: `${dev}: „${A.name}“ und „${B.name}“ tauschen ${mons.length ? `in ${mons[0]}${mons.length > 1 ? "–" + mons[mons.length - 1] : ""}` : "zeitweise"} die Reihenfolge, weil eine an der Sonne hängt. Dann schaltet „${dA === "aus" ? A.name : B.name}“ aus, bevor eingeschaltet wurde.`});
      }
    }
    if (A.trigger?.kind === "device" && B.trigger?.kind === "device" && A.trigger.value === B.trigger.value && opp)
      out.push({lvl: "info", ids: [A.id, B.id], title: "Gegenstücke am selben Sensor", text: `„${A.name}“ und „${B.name}“ hängen am selben Auslöser und schalten ${dev} gegensätzlich. Das ist meist so gewollt (an bei Bewegung, aus ohne Bewegung).`});
  }
  // Laufzeiten: ein „aus“ mitten in einer Zeit, in der ein Gerät laufen soll
  const wins = [];
  for (const A of act) {
    const hA = routineHour(A), w = rtWindow(A, hA);
    if (w) wins.push({r: A, w, devs: A.devices || [], free: hA == null});
    if (hA != null && rtDir(A) === "an" && !w) {   // Paar „an“ → nächstes „aus“ fürs selbe Gerät
      let best = null;
      for (const B of act) { if (B === A || rtDir(B) !== "aus") continue; const hB = routineHour(B); if (hB == null) continue;
        if (!(B.devices || []).some(id => (A.devices || []).includes(id))) continue;
        const d = (hB - hA + 24) % 24; if (!best || d < best.d) best = {B, d, hB}; }
      if (best) wins.push({r: A, w: {from: hA, to: best.hB}, devs: A.devices || [], closer: best.B.id});
    }
  }
  for (const W of wins) for (const C of act) {
    if (C === W.r || C.id === W.closer || rtDir(C) !== "aus") continue;
    const hC = routineHour(C); if (hC == null || !daysOverlap(W.r, C)) continue;
    const shared = (C.devices || []).filter(id => W.devs.includes(id)); if (!shared.length) continue;
    const dev = shared.map(devName).filter(Boolean).join(", ");
    if (W.free) {
      if (W.w.dur) out.push({lvl: "info", ids: [W.r.id, C.id], title: "Kann abgebrochen werden", text: `„${W.r.name}“ läuft ${String(+W.w.dur.toFixed(2)).replace(".", ",")} Std. Startest du sie weniger als diese Zeit vor ${fmtH(hC)}, schaltet „${C.name}“ ${dev} vorzeitig aus.`});
    } else if (inWin(hC, W.w)) out.push({lvl: "bad", ids: [W.r.id, C.id], title: "Schaltet mitten in der Laufzeit aus",
      text: `${dev} soll von ${fmtH(W.w.from)} bis ${fmtH(W.w.to)} laufen („${W.r.name}“), aber „${C.name}“ schaltet um ${fmtH(hC)} aus.`});
  }
  // gleicher Sprachbefehl mehrfach oder gleich wie ein Gerätebefehl
  const norm = v => (v || "").toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
  const vr = act.filter(r => r.trigger?.kind === "voice" && r.trigger.value);
  for (let i = 0; i < vr.length; i++) for (let j = i + 1; j < vr.length; j++) if (norm(vr[i].trigger.value) === norm(vr[j].trigger.value))
    out.push({lvl: "bad", ids: [vr[i].id, vr[j].id], title: "Gleicher Sprachbefehl", text: `„${vr[i].trigger.value}“ startet zwei Routinen: „${vr[i].name}“ und „${vr[j].name}“.`});
  for (const r of vr) { const hit = state.devices.find(d => allVoice(d).some(v => norm(v) === norm(r.trigger.value)));
    if (hit) out.push({lvl: "info", ids: [r.id], title: "Befehl doppelt belegt", text: `„${r.trigger.value}“ ist auch der Befehl für das Gerät „${hit.name}“. Alexa führt dann die Routine „${r.name}“ aus. Wenn das so gewollt ist, passt es.`}); }
  for (const r of act) {
    const miss = (r.devices || []).filter(id => !devName(id));
    if (miss.length) out.push({lvl: "warn", ids: [r.id], title: "Gerät fehlt", text: `„${r.name}“ enthält ${miss.length === 1 ? "ein gelöschtes Gerät" : miss.length + " gelöschte Geräte"}.`});
    if (!(r.devices || []).length) out.push({lvl: "info", ids: [r.id], title: "Keine Geräte", text: `„${r.name}“ hat noch keine Geräte eingetragen.`});
  }
  const ord = {bad: 0, warn: 1, info: 2}; return out.sort((a, b) => ord[a.lvl] - ord[b.lvl]);
}
function checksHtml(list){
  const lab = {bad: "Konflikt", warn: "Prüfen", info: "Hinweis"};
  if (!list.length) return `<div class="roomrow"><span class="n">Keine Konflikte gefunden. Die Routinen kommen sich nicht in die Quere.</span></div>`;
  return list.map(c => `<div class="roomrow ckrow ck-${c.lvl}"><span class="ckl">${lab[c.lvl]}</span><span class="ckx"><b>${esc(c.title)}</b><small>${esc(c.text)}</small><span class="gpick">${c.ids.map(id => { const r = state.routines.find(x => x.id === id); return r ? `<button class="rchip" data-act="open-routine" data-r="${id}">${rtIcon(r)}${esc(r.name)}</button>` : ""; }).join("")}</span></span></div>`).join("");
}
function routinesToday(){
  const dow = new Date().getDay(), now = nowHour();
  const list = state.routines.filter(r => r.on !== false && (!(r.days || []).length || r.days.includes(dow))).map(r => ({r, h: routineHour(r)})).filter(x => x.h != null).sort((a, b) => a.h - b.h);
  let nextSet = false;
  for (const x of list) { x.past = x.h < now; if (!x.past && !nextSet) { x.next = true; nextSet = true; } }
  return list;
}
function openRoutine(id){
  const r = id && state.routines.find(x => x.id === id);
  rdraft = r ? JSON.parse(JSON.stringify(r)) : {id: uid(), name: "", app: (state.apps.find(a => /alexa/i.test(a.name)) || state.apps[0] || {}).id || "other", trigger: {kind: "voice", value: ""}, days: [], devices: [], action: "", note: "", on: true, _new: true};
  renderRoutine();
}
function renderRoutine(){
  const m = document.getElementById("rmodal");
  if (!rdraft) { closeSheet(m); return; }
  const R = rdraft, k = R.trigger.kind, v = R.trigger.value || "";
  const sel = new Set(R.devices || []);
  const devs = [...state.devices].sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || (a.room || "").localeCompare(b.room || "", "de") || a.name.localeCompare(b.name, "de", {numeric: true}));
  let val = "";
  if (k === "voice") val = `<div class="field"><label for="rt-val">Sprachbefehl</label><input id="rt-val" value="${esc(v)}" placeholder="Alexa, Fernsehabend"></div>`;
  if (k === "time") val = `<div class="field"><label for="rt-val">Uhrzeit</label><input id="rt-val" type="time" value="${esc(v)}"></div>`;
  if (k === "sunset" || k === "sunrise") { const o = +v || 0, neg = o < 0 || (o === 0 && R._sign === -1);
    val = `<div class="field"><label for="rt-off">Versatz</label><div class="rtoff"><input id="rt-off" type="text" inputmode="numeric" pattern="[0-9]*" value="${Math.abs(o) || ""}" placeholder="0"><span>Minuten</span><span class="gpick"><button type="button" class="rchip" data-act="rt-sign" data-s="-1" aria-pressed="${neg}">vorher</button><button type="button" class="rchip" data-act="rt-sign" data-s="1" aria-pressed="${!neg}">nachher</button></span></div></div>`; }
  if (k === "device") val = `<div class="field"><label for="rt-val">Auslösendes Gerät</label><select id="rt-val"><option value="">Gerät wählen</option>${[...state.devices].sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).map(d => `<option value="${d.id}" ${d.id === v ? "selected" : ""}>${esc(d.name)}${d.room ? " · " + esc(d.room) : ""}</option>`).join("")}</select></div>`;
  const dayPick = ["time", "sunset", "sunrise"].includes(k) ? `<div class="field"><label>Tage <small class="muted">(nichts gewählt = täglich)</small></label><div class="gpick">${[1,2,3,4,5,6,0].map(d => `<button type="button" class="rchip dchip" data-act="rt-day" data-d="${d}" aria-pressed="${(R.days || []).includes(d)}">${DAYS[d]}</button>`).join("")}</div></div>` : "";
  m.innerHTML = `<div class="overlay" data-act="rclose-bg"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="rt-h">
    <h2 id="rt-h">${R._new ? "Neue Routine" : "Routine bearbeiten"}</h2>
    <form class="form" id="rtForm">
      <div class="field"><label for="rt-name">Name</label><input id="rt-name" required value="${esc(R.name)}" placeholder="z. B. Abendlicht"></div>
      <div class="field"><label for="rt-app">Läuft in</label><select id="rt-app">${sortedApps().map(a => `<option value="${a.id}" ${appClass(R.app) === a.id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Auslöser</label><div class="gpick">${Object.entries(TRIG).map(([kk, l]) => `<button type="button" class="rchip" data-act="rt-trig" data-k="${kk}" aria-pressed="${kk === k}">${RT_ICONS[kk].replace("<svg", '<svg class="rcsvg"')}${l}</button>`).join("")}</div></div>
      ${val}${dayPick}
      <div class="field"><label for="rt-filter">Geräte <small class="muted" id="rt-cnt">${sel.size} gewählt</small></label>${state.groups.length ? `<div class="gpick rtgrps">${state.groups.map(g => { const ids = state.devices.filter(d => devGroups(d).includes(g.id)).map(d => d.id); return `<button type="button" class="rchip" data-act="rt-grp" data-ids="${ids.join(",")}" aria-pressed="${ids.length > 0 && ids.every(id => sel.has(id))}">${groupIcon}${esc(g.name)} <span class="muted">${ids.length}</span></button>`; }).join("")}</div>` : ""}<input id="rt-filter" type="search" placeholder="Gerät suchen"><div class="rtdevs">${devs.map(d => `<label class="rtdev" data-s="${esc((d.name + " " + (d.room || "")).toLowerCase())}"><input type="checkbox" class="rt-d" value="${d.id}" ${sel.has(d.id) ? "checked" : ""}><span>${esc(d.name)}<small>${esc(d.room || "Ohne Raum")}</small></span></label>`).join("")}</div></div>
      <div class="field"><label for="rt-action">Was passiert</label><textarea id="rt-action" rows="4" placeholder="z. B.&#10;Fernsehschrank Licht an&#10;Stehlampe auf 30 % dimmen&#10;Szene Kino starten">${esc(R.action || "")}</textarea></div>
      <div class="field"><label for="rt-note">Notiz</label><input id="rt-note" value="${esc(R.note || "")}" placeholder="optional"></div>
      <label class="lampopt"><input type="checkbox" id="rt-on" ${R.on !== false ? "checked" : ""}><span>Aktiv<small>Pausierte Routinen erscheinen nicht unter „Routinen heute“</small></span></label>
      ${R._del ? `<div class="confirm">„${esc(R.name)}“ wirklich löschen? <button type="button" class="btn small danger" data-act="rt-del-yes">Löschen</button><button type="button" class="btn small" data-act="rt-del-no">Abbrechen</button></div>` : ""}
      <div class="actions">${R._new ? "" : `<button type="button" class="btn danger" data-act="rt-del">Löschen</button>`}
        <div class="r">${openBtn(R.app)}<button type="button" class="btn" data-act="rclose">Abbrechen</button><button class="btn primary">Speichern</button></div></div>
    </form></div></div>`;
}
document.addEventListener("change", e => { if (e.target.classList?.contains("rt-d")) { const c = document.getElementById("rt-cnt"); if (c) c.textContent = document.querySelectorAll(".rt-d:checked").length + " gewählt"; } });
function readRoutine(){
  if (!rdraft) return;
  const g = id => document.getElementById(id);
  rdraft.name = g("rt-name")?.value.trim() ?? rdraft.name;
  rdraft.app = g("rt-app")?.value || rdraft.app;
  if (g("rt-val")) rdraft.trigger.value = g("rt-val").value.trim();
  if (g("rt-off")) { const n = parseInt(g("rt-off").value.replace(/\D/g, ""), 10) || 0, neg = document.querySelector('[data-act="rt-sign"][data-s="-1"]')?.getAttribute("aria-pressed") === "true"; rdraft._sign = neg ? -1 : 1; rdraft.trigger.value = String(neg ? -n : n); }
  rdraft.devices = [...document.querySelectorAll(".rt-d:checked")].map(x => x.value);
  rdraft.action = g("rt-action")?.value.trim() || "";
  rdraft.note = g("rt-note")?.value.trim() || "";
  rdraft.on = !!g("rt-on")?.checked;
}
function commitRoutine(){
  readRoutine();
  if (!rdraft.name) { document.getElementById("rt-name").focus(); toast("Bitte gib der Routine einen Namen."); return; }
  const {_new, _del, _sign, ...r} = rdraft;
  const i = state.routines.findIndex(x => x.id === r.id);
  if (i >= 0) state.routines[i] = r; else state.routines.push(r);
  rdraft = null; renderRoutine(); save(); render(); buzz(10); showCheck();
  toast(_new ? "Routine angelegt" : "Routine gespeichert");
}


/* ================= Gruppenmitglieder wählen ================= */
let gmId = "";
function openMembers(g){ gmId = g; renderMembers(); }
function renderMembers(){
  const m = document.getElementById("rmodal");
  if (!gmId) { closeSheet(m); return; }
  const G0 = state.groups.find(g => g.id === gmId) || {}, auto = new Set(G0.autoTypes || []);
  const sel = new Set(state.devices.filter(d => (d.groups || []).includes(gmId) || auto.has(d.type)).map(d => d.id));
  const tc = Object.keys(TYPES).map(k => [k, state.devices.filter(d => d.type === k).length]).filter(x => x[1]);
  const devs = [...state.devices].sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || (a.room || "").localeCompare(b.room || "", "de") || a.name.localeCompare(b.name, "de", {numeric: true}));
  m.innerHTML = `<div class="overlay" data-act="gm-close-bg"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="gm-h">
    <h2 id="gm-h">${groupIcon} ${esc(grpName(gmId))}</h2>
    <div class="form">
      <div class="field"><label>Automatisch dazu <small class="muted">auch neue Geräte dieser Art</small></label><div class="gpick">${tc.map(([k, n]) => `<button type="button" class="rchip" data-act="gm-auto" data-type="${k}" aria-pressed="${auto.has(k)}">Alle ${esc(({light: "Lichter", plug: "Steckdosen", switch: "Schalter", sensor: "Sensoren", camera: "Kameras", climate: "Heizungen/Klima", alexa: "Alexa-Geräte", console: "Spielekonsolen", bridge: "Bridges/Switches", other: "sonstigen Geräte"})[k] || TYPES[k][0])} <span class="muted">${n}</span></button>`).join("")}</div></div>
      <div class="field"><label for="rt-filter">Geräte in dieser Gruppe <small class="muted" id="rt-cnt">${sel.size} gewählt</small></label><input id="rt-filter" type="search" placeholder="Gerät oder Raum suchen">
      <div class="rtdevs gmdevs">${devs.map(d => `<label class="rtdev" data-s="${esc((d.name + " " + (d.room || "")).toLowerCase())}"><input type="checkbox" class="gm-d rt-d" value="${d.id}" data-type="${d.type}" ${sel.has(d.id) ? "checked" : ""} ${auto.has(d.type) ? "disabled" : ""}><span>${esc(d.name)}<small>${esc(d.room || "Ohne Raum")} · ${esc(appById(d.app).name)}${auto.has(d.type) ? " · automatisch" : ""}</small></span></label>`).join("")}</div></div>
      <div class="actions"><div class="r"><button type="button" class="btn" data-act="gm-close">Abbrechen</button><button type="button" class="btn primary" data-act="gm-save">Speichern</button></div></div>
    </div></div></div>`;
}


/* ================= Änderungsverlauf ================= */
const FIELD_DE = {name: "Name", room: "Raum", x: "Position", y: "Position", floor: "Etage", groups: "Gruppen", voice: "Sprachbefehle", circuit: "Sicherung", link: "Verbindung", app: "App", type: "Art", note: "Notiz", ip: "IP", lamp: "Lampe", help: "Störungshilfe", inactive: "Aktiv/Inaktiv", guideHide: "Gäste-Anleitung", noVoice: "Sprachsteuerung", noStd: "Standard-Befehle",
  devices: "Geräte", days: "Tage", trigger: "Auslöser", action: "Ablauf", on: "Aktiv", autoTypes: "Automatik", bridge: "Bridge", hub: "Hauptgerät", mac: "MAC", color: "Farbe", iconAsset: "Logo", iconData: "Logo", planAsset: "Grundriss", planData: "Grundriss", zones: "Raumflächen"};
function diffList(A, B, label, nameOf){
  const out = [], a = new Map((A || []).map(x => [x.id, x])), b = new Map((B || []).map(x => [x.id, x]));
  for (const [id, x] of b) if (!a.has(id)) out.push(`${label} „${nameOf(x)}“ hinzugefügt`);
  for (const [id, x] of a) if (!b.has(id)) out.push(`${label} „${nameOf(x)}“ gelöscht`);
  for (const [id, y] of b) { const x = a.get(id); if (!x) continue;
    const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(k => !k.startsWith("_") && JSON.stringify(x[k]) !== JSON.stringify(y[k]));
    if (!keys.length) continue;
    if (keys.includes("name")) out.push(`${label} „${nameOf(x)}“ heißt jetzt „${nameOf(y)}“`);
    const rest = [...new Set(keys.filter(k => k !== "name").map(k => FIELD_DE[k] || k))];
    if (rest.length) out.push(`„${nameOf(y)}“: ${rest.join(", ")} geändert`);
  }
  return out;
}
function diffText(A, B){
  const out = [];
  out.push(...diffList(A.devices, B.devices, "Gerät", x => x.name || "ohne Namen"));
  out.push(...diffList(A.groups, B.groups, "Gruppe", x => x.name));
  out.push(...diffList(A.routines, B.routines, "Routine", x => x.name));
  out.push(...diffList(A.apps, B.apps, "App", x => x.name));
  out.push(...diffList(A.floors, B.floors, "Etage", x => x.name));
  out.push(...diffList(A.links, B.links, "Verbindung", x => x.name));
  const ra = new Set(A.rooms || []), rb = new Set(B.rooms || []);
  for (const r of rb) if (!ra.has(r)) out.push(`Raum „${r}“ angelegt`);
  for (const r of ra) if (!rb.has(r)) out.push(`Raum „${r}“ entfernt`);
  const ca = JSON.stringify(A.circuits), cb = JSON.stringify(B.circuits); if (ca !== cb) out.push("Sicherungskasten geändert");
  if (JSON.stringify(A.roomCircuits) !== JSON.stringify(B.roomCircuits)) out.push("Sicherung eines Raums geändert");
  if (JSON.stringify(A.roomFloors) !== JSON.stringify(B.roomFloors)) out.push("Etage eines Raums geändert");
  if (JSON.stringify(A.voiceStd) !== JSON.stringify(B.voiceStd)) out.push("Standard-Sprachbefehle geändert");
  if (JSON.stringify(A.wifi) !== JSON.stringify(B.wifi)) out.push("Gäste-WLAN geändert");
  if (JSON.stringify(A.accounts) !== JSON.stringify(B.accounts)) out.push("Konten-Übersicht geändert");
  return out;
}
function doUndo(){
  const u = undoStack.pop(); if (!u) { toast("Nichts zum Rückgängigmachen."); return; }
  const hist = state.history; state = normalize(JSON.parse(u.snap)); state.history = hist; undoing = true; save(); render(); toast(`Rückgängig: ${u.text}`);
}
const relTime = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return "gerade eben"; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; const d = new Date(iso); return d.toLocaleDateString("de-DE", {day: "numeric", month: "short"}) + ", " + d.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"}); };
const bkWifi = () => { try { return localStorage.getItem(LS + "-bkwifi") === "1"; } catch (_) { return false; } };
const backupAge = () => state.lastBackup ? Math.floor((Date.now() - new Date(state.lastBackup)) / 864e5) : null;

/* ================= Nur ansehen (Familie) ================= */
function setReadOnly(ro){
  readOnly = ro; document.body.classList.toggle("ro", ro);
  if (ro) { editMode = false; setSync("Nur ansehen"); }
  render();
}

/* ================= Tippfehler ================= */
let typoOpen = false;
const COMMON_WORDS = "alexa nachts morgens abends mittags licht lampe lampen steckdose steckdosen wasserkocher spülmaschine geschirrspüler waschmaschine trockner kühlschrank gefrierschrank gruppe wohnzimmer schlafzimmer küche badezimmer flur garten vorgarten schuppen terrasse lautsprecher fernseher fernsehschrank echo alexa heizung sensor kamera laden automatisch täglich gartenpumpe pumpe rasensprenger staubsauger saugroboter luftentfeuchter bewegung musik lautstärke reinigung sofa couch sessel kissen hinten vorne oben unten links rechts deckenlampe stehlampe router drucker ladegerät handy gästezimmer arbeitszimmer kinderzimmer büro keller dachboden einfahrt carport garage nicht nacht noch auch wird werden wieder dann danach immer jeden jede stunden stunde minuten minute zwischen sonst ohne beim beide einer eine einen geht gehen gestellt gespielt geladen schaltet ausgeschaltet eingeschaltet wochentags woche morgen bitte alles ende sind wenn oder unter über nach aber denn mehr sehr hier jetzt schon kurz lang lange erst etwa ganz halb viel viele".split(" ");
function lev1(a, b){ if (Math.abs(a.length - b.length) > 1 || a === b) return false; let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return e + (a.length - i) + (b.length - j) === 1; }
function typoFields(){
  const f = [];
  for (const d of state.devices) { f.push({k: "dev", id: d.id, field: "name", label: "Gerät", text: d.name}); (d.voice || []).forEach((v, i) => f.push({k: "dev", id: d.id, field: "voice", vi: i, label: "Sprachbefehl von „" + d.name + "“", text: v})); if (d.note) f.push({k: "dev", id: d.id, field: "note", label: "Notiz bei „" + d.name + "“", text: d.note}); }
  for (const r of state.routines) { f.push({k: "rt", id: r.id, field: "name", label: "Routine", text: r.name}); if (r.action) f.push({k: "rt", id: r.id, field: "action", label: "Ablauf von „" + r.name + "“", text: r.action}); if (r.trigger?.kind === "voice" && r.trigger.value) f.push({k: "rt", id: r.id, field: "voice", label: "Sprachbefehl von „" + r.name + "“", text: r.trigger.value}); }
  for (const g of state.groups) f.push({k: "grp", id: g.id, field: "name", label: "Gruppe", text: g.name});
  return f;
}
const WORD_RE = /[A-Za-zÄÖÜäöüß]{4,}/g;
function typoFindings(){
  const fields = typoFields(), cnt = new Map(), add = (w, n) => cnt.set(w, (cnt.get(w) || 0) + n);
  for (const f of fields) for (const w of (f.text || "").match(WORD_RE) || []) add(w.toLowerCase(), 1);
  for (const w of COMMON_WORDS) add(w, 3);
  const ign = new Set((state.typoIgnore || []).map(x => x.toLowerCase())), out = [], seen = new Set();
  for (const f of fields) for (const w of new Set((f.text || "").match(WORD_RE) || [])) {
    const lw = w.toLowerCase(), own = cnt.get(lw) || 0; if (ign.has(lw) || COMMON_WORDS.includes(lw)) continue;
    let best = null;
    for (const [c, n] of cnt) { if (n < 2 || c === lw || c.startsWith(lw) || lw.startsWith(c)) continue; if (lev1(lw, c) && (!best || n > best.n)) best = {c, n}; }
    // Ein Wort, das öfter vorkommt, gilt nur als Tippfehler, wenn die richtige Form viel häufiger ist (z. B. „Alexs“ neben vielen „Alexa“)
    if (!best || (own > 1 && best.n < own * 5)) continue;
    const sug = w[0] === w[0].toUpperCase() ? best.c[0].toUpperCase() + best.c.slice(1) : best.c, key = f.k + f.id + f.field + w;
    if (seen.has(key)) continue; seen.add(key);
    out.push({...f, word: w, sug});
  }
  // doppelte Gerätenamen
  const byName = new Map(); for (const d of state.devices) { const k = (d.name || "").trim().toLowerCase(); if (!k) continue; byName.set(k, [...(byName.get(k) || []), d]); }
  for (const [k, ds] of byName) if (ds.length > 1 && !ign.has("dup:" + k)) out.push({dup: true, ids: ds.map(d => d.id), word: ds[0].name, key: "dup:" + k});
  return out;
}
let typoCache = [];
function renderTypo(){
  const m = document.getElementById("rmodal");
  if (!typoOpen) { closeSheet(m); return; }
  typoCache = typoFindings();
  m.innerHTML = `<div class="overlay" data-act="typo-close-bg"><div class="panel" role="dialog" aria-modal="true" aria-labelledby="ty-h"><h2 id="ty-h">Namen prüfen</h2>
    ${typoCache.length ? `<div class="list">${typoCache.map((x, i) => x.dup ? `<div class="roomrow tyrow"><span class="tyx"><b>${x.ids.length} Geräte heißen „${esc(x.word)}“</b><small>Gib ihnen unterschiedliche Namen, sonst verwechselt Alexa sie.</small><span class="gpick">${x.ids.map((id, k) => `<button class="rchip" data-act="typo-dev" data-id="${id}">Öffnen ${k + 1} · ${esc(state.devices.find(d => d.id === id)?.room || "Ohne Raum")}</button>`).join("")}<button class="rchip" data-act="typo-ign" data-i="${i}">Ist so gewollt</button></span></span></div>`
      : `<div class="roomrow tyrow"><span class="tyx"><small>${esc(x.label)}</small><b>${esc(x.text).replace(new RegExp(esc(x.word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `<s>${esc(x.word)}</s> <ins>${esc(x.sug)}</ins>`)}</b><span class="gpick"><button class="rchip" data-act="typo-fix" data-i="${i}" aria-pressed="true">In „${esc(x.sug)}“ ändern</button><button class="rchip" data-act="typo-ign" data-i="${i}">Ist richtig</button></span></span></div>`).join("")}</div>`
      : `<p class="note">Keine Tippfehler gefunden.</p>`}
    <div class="actions"><div class="r"><button type="button" class="btn" data-act="typo-close">Fertig</button></div></div></div></div>`;
}
function applyTypo(i, fix){
  const x = typoCache[i]; if (!x) return;
  if (!fix) { state.typoIgnore = [...(state.typoIgnore || []), x.dup ? x.key : x.word.toLowerCase()]; save(); renderTypo(); render(); return; }
  const re = new RegExp(`(^|[^A-Za-zÄÖÜäöüß])${x.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^A-Za-zÄÖÜäöüß]|$)`, "g"), sub = (txt) => txt.replace(re, (m0, p1) => p1 + x.sug);
  if (x.k === "dev") { const d = state.devices.find(y => y.id === x.id); if (d) { if (x.field === "voice") d.voice = (d.voice || []).map((v, i) => i === x.vi ? sub(v) : v); else d[x.field] = sub(d[x.field] || ""); } }
  if (x.k === "grp") { const g = state.groups.find(y => y.id === x.id); if (g) g.name = sub(g.name); }
  if (x.k === "rt") { const r = state.routines.find(y => y.id === x.id); if (r) { if (x.field === "voice") r.trigger.value = sub(r.trigger.value); else r[x.field] = sub(r[x.field] || ""); } }
  save(); buzz(8); toast(`„${x.word}“ → „${x.sug}“`); renderTypo(); render();
}

/* ================= Zeitstrahl ================= */
function timelineHtml(){
  const dow = new Date().getDay(), per = new Map();
  const rts = state.routines.filter(r => r.on !== false && (!(r.days || []).length || r.days.includes(dow)));
  for (const r of rts) {
    const h = routineHour(r); if (h == null) continue;
    const w = rtWindow(r, h), dir = rtDir(r);
    for (const id of r.devices || []) {
      const ev = per.get(id) || [];
      if (w && dir !== "aus") ev.push({t: w.from % 24, on: true, r, win: w}, {t: w.to % 24, on: false, r, end: true});
      else ev.push({t: h % 24, on: dir === "an" ? true : dir === "aus" ? false : null, r});
      per.set(id, ev);
    }
  }
  if (!per.size) return `<div class="roomrow"><span class="n">Noch keine Routinen mit Uhrzeit. Sobald du welche einträgst, siehst du hier, wann welches Gerät an ist.</span></div>`;
  const now = nowHour(), pct = t => (t / 24 * 100).toFixed(2) + "%";
  const rows = [...per.entries()].map(([id, ev]) => ({d: state.devices.find(x => x.id === id), ev: ev.sort((a, b) => a.t - b.t)})).filter(x => x.d).sort((a, b) => a.d.name.localeCompare(b.d.name, "de", {numeric: true}));
  let h = `<div class="tl"><div class="tlhd"><span></span><span class="tlax">${[0, 6, 12, 18, 24].map(t => `<i style="left:${pct(t)}">${t}</i>`).join("")}</span></div>`;
  for (const {d, ev} of rows) {
    const def = ev.filter(e => e.on != null); let st = def.length ? def[def.length - 1].on : false, from = 0, segs = [];
    for (const e of ev) { if (e.on == null) continue; if (st && !e.on) segs.push([from, e.t]); if (!st && e.on) from = e.t; st = e.on; }
    if (st) segs.push([from, 24]);
    const wins = ev.filter(e => e.win);
    const ticks = ev.map(e => { const bad = e.on === false && !e.end && wins.some(w => w.r !== e.r && inWin(e.t, w.win));
      return `<button class="tlt ${e.on === true ? "on" : e.on === false ? "off" : "nn"} ${bad ? "bad" : ""}" data-act="open-routine" data-r="${e.r.id}" style="left:${pct(e.t)}" title="${esc(fmtH(e.t) + " · " + e.r.name)}" aria-label="${esc(fmtH(e.t) + " " + e.r.name)}"></button>`; }).join("");
    h += `<div class="tlrow"><span class="tln">${esc(d.name)}</span><span class="tlbar">${segs.map(([a, b]) => `<i class="tlseg" style="left:${pct(a)};width:${pct(Math.max(.15, b - a))}"></i>`).join("")}${ticks}<i class="tlnow" style="left:${pct(now)}"></i></span></div>`;
  }
  return h + `</div><p class="note tlnote"><i class="tlk on"></i> an · <i class="tlk off"></i> aus · <i class="tlk nn"></i> sonstiges · <i class="tlk bad"></i> Konflikt · Striche antippen öffnet die Routine. Heute, ${DAYS[dow]}.</p>`;
}

/* ================= IP-Adressen aus der Fritzbox ================= */
let ipPreview = [];
/* MAC-Adresse vereinheitlichen: AA:BB:CC:DD:EE:FF */
const normMac = t => { const h = String(t || "").replace(/[^0-9a-f]/gi, "").toUpperCase(); return h.length === 12 ? h.match(/../g).join(":") : ""; };
const devMac = d => d.mac || normMac((String(d.ip || "").match(/([0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5})/) || [])[1]);
// Im Grundriss sichtbar: platziert und aktiv. Inaktive behalten x/y und erscheinen beim Aktivieren wieder an ihrem Platz.
const onPlan = d => typeof d.x === "number" && !d.inactive;
/* Mehrfachsteckdosen: Kanäle (z. B. Tower 1–3) gehören zu einem Hauptgerät mit gemeinsamer IP und MAC */
const hubOf = d => d && d.hub ? state.devices.find(x => x.id === d.hub && x.id !== d.id) : null;
const channelsOf = d => state.devices.filter(x => x.hub === d.id);
/* Funk-Geräte (Zigbee, Thread, …) laufen über eine Bridge: eigene Angabe am Gerät oder für die ganze Verbindungsart */
const bridgeOf = d => { if (!d) return null; const id = d.bridge || linkById(d.link)?.bridge; const b = id && id !== d.id ? state.devices.find(x => x.id === id) : null; return b || null; };
const bridgedBy = b => state.devices.filter(x => x.id !== b.id && bridgeOf(x)?.id === b.id);
/* In der Gäste-Anleitung: Kameras und Sensoren standardmäßig ausgeblendet */
const guideHidden = d => typeof d.guideHide === "boolean" ? d.guideHide : ["camera", "sensor", "bridge"].includes(d.type);
const isRadio = d => { const l = linkById(d?.link); return !!l && RADIO.test(l.name + " " + l.id); };
const devNet = d => { const h = hubOf(d) || (isRadio(d) ? bridgeOf(d) : null); return h ? {ip: h.ip || "", mac: devMac(h), via: h} : {ip: d.ip || "", mac: devMac(d)}; };
const RADIO = /zigbee|thread|z-?wave|bluetooth|matter/i;
const normName = t => (t || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");
function parseIpList(txt){
  const out = [];
  for (const line of (txt || "").split(/\r?\n/)) {
    const ip = (line.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/) || [])[1]; if (!ip) continue;
    const mac = (line.match(/\b([0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5})\b/) || [])[1] || "";
    const name = line.replace(ip, " ").replace(mac, " ").split(/\t|;|,|\s{2,}|\|/).map(x => x.trim()).find(x => /[A-Za-zÄÖÜäöü]{2,}/.test(x) && !/^(wlan|lan|ethernet|aktiv|verbunden|\d.*ghz|ipv[46])$/i.test(x)) || "";
    let best = null; const nn = normName(name), m = normMac(mac);
    const byMac = m && state.devices.find(d => devMac(d) === m);
    if (byMac) { out.push({name, ip, mac: m, dev: byMac.id, how: "mac"}); continue; }
    if (nn) for (const d of state.devices) { const dn = normName(d.name); if (!dn) continue;
      let sc = dn === nn ? 100 : (dn.includes(nn) || nn.includes(dn)) && Math.min(dn.length, nn.length) >= 4 ? 80 : 0;
      if (!sc) { const ta = new Set((d.name || "").toLowerCase().split(/[^a-zäöüß0-9]+/).filter(x => x.length > 2)), tb = (name.toLowerCase().split(/[^a-zäöüß0-9]+/).filter(x => x.length > 2)); const hit = tb.filter(x => ta.has(x)).length; if (hit) sc = 40 + 30 * hit / Math.max(ta.size, tb.length); }
      if (sc >= 50 && (!best || sc > best.sc)) best = {id: d.id, sc}; }
    out.push({name, ip, mac: m, dev: best?.id || "", how: best ? "name" : ""});
  }
  return out;
}
function applyIps(){
  let n = 0;
  document.querySelectorAll(".iprow").forEach((row, i) => { const p = ipPreview[i], sel = row.querySelector("select"), on = row.querySelector("input[type=checkbox]");
    if (!p || !sel?.value || !on?.checked) return; let d = state.devices.find(x => x.id === sel.value); if (!d) return; d = hubOf(d) || d;
    // Dieselbe MAC darf nur an einem Gerät hängen
    if (p.mac) for (const o of state.devices) if (o !== d && devMac(o) === p.mac) { delete o.mac; if (/[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}/.test(o.ip || "")) o.ip = (o.ip.match(/\d{1,3}(?:\.\d{1,3}){3}/) || [""])[0]; }
    d.ip = p.ip; if (p.mac) d.mac = p.mac; n++; });
  ipPreview = []; save(); render(); toast(n ? `${n} IP-Adressen übernommen` : "Nichts übernommen");
}
function ipHtml(){
  const devOpts = sel => `<option value="">— nicht zuordnen —</option>` + [...state.devices].sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true})).map(d => `<option value="${d.id}" ${d.id === sel ? "selected" : ""}>${esc(d.name)}${d.room ? " · " + esc(d.room) : ""}</option>`).join("");
  let h = `<div class="list"><div class="roomrow vsrow"><label class="n" for="ipPaste">Am PC fritz.box öffnen. Unter WLAN → Funknetz (mit MAC-Adressen) oder Heimnetz → Netzwerk die Liste markieren, kopieren und hier einfügen. Eine CSV-Datei geht auch.</label>
    <textarea id="ipPaste" rows="4" placeholder="Wasserkocher    192.168.178.42    A4:CF:12:34:56:78"></textarea>
    <span class="bkrow"><button class="btn small primary" data-act="ip-parse">Zuordnen</button><label class="btn small filebtn">Datei wählen<input type="file" id="ipFile" accept=".csv,.txt,text/plain,text/csv"></label></span></div></div>`;
  if (ipPreview.length) {
    const found = ipPreview.filter(p => p.dev).length;
    const sure = ipPreview.filter(p => p.how === "mac").length;
    h += `<p class="rcklbl">${ipPreview.length} Einträge · ${sure} sicher über MAC · ${found - sure} nach Name</p><div class="list">${ipPreview.map(p => `<div class="roomrow iprow ${p.how}"><input type="checkbox" ${p.dev ? "checked" : ""} aria-label="Übernehmen"><span class="ipx"><b>${esc(p.name || "ohne Namen")} ${p.how === "mac" ? `<span class="ipb ok">MAC sicher</span>` : p.how === "name" ? `<span class="ipb chk">nach Name, bitte prüfen</span>` : ""}</b><small class="mono">${esc(p.ip)}${p.mac ? " · " + esc(p.mac) : ""}</small><select aria-label="Gerät für ${esc(p.ip)}">${devOpts(p.dev)}</select></span></div>`).join("")}</div>
      <div class="addroom"><button class="btn primary" data-act="ip-apply">Übernehmen</button><button class="btn" data-act="ip-clear">Verwerfen</button></div>`;
  }
  const withIp = state.devices.filter(d => d.ip).length, withMac = state.devices.filter(d => devMac(d)).length;
  return h + `<p class="note">${withIp} von ${state.devices.length} Geräten haben eine IP, ${withMac} eine MAC-Adresse. Geräte mit MAC werden beim nächsten Import sicher wiedererkannt, auch wenn sich Name oder IP ändern. Die MAC findest du in Smart Life und eWeLink in den Geräteinformationen und kannst sie beim Gerät eintragen.</p>`;
}

/* ================= Gäste-WLAN ================= */
const wifiPayload = w => { const e = s => String(s || "").replace(/([\;,:"])/g, "\\$1"); return `WIFI:T:${w.enc === "nopass" ? "nopass" : w.enc};S:${e(w.ssid)};${w.enc === "nopass" ? "" : `P:${e(w.pass)};`};`; };
async function qrSvg(text, px = 220){
  await loadQr(); const q = window.qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount();
  let r = ""; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) r += `M${x + 2} ${y + 2}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + 4} ${n + 4}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${r}" fill="#131C2B"/></svg>`;
}
async function showWifi(){
  const w = state.wifi || {}; if (!w.ssid) return;
  const m = document.getElementById("rmodal");
  let qr = ""; try { qr = await qrSvg(wifiPayload(w), 240); } catch (_) { qr = `<p class="note">Der QR-Code konnte nicht geladen werden. Prüfe die Internetverbindung.</p>`; }
  m.innerHTML = `<div class="overlay" data-act="wifi-close-bg"><div class="panel wfpanel" role="dialog" aria-modal="true" aria-labelledby="wf-h"><h2 id="wf-h">Gäste-WLAN</h2>
    <div class="wfqr">${qr}</div><p class="wfname">${esc(w.ssid)}</p>${w.enc !== "nopass" ? `<p class="wfpass mono">${esc(w.pass)}</p>` : ""}
    <p class="note">Kamera aufs Handy halten, den Code scannen, fertig. Kein Passwort-Tippen nötig.</p>
    <div class="actions"><div class="r"><button class="btn" data-act="wifi-close">Schließen</button></div></div></div></div>`;
  buzz(8);
}

/* ================= Hausanleitung (PDF) ================= */
async function exportGuide(){
  if (!downloads) return;
  toast("Hausanleitung wird erstellt …");
  try {
    try {
      if (!window.jspdf) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"]);
      if (!window.jspdf?.jsPDF?.API?.autoTable) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"]);
    } catch (_) { toast("Die PDF-Bausteine konnten nicht geladen werden. Prüfe deine Internetverbindung."); return; }
    const { jsPDF } = window.jspdf, doc = new jsPDF({unit: "mm", format: "a4"}), T = pdfText;
    const style = {font: "helvetica", fontSize: 9.5, cellPadding: 2, valign: "top", lineColor: [228,223,214], lineWidth: .2};
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text(T("So funktioniert unser Zuhause"), 16, 24);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110); doc.text(T("Die wichtigsten Sprachbefehle, Raum für Raum. Einfach laut sagen."), 16, 31); doc.setTextColor(0);
    let y = 40;
    const w = state.wifi || {};
    if (w.ssid) {
      try { await loadQr(); const q = window.qrcode(0, "M"); q.addData(wifiPayload(w)); q.make(); const n = q.getModuleCount(), S = 44, c = S / (n + 2);
        doc.setDrawColor(228, 223, 214); doc.rect(16, y, 178, S + 8);
        doc.setFillColor(43, 42, 39); for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) doc.rect(20 + (k + 1) * c, y + 4 + (r + 1) * c, c + .02, c + .02, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(T("WLAN für Gäste"), 72, y + 14);
        doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text(T("Netzwerk: " + w.ssid), 72, y + 23); if (w.enc !== "nopass") doc.text(T("Passwort: " + w.pass), 72, y + 31);
        doc.setFontSize(9); doc.setTextColor(110); doc.text(T("Mit der Handykamera scannen, dann verbindet sich das Handy von selbst."), 72, y + 41); doc.setTextColor(0);
        y += S + 16; } catch (_) {}
    }
    const shown = r => { const ds = (r.devices || []).map(id => state.devices.find(d => d.id === id)).filter(Boolean); return !ds.length || ds.some(d => !guideHidden(d)); };
    const vr = state.routines.filter(r => r.on !== false && r.trigger?.kind === "voice" && r.trigger.value && shown(r)), gv = state.groups.filter(g => (g.voice || []).length);
    if (vr.length || gv.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(T("Für das ganze Haus"), 16, y); y += 3;
      doc.autoTable({startY: y, head: [["Sag", "Was passiert"]], body: [...gv.flatMap(g => g.voice.map(v => [v, "Gruppe " + g.name])), ...vr.map(r => [r.trigger.value, (r.action || r.name).split("\n")[0]])].map(r => r.map(T)),
        styles: style, headStyles: {fillColor: [43,42,39], textColor: 255}, columnStyles: {0: {cellWidth: 75, fontStyle: "bold"}}, margin: {left: 16, right: 16}});
      y = doc.lastAutoTable.finalY + 10;
    }
    const fl = id => (state.floors.find(f => f.id === id) || {}).name || "";
    for (const g of roomsByFloor(roomsInUse())) for (const room of g.rooms) {
      const ds = state.devices.filter(d => d.room === room && !guideHidden(d) && !d.inactive).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}));
      if (!ds.length) continue;
      const rows = ds.map(d => [d.name, d.noVoice ? "nur über die App" : (allVoice(d).join("\n") || "–")]);
      const rr = state.routines.filter(r => r.on !== false && shown(r) && (r.devices || []).some(id => ds.some(d => d.id === id)));
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(T(room), 16, y); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120); doc.text(T(g.f?.name || fl(ds[0].floor) || ""), 194, y, {align: "right"}); doc.setTextColor(0); y += 3;
      doc.autoTable({startY: y, head: [["Gerät", "Was du sagen kannst"]], body: rows.map(r => r.map(T)), styles: style, headStyles: {fillColor: [43,42,39], textColor: 255}, columnStyles: {0: {cellWidth: 62, fontStyle: "bold"}}, margin: {left: 16, right: 16}});
      y = doc.lastAutoTable.finalY + 3;
      if (rr.length) { doc.setFontSize(8.5); doc.setTextColor(90); for (const r of rr) { const line = T(`Automatisch: ${r.name} (${trigText(r)})`); const sp = doc.splitTextToSize(line, 178); if (y + sp.length * 4 > 285) { doc.addPage(); y = 20; } doc.text(sp, 16, y + 3); y += sp.length * 4; } doc.setTextColor(0); }
      y += 8;
    }
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140); doc.text(`Seite ${i} von ${pages}`, 194, 290, {align: "right"}); }
    await downloads.save({filename: "Hausanleitung.pdf", data: doc.output("blob")});
    toast("Hausanleitung gespeichert. Drucken und an den Kühlschrank hängen.");
  } catch (e) { if (e && e.code === "declined") return; toast("Die Hausanleitung konnte nicht erstellt werden" + (e && e.message ? ` (${String(e.message).slice(0, 80)})` : "") + "."); }
}

/* ================= Zusätzliche Bereiche unter „Räume & Apps“ ================= */
function extraRoomSections(){
  let h = "";
  const w = state.wifi || {};
  h += `<h2 class="sec">Gäste-WLAN</h2><div class="list"><div class="roomrow vsrow"><label class="n" for="wfSsid">Netzwerkname (SSID)</label><input id="wfSsid" value="${esc(w.ssid || "")}" placeholder="z. B. FRITZ!Box Gastzugang" autocomplete="off">
    <label class="n" for="wfPass">Passwort</label><input id="wfPass" value="${esc(w.pass || "")}" autocomplete="off" spellcheck="false">
    <label class="n" for="wfEnc">Verschlüsselung</label><select id="wfEnc">${[["WPA", "WPA2 / WPA3 (Standard)"], ["WEP", "WEP (alt)"], ["nopass", "Offen, ohne Passwort"]].map(([v, l]) => `<option value="${v}" ${(w.enc || "WPA") === v ? "selected" : ""}>${l}</option>`).join("")}</select>
    <span class="bkrow"><button class="btn small primary" data-act="wifi-save">Speichern</button>${w.ssid ? `<button class="btn small" data-act="wifi-show">QR-Code zeigen</button>` : ""}</span></div></div>
    <p class="note">Gäste scannen den Code und sind im WLAN. Er steht auch auf der Übersicht und in der Hausanleitung. Nimm am besten den Gastzugang der Fritzbox. Wer die App mitbenutzen darf, sieht das Passwort.</p>`;
  h += `<h2 class="sec">IP-Adressen</h2>${ipHtml()}`;
  h += `<h2 class="sec" data-cnt="${Object.keys(state.accounts || {}).length}">Konten</h2>${accountsHtml()}`;
  h += `<h2 class="sec">Netzwerkplan</h2>${netTree()}`;
  h += `<h2 class="sec">Neustart-Reihenfolge</h2>${restartHtml()}`;
  h += `<h2 class="sec" data-cnt="${state.devices.filter(d => d.help).length}">Störungshilfe</h2>${helpListHtml()}`;
  h += `<h2 class="sec">Zeitstrahl</h2>${timelineHtml()}`;
  const hist = [...(state.history || [])].reverse().slice(0, 40);
  h += `<h2 class="sec" data-cnt="${(state.history || []).length}">Änderungsverlauf</h2><div class="list"><label class="roomrow optrow"><span>Änderungen aufzeichnen</span><input type="checkbox" id="optHist" ${state.historyOff ? "" : "checked"}></label>
    ${(state.history || []).length ? `<div class="roomrow bkrow">${histDel ? `<span class="n">Wirklich alle ${state.history.length} Einträge löschen?</span><button class="btn small danger" data-act="hist-clear-yes">Löschen</button><button class="btn small" data-act="hist-clear-no">Abbrechen</button>` : `<button class="btn small" data-act="hist-clear">Verlauf löschen</button>`}</div>` : ""}</div>${undoStack.length && !readOnly ? `<div class="addroom"><button class="btn" data-act="undo">Letzte Änderung rückgängig</button><span class="n">${esc(undoStack[undoStack.length - 1].text)}</span></div>` : ""}
    <div class="list">${hist.length ? hist.map(x => `<div class="roomrow hsrow"><span class="hst">${esc(relTime(x.t))}</span><span class="hsx">${esc(x.text)}</span></div>`).join("") : `<div class="roomrow"><span class="n">Noch keine Änderungen aufgezeichnet. Ab jetzt steht hier jede Änderung.</span></div>`}</div>
    <p class="note">Rückgängig geht für die Änderungen, die du in dieser Sitzung auf diesem Gerät gemacht hast.</p>`;
  return h;
}


/* Fenster beim Neuzeichnen nicht nach oben springen lassen */
const panelScroll = {};
document.addEventListener("scroll", e => { const t = e.target; if (t.classList?.contains("panel")) { const host = t.closest("#modal, #rmodal"); if (host) panelScroll[host.id] = t.scrollTop; } }, true);
for (const id of ["modal", "rmodal"]) {
  const host = document.getElementById(id); if (!host) continue;
  new MutationObserver(muts => {
    const removed = muts.some(m => [...m.removedNodes].some(n => n.classList?.contains("overlay"))), pnl = host.querySelector(".panel");
    if (!pnl) { panelScroll[id] = 0; return; }
    if (removed) { pnl.classList.add("noanim"); pnl.scrollTop = panelScroll[id] || 0; requestAnimationFrame(() => { pnl.scrollTop = panelScroll[id] || 0; }); }
    else panelScroll[id] = 0;
  }).observe(host, {childList: true});
}


/* ================= Animationen ================= */
function motionOn(){ return typeof fx !== "undefined" && fx.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches; }
const EASE = "cubic-bezier(.2,.8,.2,1)";
function closeSheet(m){
  const pnl = m.querySelector(".panel"), ov = m.querySelector(".overlay");
  if (!pnl || !motionOn()) { m.innerHTML = ""; return; }
  const cur = getComputedStyle(pnl).transform;
  pnl.style.transition = "none";
  const a = pnl.animate([{transform: cur === "none" ? "translateY(0)" : cur}, {transform: "translateY(105%)"}], {duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards"});
  ov?.animate([{opacity: 1}, {opacity: 0}], {duration: 220, fill: "forwards"});
  const snap = m.firstElementChild;
  a.onfinish = () => { if (m.firstElementChild === snap) m.innerHTML = ""; };
}
function accAnim(sec, open){
  if (!motionOn()) return;
  const body = sec.querySelector(".accbody"); if (!body) return;
  if (open) { const h = body.scrollHeight; body.animate([{height: "0px", opacity: 0, overflow: "hidden"}, {height: h + "px", opacity: 1, overflow: "hidden"}], {duration: 260, easing: EASE}); }
  else { const h = body.scrollHeight; const clone = body.cloneNode(true); clone.classList.add("acc-ghost"); clone.style.cssText = "display:block;overflow:hidden"; body.after(clone);
    clone.animate([{height: h + "px", opacity: 1}, {height: "0px", opacity: 0}], {duration: 200, easing: "cubic-bezier(.4,0,1,1)"}).onfinish = () => clone.remove(); }
}
function shrinkOut(el, done){
  if (!el || !motionOn()) { done(); return; }
  const h = el.offsetHeight; el.style.overflow = "hidden";
  el.animate([{height: h + "px", opacity: 1, transform: "none"}, {height: h + "px", opacity: 0, transform: "translateX(40px)", offset: .5}, {height: "0px", opacity: 0, transform: "translateX(40px)", paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0}], {duration: 380, easing: EASE, fill: "forwards"}).onfinish = done;
}
function showCheck(){
  if (!motionOn()) return;
  const el = document.createElement("div"); el.className = "savecheck"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(el); setTimeout(() => el.remove(), 900);
}
function countUp(el, to, dur = 700){
  const t0 = performance.now(), from = 0, isPct = /%$/.test(el.textContent);
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e) + (isPct ? "%" : ""); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function placeTabInd(animate){
  const nav = document.querySelector(".bottomnav"), ind = nav?.querySelector(".tabind"), sel = nav?.querySelector('.tab[aria-selected="true"]');
  if (!ind) return; ind.style.opacity = sel ? "" : "0"; if (!sel) return;
  const nr = nav.getBoundingClientRect(), r = sel.getBoundingClientRect();
  ind.style.transition = animate && motionOn() ? "transform .32s cubic-bezier(.3,1.3,.5,1), width .32s" : "none";
  ind.style.width = "22px"; ind.style.transform = `translateX(${r.left - nr.left + r.width / 2 - 11}px)`;
}
let lastTabSel = null;
function afterRender(enter, floorEnter){
  const v = document.getElementById("view");
  const sel = document.querySelector('.bottomnav .tab[aria-selected="true"]');
  placeTabInd(lastTabSel !== null);
  if (sel && sel !== lastTabSel && lastTabSel && motionOn()) sel.querySelector("svg")?.animate([{transform: "translateY(0) scale(1)"}, {transform: "translateY(-5px) scale(1.15)"}, {transform: "translateY(0) scale(1)"}], {duration: 360, easing: "cubic-bezier(.3,1.5,.5,1)"});
  lastTabSel = sel;
  if (!motionOn() || !v) return;
  if (enter) {
    const items = v.querySelectorAll(":scope > .acc, :scope > .rcat, .room > .head, .row, .dev, .hm-card, .hm-fl, .hm-act, .hm-hello, .kpi, .sbars, .stat");
    [...items].slice(0, 18).forEach((el, i) => el.animate([{opacity: 0, transform: "translateY(14px)"}, {opacity: 1, transform: "none"}], {duration: 360, delay: i * 35, easing: EASE, fill: "backwards"}));
    if (view === "home") {
      v.querySelectorAll(".hm-fl b").forEach(b => countUp(b, +b.textContent || 0));
      const t = v.querySelector(".hm-ring text"), c = v.querySelector(".hm-ring circle:nth-of-type(2)");
      if (t) countUp(t, parseInt(t.textContent) || 0, 900);
      if (c) { const d = c.getAttribute("stroke-dasharray"); c.animate([{strokeDasharray: "0 97.4"}, {strokeDasharray: d}], {duration: 900, easing: EASE}); }
      v.querySelectorAll(".hm-mini i, .hm-bar i").forEach((b, i) => b.animate([{transform: "scaleX(0)"}, {transform: "scaleX(1)"}], {duration: 600, delay: 200 + i * 40, easing: EASE, fill: "backwards"}));
    }
  }
  if (floorEnter) {
    const pins = document.querySelectorAll("#canvas .pin .head");
    pins.forEach((h, i) => h.animate([{transform: "translateY(-28px)", opacity: 0}, {transform: "translateY(3px)", opacity: 1, offset: .7}, {transform: "none", opacity: 1}], {duration: 480, delay: 120 + i * 30, easing: "cubic-bezier(.3,1.2,.5,1)", fill: "backwards"}));
    document.querySelectorAll("#canvas .dl-glow").forEach((g, i) => g.animate([{opacity: 0}, {opacity: .6, offset: .3}, {opacity: .2, offset: .45}, {opacity: 1}], {duration: 700, delay: 500 + i * 180, fill: "backwards"}));
  }
}
window.addEventListener("resize", () => placeTabInd(false));


/* ================= Spickzettel: alle Sprachbefehle und Routinen ================= */
let cmdsTab = "voice", cmdsQ = "", cmdsBack = "home";
function renderCmds(){
  const q = cmdsQ.trim().toLowerCase(), hit = (...t) => !q || t.join(" ").toLowerCase().includes(q);
  const chip = (c, std) => `<button class="cmd ${std ? "std" : ""}" data-act="copy-cmd" data-c="${esc(c)}" title="Antippen zum Kopieren">${esc(c)}</button>`;
  const nVoice = state.devices.filter(d => !d.inactive).reduce((a, d) => a + allVoice(d).length, 0) + state.groups.reduce((a, g) => a + (g.voice || []).length, 0) + state.routines.filter(r => r.trigger?.kind === "voice" && r.trigger.value).length;
  let h = `<div class="cmdhd"><button class="btn small" data-act="cmds-back" aria-label="Zurück">← Zurück</button><h2>Spickzettel</h2>${downloads ? `<button class="btn small primary cmdprint" data-act="export-cheat">Als Poster drucken</button>` : ""}</div>
    <div class="search sbig"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="cmdQ" type="search" placeholder="Befehl, Gerät oder Routine suchen" value="${esc(cmdsQ)}" aria-label="Spickzettel durchsuchen"></div>
    <div class="cmdtabs" role="tablist"><button role="tab" data-act="cmds-tab" data-t="voice" aria-selected="${cmdsTab === "voice"}">Sprachbefehle <span>${nVoice}</span></button><button role="tab" data-act="cmds-tab" data-t="rt" aria-selected="${cmdsTab === "rt"}">Routinen <span>${state.routines.length}</span></button></div>`;
  if (cmdsTab === "voice") {
    let any = false;
    const vr = state.routines.filter(r => r.trigger?.kind === "voice" && r.trigger.value && hit(r.trigger.value, r.name));
    const gs = state.groups.filter(g => (g.voice || []).length && hit(g.name, ...(g.voice || [])));
    if (vr.length || gs.length) { any = true;
      h += `<section class="cmdsec"><h3>Für das ganze Haus</h3>${vr.map(r => `<div class="cmdrow"><span class="cmdn">${rtIcon(r)}<b>${esc(r.name)}</b><small>Routine${r.on === false ? " · pausiert" : ""}</small></span><span class="cmdl">${chip(r.trigger.value)}</span></div>`).join("")}${gs.map(g => `<div class="cmdrow"><span class="cmdn">${groupIcon}<b>${esc(g.name)}</b><small>Gruppe</small></span><span class="cmdl">${g.voice.map(v => chip(v)).join("")}</span></div>`).join("")}</section>`; }
    for (const grp of roomsByFloor(roomsInUse().sort((a, b) => a.localeCompare(b, "de")))) for (const room of grp.rooms) {
      const ds = state.devices.filter(d => d.room === room && !d.inactive && allVoice(d).length && hit(d.name, room, ...allVoice(d))).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}));
      if (!ds.length) continue; any = true;
      h += `<section class="cmdsec"><h3>${esc(room)}<small>${esc(grp.f?.name || "")}</small></h3>${ds.map(d => { const own = new Set((d.voice || []).map(v => v.toLowerCase())); return `<div class="cmdrow"><button class="cmdn" data-act="edit" data-id="${d.id}"><span class="cmdico" data-c="${appColor(d.app)}">${icon(d.type)}</span><b>${esc(d.name)}</b></button><span class="cmdl">${allVoice(d).map(v => chip(v, !own.has(v.toLowerCase()))).join("")}</span></div>`; }).join("")}</section>`;
    }
    if (!any) h += `<div class="empty"><strong>Nichts gefunden</strong>${q ? "Ändere die Suche." : "Noch keine Sprachbefehle eingetragen."}</div>`;
    else h += `<p class="note">Antippen kopiert den Befehl. Blasse Befehle kommen aus der Standard-Vorlage.</p>`;
  } else {
    const groups = [["voice", "Per Sprache"], ["time", "Nach Uhrzeit"], ["sunset", "Bei Sonnenuntergang"], ["sunrise", "Bei Sonnenaufgang"], ["device", "Durch Gerät oder Sensor"], ["manual", "Von Hand"]];
    let any = false;
    for (const [k, l] of groups) {
      const rs = state.routines.filter(r => (r.trigger?.kind || "manual") === k && hit(r.name, r.action || "", r.trigger?.value || "", ...(r.devices || []).map(id => state.devices.find(d => d.id === id)?.name || "")))
        .sort((a, b) => (routineHour(a) ?? 99) - (routineHour(b) ?? 99) || a.name.localeCompare(b.name, "de"));
      if (!rs.length) continue; any = true;
      h += `<section class="cmdsec"><h3>${RT_ICONS[k].replace("<svg", '<svg class="cmdh"')} ${l}</h3>${rs.map(r => { const hr = routineHour(r), devs = (r.devices || []).map(id => state.devices.find(d => d.id === id)?.name).filter(Boolean);
        return `<button class="rtcard ${r.on === false ? "rtoff" : ""}" data-act="open-routine" data-r="${r.id}"><span class="rtct">${hr != null ? `<b class="rtclock">${fmtH(hr)}</b>` : ""}<b>${esc(r.name)}</b>${r.on === false ? `<em>pausiert</em>` : ""}</span>
          <small>${esc(trigText(r))}</small>${r.action ? `<span class="rtact">${esc(r.action)}</span>` : ""}${devs.length ? `<span class="rtdevs2">${devs.slice(0, 6).map(n => `<i>${esc(n)}</i>`).join("")}${devs.length > 6 ? `<i>+${devs.length - 6}</i>` : ""}</span>` : ""}</button>`; }).join("")}</section>`;
    }
    if (!any) h += `<div class="empty"><strong>Nichts gefunden</strong>${q ? "Ändere die Suche." : "Noch keine Routinen eingetragen."}</div>`;
  }
  return h;
}


/* ================= Spickzettel-Poster (A4, PDF) ================= */
function cheatData(){
  const rooms = new Map();
  for (const d of state.devices) {
    if (d.inactive || d.noVoice) continue;
    const c = allVoice(d); if (!c.length) continue;
    const base = "alexa, " + d.name.toLowerCase(), on = c.some(x => x.toLowerCase() === base + " an"), off = c.some(x => x.toLowerCase() === base + " aus");
    const extra = c.filter(x => ![base + " an", base + " aus"].includes(x.toLowerCase()));
    const r = d.room || "Ohne Raum"; if (!rooms.has(r)) rooms.set(r, []);
    rooms.get(r).push({name: d.name, std: on && off ? "an / aus" : on ? "an" : off ? "aus" : "", extra});
  }
  const list = [...rooms.entries()].map(([r, ds]) => [r, ds.sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}))]).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "de"));
  const house = [...state.groups.filter(g => (g.voice || []).length).map(g => ({cmd: g.voice[0], cap: "Gruppe: " + g.name})),
    ...state.routines.filter(r => r.on !== false && r.trigger?.kind === "voice" && r.trigger.value).map(r => ({cmd: r.trigger.value, cap: "Routine: " + r.name}))];
  const timed = state.routines.filter(r => r.on !== false).map(r => ({r, h: routineHour(r)})).filter(x => x.h != null).sort((a, b) => a.h - b.h);
  return {rooms: list, house, timed};
}
async function exportCheat(){
  if (!downloads) return;
  toast("Poster wird erstellt …");
  try {
    try { if (!window.jspdf) await loadAny(["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"]); }
    catch (_) { toast("Die PDF-Bausteine konnten nicht geladen werden. Prüfe deine Internetverbindung."); return; }
    const { jsPDF } = window.jspdf, doc = new jsPDF({unit: "mm", format: "a4"}), T = pdfText, C = cheatData();
    const INK = [43, 42, 39], MUT = [138, 133, 124], ACC = [194, 84, 24];
    const COL = [[194,84,24],[47,111,223],[46,139,87],[123,79,214],[208,138,30],[30,155,215],[178,58,107],[94,138,78],[138,122,98],[60,110,113]];
    const L = 16, R = 194, W = R - L;
    // Kopf
    doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(34); doc.text(T("Sag einfach"), L, 30);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT);
    doc.text(T("Unser Zuhause"), R, 24, {align: "right"}); doc.text(T("Stand " + new Date().toLocaleDateString("de-DE", {day: "numeric", month: "long", year: "numeric"})), R, 28.5, {align: "right"});
    doc.setDrawColor(...INK); doc.setLineWidth(1.1); doc.line(L, 33, R, 33);
    // Regel-Balken
    let y = 37; doc.setFillColor(...INK); doc.rect(L, y, W, 13, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(255);
    const p1 = '"Alexa, ', p2 = "Name", p3 = ' an / aus"'; let x = L + 5;
    doc.text(p1, x, y + 9); x += doc.getTextWidth(p1);
    const w2 = doc.getTextWidth(p2) + 4; doc.setFillColor(...ACC); doc.rect(x, y + 2.6, w2, 8.6, "F"); doc.text(p2, x + 2, y + 9); x += w2 + 1;
    doc.text(p3, x, y + 9);
    y += 18;
    // Haus-Befehle als Kacheln
    if (C.house.length) {
      let cx = L, rowH = 10.5;
      for (const hb of C.house) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); const t1 = T(hb.cmd); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); const t2 = T(hb.cap);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); const bw = Math.min(W, Math.max(doc.getTextWidth(t1), (doc.setFontSize(6.5), doc.getTextWidth(t2))) + 6);
        if (cx + bw > R + .1) { cx = L; y += rowH + 2; }
        doc.setDrawColor(...INK); doc.setLineWidth(.45); doc.rect(cx, y, bw, rowH);
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.text(t1, cx + 3, y + 4.6);
        doc.setTextColor(...MUT); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.text(t2, cx + 3, y + 8.4);
        cx += bw + 2;
      }
      y += rowH + 7;
    }
    // Räume zweispaltig, Schriftgröße passt sich an
    const footTop = 270, colW = (W - 8) / 2;
    const roomH = (ds, fs) => 1.2 + ds.reduce((a, d) => a + fs * .4 + (d.extra.length ? fs * .4 : 0) + 1.3, 0) + 6.5 + fs * .42;
    let fs = 12.5, cols;
    const layout = fs => { const hs = C.rooms.map(([, ds]) => roomH(ds, fs)), total = hs.reduce((a, b) => a + b, 0); let acc = 0, split = C.rooms.length;
      for (let i = 0; i < hs.length; i++) { if (acc + hs[i] / 2 > total / 2) { split = i; break; } acc += hs[i]; }
      const c1 = hs.slice(0, split).reduce((a, b) => a + b, 0), c2 = total - c1; return {split, h: Math.max(c1, c2)}; };
    while (fs > 7 && (cols = layout(fs)).h > footTop - y) fs -= .25;
    cols = layout(fs);
    const drawCol = (rooms, x0, ci0) => { let yy = y;
      rooms.forEach(([room, ds], i) => {
        const col = COL[(ci0 + i) % COL.length];
        if (yy + roomH(ds, fs) > footTop && yy > y) { doc.addPage(); yy = 20; }
        doc.setFillColor(...col); doc.rect(x0, yy - fs * .3, fs * .3, fs * .3, "F");
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(fs * 1.2); doc.text(T(room), x0 + fs * .45, yy);
        yy += 1.2;
        for (const d of ds) {
          yy += fs * .4;
          doc.setFont("helvetica", "bold"); doc.setFontSize(fs * .92); doc.setTextColor(...INK);
          const nm = doc.splitTextToSize(T(d.name), colW - 18)[0]; doc.text(nm, x0, yy);
          doc.setFont("helvetica", "normal"); doc.setTextColor(...MUT); doc.text(T(d.std), x0 + colW, yy, {align: "right"});
          if (d.extra.length) { yy += fs * .4; doc.setFont("helvetica", "italic"); doc.setFontSize(fs * .8); doc.text(doc.splitTextToSize(T(d.extra.join(" · ")), colW)[0], x0, yy); }
          yy += 1.2; doc.setDrawColor(207, 200, 188); doc.setLineWidth(.2); doc.setLineDashPattern([.4, .8], 0); doc.line(x0, yy, x0 + colW, yy); doc.setLineDashPattern([], 0);
          yy += .1;
        }
        yy += 6.5 + fs * .42;
      }); };
    drawCol(C.rooms.slice(0, cols.split), L, 0);
    doc.setPage(1); drawCol(C.rooms.slice(cols.split), L + colW + 8, cols.split);
    // Fuß: Tagesbalken mit Routinen
    doc.setPage(1);
    if (C.timed.length) {
      const fy = 276, bx = L + 22, bw = W - 40;
      doc.setDrawColor(228, 223, 214); doc.setLineWidth(.4); doc.line(L, fy - 4, R, fy - 4);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...MUT); doc.text("Automatisch", L, fy + 2.4);
      doc.setFillColor(246, 241, 232); doc.rect(bx, fy, bw, 4, "F");
      for (const t of C.timed) { const tx = bx + (t.h % 24) / 24 * bw; doc.setFillColor(...(t.r.trigger.kind.startsWith("sun") ? ACC : INK)); doc.rect(tx - .3, fy, .6, 4, "F"); }
      doc.text("0", bx, fy + 7.5); doc.text("6", bx + bw / 4, fy + 7.5, {align: "center"}); doc.text("12", bx + bw / 2, fy + 7.5, {align: "center"}); doc.text("18", bx + bw * .75, fy + 7.5, {align: "center"}); doc.text("24 Uhr", bx + bw, fy + 7.5, {align: "right"});
      doc.setFontSize(6.3);
      const line = C.timed.map(t => fmtH(t.h) + " " + t.r.name).join("  ·  ");
      doc.text(doc.splitTextToSize(T(line), W).slice(0, 2), L, fy + 11.5);
    }
    await downloads.save({filename: "Spickzettel.pdf", data: doc.output("blob")});
    toast("Poster gespeichert. Am besten in Farbe auf A4 drucken.");
  } catch (e) { if (e && e.code === "declined") return; toast("Das Poster konnte nicht erstellt werden" + (e && e.message ? ` (${String(e.message).slice(0, 80)})` : "") + "."); }
}


/* ================= Notfall & Hilfe ================= */
const HELP_TIPS = [
  [/smart ?life|tuya/i, "Smart Life", {manual: "Taste am Gerät kurz drücken: an oder aus.", pair: "Taste etwa 5 Sekunden halten, bis die LED schnell blinkt. Dann in Smart Life auf ‚+‘ → Gerät hinzufügen.", reset: "Taste etwa 5 Sekunden halten, bis die LED schnell blinkt. Das Gerät muss danach neu eingerichtet werden."}],
  [/ewelink|sonoff/i, "eWeLink", {manual: "Taste am Gerät kurz drücken: an oder aus.", pair: "Taste etwa 5 Sekunden halten, bis die LED im Kopplungsmuster blinkt. Dann in eWeLink auf ‚+‘.", reset: "Taste lange halten (je nach Modell 5–10 Sekunden), bis die LED schnell blinkt."}],
  [/meross/i, "Meross", {manual: "Taste am Gerät kurz drücken: an oder aus.", pair: "Taste etwa 5 Sekunden halten, bis die LED abwechselnd blinkt. Dann in der Meross-App ‚+‘.", reset: "Taste etwa 5 Sekunden halten."}],
  [/kasa|tp-?link/i, "Kasa", {manual: "Taste am Gerät kurz drücken: an oder aus.", pair: "Taste etwa 5 Sekunden halten, bis die LED abwechselnd blinkt. Dann in der Kasa-App ‚+‘.", reset: "Taste etwa 10 Sekunden halten."}],
  [/alexa|echo/i, "Echo", {manual: "Aktionstaste (Punkt) drücken und sprechen.", pair: "In der Alexa-App: Geräte → ‚+‘ → Amazon Echo.", reset: "Je nach Modell die Aktionstaste etwa 25 Sekunden halten, bis der Ring orange leuchtet."}],
];
function helpSuggest(d){
  const a = appById(d.app), hay = (a?.name || "") + " " + (d.name || "");
  // Smarte Glühlampen haben keine Taste: Bedienung und Kopplung über den Lichtschalter
  if (d.type === "light" && !d.lamp) {
    const app = (a && a.id !== "other") ? a.name : "der App";
    return {label: "smarte Glühlampe", manual: "Keine Taste: am normalen Lichtschalter oder an der Lampe aus- und wieder einschalten. Nach Stromausfall geht sie meist mit voller Helligkeit an.", pair: `Lampe am Schalter 3- bis 5-mal im Abstand von etwa 1 Sekunde aus- und einschalten, bis sie schnell blinkt. Dann in ${app} auf ‚+‘ → Gerät hinzufügen.`, reset: "Wie beim Koppeln: mehrmals schnell aus- und einschalten, bis sie blinkt. Je nach Hersteller 3-, 5- oder 6-mal."};
  }
  for (const [re, label, t] of HELP_TIPS) if (re.test(hay)) return {...t, label};
  return null;
}

/* Neustart-Reihenfolge aus den Abhängigkeiten ableiten */
function restartPlan(){
  const D = state.devices.filter(d => !d.inactive);
  const isRep = d => /rep[a-z]*t[a-z]*r|mesh|access ?point/i.test(d.name);
  const router = D.filter(d => /fritz|router|modem/i.test(d.name + " " + (appById(d.app)?.name || "")) && !isRep(d) && !/dect|fon|smart ?home/i.test(d.name));
  const rep = D.filter(isRep);
  const mid = D.filter(d => d.type === "bridge" || bridgedBy(d).length || channelsOf(d).length).filter(d => !router.includes(d));
  const steps = [];
  steps.push({t: "Router neu starten", items: router.length ? router.map(d => d.name) : ["FRITZ!Box"], txt: "Stecker ziehen, 30 Sekunden warten, wieder einstecken. Warten, bis die Power- und WLAN-LED ruhig leuchten (etwa 3 Minuten)."});
  if (rep.length) steps.push({t: "Repeater", items: rep.map(d => d.name), txt: "Erst neu starten, wenn die FRITZ!Box wieder läuft. 1–2 Minuten warten."});
  if (mid.length) steps.push({t: "Bridges, Switches und Mehrfachsteckdosen", items: mid.map(d => { const n = [...bridgedBy(d), ...channelsOf(d)].length; return n ? `${d.name} (für ${n} ${n === 1 ? "Gerät" : "Geräte"})` : d.name; }), txt: "Strom kurz trennen und wieder verbinden. Etwa 1 Minute warten, bis sie verbunden sind."});
  steps.push({t: "Übrige Geräte", items: [], txt: "Nur Geräte, die immer noch nicht reagieren: kurz vom Strom nehmen oder die Taste am Gerät drücken. Geht es dann noch nicht, hilft die Störungshilfe beim Gerät."});
  return steps;
}
function restartHtml(){
  return `<ol class="rsteps">${restartPlan().map((st, i) => `<li><span class="rnum">${i + 1}</span><div><b>${esc(st.t)}</b>${st.items.length ? `<span class="ritems">${st.items.map(x => `<i>${esc(x)}</i>`).join("")}</span>` : ""}<small>${esc(st.txt)}</small></div></li>`).join("")}</ol>
    <p class="note">Die Reihenfolge ergibt sich aus „Verbunden über“ und „Gehört zu“ bei den Geräten. Was dort eingetragen ist, startet nach der FRITZ!Box und vor den Geräten, die daran hängen.</p>`;
}

/* Netzwerkplan als Baum */
function netTree(){
  const D = state.devices.filter(d => !d.inactive);
  const parentOf = d => hubOf(d) || bridgeOf(d);
  const kids = p => D.filter(d => parentOf(d)?.id === p.id).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}));
  const router = D.find(d => /fritz/i.test(d.name) && !/rep[a-z]*t[a-z]*r/i.test(d.name));
  const top = D.filter(d => !parentOf(d) && d !== router);
  const by = re => top.filter(d => re.test((linkById(d.link)?.name || "") + " " + (d.link || "")));
  const wifi = by(/wlan|wifi/i), lan = by(/kabel|ethernet|\blan\b/i).filter(d => !wifi.includes(d)), radio = top.filter(d => isRadio(d) && !bridgedBy(d).length), other = top.filter(d => !lan.includes(d) && !wifi.includes(d) && !radio.includes(d));
  const node = (d, depth = 0) => { const k = kids(d); const label = `<span class="nn" data-c="${appColor(d.app)}">${esc(d.name)}</span>${k.length ? `<small>${k.length}</small>` : ""}`;
    return k.length ? `<li><details ${depth < 1 ? "open" : ""}><summary>${label}</summary><ul>${k.map(x => node(x, depth + 1)).join("")}</ul></details></li>` : `<li><button class="nlf" data-act="edit" data-id="${d.id}">${label}</button></li>`; };
  const grp = (title, list, open) => list.length ? `<li><details ${open ? "open" : ""}><summary><span class="ng">${esc(title)}</span><small>${list.length}</small></summary><ul>${list.sort((a, b) => (kids(b).length - kids(a).length) || a.name.localeCompare(b.name, "de", {numeric: true})).map(d => node(d, 1)).join("")}</ul></details></li>` : "";
  return `<ul class="ntree"><li><details open><summary><span class="ng">Internet</span></summary><ul><li><details open><summary><span class="nn root">${esc(router?.name || "FRITZ!Box")}</span></summary><ul>
    ${grp("LAN-Kabel", lan, true)}${grp("WLAN", wifi, false)}${grp("Funk ohne Bridge", radio, false)}${grp("Ohne Angabe", other, false)}
    </ul></details></li></ul></details></li></ul>
    <p class="note">Antippen klappt auf. Geräte unter einer Bridge, einem Switch oder einer Mehrfachsteckdose hängen darunter. Tippen auf ein Gerät öffnet es.</p>`;
}

/* Konten ohne Passwörter */
function accountsHtml(){
  const apps = sortedApps().filter(a => state.devices.some(d => appClass(d.app) === a.id) || state.accounts[a.id]);
  return `<p class="note warnnote">Keine Passwörter eintragen! Nur, wo sie liegen, zum Beispiel „Passwortmanager, Eintrag Smart Life“.</p><div class="list">${apps.map(a => { const v = state.accounts[a.id] || {}, n = state.devices.filter(d => appClass(d.app) === a.id).length;
    const f = (k, l, ph) => `<label class="accf"><span>${l}</span><input class="acc-in" data-app="${a.id}" data-k="${k}" value="${esc(v[k] || "")}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false"></label>`;
    return `<details class="roomrow accrow" ${Object.values(v).some(Boolean) ? "" : ""}><summary>${appIcon(a, "abadge accico") || `<span class="accico" data-c="${a.color}"></span>`}<b>${esc(a.name)}</b><small>${n} ${n === 1 ? "Gerät" : "Geräte"}${v.acc ? " · " + esc(v.acc) : " · noch leer"}</small></summary>
      <div class="accgrid">${f("acc", "Konto / E-Mail", "familie@beispiel.de")}${f("who", "Wer hat Zugriff", "z. B. Andre, Partnerin")}${f("twofa", "Bestätigungscode geht an", "z. B. Handy von Andre (SMS)")}${f("pw", "Passwort liegt", "z. B. Passwortmanager, Eintrag „Smart Life“")}</div></details>`; }).join("")}</div>`;
}
function helpListHtml(){
  const ds = state.devices.filter(d => !d.inactive && d.help && (d.help.manual || d.help.pair || d.help.reset)).sort((a, b) => a.name.localeCompare(b.name, "de", {numeric: true}));
  const miss = state.devices.filter(d => !d.inactive && !(d.help && (d.help.manual || d.help.pair || d.help.reset)) && helpSuggest(d)).length;
  return (ds.length ? `<div class="list">${ds.map(d => `<details class="roomrow hlprow"><summary><b>${esc(d.name)}</b><small>${esc(d.room || "")}</small></summary>${[["manual", "Von Hand"], ["pair", "Neu koppeln"], ["reset", "Zurücksetzen"]].filter(([k]) => d.help[k]).map(([k, l]) => `<p><b>${l}:</b> ${esc(d.help[k])}</p>`).join("")}<button class="btn small" data-act="edit" data-id="${d.id}">Bearbeiten</button></details>`).join("")}</div>` : `<div class="list"><div class="roomrow"><span class="n">Noch keine Störungshilfe eingetragen.</span></div></div>`)
    + `<p class="note">Eintragen kannst du sie im Gerät unter „Störungshilfe“.${miss ? ` Für ${miss} Geräte gibt es dort einen fertigen Vorschlag zum Übernehmen.` : ""}</p>`;
}

/* ---------- Boot ---------- */
try { const fl = localStorage.getItem(LS+"-floor"); if (fl) curFloor = fl; showLabels = localStorage.getItem(LS+"-labels") === "1"; } catch(_){}
view = "home"; // Die App startet immer mit der Übersicht
render();

let booted = false;
function startLocal(){}
BOX.start({
  open(data){ state = normalize(data || {}); lastSaved = JSON.parse(JSON.stringify(state)); undoStack = []; booted = true; mode = "local"; ready = true; setSync("Verschlüsselt gespeichert"); view = "home"; render(); window.scrollTo(0, 0); checkHash(); },
  close(){ draft = null; rdraft = null; gmId = ""; typoOpen = false; pendingBackup = null;
    document.getElementById("modal").innerHTML = ""; document.getElementById("rmodal").innerHTML = ""; document.body.classList.remove("fs-open", "modal-open");
    ready = false; state = normalize({}); lastSaved = null; undoStack = []; render(); },
  flush(){ if (saveFn) { clearTimeout(saveTimer); const f = saveFn; f(); } },
  stash(){ try { if (draft) { readDraftFields(); return {k: "dev", d: JSON.parse(JSON.stringify(draft))}; } if (rdraft) { readRoutine(); return {k: "rt", d: JSON.parse(JSON.stringify(rdraft))}; } } catch (_) {} return null; },
  restore(x){ if (!x) return; if (x.k === "dev") { draft = x.d; renderEditor(); } else if (x.k === "rt") { rdraft = x.d; renderRoutine(); } },
  replace(d){ state = normalize(d); save(); render(); },
  markBackup(){ state.lastBackup = new Date().toISOString(); save(); },
  refresh(){ if (ready) render(); },
  go(v){ view = v; placingId = ""; render(); window.scrollTo(0, 0); },
  sheetHtml(){ return ready ? renderSheet() : ""; },
  decorate(root){ makeAccordions(root); },
  search(){ view = "list"; placingId = ""; render(); window.scrollTo(0, 0); setTimeout(() => document.getElementById("q")?.focus(), 60); },
  create(k){ if (k === "routine") openRoutine(null); else if (k === "room") { view = "rooms"; accOpen = {...accOpen, "Räume": true}; render(); setTimeout(() => { const i = document.getElementById("newRoom"); i?.scrollIntoView({block: "center"}); i?.focus(); }, 80); } else openEditor(null); }
});
