/* Shared helpers for pay.html / invoice.html */
const API='../backend/index.php';let CSRF='';
const $=id=>document.getElementById(id);
function esc(x){return x==null?'':String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function fdate(d){if(!d)return'—';return new Date(String(d).length===10?d+'T00:00:00':d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function money(n){return'৳'+Number(n||0).toLocaleString()}
try{document.documentElement.setAttribute('data-theme',localStorage.getItem('edu_theme')||'dark')}catch(e){}
async function initCsrf(){try{const r=await fetch(API+'?api=init',{credentials:'same-origin',cache:'no-store'});const j=await r.json();CSRF=j.csrf;if(j.cfg&&$('brand'))$('brand').textContent=j.cfg.appFull}catch(e){}}
async function api(a,d={},retry=true){
  try{
    if(!CSRF)await initCsrf();
    const r=await fetch(API+'?api='+a,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(d)});
    const j=await r.json().catch(()=>({ok:false,error:'Server error'}));
    if(r.status===403&&retry){CSRF='';return api(a,d,false)}          // stale token -> refresh once and retry
    if(r.status===401){location.href='login.html';return j}
    return j;
  }catch(e){return{ok:false,error:'Network error. Check your connection.'}}
}
