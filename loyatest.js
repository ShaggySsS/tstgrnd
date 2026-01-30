javascript:(()=>{try{
const KEY="loyalty_calc_widget_v3";
const state=JSON.parse(localStorage.getItem(KEY)||"{}");

const css=`
#lcw_box{position:fixed;z-index:99999;left:${state.x??30}px;top:${state.y??120}px;width:320px;background:#f4e4bc;border:1px solid #8b6b2e;border-radius:10px;box-shadow:0 8px 25px rgba(0,0,0,.25);font-family:Verdana,Arial,sans-serif;color:#3b2a12}
#lcw_head{cursor:move;padding:8px 10px;background:linear-gradient(#d2b26c,#b89143);border-bottom:1px solid #8b6b2e;border-radius:10px 10px 0 0;font-weight:700;display:flex;align-items:center;justify-content:space-between}
#lcw_head span{font-size:13px}
#lcw_close{cursor:pointer;border:none;background:transparent;font-size:16px;font-weight:700;color:#3b2a12}
#lcw_body{padding:10px}
#lcw_table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:12px}
#lcw_table td{padding:4px 6px;vertical-align:middle}
#lcw_table td:first-child{color:#4a3417;font-weight:700;width:45%}
#lcw_value{font-weight:700}
#lcw_hint{font-size:11px;color:#6b4a1d;margin-top:6px;opacity:.9}
#lcw_row_manual{background:rgba(255,255,255,.35);border:1px solid rgba(0,0,0,.08);border-radius:8px;padding:8px}
#lcw_manual_wrap{margin-top:8px;display:none}
.lcw_inp{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #8b6b2e;border-radius:8px;background:#fff;font-size:12px}
.lcw_chk{transform:translateY(1px)}
#lcw_small{font-size:11px;color:#5b3f18}
`;
const addStyle=()=>{const s=document.createElement("style");s.id="lcw_style";s.textContent=css;document.head.appendChild(s);};
const removeOld=()=>{document.getElementById("lcw_style")?.remove();document.getElementById("lcw_box")?.remove();};

removeOld(); addStyle();

const box=document.createElement("div");
box.id="lcw_box";
box.innerHTML=`
  <div id="lcw_head">
    <span>Kalkulačka oddanosti</span>
    <button id="lcw_close" title="Zavřít">✕</button>
  </div>
  <div id="lcw_body">
    <div id="lcw_row_manual">
      <label style="display:flex;gap:8px;align-items:center;font-size:12px;font-weight:700;color:#3b2a12;">
        <input id="lcw_manual" class="lcw_chk" type="checkbox">
        Ruční zadání (přepsat report)
      </label>

      <div id="lcw_manual_wrap">
        <div style="margin-top:8px">
          <div id="lcw_small">Oddanost po útoku</div>
          <input id="lcw_inp_loy" class="lcw_inp" type="number" min="0" max="100" placeholder="např. 52">
        </div>

        <div style="margin-top:8px">
          <div id="lcw_small">Čas boje (DD.MM.YYYY HH:MM:SS)</div>
          <input id="lcw_inp_time" class="lcw_inp" type="text" placeholder="např. 28.01.2026 21:30:00">
        </div>

        <div style="margin-top:6px;font-size:11px;color:#5b3f18;opacity:.95">
          Tip: formát musí sedět přesně, jinak se čas nevezme.
        </div>
      </div>
    </div>

    <table id="lcw_table">
      <tr><td>Počáteční oddanost:</td><td id="lcw_loy">–</td></tr>
      <tr><td>Kdy tam byla počáteční oddanost:</td><td id="lcw_bt">–</td></tr>
      <tr><td>Rychlost regenerace:</td><td id="lcw_spd">–</td></tr>
      <tr><td>Uběhlo:</td><td id="lcw_el">–</td></tr>
      <tr><td><b>Odhad oddanosti teď:</b></td><td id="lcw_now"><b>–</b></td></tr>
      <tr><td>Potřeba šlechticů (odhad):</td><td id="lcw_nob">–</td></tr>
    </table>

    <div id="lcw_hint">Výpočet je jen odhad (regen + náhodné ubírání šlechticem).</div>
  </div>
`;
document.body.appendChild(box);

const $=sel=>box.querySelector(sel);
const manualChk=$("#lcw_manual");
const manualWrap=$("#lcw_manual_wrap");
const inpLoy=$("#lcw_inp_loy");
const inpTime=$("#lcw_inp_time");

manualChk.checked=!!state.manual;
manualWrap.style.display=manualChk.checked?"block":"none";
inpLoy.value=state.manualLoy??"";
inpTime.value=state.manualTime??"";

$("#lcw_close").onclick=()=>{removeOld();};

function saveState(patch){
  const s=JSON.parse(localStorage.getItem(KEY)||"{}");
  Object.assign(s,patch);
  localStorage.setItem(KEY,JSON.stringify(s));
}

manualChk.onchange=()=>{
  manualWrap.style.display=manualChk.checked?"block":"none";
  saveState({manual:manualChk.checked});
  update();
};

inpLoy.oninput=()=>{saveState({manualLoy:inpLoy.value}); update();};
inpTime.oninput=()=>{saveState({manualTime:inpTime.value}); update();};

function parseCZDateTime(s){
  if(!s) return null;
  s=(""+s).replace(/\u00A0/g," ").trim();
  const m=s.match(/^(\d{2})\.(\d{2})\.(\d{2,4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if(!m) return null;
  let dd=+m[1], mm=+m[2]-1, yy=+m[3], HH=+m[4], MM=+m[5], SS=+m[6];
  if(yy<100) yy+=2000;
  return new Date(yy,mm,dd,HH,MM,SS);
}

function getServerNow(){
  try{
    const sd=document.querySelector("#serverDate")?.textContent?.trim();
    const st=document.querySelector("#serverTime")?.textContent?.trim();
    if(sd&&st){
      const m=sd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const t=st.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if(m&&t){
        return new Date(+m[3],+m[2]-1,+m[1],+t[1],+t[2],+t[3]);
      }
    }
  }catch(e){}
  return new Date();
}

function getSpeed(){
  const raw=localStorage.getItem("world_config");
  if(!raw) return null;
  let cfg;
  try{ cfg=JSON.parse(raw); }catch(e){ return null; }
  const spd=parseFloat(cfg?.speed||cfg?.config?.speed);
  return isNaN(spd)?null:spd;
}

function readFromReport(){
  // Oddanost z reportu
  let loyalty=null;
  const th=[...document.querySelectorAll("#attack_results th")].find(x=>/Oddanost/i.test(x.textContent||""));
  if(th){
    const td=th.nextElementSibling;
    if(td){
      const txt=(td.textContent||"").trim();
      const nums=txt.split(/\s+/).filter(x=>!isNaN(x)).map(Number);
      if(nums.length>=2) loyalty=parseInt(nums[1],10);
      else if(nums.length>=1) loyalty=parseInt(nums[0],10);
    }
  }

  // Čas boje (běžně je v .small.grey parentu)
  let battleTime=null;
  const t=document.querySelector(".small.grey")?.parentElement?.textContent?.trim();
  if(t) battleTime=parseCZDateTime(t);

  // fallback: textově v body
  if(!battleTime){
    const body=(document.body.innerText||"").replace(/\u00A0/g," ");
    const m=body.match(/Čas\s*boje\s*[:\-]?\s*([0-9]{2}\.[0-9]{2}\.[0-9]{2,4}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})/i);
    if(m) battleTime=parseCZDateTime(m[1]);
  }

  return {loyalty,battleTime};
}

function estimateNobles(currentLoyalty){
  // TW ubírá náhodně cca 20–35.
  // Odhadneme průměr 27.5 → nobles ≈ ceil(L / 27.5)
  const avgDrop=27.5;
  const minDrop=20, maxDrop=35;

  const avg=Math.ceil(currentLoyalty/avgDrop);
  const best=Math.ceil(currentLoyalty/maxDrop); // když padá vysoko
  const worst=Math.ceil(currentLoyalty/minDrop); // když padá nízko

  return {avg,best,worst};
}

function update(){
  const speed=getSpeed();
  $("#lcw_spd").textContent = speed!=null ? `${speed} / hod` : "nenalezeno";

  let loyalty=null;
  let battleTime=null;

  if(manualChk.checked){
    loyalty=parseInt(inpLoy.value,10);
    battleTime=parseCZDateTime(inpTime.value);
  }else{
    const r=readFromReport();
    loyalty=r.loyalty;
    battleTime=r.battleTime;
  }

  $("#lcw_loy").textContent = (loyalty!=null && !isNaN(loyalty)) ? loyalty : "–";
  $("#lcw_bt").textContent = (battleTime && !isNaN(battleTime.getTime())) ? battleTime.toLocaleString() : "–";

  if(speed==null || loyalty==null || isNaN(loyalty) || !battleTime || isNaN(battleTime.getTime())){
    $("#lcw_el").textContent="–";
    $("#lcw_now").textContent="–";
    $("#lcw_nob").textContent="–";
    return;
  }

  const now=getServerNow();
  const hours=(now-battleTime)/(1000*60*60);
  if(hours<0){
    $("#lcw_el").textContent="čas v budoucnosti";
    $("#lcw_now").textContent="–";
    $("#lcw_nob").textContent="–";
    return;
  }

  const estimated=Math.min(100, loyalty + hours*speed);

  const h=Math.floor(hours);
  const m=Math.floor((hours-h)*60);
  $("#lcw_el").textContent=`${h}h ${m}m`;

  const estFloor=Math.floor(estimated);
  $("#lcw_now").textContent=estFloor;

  const n=estimateNobles(estFloor);
  $("#lcw_nob").textContent=`≈ ${n.avg} (rozmezí ${n.best}–${n.worst})`;
}

update();

// Drag + uložení pozice (PC)
const head=document.getElementById("lcw_head");
let drag=false, dx=0, dy=0;

head.addEventListener("mousedown",(e)=>{
  drag=true;
  const r=box.getBoundingClientRect();
  dx=e.clientX-r.left;
  dy=e.clientY-r.top;
  e.preventDefault();
});

document.addEventListener("mousemove",(e)=>{
  if(!drag) return;
  const x=Math.max(0,Math.min(window.innerWidth-20,e.clientX-dx));
  const y=Math.max(0,Math.min(window.innerHeight-20,e.clientY-dy));
  box.style.left=x+"px";
  box.style.top=y+"px";
});

document.addEventListener("mouseup",()=>{
  if(!drag) return;
  drag=false;
  saveState({x:parseInt(box.style.left,10),y:parseInt(box.style.top,10)});
});

}catch(err){alert("Chyba: "+(err?.message||err));}})();
