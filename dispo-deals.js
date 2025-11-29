<script>
(function(){
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  const db = firebase.database();
  const dispoList = document.getElementById("dispoList");
  const statusEl = document.getElementById("status");

  function esc(s){ return (''+(s||'')).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) }

  function renderDeals(deals){
    if(!dispoList || !Array.isArray(deals)) return;
    dispoList.innerHTML = deals.map(d=>`
      <div class="deal-card">
        <div class="deal-info">
          <div><strong>${esc(d.address||'Unknown')}</strong></div>
          <div>Price: <strong>$${esc(d.price||'')}</strong></div>
          <div>Phone: ${esc(d.phone||'')}</div>
          <div class="deal-notes">${esc(d.notes||'')}</div>
          <button onclick="window.open('https://maps.google.com?q=${encodeURIComponent(d.address)}','_blank')">View Map</button>
        </div>
      </div>
    `).join('');
    statusEl.textContent = 'Dispo: '+deals.length+' deals';
  }

  function loadDeals(){
    db.ref("dispoDeals").on("value", snap => {
      const val = snap.val() || {};
      const arr = Object.values(val);
      renderDeals(arr);
    });
  }

  loadDeals();
})();
</script>
