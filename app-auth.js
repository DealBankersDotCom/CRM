(function () {
  // Initialize Firebase app once globally
  if (!window.firebaseApp) {
    window.firebaseApp = firebase.initializeApp(window.firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.firestore(); // Swapped to Firestore
    window.storage = firebase.storage && firebase.storage();
  }

  const auth = window.auth;
  const db = window.db;

  // Track user presence (online/offline)
  function setPresence(uid) {
    const ref = db.collection('presence_global').doc(uid);
    
    // Set to Online
    ref.set({
      online: true,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Firestore Workaround for onDisconnect()
    window.addEventListener("beforeunload", () => {
      ref.set({
        online: false,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  }

  // Mirror role into userSettings
  async function ensureRoleMirror(uid) {
    try {
      const roleSnap = await db.collection('roles').doc(uid).get();
      // Safely extract role, default to 'member' if it doesn't exist
      const role = roleSnap.exists ? (roleSnap.data().role || 'member') : 'member';
      
      await db.collection('userSettings').doc(uid).set({
        roles: { role: role }
      }, { merge: true });
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
