/* ================= CONFIG / STATE ================= */
const API='../backend/index.php';
let CSRF='';
let cfg={appFull:'EduTrack Pro',appName:'EduTrack',tagline:'Student Management System',logoIcon:'fa-graduation-cap',primaryColor:'#5b6ef5',accentColor:'#a78bfa',allowStudentPw:true,allowTeacherPw:true,showHint:false};
async function initCsrf(){try{const r=await fetch(API+'?api=init',{credentials:'same-origin'});const j=await r.json();CSRF=j.csrf;cfg=j.cfg}catch(e){}}
const $=id=>document.getElementById(id);
function lsGet(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
let cUser=null,cTab='dashboard',users=[],students=[],results=[],attendance=[],notices=[],requests=[],fees=[],defaultPw=false,myStudent=null;
let settings={theme:lsGet('edu_theme','dark'),perPage:parseInt(lsGet('edu_pp','10'))||10};
let stSQ='',stSF='name',stSD='asc',stPage=1,tcSQ='',resSQ='',attDate='',bulkD='',stuProfileSid='';

/* ================= API ================= */
async function api(a,d={},retry=true){
  try{
    if(!CSRF)await initCsrf();
    const r=await fetch(API+'?api='+a,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(d)});
    const j=await r.json().catch(()=>({ok:false,error:'Server error'}));
    if(r.status===403&&retry){CSRF='';return api(a,d,false)}   // stale CSRF token -> refresh once
    if(r.status===401&&a!=='login'&&a!=='bootstrap'){location.href='login.html';}
    return j;
  }catch(e){return{ok:false,error:'Network error. Check your connection.'}}
}
async function load(){
  const j=await api('bootstrap'); if(!j.ok)return false;
  cUser=j.user;users=j.users;students=j.students;results=j.results;attendance=j.attendance;notices=j.notices;cfg=j.cfg;defaultPw=j.defaultPw;requests=j.requests||[];fees=j.fees||[];
  myStudent=cUser.role==='student'?(students.find(x=>x.sid===cUser.uid)||null):null;
  return true;
}
async function act(action,data,msg,before){
  const r=await api(action,data);
  if(!r.ok){toast(r.error||'Failed','error');return false;}
  if(before)before(r);
  await load(); applyBrand();
  if(msg)toast(typeof msg==='function'?msg(r):msg,'success');
  if(cUser&&!NAV[cUser.role].some(t=>t.id===cTab)&&!['stu_profile'].includes(cTab))cTab='dashboard';
  buildSidebar(); renderPage(); return true;
}

