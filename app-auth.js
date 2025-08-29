(function(){
  if (!window.firebaseApp) {
    if (!window.firebaseConfig) {
      console.error('[app-auth] Missing window.firebaseConfig from config.js');
    }
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
    try {
      const roleSnap = await db.ref('roles/'+uid).get();
      const role = roleSnap.exists() ? roleSnap.val() : 'member';
      await db.ref('userSettings/'+uid+'/roles/role').set(role);
    } catch (e) {
      console.warn('[app-auth] ensureRoleMirror failed:', e);
    }
  }

  function isIndexPath(){
    // Be generous: treat "/", "/index.html", "", and GitHub Pages root as index
    const p = location.pathname;
    if (!p || p === '/') return true;
    if (p.endsWith('/')) return true;
    if (p.endsWith('/index.html')) return true;
    return false;
  }

  function safeRedirectToProfile(){
    // Avoid redirect loops if profile doesn't exist
    const target = 'profile.html';
    if (!location.pathname.endsWith('/'+target)) {
      location.replace(target);
    }
  }

  // Primary gate
  auth.onAuthStateChanged(async user => {
    const gateEl = document.querySelector('[data-auth-status]');
    if (gateEl) gateEl.textContent = user ? 'signed in' : 'signed out';

    if (!user) {
      // Stay on index for sign-in; kick non-index pages back to index
      if (!isIndexPath()) location.replace('index.html');
      return;
    }

    // Signed in: set presence + ensure role mirror, then leave non-index pages alone
    try {
      setPresence(user.uid);
      await ensureRoleMirror(user.uid);
    } catch (e) {
      console.warn('[app-auth] post-signin ops failed:', e);
    }

    // If we're on an index-like path, move to profile
    if (isIndexPath()) {
      safeRedirectToProfile();
    }
  });

  // Defensive: if already signed in but on index, nudge redirect after load
  window.addEventListener('load', () => {
    const u = auth.currentUser;
    if (u && isIndexPath()) {
      setTimeout(safeRedirectToProfile, 150);
    }
  });

  // Helper for pages that need a user before running
  window.requireAuth = () => new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(u => { if (u) { unsub(); resolve(u); } });
  });
})();  
