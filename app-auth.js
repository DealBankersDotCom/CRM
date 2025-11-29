(function () {
  // Initialize Firebase app once globally
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.database();
    window.storage = firebase.storage && firebase.storage();
  }

  const auth = window.auth;
  const db = window.db;

  // Track user presence (online/offline)
  function setPresence(uid) {
    const ref = db.ref('presence/global/' + uid);
    ref.onDisconnect().set({
      online: false,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    ref.set({
      online: true,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  }

  // Mirror role into userSettings
  async function ensureRoleMirror(uid) {
    try {
      const roleSnap = await db.ref('roles/' + uid).get();
      const role = roleSnap.exists() ? roleSnap.val() : 'member';
      await db.ref('userSettings/' + uid + '/roles/role').set(role);
    } catch (err) {
      console.warn("Failed to mirror user role:", err);
    }
  }

  // Helper: Check if we're on index.html
  function isIndex() {
    const p = location.pathname;
    return !p || p === '/' || p.endsWith('/') || p.endsWith('/index.html');
  }

  // Helper: Go to profile page
  function goProfile() {
    if (!location.pathname.endsWith('/profile.html')) {
      location.replace('profile.html');
    }
  }

  // Handle auth state changes
  auth.onAuthStateChanged(async user => {
    const statusElem = document.querySelector('[data-auth-status]');
    if (statusElem) {
      statusElem.textContent = user ? 'Signed in' : 'Signed out';
    }

    if (!user) {
      if (!isIndex()) location.replace('index.html');
      return;
    }

    setPresence(user.uid);
    await ensureRoleMirror(user.uid);

    if (isIndex()) goProfile();
  });

  // Utility: Wait until user is signed in (used in secured pages)
  window.requireAuth = () => new Promise(res => {
    const un = auth.onAuthStateChanged(u => {
      if (u) {
        un();
        res(u);
      }
    });
  });

  // Utility: Global log out handler
  window.logoutUser = () => {
    auth.signOut()
      .then(() => location.replace('index.html'))
      .catch(err => console.error("Logout failed:", err));
  };
})();