/* ================= UTILS ================= */
function esc(x){return x==null?'':String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fdate(d){if(!d)return'—';return new Date(String(d).length===10?d+'T00:00:00':d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function grade(m,t){const p=t?m/t*100:m;
  if(p>=80)return['A+','4.00','#10d9a0'];if(p>=70)return['A','3.75','#34d399'];if(p>=60)return['A-','3.50','#6ee7b7'];
  if(p>=50)return['B','3.00','#fbbf24'];if(p>=40)return['C','2.00','#f97316'];if(p>=33)return['D','1.00','#f87171'];return['F','0.00','#f43f5e']}
function gb(r){const[g,gpa,c]=grade(r.marks,r.total);return{g,gpa,c,html:`<div class="grade-badge" style="background:${c}22;color:${c};border:1px solid ${c}44">${g}</div>`}}
function attPct(sid){const a=attendance.filter(x=>x.sid===sid);return a.length?Math.round(a.filter(x=>x.status==='present').length/a.length*100):0}
function pctColor(p){return p>=75?'var(--accent3)':p>=50?'var(--accent2)':'var(--danger)'}
function togglePw(id){const el=$(id);if(el)el.type=el.type==='password'?'text':'password'}
function avatarHtml(s2,size=40){
  if(s2&&s2.img)return`<img src="${esc(s2.img)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'">`;
  return`<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:${Math.round(size*.38)}px;">${esc((s2?s2.name:'U').charAt(0).toUpperCase())}</div>`}
function toast(msg,type='success'){
  const ico={success:'check-circle',error:'exclamation-circle',warning:'exclamation-triangle',info:'info-circle'}[type];
  const col={success:'accent3',error:'danger',warning:'accent2',info:'accent'}[type];
  const el=document.createElement('div');el.className='toast t-'+type;
  el.innerHTML=`<i class="fas fa-${ico}" style="color:var(--${col})"></i><span style="flex:1">${esc(msg)}</span><button class="toast-x" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  $('toastBox').appendChild(el);setTimeout(()=>el.remove(),type==='error'?12000:4000)}
function openModal(id){$(id).classList.add('open')}function closeModal(id){$(id).classList.remove('open')}
function applyTheme(){document.documentElement.setAttribute('data-theme',settings.theme);const b=$('themeBtn');if(b)b.innerHTML=settings.theme==='dark'?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>'}
function toggleTheme(){settings.theme=settings.theme==='dark'?'light':'dark';lsSet('edu_theme',settings.theme);applyTheme()}
function brandHtml(){const t=(cfg.appFull||'EduTrack').trim(),i=t.lastIndexOf(' ');return i>0?esc(t.slice(0,i))+' <em>'+esc(t.slice(i+1))+'</em>':esc(t)}
function applyBrand(){
  $('appName').innerHTML=brandHtml();$('appTagline').textContent=cfg.tagline||'Student Management System';
  $('appIco').innerHTML=`<i class="fas ${esc(cfg.logoIcon||'fa-graduation-cap')}"></i>`;
  document.documentElement.style.setProperty('--accent',cfg.primaryColor||'#5b6ef5');
  document.documentElement.style.setProperty('--purple',cfg.accentColor||'#a78bfa');
  document.title=(cfg.appFull||'EduTrack')+' — Dashboard'}

/* ================= AUTH ================= */
async function logout(){if(!confirm('সাইন আউট করতে চান?'))return;await api('logout');location.href='login.html'}

/* ================= NAV ================= */
const NAV={
  admin:[{id:'dashboard',l:'Dashboard',i:'fa-chart-line'},{id:'students',l:'Students',i:'fa-user-graduate'},{id:'teachers',l:'Teachers',i:'fa-chalkboard-teacher'},{id:'attendance',l:'Attendance',i:'fa-calendar-check'},{id:'results',l:'Results',i:'fa-file-alt'},{id:'notices',l:'Notices',i:'fa-bullhorn'},{id:'fees',l:'Fees',i:'fa-money-bill-wave'},{id:'requests',l:'Requests',i:'fa-user-clock'},{id:'settings',l:'Settings',i:'fa-cog'}],
  teacher:[{id:'dashboard',l:'Dashboard',i:'fa-home'},{id:'attendance',l:'Attendance',i:'fa-calendar-check'},{id:'results',l:'Results',i:'fa-file-alt'},{id:'notices',l:'Notices',i:'fa-bullhorn'},{id:'profile',l:'My Profile',i:'fa-id-card'}],
  student:[{id:'dashboard',l:'Dashboard',i:'fa-home'},{id:'my_results',l:'My Results',i:'fa-file-alt'},{id:'my_att',l:'My Attendance',i:'fa-calendar-check'},{id:'my_fees',l:'My Fees',i:'fa-money-bill-wave'},{id:'notices',l:'Notices',i:'fa-bullhorn'},{id:'profile',l:'My Profile',i:'fa-id-card'}]};
function buildSidebar(){
  $('sbName').textContent=cUser.name;$('sbRole').textContent=cUser.role;
  const b=$('sbBadge');b.className='sb-role-badge role-'+cUser.role;b.textContent=cUser.role.toUpperCase();
  const av=$('sbAvatar');
  if(myStudent&&myStudent.img)av.innerHTML=`<img src="${esc(myStudent.img)}">`;else av.textContent=cUser.name.charAt(0).toUpperCase();
  $('sbNav').innerHTML='<div class="sb-section">Menu</div>'+NAV[cUser.role].map(t=>`<a href="#" class="sb-link${cTab===t.id||(cTab==='stu_profile'&&t.id==='students')?' active':''}" onclick="nav('${t.id}');return false;"><span class="ico"><i class="fas ${t.i}"></i></span> ${t.l}</a>`).join('')}
function nav(tab){cTab=tab;buildSidebar();renderPage();window.scrollTo({top:0,behavior:'smooth'});closeSB()}
function toggleSB(){$('sidebar').classList.toggle('open');$('overlay').classList.toggle('open')}
function closeSB(){$('sidebar').classList.remove('open');$('overlay').classList.remove('open')}

/* ================= RENDER ================= */
const TITLES={dashboard:'Dashboard',students:'Students',teachers:'Teachers',attendance:'Attendance',results:'Results',notices:'Notices',settings:'Settings',profile:'My Profile',my_results:'My Results',my_att:'My Attendance',stu_profile:'Student Profile',requests:'Admission Requests',fees:'Fees',my_fees:'My Fees'};
function renderPage(){
  const ae=document.activeElement,aid=ae&&ae.id,title=TITLES[cTab]||'Dashboard',role=cUser.role;
  const top=`<div class="topbar"><div class="topbar-left"><button class="menu-toggle" onclick="toggleSB()"><i class="fas fa-bars"></i></button><div>
    <div class="breadcrumb"><a href="#" onclick="nav('dashboard');return false;">Home</a> <span>›</span> <span>${title}</span></div>
    <h1>${title}</h1><div class="sub">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div></div></div>
    <div class="topbar-right">${role==='admin'?`<button class="btn btn-ghost btn-sm" onclick="exportData()"><i class="fas fa-download"></i> Export</button>`:''}<button class="btn btn-ghost btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button></div></div>`;
  let body='';
  const A=role==='admin',T=role==='teacher',S=role==='student';
  if(cTab==='dashboard')body=A?adminDash():T?teacherDash():studentDash();
  else if(cTab==='students'&&A)body=studentsTab();
  else if(cTab==='teachers'&&A)body=teachersTab();
  else if(cTab==='attendance'&&(A||T))body=attendanceTab();
  else if(cTab==='results'&&(A||T))body=resultsTab();
  else if(cTab==='notices')body=noticesTab();
  else if(cTab==='requests'&&A)body=requestsTab();
  else if(cTab==='fees'&&A)body=feesTab();
  else if(cTab==='my_fees'&&S)body=myFees();
  else if(cTab==='settings'&&A)body=settingsTab();
  else if(cTab==='profile'&&T)body=teacherProfile();
  else if(cTab==='profile'&&S)body=studentProfile();
  else if(cTab==='my_results'&&S)body=myResults();
  else if(cTab==='my_att'&&S)body=myAttendance();
  else if(cTab==='stu_profile'&&A)body=stuProfileAdmin();
  else body=`<div class="card"><div class="empty"><div class="ei">🚧</div><h4>Not available</h4></div></div>`;
  $('mainContent').innerHTML=top+body;
  if(aid&&['stQ','tcQ','rsQ','feeQ'].includes(aid)){const el=$(aid);if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}}
  setTimeout(()=>{if(cTab==='dashboard'&&A)initAdminCharts();if(cTab==='dashboard'&&T)initTeacherCharts();if(cTab==='dashboard'&&S)initStudentCharts();if(cTab==='my_results')initResultCharts()},60)}

const AXES={y:{beginAtZero:true,grid:{color:'rgba(128,128,128,.12)'},ticks:{color:'#7a84a6'}},x:{grid:{display:false},ticks:{color:'#7a84a6'}}};
function barChart(id,labels,data,label){const c=$(id);if(!c)return;
  if(!labels.length){c.parentElement.innerHTML='<div class="empty" style="padding:20px"><div class="ei">📊</div><p>No data yet</p></div>';return}
  new Chart(c,{type:'bar',data:{labels,datasets:[{label,data,backgroundColor:'rgba(91,110,245,.7)',borderRadius:8,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{...AXES.y,max:100},x:AXES.x}}})}

/* ---- dashboards ---- */
function adminDash(){
  const todayPres=attendance.filter(a=>a.date===today()&&a.status==='present').length;
  const recent=students.slice(-5).reverse(),recentN=notices.slice(-3).reverse();
  return`${defaultPw?`<div class="alert a-warn"><i class="fas fa-exclamation-triangle"></i> Default admin password (admin123) is still active. <a href="#" onclick="nav('settings');return false;" style="text-decoration:underline;font-weight:700">Change it now →</a></div>`:''}
  <div class="stats-grid">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-user-graduate"></i></div><div class="sc-val">${students.length}</div><div class="sc-label">Total Students</div></div>
    <div class="stat-card s5"><div class="sc-ico"><i class="fas fa-chalkboard-teacher"></i></div><div class="sc-val">${users.filter(u=>u.role==='teacher').length}</div><div class="sc-label">Teachers</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-check-circle"></i></div><div class="sc-val">${todayPres}</div><div class="sc-label">Present Today</div></div>
    <div class="stat-card s3"><div class="sc-ico"><i class="fas fa-file-alt"></i></div><div class="sc-val">${results.length}</div><div class="sc-label">Result Entries</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-bullhorn"></i></div><div class="sc-val">${notices.length}</div><div class="sc-label">Notices</div></div>
    <div class="stat-card s5"><div class="sc-ico"><i class="fas fa-money-bill-wave"></i></div><div class="sc-val">৳${totalDue(fees).toLocaleString()}</div><div class="sc-label">Fees Due</div></div>
  </div>
  <div class="charts-grid">
    <div class="card"><div class="card-head"><h3><i class="fas fa-chart-line" style="color:var(--accent)"></i> Attendance Trend (7 Days)</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="attChart"></canvas></div></div></div>
    <div class="card"><div class="card-head"><h3><i class="fas fa-chart-pie" style="color:var(--accent2)"></i> Grade Distribution</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="gradeChart"></canvas></div></div></div>
  </div>
  <div class="two-col">
    <div class="card"><div class="card-head"><h3><i class="fas fa-users" style="color:var(--accent3)"></i> Recent Students</h3><a href="#" onclick="nav('students');return false;" style="font-size:.8rem;color:var(--accent);font-weight:600">View all →</a></div>
      <div class="tbl-wrap"><table><tr><th>Name</th><th>ID</th><th>Class</th></tr>
      ${recent.map(s=>`<tr style="cursor:pointer" onclick="viewStuProfile('${esc(s.sid)}')"><td><strong>${esc(s.name)}</strong></td><td><span class="badge b-accent">${esc(s.sid)}</span></td><td>${esc(s.class||'—')}</td></tr>`).join('')}
      ${!recent.length?'<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:24px">No students yet</td></tr>':''}</table></div></div>
    <div class="card"><div class="card-head"><h3><i class="fas fa-bell" style="color:var(--accent2)"></i> Latest Notices</h3><a href="#" onclick="nav('notices');return false;" style="font-size:.8rem;color:var(--accent);font-weight:600">View all →</a></div>
      <div class="card-body" style="padding:16px">
      ${recentN.map(n=>`<div class="notice-item pri-${esc(n.priority)}"><h4>${esc(n.title)}</h4><p>${esc(n.body.substring(0,80))}${n.body.length>80?'...':''}</p><div class="notice-meta"><span><i class="fas fa-calendar"></i> ${esc(n.date)}</span><span><i class="fas fa-user"></i> ${esc(n.by)}</span></div></div>`).join('')}
      ${!recentN.length?'<div class="empty"><div class="ei">📭</div><p>No notices yet</p></div>':''}</div></div>
  </div>`}
function initAdminCharts(){
  const days=[],labels=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));labels.push(d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}
  const c1=$('attChart');
  if(c1)new Chart(c1,{type:'line',data:{labels,datasets:[{label:'Present',data:days.map(d=>attendance.filter(a=>a.date===d&&a.status==='present').length),borderColor:'#5b6ef5',backgroundColor:'rgba(91,110,245,.08)',fill:true,tension:.4,pointBackgroundColor:'#5b6ef5',pointBorderColor:'#fff',pointBorderWidth:2,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:AXES}});
  const gc={};results.forEach(r=>{const g=grade(r.marks,r.total)[0];gc[g]=(gc[g]||0)+1});
  const order=['A+','A','A-','B','C','D','F'],cols={'A+':'#10d9a0',A:'#34d399','A-':'#6ee7b7',B:'#fbbf24',C:'#f97316',D:'#f87171',F:'#f43f5e'};
  const gl=order.filter(g=>gc[g]),c2=$('gradeChart');
  if(c2&&gl.length)new Chart(c2,{type:'doughnut',data:{labels:gl,datasets:[{data:gl.map(g=>gc[g]),backgroundColor:gl.map(g=>cols[g]),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#8892b0',font:{size:12},padding:14}}},cutout:'62%'}});
  else if(c2)c2.parentElement.innerHTML='<div class="empty"><div class="ei">📊</div><p>No result data</p></div>'}

function teacherDash(){
  const myRes=results.filter(r=>r.addedBy===cUser.uid),myAtt=attendance.filter(a=>a.markedBy===cUser.name);
  return`<div class="stats-grid">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-user-graduate"></i></div><div class="sc-val">${students.length}</div><div class="sc-label">Total Students</div></div>
    <div class="stat-card s3"><div class="sc-ico"><i class="fas fa-file-alt"></i></div><div class="sc-val">${myRes.length}</div><div class="sc-label">My Results</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-calendar-check"></i></div><div class="sc-val">${myAtt.length}</div><div class="sc-label">Attendance Marked</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-bullhorn"></i></div><div class="sc-val">${notices.length}</div><div class="sc-label">Notices</div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-chart-bar" style="color:var(--accent)"></i> My Subject Performance</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="tchChart"></canvas></div></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-list" style="color:var(--accent2)"></i> Recent Results Added</h3></div>
    <div class="tbl-wrap"><table><tr><th>Student</th><th>Subject</th><th>Exam</th><th>Marks</th><th>Grade</th></tr>
    ${myRes.slice().reverse().slice(0,8).map(r=>{const stu=students.find(x=>x.sid===r.sid);return`<tr><td><strong>${esc(stu?stu.name:'Unknown')}</strong></td><td>${esc(r.subject)}</td><td>${esc(r.exam)}</td><td>${r.marks}/${r.total}</td><td>${gb(r).html}</td></tr>`}).join('')}
    ${!myRes.length?'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">No results added yet</td></tr>':''}</table></div></div>`}
function subjAvg(list){const sg={};list.forEach(r=>{(sg[r.subject]=sg[r.subject]||[]).push(r.total?r.marks/r.total*100:0)});const l=Object.keys(sg);return[l,l.map(s=>Math.round(sg[s].reduce((a,b)=>a+b,0)/sg[s].length))]}
function initTeacherCharts(){const[l,d]=subjAvg(results.filter(r=>r.addedBy===cUser.uid));barChart('tchChart',l,d,'Avg %')}

function studentDash(){
  if(!myStudent)return`<div class="card"><div class="empty"><div class="ei">😕</div><h4>Profile not found</h4></div></div>`;
  const mySR=results,pct=attPct(cUser.uid),avgM=mySR.length?Math.round(mySR.reduce((s,r)=>s+(r.total?r.marks/r.total*100:0),0)/mySR.length):0;
  return`<div class="stats-grid">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-calendar-check"></i></div><div class="sc-val" style="color:${pctColor(pct)}">${pct}%</div><div class="sc-label">My Attendance</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-file-alt"></i></div><div class="sc-val">${mySR.length}</div><div class="sc-label">Result Entries</div></div>
    <div class="stat-card s3"><div class="sc-ico"><i class="fas fa-star"></i></div><div class="sc-val">${avgM}%</div><div class="sc-label">Avg. Score</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-bullhorn"></i></div><div class="sc-val">${notices.length}</div><div class="sc-label">Notices</div></div>
    <div class="stat-card s5"><div class="sc-ico"><i class="fas fa-money-bill-wave"></i></div><div class="sc-val" style="color:${totalDue(fees)?'var(--danger)':'var(--accent3)'}">৳${totalDue(fees).toLocaleString()}</div><div class="sc-label">Fees Due</div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-body"><div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">${avatarHtml(myStudent,72)}
    <div><div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800">${esc(myStudent.name)}</div>
    <div style="color:var(--text3);font-size:.85rem;margin-top:3px">${esc(myStudent.class||'')}${myStudent.batch?' · Batch '+esc(myStudent.batch):''}</div>
    <span class="badge b-accent" style="margin-top:8px">${esc(myStudent.sid)}</span></div></div></div></div>
  <div class="two-col">
    <div class="card"><div class="card-head"><h3><i class="fas fa-file-alt" style="color:var(--accent)"></i> Recent Results</h3><a href="#" onclick="nav('my_results');return false;" style="font-size:.8rem;color:var(--accent);font-weight:600">View all →</a></div>
      <div class="tbl-wrap"><table><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
      ${mySR.slice().reverse().slice(0,5).map(r=>`<tr><td>${esc(r.subject)}</td><td>${r.marks}/${r.total}</td><td>${gb(r).html}</td></tr>`).join('')}
      ${!mySR.length?'<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:20px">No results yet</td></tr>':''}</table></div></div>
    <div class="card"><div class="card-head"><h3><i class="fas fa-chart-bar" style="color:var(--accent2)"></i> Performance</h3></div><div class="card-body"><div class="chart-wrap-sm"><canvas id="stuPerfChart"></canvas></div></div></div></div>`}
function initStudentCharts(){
  const eg={};results.forEach(r=>{(eg[r.exam]=eg[r.exam]||[]).push(r)});
  const labels=Object.keys(eg).slice(-5);
  barChart('stuPerfChart',labels,labels.map(ex=>{const e=eg[ex],t=e.reduce((s,r)=>s+r.total,0);return t?Math.round(e.reduce((s,r)=>s+r.marks,0)/t*100):0}),'Score %')}

/* ---- students (admin) ---- */
function studentsTab(){
  const f=students.filter(s=>[s.name,s.sid,s.class,s.email].some(x=>x&&x.toLowerCase().includes(stSQ)));
  f.sort((a,b)=>{let va=(a[stSF]||'').toLowerCase(),vb=(b[stSF]||'').toLowerCase();return va<vb?(stSD==='asc'?-1:1):va>vb?(stSD==='asc'?1:-1):0});
  const pp=settings.perPage,tp=Math.max(1,Math.ceil(f.length/pp));if(stPage>tp)stPage=1;
  const paged=f.slice((stPage-1)*pp,stPage*pp);
  return`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-user-plus" style="color:var(--accent3)"></i> Add New Student</h3></div><div class="card-body">
    <form onsubmit="addStudent(event)"><div class="form-row">
      <div class="fg"><label>Full Name *</label><input name="name" placeholder="Md. Rahim Uddin" required></div>
      <div class="fg"><label>Student ID *</label><input name="sid" placeholder="STU-001" required pattern="[A-Za-z0-9._\\-]{2,50}" title="Letters, numbers, . _ - only"></div>
      <div class="fg"><label>Email *</label><input type="email" name="email" placeholder="student@email.com" required></div>
      <div class="fg"><label>Password * (min 6)</label><div class="pw-wrap"><input type="password" name="password" id="ap1" minlength="6" placeholder="Login password" required><button type="button" class="pw-eye" onclick="togglePw('ap1')"><i class="fas fa-eye"></i></button></div></div>
      <div class="fg"><label>Class / Course</label><input name="class" placeholder="Class 10 / CSE"></div>
      <div class="fg"><label>Batch</label><input name="batch" placeholder="2024"></div>
      <div class="fg"><label>Mobile</label><input name="mobile" placeholder="01XXXXXXXXX"></div>
      <div class="fg"><label>Date of Birth</label><input type="date" name="dob"></div>
      <div class="fg span2"><label>Photo URL</label><input name="img" placeholder="https://..."></div>
      <div class="fg span2"><label>Address</label><textarea name="address" placeholder="Full address..."></textarea></div>
    </div><button type="submit" class="btn btn-success"><i class="fas fa-plus"></i> Add Student</button></form></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-users" style="color:var(--accent)"></i> All Students (${f.length})</h3>
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
      <div class="s-wrap"><i class="fas fa-search"></i><input class="s-input" id="stQ" type="text" placeholder="Search..." value="${esc(stSQ)}" oninput="stSQ=this.value.toLowerCase();stPage=1;renderPage()"></div>
      <select class="f-select" onchange="settings.perPage=parseInt(this.value);lsSet('edu_pp',this.value);renderPage()">${[10,20,50].map(n=>`<option value="${n}" ${pp===n?'selected':''}>${n}/page</option>`).join('')}</select></div></div>
  ${!f.length?`<div class="empty"><div class="ei">🎓</div><h4>No students found</h4><p>${stSQ?'Try different search.':'Add first student above.'}</p></div>`:
  `<div class="tbl-wrap"><table><tr><th>Photo</th>
    <th class="sort ${stSF==='name'?stSD:''}" onclick="sortStu('name')">Name</th><th class="sort ${stSF==='sid'?stSD:''}" onclick="sortStu('sid')">ID</th>
    <th class="sort ${stSF==='class'?stSD:''}" onclick="sortStu('class')">Class</th><th>Batch</th><th>Mobile</th><th>Attendance</th><th>Actions</th></tr>
    ${paged.map(stu=>{const p=attPct(stu.sid),ac=pctColor(p);return`<tr><td>${avatarHtml(stu,38)}</td><td><strong>${esc(stu.name)}</strong></td><td><span class="badge b-accent">${esc(stu.sid)}</span></td><td>${esc(stu.class||'—')}</td><td>${esc(stu.batch||'—')}</td><td>${esc(stu.mobile||'—')}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="prog" style="width:60px"><div class="prog-fill" style="width:${p}%;background:${ac}"></div></div><span style="font-size:.78rem;font-weight:700;color:${ac}">${p}%</span></div></td>
      <td><div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-xs btn-primary" onclick="viewStuProfile('${esc(stu.sid)}')" title="View"><i class="fas fa-eye"></i></button>
        <button class="btn btn-xs btn-warning" onclick="openEditStu('${esc(stu.sid)}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn btn-xs btn-info" onclick="openStuPw('${esc(stu.sid)}')" title="Reset password"><i class="fas fa-key"></i></button>
        <button class="btn btn-xs btn-danger" onclick="deleteStu('${esc(stu.sid)}')" title="Delete"><i class="fas fa-trash"></i></button></div></td></tr>`}).join('')}</table></div>
    <div class="pagination">
      <button onclick="stPage=1;renderPage()" ${stPage===1?'disabled':''}><i class="fas fa-angle-double-left"></i></button>
      <button onclick="stPage--;renderPage()" ${stPage===1?'disabled':''}><i class="fas fa-angle-left"></i></button>
      ${Array.from({length:tp},(_,i)=>i+1).map(p=>`<button class="${stPage===p?'active':''}" onclick="stPage=${p};renderPage()">${p}</button>`).join('')}
      <button onclick="stPage++;renderPage()" ${stPage===tp?'disabled':''}><i class="fas fa-angle-right"></i></button>
      <button onclick="stPage=${tp};renderPage()" ${stPage===tp?'disabled':''}><i class="fas fa-angle-double-right"></i></button></div>`}</div>`}
function sortStu(f){if(stSF===f)stSD=stSD==='asc'?'desc':'asc';else{stSF=f;stSD='asc'}renderPage()}
function addStudent(e){e.preventDefault();const form=e.target;act('student_add',Object.fromEntries(new FormData(form)),'Student added successfully!',()=>form.reset())}
function openEditStu(sid){
  const s=students.find(x=>x.sid===sid);if(!s)return;
  $('es_sid').value=sid;$('es_name').value=s.name;$('es_email').value=s.email||'';$('es_class').value=s.class||'';$('es_batch').value=s.batch||'';
  $('es_mobile').value=s.mobile||'';$('es_dob').value=s.dob||'';$('es_img').value=s.img||'';$('es_address').value=s.address||'';openModal('editStuModal')}
async function saveEditStu(e){e.preventDefault();
  const ok=await act('student_update',{sid:$('es_sid').value,name:$('es_name').value,email:$('es_email').value,class:$('es_class').value,batch:$('es_batch').value,mobile:$('es_mobile').value,dob:$('es_dob').value,img:$('es_img').value,address:$('es_address').value},'Student updated!');
  if(ok)closeModal('editStuModal')}
function openStuPw(sid){const s=students.find(x=>x.sid===sid);if(!s)return;$('spw_sid').value=sid;$('spw_name').value=s.name+' ('+sid+')';$('spw_new').value='';openModal('stuPwModal')}
async function saveStuPw(e){e.preventDefault();if(await act('student_pw',{sid:$('spw_sid').value,pw:$('spw_new').value},'Password updated!'))closeModal('stuPwModal')}
function deleteStu(sid){const s=students.find(x=>x.sid===sid);if(!s||!confirm(`Delete "${s.name}" (${sid})? All their results and attendance will be removed.`))return;act('student_delete',{sid},'Student deleted.')}
function viewStuProfile(sid){stuProfileSid=sid;cTab='stu_profile';buildSidebar();renderPage()}

function stuProfileAdmin(){
  const stu=students.find(x=>x.sid===stuProfileSid);
  if(!stu)return`<div class="card"><div class="empty"><div class="ei">❌</div><h4>Not found</h4></div></div>`;
  const stuR=results.filter(r=>r.sid===stu.sid),stuA=attendance.filter(a=>a.sid===stu.sid),pct=attPct(stu.sid);
  const avgM=stuR.length?Math.round(stuR.reduce((s,r)=>s+(r.total?r.marks/r.total*100:0),0)/stuR.length):0;
  const box=(v,l,c)=>`<div style="background:var(--surface);border-radius:12px;padding:18px;text-align:center;border:1px solid var(--border)"><div style="font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;color:${c}">${v}</div><div style="font-size:.75rem;color:var(--text3);margin-top:4px">${l}</div></div>`;
  return`<a href="#" onclick="nav('students');return false;" style="display:inline-flex;align-items:center;gap:7px;color:var(--text3);font-size:.84rem;margin-bottom:18px"><i class="fas fa-arrow-left"></i> Back to Students</a>
  <div class="card" style="margin-bottom:18px"><div class="card-body"><div class="profile-hero">
    ${stu.img?`<img src="${esc(stu.img)}" class="p-photo">`:`<div class="p-initials">${esc(stu.name.charAt(0).toUpperCase())}</div>`}
    <div style="flex:1"><div class="p-name">${esc(stu.name)}</div><span class="badge b-accent">${esc(stu.sid)}</span>
      <div class="p-meta">
        <div class="p-meta-item"><label><i class="fas fa-envelope"></i> Email</label><p>${esc(stu.email)}</p></div>
        <div class="p-meta-item"><label><i class="fas fa-phone"></i> Mobile</label><p>${esc(stu.mobile||'—')}</p></div>
        <div class="p-meta-item"><label><i class="fas fa-school"></i> Class</label><p>${esc(stu.class||'—')}</p></div>
        <div class="p-meta-item"><label><i class="fas fa-layer-group"></i> Batch</label><p>${esc(stu.batch||'—')}</p></div>
        <div class="p-meta-item"><label><i class="fas fa-birthday-cake"></i> D.O.B</label><p>${fdate(stu.dob)}</p></div>
        <div class="p-meta-item"><label><i class="fas fa-calendar-plus"></i> Joined</label><p>${fdate(stu.joined)}</p></div>
        ${stu.address?`<div class="p-meta-item" style="grid-column:span 2"><label><i class="fas fa-map-marker-alt"></i> Address</label><p>${esc(stu.address)}</p></div>`:''}
      </div>
      <button class="btn btn-warning btn-sm" style="margin-top:16px" onclick="openStuPw('${esc(stu.sid)}')"><i class="fas fa-key"></i> Reset Password</button></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-top:22px">
      ${box(pct+'%','Attendance','var(--accent)')}${box(avgM+'%','Avg. Score','var(--accent2)')}${box(stuR.length,'Result Entries','var(--accent3)')}${box(stuA.filter(a=>a.status==='absent').length,'Absences','var(--danger)')}</div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-file-alt" style="color:var(--accent)"></i> Results</h3></div>
    <div class="tbl-wrap"><table><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Total</th><th>Grade</th><th>GPA</th><th>Date</th></tr>
    ${stuR.map(r=>{const x=gb(r);return`<tr><td>${esc(r.subject)}</td><td>${esc(r.exam)}</td><td><strong>${r.marks}</strong></td><td>${r.total}</td><td>${x.html}</td><td>${x.gpa}</td><td>${fdate(r.date)}</td></tr>`}).join('')}
    ${!stuR.length?'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">No results</td></tr>':''}</table></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-calendar-check" style="color:var(--accent3)"></i> Attendance</h3></div>
    <div class="card-body"><div class="att-cal">${stuA.slice().reverse().map(a=>`<div class="att-day ${esc(a.status)}" title="${esc(a.date)}: ${esc(a.status)}">${parseInt(a.date.slice(8,10))}</div>`).join('')}${!stuA.length?'<p style="color:var(--text3);padding:16px">No records</p>':''}</div></div></div>`}

/* ---- teachers (admin) ---- */
function teachersTab(){
  const f=users.filter(u=>u.role==='teacher'&&[u.name,u.uid,u.email].some(x=>x&&x.toLowerCase().includes(tcSQ)));
  return`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-user-plus" style="color:var(--accent3)"></i> Add New Teacher</h3></div><div class="card-body">
    <form onsubmit="addTeacher(event)"><div class="form-row">
      <div class="fg"><label>Teacher ID *</label><input name="tid" placeholder="TCH-001" required pattern="[A-Za-z0-9._\\-]{2,50}" title="Letters, numbers, . _ - only"></div>
      <div class="fg"><label>Full Name *</label><input name="name" placeholder="Mr. Karim" required></div>
      <div class="fg"><label>Email *</label><input type="email" name="email" placeholder="teacher@email.com" required></div>
      <div class="fg"><label>Password * (min 6)</label><div class="pw-wrap"><input type="password" name="password" id="tp1" minlength="6" placeholder="Login password" required><button type="button" class="pw-eye" onclick="togglePw('tp1')"><i class="fas fa-eye"></i></button></div></div>
      <div class="fg"><label>Subject</label><input name="subject" placeholder="Mathematics"></div>
      <div class="fg"><label>Mobile</label><input name="mobile" placeholder="01XXXXXXXXX"></div></div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><h4 style="font-size:.88rem;font-weight:700;margin-bottom:10px;color:var(--text2)"><i class="fas fa-shield-alt"></i> Teacher Permissions</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.84rem">
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" name="can_result" value="1" checked> Give/Enter Results</label>
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" name="can_att" value="1" checked> Mark Attendance</label>
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" name="can_notice" value="1" checked> Publish Notices</label></div></div>
      <button type="submit" class="btn btn-success" style="margin-top:14px"><i class="fas fa-plus"></i> Add Teacher</button></form></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-chalkboard-teacher" style="color:var(--accent)"></i> All Teachers (${f.length})</h3>
    <div class="s-wrap"><i class="fas fa-search"></i><input class="s-input" id="tcQ" type="text" placeholder="Search..." value="${esc(tcSQ)}" oninput="tcSQ=this.value.toLowerCase();renderPage()"></div></div>
  ${!f.length?`<div class="empty"><div class="ei">👨‍🏫</div><h4>No teachers found</h4><p>${tcSQ?'Try different search.':'Add first teacher above.'}</p></div>`:
  `<div class="tbl-wrap"><table><tr><th>Name</th><th>ID</th><th>Email</th><th>Subject</th><th>Permissions</th><th>Actions</th></tr>
  ${f.map(t=>`<tr><td><strong>${esc(t.name)}</strong></td><td><span class="badge b-blue">${esc(t.uid)}</span></td><td>${esc(t.email||'—')}</td><td>${esc(t.subject||'—')}</td>
    <td>${t.can_result?'<span class="badge b-green" style="margin:2px">Result</span>':''}${t.can_att?'<span class="badge b-blue" style="margin:2px">Attendance</span>':''}${t.can_notice?'<span class="badge b-yellow" style="margin:2px">Notice</span>':''}</td>
    <td><div style="display:flex;gap:5px">
      <button class="btn btn-xs btn-warning" onclick="openEditTch('${esc(t.uid)}')" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="btn btn-xs btn-info" onclick="openTchPw('${esc(t.uid)}')" title="Reset password"><i class="fas fa-key"></i></button>
      <button class="btn btn-xs btn-purple" onclick="openTchAccess('${esc(t.uid)}')" title="Permissions"><i class="fas fa-shield-alt"></i></button>
      <button class="btn btn-xs btn-danger" onclick="deleteTch('${esc(t.uid)}')" title="Delete"><i class="fas fa-trash"></i></button></div></td></tr>`).join('')}</table></div>`}</div>`}
function addTeacher(e){e.preventDefault();const form=e.target;act('teacher_add',Object.fromEntries(new FormData(form)),'Teacher added!',()=>form.reset())}
function openEditTch(tid){const t=users.find(x=>x.uid===tid);if(!t)return;$('et_tid').value=tid;$('et_name').value=t.name;$('et_email').value=t.email||'';$('et_subject').value=t.subject||'';$('et_mobile').value=t.mobile||'';openModal('editTchModal')}
async function saveEditTch(e){e.preventDefault();if(await act('teacher_update',{tid:$('et_tid').value,name:$('et_name').value,email:$('et_email').value,subject:$('et_subject').value,mobile:$('et_mobile').value},'Teacher updated!'))closeModal('editTchModal')}
function openTchPw(tid){const t=users.find(x=>x.uid===tid);if(!t)return;$('tpw_tid').value=tid;$('tpw_name').value=t.name+' ('+tid+')';$('tpw_new').value='';openModal('tchPwModal')}
async function saveTchPw(e){e.preventDefault();if(await act('teacher_pw',{tid:$('tpw_tid').value,pw:$('tpw_new').value},'Teacher password updated!'))closeModal('tchPwModal')}
function openTchAccess(tid){const t=users.find(x=>x.uid===tid);if(!t)return;$('ta_tid').value=tid;$('ta_result').checked=!!t.can_result;$('ta_att').checked=!!t.can_att;$('ta_notice').checked=!!t.can_notice;openModal('tchAccessModal')}
async function saveTchAccess(){if(await act('teacher_access',{tid:$('ta_tid').value,can_result:$('ta_result').checked,can_att:$('ta_att').checked,can_notice:$('ta_notice').checked},'Permissions saved!'))closeModal('tchAccessModal')}
function deleteTch(tid){const t=users.find(x=>x.uid===tid);if(!t||!confirm(`Delete teacher "${t.name}"?`))return;act('teacher_delete',{tid},'Teacher deleted.')}

/* ---- attendance ---- */
function noAccess(msg){return`<div class="card"><div class="empty"><div class="ei">🔒</div><h4>No Access</h4><p>${msg}</p></div></div>`}
function attendanceTab(){
  if(!(cUser.role==='admin'||cUser.can_att))return noAccess('Admin has not granted you attendance permission.');
  const bd=bulkD||today(),fd=attDate||today();
  return`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-calendar-plus" style="color:var(--accent3)"></i> Bulk Mark Attendance</h3></div><div class="card-body">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
      <div class="fg" style="margin:0"><label>Date</label><input type="date" id="bulkDate" value="${bd}" max="${today()}" onchange="bulkD=this.value;renderPage()" style="width:170px"></div>
      <div style="display:flex;gap:8px;margin-top:18px"><button class="btn btn-success btn-sm" onclick="markAll('p')"><i class="fas fa-check-double"></i> All Present</button><button class="btn btn-danger btn-sm" onclick="markAll('ab')"><i class="fas fa-times"></i> All Absent</button></div></div>
    <div style="max-height:380px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r2)">
    ${students.map(stu=>{const ex=attendance.find(a=>a.sid===stu.sid&&a.date===bd),ch=ex?ex.status:'none';
      return`<div class="bulk-row"><div class="bulk-info">${avatarHtml(stu,36)}<div><div style="font-size:.88rem;font-weight:600">${esc(stu.name)}</div><div style="font-size:.75rem;color:var(--text3)">${esc(stu.sid)}</div></div></div>
      <div class="bulk-actions"><input type="radio" name="a_${esc(stu.sid)}" id="p_${esc(stu.sid)}" value="present" ${ch==='present'?'checked':''} style="display:none"><label for="p_${esc(stu.sid)}" class="att-radio-label att-label-p"><i class="fas fa-check"></i> Present</label>
      <input type="radio" name="a_${esc(stu.sid)}" id="ab_${esc(stu.sid)}" value="absent" ${ch==='absent'?'checked':''} style="display:none"><label for="ab_${esc(stu.sid)}" class="att-radio-label att-label-a"><i class="fas fa-times"></i> Absent</label></div></div>`}).join('')}
    ${!students.length?'<div class="empty"><div class="ei">👥</div><p>No students added yet</p></div>':''}</div>
    <button class="btn btn-primary" style="margin-top:14px" onclick="saveBulkAtt()"><i class="fas fa-save"></i> Save Attendance</button></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-chart-bar" style="color:var(--accent2)"></i> Student Overview</h3></div>
    <div class="tbl-wrap"><table><tr><th>Name</th><th>ID</th><th>Present</th><th>Absent</th><th>%</th><th>Status</th></tr>
    ${students.map(stu=>{const pres=attendance.filter(a=>a.sid===stu.sid&&a.status==='present').length,abs=attendance.filter(a=>a.sid===stu.sid&&a.status==='absent').length,p=attPct(stu.sid);
      return`<tr><td><strong>${esc(stu.name)}</strong></td><td>${esc(stu.sid)}</td><td style="color:var(--accent3);font-weight:700">${pres}</td><td style="color:var(--danger);font-weight:700">${abs}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="prog" style="width:70px"><div class="prog-fill" style="width:${p}%;background:${pctColor(p)}"></div></div><span style="font-weight:700;font-size:.82rem">${p}%</span></div></td>
      <td><span class="badge ${p>=75?'b-green':p>=50?'b-yellow':'b-red'}">${p>=75?'Good':p>=50?'Average':'Low'}</span></td></tr>`}).join('')}
    ${!students.length?'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">No students</td></tr>':''}</table></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-list" style="color:var(--accent)"></i> Attendance Log</h3>
    <input type="date" value="${fd}" onchange="attDate=this.value;renderPage()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit"></div>
    <div class="tbl-wrap"><table><tr><th>Student</th><th>ID</th><th>Date</th><th>Status</th><th>Marked By</th></tr>
    ${attendance.filter(a=>a.date===fd).map(a=>{const stu=students.find(x=>x.sid===a.sid);return`<tr><td>${esc(stu?stu.name:'Unknown')}</td><td>${esc(a.sid)}</td><td>${fdate(a.date)}</td><td><span class="badge ${a.status==='present'?'b-green':'b-red'}"><i class="fas fa-${a.status==='present'?'check':'times'}"></i> ${a.status==='present'?'Present':'Absent'}</span></td><td><span class="badge b-dark">${esc(a.markedBy||'—')}</span></td></tr>`}).join('')}
    ${!attendance.some(a=>a.date===fd)?'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">No records for this date</td></tr>':''}</table></div></div>`}
function markAll(k){students.forEach(s=>{const r=$(`${k}_${s.sid}`);if(r)r.checked=true});toast(k==='p'?'All marked as present':'All marked as absent',k==='p'?'info':'warning')}
function saveBulkAtt(){
  const date=$('bulkDate').value;if(!date){toast('Select a date first','error');return}
  const records=[];students.forEach(s=>{const p=$('p_'+s.sid),a=$('ab_'+s.sid);if(p&&p.checked)records.push({sid:s.sid,status:'present'});else if(a&&a.checked)records.push({sid:s.sid,status:'absent'})});
  if(!records.length){toast('Nothing selected','warning');return}
  act('att_save',{date,records},r=>`${r.count} records saved!`)}

/* ---- results ---- */
function resultsTab(){
  if(!(cUser.role==='admin'||cUser.can_result))return noAccess('Admin has not granted you result permission.');
  const q=resSQ.toLowerCase();
  const f=results.filter(r=>{const s=students.find(x=>x.sid===r.sid);return!q||(s&&s.name.toLowerCase().includes(q))||r.subject.toLowerCase().includes(q)||r.exam.toLowerCase().includes(q)});
  return`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-plus-circle" style="color:var(--accent3)"></i> Add Result</h3></div><div class="card-body">
    <form onsubmit="addResult(event)"><div class="form-row">
      <div class="fg"><label>Student *</label><select name="sid" required><option value="">Select Student</option>${students.map(s=>`<option value="${esc(s.sid)}">${esc(s.name)} (${esc(s.sid)})</option>`).join('')}</select></div>
      <div class="fg"><label>Subject *</label><input name="subject" placeholder="Mathematics" required></div>
      <div class="fg"><label>Exam *</label><input name="exam" placeholder="Mid-Term 2024" required></div>
      <div class="fg"><label>Marks *</label><input type="number" name="marks" min="0" max="1000" required></div>
      <div class="fg"><label>Out of *</label><input type="number" name="total" value="100" min="1" max="1000" required></div>
      <div class="fg" style="display:flex;align-items:flex-end"><button type="submit" class="btn btn-success"><i class="fas fa-plus"></i> Add Result</button></div></div></form></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-list-alt" style="color:var(--accent)"></i> All Results (${f.length})</h3>
    <div class="s-wrap"><i class="fas fa-search"></i><input class="s-input" id="rsQ" type="text" placeholder="Search..." value="${esc(resSQ)}" oninput="resSQ=this.value;renderPage()"></div></div>
    <div class="tbl-wrap"><table><tr><th>Student</th><th>Subject</th><th>Exam</th><th>Marks</th><th>Grade</th><th>GPA</th><th>Date</th><th>Added By</th><th>Action</th></tr>
    ${f.slice().reverse().map(r=>{const stu=students.find(x=>x.sid===r.sid),x=gb(r),by=users.find(u=>u.uid===r.addedBy);
      const canDel=cUser.role==='admin'||r.addedBy===cUser.uid;
      return`<tr><td><strong>${esc(stu?stu.name:'Unknown')}</strong></td><td>${esc(r.subject)}</td><td>${esc(r.exam)}</td><td><strong>${r.marks}/${r.total}</strong></td><td>${x.html}</td><td>${x.gpa}</td><td>${fdate(r.date)}</td><td><span class="badge b-dark">${esc(by?by.name:(r.addedBy||'Admin'))}</span></td><td>${canDel?`<button class="btn btn-xs btn-danger" onclick="deleteResult('${esc(r.id)}')"><i class="fas fa-trash"></i></button>`:''}</td></tr>`}).join('')}
    ${!f.length?'<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px">No results found</td></tr>':''}</table></div></div>`}
function addResult(e){e.preventDefault();const form=e.target;act('result_add',Object.fromEntries(new FormData(form)),'Result added!',()=>form.reset())}
function deleteResult(id){if(confirm('Delete this result?'))act('result_delete',{id},'Result deleted.')}

/* ---- notices ---- */
function noticesTab(){
  const canN=cUser.role==='admin'||cUser.can_notice;
  return`${canN?`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-bullhorn" style="color:var(--accent2)"></i> Publish Notice</h3></div><div class="card-body"><form onsubmit="addNotice(event)">
      <div class="form-row"><div class="fg"><label>Title *</label><input name="title" placeholder="Notice title..." required></div>
      <div class="fg"><label>Priority</label><select name="priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div></div>
      <div class="fg"><label>Content *</label><textarea name="body" placeholder="Write your notice here..." required></textarea></div>
      <button type="submit" class="btn btn-warning"><i class="fas fa-paper-plane"></i> Publish</button></form></div></div>`:
    cUser.role==='teacher'?`<div style="margin-bottom:18px">${noAccess('Admin has not granted you notice publishing permission.')}</div>`:''}
  <div class="card"><div class="card-head"><h3><i class="fas fa-newspaper" style="color:var(--accent)"></i> All Notices (${notices.length})</h3></div><div class="card-body">
    ${notices.slice().reverse().map(n=>`<div class="notice-item pri-${esc(n.priority)}"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><h4 style="margin:0">${esc(n.title)}</h4>${n.priority==='high'?'<span class="badge b-red" style="font-size:.62rem">HIGH</span>':n.priority==='low'?'<span class="badge b-green" style="font-size:.62rem">LOW</span>':'<span class="badge b-yellow" style="font-size:.62rem">MED</span>'}</div>
      <p style="margin-top:6px">${esc(n.body).replace(/\n/g,'<br>')}</p>
      <div class="notice-meta"><span><i class="fas fa-calendar"></i> ${esc(n.date)}</span><span><i class="fas fa-user"></i> ${esc(n.by)}</span></div></div>
      ${cUser.role==='admin'?`<button class="btn btn-xs btn-danger" onclick="deleteNotice('${esc(n.id)}')"><i class="fas fa-trash"></i></button>`:''}</div></div>`).join('')}
    ${!notices.length?'<div class="empty"><div class="ei">📭</div><h4>No notices</h4><p>Check back later.</p></div>':''}</div></div>`}
function addNotice(e){e.preventDefault();const form=e.target;act('notice_add',Object.fromEntries(new FormData(form)),'Notice published!',()=>form.reset())}
function deleteNotice(id){if(confirm('Delete notice?'))act('notice_delete',{id},'Notice deleted.')}

/* ---- settings (admin) ---- */
function settingsTab(){
  const tg=(id,h,p,on)=>`<div class="access-item"><div class="access-label"><h4>${h}</h4><p>${p}</p></div><label class="toggle"><input type="checkbox" id="${id}" ${on?'checked':''}><span class="toggle-slider"></span></label></div>`;
  const pwf=(id,l)=>`<div class="fg"><label>${l}</label><div class="pw-wrap"><input type="password" id="${id}" required minlength="${id==='ap_cur'?1:6}"><button type="button" class="pw-eye" onclick="togglePw('${id}')"><i class="fas fa-eye"></i></button></div></div>`;
  return`<div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-paint-brush" style="color:var(--accent)"></i> School Name</h3></div><div class="card-body"><form onsubmit="saveBrand(event)">
    <div class="settings-grid">
      <div class="fg"><label>App Full Name *</label><input name="appFull" value="${esc(cfg.appFull)}" required></div>
      <div class="fg"><label>App Short Name *</label><input name="appName" value="${esc(cfg.appName)}" required></div>
      <div class="fg" style="grid-column:1/-1"><label>Tagline</label><input name="tagline" value="${esc(cfg.tagline)}"></div></div>
    <button type="submit" class="btn btn-primary" style="margin-top:12px"><i class="fas fa-save"></i> Save</button></form></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-shield-alt" style="color:var(--accent2)"></i> Security & Permissions</h3></div><div class="card-body"><form onsubmit="saveSecurity(event)">
    ${tg('sp_stuPw','Allow Student Password Change','Students can change their own passwords from their profile',cfg.allowStudentPw)}
    ${tg('sp_tchPw','Allow Teacher Password Change','Teachers can change their own passwords from their profile',cfg.allowTeacherPw)}
    ${tg('sp_hints','Show Login Hints','Display ID hints on the login page',cfg.showHint)}
    <button type="submit" class="btn btn-warning" style="margin-top:18px"><i class="fas fa-save"></i> Save Security Settings</button></form></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-user-shield" style="color:var(--purple)"></i> Admin Password</h3></div><div class="card-body"><form onsubmit="selfPw(event)" style="max-width:400px">
    ${pwf('ap_cur','Current Password')}${pwf('ap_new','New Password (min 6)')}${pwf('ap_conf','Confirm New Password')}
    <button type="submit" class="btn btn-purple"><i class="fas fa-key"></i> Change Admin Password</button></form></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-database" style="color:var(--danger)"></i> Data Management</h3></div><div class="card-body"><div class="two-col">
    <div style="background:var(--surface);border-radius:var(--r2);padding:18px;border:1px solid var(--border)"><h4 style="margin-bottom:6px"><i class="fas fa-download" style="color:var(--accent3)"></i> Export Data</h4><p style="font-size:.82rem;color:var(--text3);margin-bottom:12px">Download all system data as JSON (no passwords)</p><button class="btn btn-success btn-sm" onclick="exportData()"><i class="fas fa-download"></i> Export</button></div>
    <div style="background:var(--surface);border-radius:var(--r2);padding:18px;border:1px solid var(--border)"><h4 style="margin-bottom:6px"><i class="fas fa-trash-alt" style="color:var(--danger)"></i> Reset System</h4><p style="font-size:.82rem;color:var(--text3);margin-bottom:12px">Deletes all students, teachers, results, attendance & notices. Cannot be undone.</p><button class="btn btn-danger btn-sm" onclick="resetSystem()"><i class="fas fa-exclamation-triangle"></i> Reset All</button></div></div></div></div>`}
function saveBrand(e){e.preventDefault();act('cfg_save',Object.fromEntries(new FormData(e.target)),'Branding saved!')}
function saveSecurity(e){e.preventDefault();act('cfg_save',{allowStudentPw:$('sp_stuPw').checked,allowTeacherPw:$('sp_tchPw').checked,showHint:$('sp_hints').checked},'Security settings saved!')}
function selfPw(e){e.preventDefault();
  const cur=$('ap_cur')?$('ap_cur').value:$('sp_cur').value,nw=$('ap_new')?$('ap_new').value:$('sp_new').value;
  if($('ap_conf')&&nw!==$('ap_conf').value){toast('Passwords do not match!','error');return}
  act('self_pw',{cur,nw},'Password changed!')}
async function resetSystem(){
  if(!confirm('WARNING: All data will be permanently deleted. Continue?'))return;
  const pw=prompt('Enter your admin password to confirm:');if(!pw)return;
  if(await act('reset_system',{pw},'System reset.'))cTab='dashboard'}

/* ---- profiles ---- */
function pwBox(){return cfg[cUser.role==='teacher'?'allowTeacherPw':'allowStudentPw']?`<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)"><h4 style="font-size:.9rem;font-weight:700;margin-bottom:12px"><i class="fas fa-key" style="color:var(--accent2)"></i> Change Password</h4>
  <form onsubmit="selfPw(event)" style="max-width:380px">
  <div class="fg"><label>Current Password</label><div class="pw-wrap"><input type="password" id="sp_cur" required><button type="button" class="pw-eye" onclick="togglePw('sp_cur')"><i class="fas fa-eye"></i></button></div></div>
  <div class="fg"><label>New Password (min 6)</label><div class="pw-wrap"><input type="password" id="sp_new" required minlength="6"><button type="button" class="pw-eye" onclick="togglePw('sp_new')"><i class="fas fa-eye"></i></button></div></div>
  <button type="submit" class="btn btn-warning"><i class="fas fa-key"></i> Change Password</button></form></div>`:
  '<div style="margin-top:16px;padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);font-size:.84rem;color:var(--text3)"><i class="fas fa-lock"></i> Password change disabled by admin.</div>'}
function teacherProfile(){
  const t=users.find(x=>x.uid===cUser.uid);if(!t)return`<div class="card"><div class="empty"><div class="ei">❌</div><h4>Profile not found</h4></div></div>`;
  const pm=(on,y,n,c)=>on?`<span class="badge ${c}"><i class="fas fa-check"></i> ${y}</span>`:`<span class="badge b-red"><i class="fas fa-times"></i> ${n}</span>`;
  return`<div class="card"><div class="card-body"><div class="profile-hero"><div class="p-initials">${esc(t.name.charAt(0).toUpperCase())}</div><div style="flex:1">
    <div class="p-name">${esc(t.name)}</div><span class="badge b-blue">${esc(t.uid)}</span>
    <div class="p-meta"><div class="p-meta-item"><label><i class="fas fa-envelope"></i> Email</label><p>${esc(t.email||'—')}</p></div><div class="p-meta-item"><label><i class="fas fa-book"></i> Subject</label><p>${esc(t.subject||'—')}</p></div>
    <div class="p-meta-item"><label><i class="fas fa-phone"></i> Mobile</label><p>${esc(t.mobile||'—')}</p></div><div class="p-meta-item"><label><i class="fas fa-user-tag"></i> Role</label><p><span class="badge b-blue">Teacher</span></p></div></div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)"><h4 style="font-size:.88rem;font-weight:700;margin-bottom:10px"><i class="fas fa-shield-alt" style="color:var(--purple)"></i> My Permissions</h4>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${pm(t.can_result,'Enter Results','No Result Access','b-green')}${pm(t.can_att,'Mark Attendance','No Attendance Access','b-blue')}${pm(t.can_notice,'Post Notices','No Notice Access','b-yellow')}</div></div>
    ${pwBox()}</div></div></div></div>`}
function studentProfile(){
  const m=myStudent;if(!m)return`<div class="card"><div class="empty"><div class="ei">❌</div><h4>Not found</h4></div></div>`;
  return`${totalDue(fees)>0?`<div class="alert a-warn" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><i class="fas fa-exclamation-triangle"></i><span style="flex:1">You have unpaid fees: <strong>৳${totalDue(fees).toLocaleString()}</strong></span><button class="btn btn-sm btn-primary" style="background:#e2136e;border-color:#e2136e" onclick="document.getElementById('feeCard').scrollIntoView({behavior:'smooth'})"><i class="fas fa-mobile-alt"></i> Pay with bKash</button></div>`:''}<div class="card"><div class="card-body"><div class="profile-hero">
    ${m.img?`<img src="${esc(m.img)}" class="p-photo">`:`<div class="p-initials">${esc(m.name.charAt(0).toUpperCase())}</div>`}<div style="flex:1">
    <div class="p-name">${esc(m.name)}</div><span class="badge b-accent">${esc(m.sid)}</span>
    <div class="p-meta"><div class="p-meta-item"><label><i class="fas fa-envelope"></i> Email</label><p>${esc(m.email)}</p></div><div class="p-meta-item"><label><i class="fas fa-phone"></i> Mobile</label><p>${esc(m.mobile||'—')}</p></div>
    <div class="p-meta-item"><label><i class="fas fa-school"></i> Class</label><p>${esc(m.class||'—')}</p></div><div class="p-meta-item"><label><i class="fas fa-layer-group"></i> Batch</label><p>${esc(m.batch||'—')}</p></div>
    <div class="p-meta-item"><label><i class="fas fa-birthday-cake"></i> D.O.B</label><p>${fdate(m.dob)}</p></div><div class="p-meta-item"><label><i class="fas fa-calendar-plus"></i> Joined</label><p>${fdate(m.joined)}</p></div>
    ${m.address?`<div class="p-meta-item" style="grid-column:span 2"><label><i class="fas fa-map-marker-alt"></i> Address</label><p>${esc(m.address)}</p></div>`:''}</div>
    ${pwBox()}</div></div></div></div>${myFeesCard()}`}

/* ---- student: results & attendance ---- */
function myResults(){
  const mySR=results,eg={};mySR.forEach(r=>{(eg[r.exam]=eg[r.exam]||[]).push(r)});
  const avg=mySR.length?Math.round(mySR.reduce((s,r)=>s+(r.total?r.marks/r.total*100:0),0)/mySR.length):0;
  return`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:13px;margin-bottom:20px">
    ${Object.entries(eg).map(([ex,ers])=>{const sm=ers.reduce((s,r)=>s+r.marks,0),st=ers.reduce((s,r)=>s+r.total,0),p=st?Math.round(sm/st*100):0;return`<div class="stat-card s1" style="text-align:center"><div class="sc-val" style="color:${grade(p,100)[2]};font-size:1.6rem">${p}%</div><div class="sc-label">${esc(ex)}</div></div>`}).join('')}</div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-chart-bar" style="color:var(--accent)"></i> Subject-wise Score</h3></div><div class="card-body"><div class="chart-wrap"><canvas id="subChart"></canvas></div></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-list-alt" style="color:var(--accent)"></i> All Results</h3><span style="font-size:.85rem;color:var(--text3);font-weight:600">Average: ${avg}%</span></div>
    <div class="tbl-wrap"><table><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Total</th><th>%</th><th>Grade</th><th>GPA</th></tr>
    ${mySR.slice().reverse().map(r=>{const x=gb(r);return`<tr><td><strong>${esc(r.subject)}</strong></td><td>${esc(r.exam)}</td><td><strong>${r.marks}</strong></td><td>${r.total}</td><td>${Math.round(r.marks/r.total*100)}%</td><td>${x.html}</td><td>${x.gpa}</td></tr>`}).join('')}
    ${!mySR.length?'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">No results yet</td></tr>':''}</table></div></div>`}
function initResultCharts(){const[l,d]=subjAvg(results);barChart('subChart',l,d,'Avg %')}
function myAttendance(){
  const myA=attendance,pres=myA.filter(a=>a.status==='present').length,abs=myA.filter(a=>a.status==='absent').length,tot=pres+abs,pct=tot?Math.round(pres/tot*100):0;
  const now=new Date(),yr=now.getFullYear(),mo=now.getMonth(),first=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate();
  let cal=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:.65rem;font-weight:700;color:var(--text3);padding:7px 0">${d}</div>`).join('');
  for(let i=0;i<first;i++)cal+='<div></div>';
  for(let d=1;d<=dim;d++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,rec=myA.find(a=>a.date===ds);cal+=`<div class="att-day ${rec?rec.status:'none'}" title="${ds}: ${rec?rec.status:'No record'}">${d}</div>`}
  const lg=(bg,bd,t)=>`<span style="display:flex;align-items:center;gap:6px"><span style="width:11px;height:11px;border-radius:3px;background:${bg};border:1px solid ${bd};display:inline-block"></span> ${t}</span>`;
  return`<div class="stats-grid" style="margin-bottom:20px">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-check-circle"></i></div><div class="sc-val" style="color:var(--accent3)">${pres}</div><div class="sc-label">Present</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-times-circle"></i></div><div class="sc-val" style="color:var(--danger)">${abs}</div><div class="sc-label">Absent</div></div>
    <div class="stat-card s3"><div class="sc-ico"><i class="fas fa-percentage"></i></div><div class="sc-val" style="color:${pctColor(pct)}">${pct}%</div><div class="sc-label">Overall</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-calendar-alt"></i></div><div class="sc-val">${tot}</div><div class="sc-label">Total Days</div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-calendar-alt" style="color:var(--accent)"></i> ${now.toLocaleDateString('en-GB',{month:'long',year:'numeric'})} Calendar</h3></div><div class="card-body"><div class="att-cal">${cal}</div>
    <div style="display:flex;gap:18px;margin-top:14px;justify-content:center;flex-wrap:wrap;font-size:.78rem;color:var(--text3)">${lg('rgba(16,217,160,.15)','rgba(16,217,160,.25)','Present')}${lg('rgba(244,63,94,.1)','rgba(244,63,94,.18)','Absent')}${lg('var(--surface)','var(--border)','No Record')}</div></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-history" style="color:var(--accent2)"></i> Attendance History</h3></div>
    <div class="tbl-wrap"><table><tr><th>Date</th><th>Status</th><th>Marked By</th></tr>
    ${myA.slice().reverse().map(a=>`<tr><td>${fdate(a.date)}</td><td><span class="badge ${a.status==='present'?'b-green':'b-red'}"><i class="fas fa-${a.status==='present'?'check':'times'}"></i> ${a.status==='present'?'Present':'Absent'}</span></td><td><span class="badge b-dark">${esc(a.markedBy||'—')}</span></td></tr>`).join('')}
    ${!myA.length?'<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:24px">No records</td></tr>':''}</table></div></div>`}

/* ---- admission requests & messages (admin) ---- */
function requestsTab(){
  return`<div class="card"><div class="card-head"><h3><i class="fas fa-user-clock" style="color:var(--accent2)"></i> Pending Admission Requests (${requests.length})</h3></div>
  <div class="tbl-wrap"><table><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Class</th><th>Batch</th><th>Requested</th><th>Actions</th></tr>
  ${requests.map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.email)}</td><td>${esc(r.mobile||'—')}</td><td>${esc(r.class||'—')}</td><td>${esc(r.batch||'—')}</td><td>${esc(r.date)}</td>
    <td><div style="display:flex;gap:5px"><button class="btn btn-xs btn-success" onclick="approveReq('${esc(r.id)}')"><i class="fas fa-check"></i> Approve</button><button class="btn btn-xs btn-danger" onclick="rejectReq('${esc(r.id)}')" title="Reject"><i class="fas fa-times"></i></button></div></td></tr>`).join('')}
  ${!requests.length?'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:28px">No pending requests</td></tr>':''}</table></div></div>`}
function approveReq(id){const r=requests.find(x=>x.id===id);if(!r)return;
  const sid=prompt('Assign a Student ID for '+r.name+':','STU-'+String(students.length+1).padStart(3,'0'));if(!sid)return;
  act('request_approve',{id,sid:sid.trim()},'Approved! Student can now log in with email or ID.')}
function rejectReq(id){if(confirm('Reject and delete this request?'))act('request_reject',{id},'Request removed.')}

/* ---- fees ---- */
const dueOf=f=>f.amount-f.paid;
function totalDue(list){return list.reduce((s,f)=>s+dueOf(f),0)}
function feeBadge(f){const d=dueOf(f);return d<=0?'<span class="badge b-green">Paid</span>':f.paid>0?'<span class="badge b-yellow">Partial</span>':'<span class="badge b-red">Unpaid</span>'}
let feeSQ='',feeFilter='all';
function feesTab(){
  const q=feeSQ.toLowerCase();
  const f=fees.filter(x=>{const s=students.find(z=>z.sid===x.sid);const st=dueOf(x)<=0?'paid':'due';
    return(feeFilter==='all'||feeFilter===st)&&(!q||x.title.toLowerCase().includes(q)||(s&&(s.name.toLowerCase().includes(q)||s.sid.toLowerCase().includes(q))))});
  const billed=fees.reduce((s,x)=>s+x.amount,0),coll=fees.reduce((s,x)=>s+x.paid,0);
  return`<div class="stats-grid">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-file-invoice"></i></div><div class="sc-val">৳${billed.toLocaleString()}</div><div class="sc-label">Total Billed</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-check-circle"></i></div><div class="sc-val">৳${coll.toLocaleString()}</div><div class="sc-label">Collected</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-hourglass-half"></i></div><div class="sc-val">৳${(billed-coll).toLocaleString()}</div><div class="sc-label">Due</div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-plus-circle" style="color:var(--accent3)"></i> Add Fee</h3></div><div class="card-body">
    <form onsubmit="addFee(event)"><div class="form-row">
      <div class="fg"><label>Student *</label><select name="sid" required><option value="">Select Student</option><option value="__all__">★ All students</option>${students.map(s=>`<option value="${esc(s.sid)}">${esc(s.name)} (${esc(s.sid)})</option>`).join('')}</select></div>
      <div class="fg"><label>Fee Title *</label><input name="title" placeholder="Monthly Fee – Jan" required></div>
      <div class="fg"><label>Amount (৳) *</label><input type="number" name="amount" min="1" required></div>
      <div class="fg"><label>Due Date</label><input type="date" name="due"></div>
      <div class="fg" style="display:flex;align-items:flex-end"><button type="submit" class="btn btn-success"><i class="fas fa-plus"></i> Add Fee</button></div></div></form></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-money-bill-wave" style="color:var(--accent)"></i> Fee Records (${f.length})</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="s-input" style="width:auto" onchange="feeFilter=this.value;renderPage()">${[['all','All'],['due','Due'],['paid','Paid']].map(([v,l])=>`<option value="${v}" ${feeFilter===v?'selected':''}>${l}</option>`).join('')}</select>
    <div class="s-wrap"><i class="fas fa-search"></i><input class="s-input" id="feeQ" type="text" placeholder="Search..." value="${esc(feeSQ)}" oninput="feeSQ=this.value;renderPage()"></div></div></div>
    <div class="tbl-wrap"><table><tr><th>Student</th><th>Fee</th><th>Amount</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
    ${f.slice().reverse().map(x=>{const s=students.find(z=>z.sid===x.sid),d=dueOf(x);
      return`<tr><td><strong>${esc(s?s.name:'Unknown')}</strong><div style="font-size:.75rem;color:var(--text3)">${esc(x.sid)}</div></td><td>${esc(x.title)}</td><td>৳${x.amount.toLocaleString()}</td><td>৳${x.paid.toLocaleString()}</td><td><strong>৳${d.toLocaleString()}</strong></td><td>${fdate(x.due)}</td><td>${feeBadge(x)}</td>
      <td style="white-space:nowrap">${d>0?`<button class="btn btn-xs btn-success" onclick="payFee('${esc(x.id)}',${d})"><i class="fas fa-hand-holding-usd"></i> Pay</button> `:''}${x.pid?`<a class="btn btn-xs btn-ghost" href="invoice.html?p=${encodeURIComponent(x.pid)}"><i class="fas fa-file-invoice"></i></a> `:''}<button class="btn btn-xs btn-danger" onclick="deleteFee('${esc(x.id)}')"><i class="fas fa-trash"></i></button></td></tr>`}).join('')}
    ${!f.length?'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:24px">No fee records</td></tr>':''}</table></div></div>`}
function addFee(e){e.preventDefault();const form=e.target;act('fee_add',Object.fromEntries(new FormData(form)),r=>r.count>1?`Fee added for ${r.count} students!`:'Fee added!',()=>form.reset())}
function payFee(id,due){const v=prompt('Payment amount (৳) — due ৳'+due+':',due);if(v===null)return;act('fee_pay',{id,pay:parseInt(v)||0},'Payment recorded!')}
function deleteFee(id){if(confirm('Delete this fee record?'))act('fee_delete',{id},'Fee deleted.')}
function feeTable(){
  return`<div class="tbl-wrap"><table><tr><th>Fee</th><th>Amount</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th><th></th></tr>
    ${fees.slice().reverse().map(x=>`<tr><td><strong>${esc(x.title)}</strong></td><td>৳${x.amount.toLocaleString()}</td><td>৳${x.paid.toLocaleString()}</td><td><strong>৳${dueOf(x).toLocaleString()}</strong></td><td>${fdate(x.due)}</td><td>${feeBadge(x)}</td>
    <td>${dueOf(x)>0?`<button class="btn btn-xs btn-primary" style="background:#e2136e;border-color:#e2136e" onclick="goPay('${esc(x.id)}')"><i class="fas fa-mobile-alt"></i> Pay ৳${dueOf(x).toLocaleString()} with bKash</button>`:''}${x.pid?` <a class="btn btn-xs btn-ghost" href="invoice.html?p=${encodeURIComponent(x.pid)}"><i class="fas fa-file-invoice"></i> Invoice</a>`:''}</td></tr>`).join('')}
    ${!fees.length?'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">No fee records</td></tr>':''}</table></div>`}
function myFeesCard(){return`<div class="card" id="feeCard" style="margin-top:18px"><div class="card-head"><h3><i class="fas fa-money-bill-wave" style="color:var(--accent)"></i> My Fees</h3><span style="font-size:.85rem;color:var(--text3);font-weight:600">Due: ৳${totalDue(fees).toLocaleString()}</span></div>${feeTable()}</div>`}
function goPay(id){location.href='pay.html?fee='+encodeURIComponent(id)}
function myFees(){
  const billed=fees.reduce((s,x)=>s+x.amount,0),coll=fees.reduce((s,x)=>s+x.paid,0);
  return`<div class="stats-grid">
    <div class="stat-card s1"><div class="sc-ico"><i class="fas fa-file-invoice"></i></div><div class="sc-val">৳${billed.toLocaleString()}</div><div class="sc-label">Total Billed</div></div>
    <div class="stat-card s2"><div class="sc-ico"><i class="fas fa-check-circle"></i></div><div class="sc-val">৳${coll.toLocaleString()}</div><div class="sc-label">Paid</div></div>
    <div class="stat-card s4"><div class="sc-ico"><i class="fas fa-hourglass-half"></i></div><div class="sc-val" style="color:${billed-coll?'var(--danger)':'var(--accent3)'}">৳${(billed-coll).toLocaleString()}</div><div class="sc-label">Due</div></div></div>
  <div class="card"><div class="card-head"><h3><i class="fas fa-money-bill-wave" style="color:var(--accent)"></i> My Fees</h3></div>${feeTable()}</div>`}

/* ---- export ---- */
function exportData(){
  const blob=new Blob([JSON.stringify({users,students,results,attendance,notices,fees,config:cfg,exported:new Date().toISOString(),by:cUser.name},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`edutrack-export-${today()}.json`;a.click();URL.revokeObjectURL(url);toast('Data exported!','success')}

/* ================= INIT ================= */
function showApp(){$('appPage').style.display='block';applyTheme();applyBrand();buildSidebar();renderPage()}
async function init(){
  applyTheme();
  if(!await load()){location.href='login.html';return}
  showApp();
  const qp=new URLSearchParams(location.search),pay=qp.get('pay');
  if(pay){history.replaceState(null,'','app.html');
    const M={success:['Payment successful! bKash TrxID: '+(qp.get('trx')||''),'success'],failed:['bKash payment failed. You were not charged.','error'],cancel:['Payment cancelled.','warning'],invalid:['Invalid or already processed payment.','error'],error:['Could not verify the payment. If money was deducted, contact the admin with your bKash TrxID.','error']}[pay];
    if(M&&cUser.role==='student'){nav('my_fees');toast(M[0]+(qp.get('why')?' ('+qp.get('why')+')':''),M[1])}}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open'));closeSB()}});
  document.addEventListener('click',e=>{if(e.target.classList.contains('modal-bg'))e.target.classList.remove('open')});
}
init();
