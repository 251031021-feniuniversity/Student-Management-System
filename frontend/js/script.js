/* Public pages: login / register */
const API = '../backend/index.php';
let CSRF = '';
const $ = id => document.getElementById(id);
function esc(x){return x==null?'':String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function lsGet(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}

/* ---- theme ---- */
let theme = lsGet('edu_theme','dark');
function applyTheme(){document.documentElement.setAttribute('data-theme',theme);const b=$('themeBtn');if(b)b.innerHTML=theme==='dark'?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>'}
function toggleTheme(){theme=theme==='dark'?'light':'dark';lsSet('edu_theme',theme);applyTheme()}
function togglePw(id){const el=$(id);if(el)el.type=el.type==='password'?'text':'password'}

/* ---- backend ---- */
async function initApp(){
  try{
    const r=await fetch(API+'?api=init',{credentials:'same-origin'});
    const j=await r.json();
    if(j.ok){CSRF=j.csrf;applyBrand(j.cfg);return j.cfg}
  }catch(e){}
  return null;
}
async function post(action,data,retry=true){
  try{
    if(!CSRF)await initApp();
    const r=await fetch(API+'?api='+action,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(data||{})});
    if(r.status===403&&retry){CSRF='';return post(action,data,false)}
    return await r.json().catch(()=>({ok:false,error:'Server error'}));
  }catch(e){return{ok:false,error:'Network error. Please check your connection.'}}
}

/* ---- branding from admin settings ---- */
function applyBrand(c){
  const t=(c.appFull||'EduTrack').trim(),i=t.lastIndexOf(' ');
  const html=i>0?esc(t.slice(0,i))+' <em>'+esc(t.slice(i+1))+'</em>':esc(t);
  document.querySelectorAll('[data-brand]').forEach(e=>e.innerHTML=html);
  document.querySelectorAll('[data-brand-text]').forEach(e=>e.textContent=c.appFull||'EduTrack');
  document.querySelectorAll('[data-tagline]').forEach(e=>e.textContent=c.tagline||'Student Management System');
  document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML='<i class="fas '+esc(c.logoIcon||'fa-graduation-cap')+'"></i>');
  document.documentElement.style.setProperty('--accent',c.primaryColor||'#5b6ef5');
  document.documentElement.style.setProperty('--purple',c.accentColor||'#a78bfa');
  const h=$('loginHints');if(h)h.style.display=c.showHint?'block':'none';
  if(document.title.indexOf('EduTrack')>-1)document.title=document.title.replace('EduTrack',c.appName||'EduTrack');
}

/* ---- form helper ---- */
function showMsg(type,text){const m=$('formMsg');if(!m)return;m.innerHTML=`<div class="alert a-${type}"><i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${esc(text)}</div>`;m.scrollIntoView({behavior:'smooth',block:'nearest'})}
async function submitForm(form,action,onOk,pre){
  const btn=$('formBtn');let data=Object.fromEntries(new FormData(form));
  if(pre){const err=pre(data);if(err){showMsg('error',err);return}}
  btn.classList.add('loading');btn.disabled=true;
  const r=await post(action,data);
  btn.classList.remove('loading');btn.disabled=false;
  if(r.ok)onOk(r,form);else showMsg('error',r.error||'Something went wrong');
}

document.addEventListener('DOMContentLoaded',async()=>{
  applyTheme();
  const y=$('yr');if(y)y.textContent=new Date().getFullYear();
  await initApp();

  const lf=$('loginForm');
  if(lf){
    // already signed in? go straight to the dashboard
    post('bootstrap').then(r=>{if(r.ok)location.href='app.html'});
    lf.addEventListener('submit',e=>{e.preventDefault();
      submitForm(lf,'login',()=>{location.href='app.html'});});
  }
  const rf=$('registerForm');
  if(rf)rf.addEventListener('submit',e=>{e.preventDefault();
    submitForm(rf,'register_submit',(r,f)=>{f.reset();showMsg('success','Request submitted! The administrator will review it. Once approved you can sign in with your email and password.')},
      d=>d.password!==d.confirm?'Passwords do not match':null);});
});
