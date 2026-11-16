/* pay.html — review everything, then Pay Now -> bKash */
(async function(){
  const qs=new URLSearchParams(location.search),feeId=qs.get('fee'),res=qs.get('r'),page=$('page');
  const j=await api('bootstrap');
  if(!j.ok){page.innerHTML='<div class="alert a-warn">Could not load your data. <a href="login.html">Sign in again</a></div>';return}
  if(j.user.role!=='student'){location.href='app.html';return}
  $('brand').textContent=j.cfg.appFull;
  const m=j.students.find(s=>s.sid===j.user.uid),fee=j.fees.find(f=>f.id===feeId);
  if(!m||!fee){page.innerHTML='<div class="card"><div class="empty"><div class="ei">😕</div><h4>Fee not found</h4><p><a href="app.html" style="color:var(--accent)">Back to dashboard</a></p></div></div>';return}
  const due=fee.amount-fee.paid;
  const row=(i,l,v)=>`<div class="p-meta-item"><label><i class="fas ${i}"></i> ${l}</label><p>${esc(v||'—')}</p></div>`;
  const msg={failed:'bKash payment failed. You were not charged. You can try again.',cancel:'Payment was cancelled. You can try again.'}[res];
  const why=qs.get('why'),msgFull=msg?msg+(why?' Reason: '+esc(why):''):'';
  page.innerHTML=`
  <div class="steps no-print"><div class="on"><b>1</b>Review &amp; Pay Now</div><div><b>2</b>Confirm on bKash (OTP &amp; PIN)</div><div><b>3</b>Invoice &amp; PDF</div></div>
  ${msgFull?`<div class="alert a-warn" style="margin-bottom:16px"><i class="fas fa-exclamation-triangle"></i> ${msgFull}</div>`:''}
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-user-graduate" style="color:var(--accent)"></i> Student Information</h3></div><div class="card-body">
    <div class="profile-hero">${m.img?`<img src="${esc(m.img)}" class="p-photo">`:`<div class="p-initials">${esc(m.name.charAt(0).toUpperCase())}</div>`}
    <div style="flex:1"><div class="p-name">${esc(m.name)}</div><span class="badge b-accent">${esc(m.sid)}</span>
    <div class="p-meta">${row('fa-id-badge','Student ID',m.sid)}${row('fa-school','Class',m.class)}${row('fa-layer-group','Batch',m.batch)}${row('fa-envelope','Email',m.email)}${row('fa-phone','Mobile',m.mobile)}${row('fa-birthday-cake','Date of Birth',m.dob?fdate(m.dob):'')}${row('fa-calendar-plus','Joined',fdate(m.joined))}${row('fa-map-marker-alt','Address',m.address)}</div></div></div></div></div>
  <div class="card" style="margin-bottom:18px"><div class="card-head"><h3><i class="fas fa-file-invoice-dollar" style="color:var(--accent2)"></i> Fee Details</h3></div><div class="card-body">
    <div class="p-meta">${row('fa-tag','Fee',fee.title)}${row('fa-money-bill','Total Amount',money(fee.amount))}${row('fa-check-circle','Already Paid',money(fee.paid))}${row('fa-calendar-day','Due Date',fee.due?fdate(fee.due):'')}</div>
    ${due>0?`<div class="fg" style="margin-top:18px;max-width:360px"><label><i class="fas fa-mobile-alt" style="color:#e2136e"></i> bKash Number (the number you will pay from) *</label><input id="bkNum" type="tel" inputmode="numeric" maxlength="14" placeholder="01XXXXXXXXX" value="${esc(m.mobile||'')}" autocomplete="tel"></div>`:''}
    <div style="margin-top:18px;padding:16px;border-radius:14px;background:var(--surface);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div><div style="font-size:.8rem;color:var(--text3);font-weight:600">AMOUNT TO PAY</div><div style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800">${money(due)}</div></div>
      ${due>0?`<button class="btn bk" id="payBtn" style="padding:14px 28px;font-size:1rem" onclick="payNow()"><i class="fas fa-mobile-alt"></i> Pay Now with bKash</button>`:`<span class="badge b-green">Fully paid</span>${fee.pid?` <a class="btn btn-ghost" href="invoice.html?p=${encodeURIComponent(fee.pid)}"><i class="fas fa-file-invoice"></i> View Invoice</a>`:''}`}</div>
    ${due>0?`<p style="margin-top:14px;font-size:.82rem;color:var(--text3)"><i class="fas fa-lock"></i> After you click <strong>Pay Now</strong> you will be taken to bKash's secure page where you confirm this number, enter the <strong>OTP</strong> sent to it, and your <strong>PIN</strong>. We never see or store your OTP or PIN. When payment succeeds you will get your invoice and can download it as a PDF.</p>`:''}
  </div></div>`;
  window.payNow=async function(){
    const num=($('bkNum').value||'').replace(/\D/g,'').replace(/^880/,'0');
    if(!/^01[3-9]\d{8}$/.test(num)){alert('Please enter a valid bKash number, e.g. 01712345678');$('bkNum').focus();return}
    const b=$('payBtn');b.disabled=true;b.innerHTML='<i class="fas fa-spinner fa-spin"></i> Connecting to bKash...';
    const r=await api('bkash_create',{id:feeId,number:num});
    if(r.ok&&r.url){location.href=r.url;return}
    b.disabled=false;b.innerHTML='<i class="fas fa-mobile-alt"></i> Pay Now with bKash';
    alert(r.error||'Could not start bKash payment');
  };
})();
