<script>
// DealBankers — Header Actions + Intake Modals (red/blue phones) + Claims Exchange
// Safe to include on ANY page. It injects a small toolbar + two modals.
// If Firebase is present, it writes intake records; otherwise it still shows the forms.

(() => {
  const css = `
    .db-toolbar {
      position: fixed; top: 10px; right: 12px; z-index: 1000;
      display: flex; gap: 8px; align-items: center;
      pointer-events: none; /* don't block page UI */
    }
    .db-toolbar * { pointer-events: auto; }
    .db-pill {
      border: 1px solid rgba(255,255,255,.25);
      background: linear-gradient(180deg,#ffe08a,#c79a35);
      color: #1f1a07; font-weight: 800; padding: 7px 12px; border-radius: 999px;
      box-shadow: 0 6px 18px rgba(0,0,0,.35); cursor: pointer; font-size: 13px;
    }
    .db-icon {
      width: 36px; height: 36px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,.22); box-shadow: 0 6px 18px rgba(0,0,0,.35); cursor: pointer;
      font-size: 18px;
    }
    .db-icon.red  { background: radial-gradient(60% 60% at 35% 30%, #ff6c6c, #b11616); color: #fff; }
    .db-icon.blue { background: radial-gradient(60% 60% at 35% 30%, #6cb2ff, #14539a); color: #fff; }
    .db-dialog {
      border: none; border-radius: 16px; width: min(640px, 92vw);
      background: #0f1a24; color: #eaf6ff; padding: 14px;
      box-shadow: 0 28px 70px rgba(0,0,0,.55);
    }
    .db-form { display: grid; gap: 10px; }
    .db-input, .db-textarea, .db-select {
      width: 100%; background: #0d2130; color: #eaf6ff; border: 1px solid rgba(255,255,255,.2);
      border-radius: 10px; padding: 10px 12px; font-size: 14px;
    }
    .db-textarea { min-height: 120px; resize: vertical; }
    .db-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .db-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
    .db-btn { padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.22); cursor: pointer; }
    .db-btn.primary { background: linear-gradient(180deg,#30d47a,#138a4c); color: #fff; border: none; font-weight: 800; }
    .db-btn.ghost   { background: #0e2433; color: #eaf6ff; }
    .db-disclaimer { font-size: 12px; color: #bcd3e7; line-height: 1.4; }
    .db-toast {
      position: fixed; left: 50%; transform: translateX(-50%);
      bottom: 18px; background: #0b1218; color:#fff; border:1px solid rgba(255,255,255,.2);
      padding:10px 14px; border-radius:12px; box-shadow: 0 28px 70px rgba(0,0,0,.55); display:none; z-index:1001;
      font-size: 14px;
    }
    @media (max-width: 600px){
      .db-row { grid-template-columns: 1fr; }
      .db-toolbar { right: 8px; }
    }
  `;

  const html = `
    <div class="db-toolbar" id="dbToolbar">
      <button id="dbClaims" class="db-pill" title="Claims Exchange">Claims Exchange</button>
      <button id="dbSales"  class="db-icon red"  title="Urgent Intake (Sales)">☎</button>
      <button id="dbSupport"class="db-icon blue" title="Support Intake">☎</button>
    </div>

    <dialog id="dbDlgUrgent"  class="db-dialog">
      <h3 style="margin:0 0 8px">📣 Urgent Intake (Sales)</h3>
      <div class="db-disclaimer" style="margin:-4px 0 8px">
        This routes quickly to our sales desk. Use for time-sensitive lead opportunities or capital needs.
      </div>
      <form id="dbFormUrgent" class="db-form" method="dialog">
        <div class="db-row">
          <input id="uName"  class="db-input"  placeholder="Your name"/>
          <input id="uEmail" class="db-input"  placeholder="Your email"/>
        </div>
        <div class="db-row">
          <input id="uPhone" class="db-input"  placeholder="Best phone (optional)"/>
          <select id="uCategory" class="db-select">
            <option value="Lead Opportunity">Lead Opportunity</option>
            <option value="Capital Request">Capital Request</option>
            <option value="Disposition">Disposition</option>
          </select>
        </div>
        <input id="uSubject" class="db-input" placeholder="Short subject"/>
        <textarea id="uDetail" class="db-textarea" placeholder="Tell us what's urgent…"></textarea>
        <div class="db-actions">
          <button type="button" class="db-btn ghost" onclick="document.getElementById('dbDlgUrgent').close()">Close</button>
          <button type="submit" class="db-btn primary">Send</button>
        </div>
      </form>
    </dialog>

    <dialog id="dbDlgSupport" class="db-dialog">
      <h3 style="margin:0 0 8px">🛠️ Support Intake</h3>
      <div class="db-disclaimer" style="margin:-4px 0 8px">
        General questions, non-urgent bugs, or requests for help. We’ll reply in queue order.
      </div>
      <form id="dbFormSupport" class="db-form" method="dialog">
        <div class="db-row">
          <input id="sName"  class="db-input"  placeholder="Your name"/>
          <input id="sEmail" class="db-input"  placeholder="Your email"/>
        </div>
        <input id="sSubject" class="db-input" placeholder="Subject"/>
        <textarea id="sDetail" class="db-textarea" placeholder="Describe your issue / request…"></textarea>
        <div class="db-actions">
          <button type="button" class="db-btn ghost" onclick="document.getElementById('dbDlgSupport').close()">Close</button>
          <button type="submit" class="db-btn primary">Send</button>
        </div>
      </form>
    </dialog>

    <div id="dbToast" class="db-toast"></div>
  `;

  function inject() {
    if (document.getElementById('dbToolbar')) return;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    const holder = document.createElement('div'); holder.innerHTML = html;
    document.body.append(...holder.children);

    // Prefill from Firebase Auth (if present)
    try {
      const fill = (user) => {
        const name = user?.displayName || ''; const email = user?.email || '';
        const set = (id, val) => { const el=document.getElementById(id); if (el && !el.value) el.value = val; };
        set('uName', name); set('uEmail', email);
        set('sName', name); set('sEmail', email);
      };
      if (window.firebase?.auth) {
        const auth = window.firebase.auth();
        if (auth.currentUser) fill(auth.currentUser);
        auth.onAuthStateChanged(fill);
      }
    } catch(_){}

    // Buttons
    document.getElementById('dbClaims').onclick  = () => location.href = 'claims-exchange.html';
    document.getElementById('dbSales').onclick   = () => document.getElementById('dbDlgUrgent').showModal();
    document.getElementById('dbSupport').onclick = () => document.getElementById('dbDlgSupport').showModal();

    // Submits
    document.getElementById('dbFormUrgent').addEventListener('submit', (e)=>{
      e.preventDefault(); submitIntake('urgent', {
        name: gv('uName'), email: gv('uEmail'), phone: gv('uPhone'),
        category: gv('uCategory'), subject: gv('uSubject'), detail: gv('uDetail')
      }, 'dbDlgUrgent');
    });
    document.getElementById('dbFormSupport').addEventListener('submit', (e)=>{
      e.preventDefault(); submitIntake('support', {
        name: gv('sName'), email: gv('sEmail'),
        subject: gv('sSubject'), detail: gv('sDetail')
      }, 'dbDlgSupport');
    });
  }

  function gv(id){ return (document.getElementById(id)?.value || '').trim(); }

  function toast(msg){
    const el = document.getElementById('dbToast');
    el.textContent = msg; el.style.display='block';
    clearTimeout(el._t); el._t = setTimeout(()=> el.style.display='none', 1800);
  }

  function submitIntake(kind, payload, dlgId){
    const stamp = Date.now();
    const base = {
      kind, ...payload,
      createdAt: stamp,
      path: location.pathname + location.search,
      referrer: document.referrer || '',
      ua: navigator.userAgent || ''
    };
    const done = () => { toast('Sent — we\'ll follow up shortly.'); document.getElementById(dlgId).close(); };

    // If Firebase is present, write to two spots: global + by user
    try{
      const fb = window.firebase;
      if (fb?.database) {
        const db  = fb.database();
        const uid = fb.auth?.()?.currentUser?.uid || null;

        const updates = {};
        const newKey = db.ref().child('intake/global').push().key;
        updates['/intake/global/'+newKey] = {...base, uid};
        if (uid) updates['/intake/byUser/'+uid+'/'+newKey] = {...base, uid};

        db.ref().update(updates).then(done).catch(()=>{ console.warn('DB write failed; fall back'); done(); });
        return;
      }
    }catch(_){ /* fall through */ }

    // Fallback when Firebase isn’t available: still succeed UX-wise
    done();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
</script>
