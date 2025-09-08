(function(){
  let cachedUx=null;
  firebase.auth().onAuthStateChanged(async (u)=>{
    const root = document.documentElement;
    try{
      if(!u){ root.classList.remove('theme-neon','drive-mode','scale-large'); removeDriveBar(); return; }
      const snap = await firebase.database().ref('userSettings/'+u.uid+'/ux').get();
      cachedUx = snap.exists()? snap.val() : {};
      if(cachedUx.theme==='neon'){ root.classList.add('theme-neon'); } else { root.classList.remove('theme-neon'); }
      if(cachedUx.drivingMode){ root.classList.add('drive-mode'); ensureDriveBar(cachedUx); } else { root.classList.remove('drive-mode'); removeDriveBar(); }
      if(cachedUx.uiScale==='large'){ root.classList.add('scale-large'); } else { root.classList.remove('scale-large'); }
    }catch(e){ console.warn('ux-apply', e); }
  });
  function ensureDriveBar(ux){
    if(document.querySelector('.drive-bar')) return;
    const bar = document.createElement('div'); bar.className='drive-bar';
    bar.innerHTML = `
      <button class="drive-btn">New Lead</button>
      <button class="drive-btn">My Deals</button>
      <button class="drive-btn">Call</button>
    `;
    bar.querySelectorAll('button')[0].onclick = ()=> location.href='urgent-intake.html';
    bar.querySelectorAll('button')[1].onclick = ()=> location.href='wholesaler.html#dispo';
    bar.querySelectorAll('button')[2].onclick = ()=> window.open('tel:+12108165112');
    document.body.appendChild(bar);
  }
  function removeDriveBar(){ const b=document.querySelector('.drive-bar'); if(b) b.remove(); }
})();
