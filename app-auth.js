<script>
// Initializes Firebase (expects window.firebaseConfig from config.js)
(function(){
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.database();
    window.storage = firebase.storage();
  }

  const auth = window.auth, db = window.db;

  // Presence for the signed-in user
  function setPresence(uid){
    const ref = db.ref('presence/'+uid);
    ref.onDisconnect().set({ online:false, ts: firebase.database.ServerValue.TIMESTAMP });
    ref.set({ online:true, ts: firebase.database.ServerValue.TIMESTAMP });
  }

  // Ensure a minimal roles doc exists
  async function ensureRoles(uid){
    const ref = db.ref(`userSettings/${uid}/roles`);
    const snap = await ref.get();
    if (!snap.exists()) {
      await ref.set({ role:'member', acq:true, dispo:false });
    }
  }

  // Gate/redirect
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
      await ensureRoles(user.uid);
      // If on index and signed in, move into the app hub
      if (onIndex) location.href = 'profile.html';
    } catch (err) {
      console.error('Auth gate error:', err);
    }
  });

  // Optional helper for other pages
  window.requireAuth = () => new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(u => {
      if (u) { unsub(); resolve(u); }
    });
  });
})();
</script>
