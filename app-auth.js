(function(){
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.database();
    window.storage = firebase.storage();
  }

  const auth = window.auth, db = window.db;

  function setPresence(uid){
    const ref = db.ref('presence/global/'+uid);
    ref.onDisconnect().set({ online:false, ts: firebase.database.ServerValue.TIMESTAMP });
    ref.set({ online:true, ts: firebase.database.ServerValue.TIMESTAMP });
  }

  async function ensureRoleMirror(uid){
    // Mirror role from /roles/{uid} into /userSettings/{uid}/roles/role for convenience
    const rolesRef = db.ref('roles/'+uid);
    const userRoleSnap = await rolesRef.get();
    const role = userRoleSnap.exists() ? userRoleSnap.val() : 'member';
    await db.ref('userSettings/'+uid+'/roles/role').set(role);
  }

  async function ensureDefaults(uid){
    await ensureRoleMirror(uid);
  }

  auth.onAuthStateChanged(async user => {
    const gateEl = document.querySelector('[data-auth-status]');
    if (gateEl) gateEl.textContent = user ? 'signed in' : 'signed out';

    const path = location.pathname.endsWith('/') ? location.pathname+'index.html' : location.pathname;
    const onIndex = path.endsWith('/index.html');

    if (!user) {
      if (!onIndex) location.href = 'index.html';
      return;
    }

    try {
      setPresence(user.uid);
      await ensureDefaults(user.uid);
      if (onIndex) location.href = 'profile.html';
    } catch (err) {
      console.error('Auth gate error:', err);
    }
  });

  window.requireAuth = () => new Promise(resolve => {
    const unsub = window.auth.onAuthStateChanged(u => { if (u) { unsub(); resolve(u); } });
  });
})();  
