javascript:(()=>{try{
const KEY="loyalty_calc_widget_v4_pos";
const state=JSON.parse(localStorage.getItem(KEY)||"{}");
const css=`
#lcw_box{position:fixed;z-index:99999;left:${state.x??30}px;top:${state.y??120}px;width:350px;background:#f6f2e8;border:1px solid #a28b5c;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font-family:Verdana,Arial,sans-serif;color:#3c2f1e}
#lcw_head{cursor:move;padding:8px 12px;background:linear-gradient(#d9c589,#b79e59);border-bottom:1px solid #a28b5c;border-radius:10px 10px 0 0;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:space-between;color:#2f2415}
#lcw_body{padding:12px}
#lcw_close{cursor:pointer;border:none;background:transparent;font-size:17px;font-weight:700;color:#3c2f1e}
#lcw_main{background:rgba(255,255,255,.85);border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:10px;margin-bottom:12px}
#lcw_now_lbl{font-size:12px;color:#5e4d36;margin-bottom:4px;font-weight:700}
#lcw_now_val{font-size:28px;font-weight:700;color:#2e261d;text-align:center}
#lcw_nob_lbl{font-size:11px;color:#5e4d36;margin-top:4px;text-align:center}
#lcw_table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:12px}
#lcw_table td{padding:5px 8px;vertical-align:middle}
#lcw_table td:first-child{color:#4b3b25;font-weight:700;width:47%}
#lcw_small{font-size:11px;color:#6b5542;opacity:.85;margin-top:4px}
.lcw_inp{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #a28b5c;border-radius:6px;background:#fff;font-size:12px}
.lcw_chk{transform:translateY(1px)}
`;
const addStyle=()=>{const s=document.createElement("style");s.id="lcw_style";s.textContent=css;document.head.appendChild(s);}
const removeOld=()=>{document.getElementById("lcw_style")?.remove();document.getElementById("lcw_box")?.remove();}
removeOld(); addStyle();

const box=document.createElement("div");
box.id="lcw_box";
box.innerHTML=`
  <div id="lcw_head">
    <span>Kalkulačka Oddanosti</span>
    <button id="lcw_close" title="Zavřít">✕</button>
  </div>
  <div id="lcw_body">
    <div id="lcw_manual_area">
      <label style="display:flex;gap:8px;align-items:center;font-size:12px;font-weight:700;color:#3c2f1e">
        <input id="lcw_manual" class="lcw_chk" type="checkbox">
        Ruční zadání
      </label>
      <div id="lcw_manual_wrap" style="margin-top:8px;display:none">
        <div>
          <div id="lcw_small">Oddanost po útoku</div>
          <input id="lcw_inp_loy" class="lcw_inp" type="number" min="0" max="100" placeholder="např. 52">
        </div>
        <div style="margin-top:8px">
          <div id="lcw_small">Čas boje (DD.MM.YYYY HH:MM:SS)</div>
          <input id="lcw_inp_time" class="lcw_inp" type="text" inputmode="numeric" placeholder="např. 28.01.2026 21:30:00">
        </div>
        <div id="lcw_small" style="margin-top:6px">
          Tip: napiš jen čísla času (např. <b>093320</b>) → doplní se jako <b>09:33:20</b>
        </div>
      </div>
    </div>

    <div id="lcw_main">
      <div id="lcw_now_lbl">Odhad aktuální oddanosti</div>
      <div id="lcw_now_val">–</div>
      <div id="lcw_nob_lbl">Šlechtici: –</div>
    </div>

    <table id="lcw_table">
      <tr><td>Oddanost po boji:</td><td id="lcw_loy">–</td></tr>
      <tr><td>Čas boje:</td><td id="lcw_bt">–</td></tr>
      <tr><td>Rychlost regen:</td><td id="lcw_spd">–</td></tr>
      <tr><td>Uběhlo:</td><td id="lcw_el">–</td></tr>
    </table>

    <div id="lcw_small">Výpočet je odhad (20–35 na šlechtice).</div>
  </div>
`;
document.body.appendChild(box);

const $=sel=>box.querySelector(sel);
const manualChk=$("#lcw_manual");
const manualWrap=$("#lcw_manual_wrap");
const inpLoy=$("#lcw_inp_loy");
const inpTime=$("#lcw_inp_time");

$("#lcw_close").onclick=()=>{removeOld();};

function savePos(p){
  const s=JSON.parse(localStorage.getItem(KEY)||"{}");
  Object.assign(s,p);
  localStorage.setItem(KEY,JSON.stringify(s));
}

function parseCZDateTime(s){
  if(!s) return null;
  s=(s+"").replace(/\u00A0/g," ").trim();
  const m=s.match(/^(\d{2})\.(\d{2})\.(\d{2,4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if(!m) return null;
  let dd=+m[1],mm=+m[2]-1,yy=+m[3],HH=+m[4],MM=+m[5],SS=+m[6];
  if(yy<100)yy+=2000;
  return new Date(yy,mm,dd,HH,MM,SS);
}

function getServerNow(){
  try{
    const sd=document.querySelector("#serverDate")?.textContent?.trim();
    const st=document.querySelector("#serverTime")?.textContent?.trim();
    if(sd&&st){
      const m=sd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const t=st.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if(m&&t) return new Date(+m[3],+m[2]-1,+m[1],+t[1],+t[2],+t[3]);
    }
  }catch(e){}
  return new Date();
}

function pad2(n){ return String(n).padStart(2,"0"); }

function todayZeroTime(){
  const d=getServerNow();
  return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()} 00:00:00`;
}

// ====== TIME INPUT SMART (093320 -> 09:33:20) ======
function extractDigits(str){ return (str||"").replace(/\D/g,""); }

function formatTimeFromDigits(dig){
  dig=(dig||"").slice(0,6);
  const hh=dig.slice(0,2).padEnd(2,"0");
  const mm=dig.slice(2,4).padEnd(2,"0");
  const ss=dig.slice(4,6).padEnd(2,"0");
  return `${hh}:${mm}:${ss}`;
}

function setTimeDigits(digits){
  const baseDate = (inpTime.value||"").match(/^(\d{2}\.\d{2}\.\d{2,4})/)?.[1];
  const datePart = baseDate || todayZeroTime().split(" ")[0];
  inpTime.value = `${datePart} ${formatTimeFromDigits(digits)}`;
}

// ====== read report ======
function getSpeed(){
  const raw=localStorage.getItem("world_config");
  if(!raw) return null;
  let cfg;try{cfg=JSON.parse(raw);}catch(e){return null;}
  const sp=parseFloat(cfg?.speed||cfg?.config?.speed);
  return isNaN(sp)?null:sp;
}

function readReport(){
  let loyalty=null,battleTime=null;
  const th=[...document.querySelectorAll("#attack_results th")].find(x=>/Oddanost/i.test(x.textContent||""));
  if(th){
    const td=th.nextElementSibling;
    const txt=(td?.textContent||"").trim();
    const nums=txt.split(/\s+/).filter(x=>!isNaN(x)).map(Number);
    if(nums.length>=2)loyalty=parseInt(nums[1],10);
    else if(nums.length>=1)loyalty=parseInt(nums[0],10);
  }
  const t=document.querySelector(".small.grey")?.parentElement?.textContent?.trim();
  if(t) battleTime=parseCZDateTime(t);
  if(!battleTime){
    const body=document.body.innerText.replace(/\u00A0/g," ");
    const m=body.match(/Čas\s*boje\s*[:\-]?\s*([0-9]{2}\.[0-9]{2}\.[0-9]{2,4}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})/i);
    if(m)battleTime=parseCZDateTime(m[1]);
  }
  return {loyalty,battleTime};
}

function estimateNobles(L){
  const avgDrop=27.5,minDrop=20,maxDrop=35;
  const avg=Math.ceil(L/avgDrop),best=Math.ceil(L/maxDrop),worst=Math.ceil(L/minDrop);
  return {avg,best,worst};
}

function update(){
  const speed=getSpeed();
  $("#lcw_spd").textContent=speed!=null?`${speed} / hod`:"–";

  let loyalty,battleTime;
  if(manualChk.checked){
    loyalty=parseInt(inpLoy.value,10);
    battleTime=parseCZDateTime(inpTime.value);
  }else{
    const r=readReport();
    loyalty=r.loyalty;
    battleTime=r.battleTime;
  }

  $("#lcw_loy").textContent=(!isNaN(loyalty)?loyalty:"–");
  $("#lcw_bt").textContent=(battleTime&& !isNaN(battleTime.getTime()))?battleTime.toLocaleString():"–";

  if(speed==null||isNaN(loyalty)||!battleTime||isNaN(battleTime.getTime())){
    $("#lcw_el").textContent="–";
    $("#lcw_now_val").textContent="–";
    $("#lcw_nob_lbl").textContent="Šlechtici: –";
    return;
  }

  const now=getServerNow();
  const hours=(now-battleTime)/(1000*60*60);
  const est=Math.min(100,loyalty+hours*speed);

  $("#lcw_el").textContent=`${Math.floor(hours)}h ${Math.floor((hours%1)*60)}m`;
  $("#lcw_now_val").textContent=Math.floor(est);

  const n=estimateNobles(Math.floor(est));
  $("#lcw_nob_lbl").textContent=`Šlechtici: ≈ ${n.avg} (rozsah ${n.best}–${n.worst})`;
}

// ====== MANUAL DEFAULTS ======
manualChk.checked=false;
manualWrap.style.display="none";
inpLoy.value="";
inpTime.value="";

manualChk.onchange=()=>{
  manualWrap.style.display=manualChk.checked?"block":"none";

  if(manualChk.checked){
    // vždycky připrav dnešní datum + 00:00:00
    inpTime.value=todayZeroTime();

    // fokus rovnou do času (a vybere čas část)
    inpTime.focus();
    // vybrat jen časovou část (za mezerou)
    setTimeout(()=>{
      try{
        const pos = inpTime.value.indexOf(" ")+1;
        inpTime.setSelectionRange(pos, inpTime.value.length);
      }catch(e){}
    },0);
  }

  update();
};

inpLoy.oninput=()=>update();

// chytrý psaní času
inpTime.addEventListener("keydown",(e)=>{
  if(!manualChk.checked) return;

  // povolit navigaci / mazání
  const allowedKeys=["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
  if(allowedKeys.includes(e.key)) return;

  // povolit přepsání celého textu (ctrl+a)
  if((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==="a")) return;

  // pokud je číslo, zpracujeme ho sami
  if(/^\d$/.test(e.key)){
    e.preventDefault();

    // vezmeme aktuální digits z času
    const curDigits = extractDigits(inpTime.value).slice(-6); // posledních 6 = HHMMSS
    const next = (curDigits + e.key).slice(-6);

    setTimeDigits(next);

    // kurzor necháme vždycky na konci času
    setTimeout(()=>{
      try{
        inpTime.setSelectionRange(inpTime.value.length, inpTime.value.length);
      }catch(e){}
    },0);

    update();
    return;
  }

  // bloknout ostatní znaky (ať se to nerozbije)
  e.preventDefault();
});

inpTime.addEventListener("input",()=>update());

update();

// drag
let drag=false,dx=0,dy=0;
const head=document.getElementById("lcw_head");
head.addEventListener("mousedown",e=>{drag=true;const r=box.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;});
document.addEventListener("mousemove",e=>{if(!drag)return;box.style.left=(e.clientX-dx)+"px";box.style.top=(e.clientY-dy)+"px";box.style.right="auto";box.style.bottom="auto";});
document.addEventListener("mouseup",()=>{if(!drag)return;drag=false;savePos({x:parseInt(box.style.left,10),y:parseInt(box.style.top,10)});});

}catch(err){alert("Chyba: "+(err?.message||err));}})();
