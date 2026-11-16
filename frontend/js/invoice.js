/* invoice.html — shows the paid invoice, PDF download / print */
(async function(){
  const pid=new URLSearchParams(location.search).get('p'),page=$('page');
  const j=await api('invoice_get',{pid:pid||''});
  if(!j.ok){page.innerHTML=`<div class="card"><div class="empty"><div class="ei">🧾</div><h4>${esc(j.error||'Invoice not found')}</h4><p><a href="app.html" style="color:var(--accent)">Back to dashboard</a></p></div></div>`;return}
  const v=j.invoice,s=v.student,due=v.feeAmount-v.feePaid;
  $('brand').textContent=v.school;
  const L=(l,x)=>x?`<div style="margin:2px 0"><span style="color:#6b7280">${l}:</span> ${esc(x)}</div>`:'';
  page.innerHTML=`
  <div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
    <div class="alert" style="flex:1;margin:0;min-width:220px"><i class="fas fa-check-circle" style="color:#16a34a"></i> Payment successful! Your invoice is ready.</div>
    <button class="btn bk" onclick="dlPdf()" id="dlBtn"><i class="fas fa-file-pdf"></i> Download PDF</button>
    <button class="btn btn-ghost" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
    <a class="btn btn-ghost" href="app.html"><i class="fas fa-home"></i> Dashboard</a></div>
  <div id="invoice" style="background:#fff;color:#111827;padding:36px;border-radius:12px;font-family:'DM Sans','Noto Sans Bengali',sans-serif;font-size:14px;line-height:1.5;position:relative;overflow:hidden">
    <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:3px solid #e2136e;padding-bottom:18px">
      <div><div style="font-size:24px;font-weight:800">${esc(v.school)}</div><div style="color:#6b7280">${esc(v.tagline)}</div></div>
      <div style="text-align:right"><div style="font-size:26px;font-weight:800;color:#e2136e;letter-spacing:1px">INVOICE</div><div><strong>${esc(v.no)}</strong></div><div style="color:#6b7280">${esc(v.date)}</div></div></div>
    <div style="display:flex;gap:30px;flex-wrap:wrap;margin:22px 0">
      <div style="flex:1;min-width:240px"><div style="font-size:12px;font-weight:700;color:#e2136e;letter-spacing:1px;margin-bottom:6px">BILLED TO</div>
        <div style="font-size:17px;font-weight:700">${esc(s.name)}</div>${L('Student ID',s.sid)}${L('Class',s.class)}${L('Batch',s.batch)}${L('Email',s.email)}${L('Mobile',s.mobile)}${L('Date of Birth',s.dob?fdate(s.dob):'')}${L('Joined',s.joined?fdate(s.joined):'')}${L('Address',s.address)}</div>
      <div style="flex:1;min-width:220px"><div style="font-size:12px;font-weight:700;color:#e2136e;letter-spacing:1px;margin-bottom:6px">PAYMENT</div>
        ${L('Method',v.method)}${L('bKash Number',v.payer)}${L('bKash TrxID',v.trx)}<div style="margin:2px 0"><span style="color:#6b7280">Status:</span> <span style="background:#dcfce7;color:#15803d;font-weight:700;padding:2px 10px;border-radius:20px;font-size:12px">${v.status}</span></div></div></div>
    <table style="width:100%;border-collapse:collapse;margin-top:6px"><tr style="background:#fdf2f8"><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb">Description</th><th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb">Amount</th></tr>
      <tr><td style="padding:12px 10px;border-bottom:1px solid #e5e7eb">${esc(v.feeTitle)}<div style="color:#6b7280;font-size:12px">Fee total ${money(v.feeAmount)}</div></td><td style="padding:12px 10px;text-align:right;border-bottom:1px solid #e5e7eb">${money(v.payAmount)}</td></tr></table>
    <div style="margin-left:auto;margin-top:16px;max-width:300px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Fee total</span><span>${money(v.feeAmount)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Total paid so far</span><span>${money(v.feePaid)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Balance due</span><span>${money(due)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 12px;margin-top:6px;background:#e2136e;color:#fff;border-radius:8px;font-weight:800;font-size:16px"><span>Paid now</span><span>${money(v.payAmount)}</span></div></div>
    <div style="margin-top:34px;padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center">This is a computer-generated invoice and does not require a signature. Thank you for your payment.</div>
  </div>`;
  window.dlPdf=function(){
    if(typeof html2pdf==='undefined'){window.print();return}
    const b=$('dlBtn');b.disabled=true;
    html2pdf().set({margin:8,filename:'Invoice-'+v.no+'.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}})
      .from($('invoice')).save().then(()=>{b.disabled=false}).catch(()=>{b.disabled=false;window.print()});
  };
})();
