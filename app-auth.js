(function(){
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.database();
    window.storage = firebase.storage && firebase.storage();
  }
  const auth = window.auth, db = window.db;

  function setPresence(uid){
    const ref = db.ref('presence/global/'+uid);
    ref.onDisconnect().set({ online:false, ts: firebase.database.ServerValue.TIMESTAMP });
    ref.set({ online:true, ts: firebase.database.ServerValue.TIMESTAMP });
  }
  async function ensureRoleMirror(uid){
    try{
      const r = await db.ref('roles/'+uid).get();
      await db.ref('userSettings/'+uid+'/roles/role').set(r.exists()?r.val():'member');
    }catch{}
  }
  function isIndex(){ const p=location.pathname; return !p || p==='/' || p.endsWith('/') || p.endsWith('/index.html'); }
  function goProfile(){ if(!location.pathname.endsWith('/profile.html')) location.replace('profile.html'); }

  auth.onAuthStateChanged(async u=>{
    const s=document.querySelector('[data-auth-status]'); if(s) s.textContent=u?'signed in':'signed out';
    if(!u){ if(!isIndex()) location.replace('index.html'); return; }
    setPresence(u.uid); await ensureRoleMirror(u.uid); if(isIndex()) goProfile();
  });
  window.requireAuth=()=>new Promise(res=>{ const un=auth.onAuthStateChanged(u=>{ if(u){un();res(u);} }); });
})();  
