<!-- app-auth.js -->
<script>
/* Lightweight Firebase bootstrap + helpers (CDN v9 compat) */
(function () {
  const cdn = "https://www.gstatic.com/firebasejs/9.23.0/";
  const need = [
    "firebase-app-compat.js",
    "firebase-auth-compat.js",
    "firebase-database-compat.js"
  ];
  let loaded = 0;
  need.forEach(f => {
    const s = document.createElement("script");
    s.src = cdn + f;
    s.onload = () => (++loaded === need.length) && init();
    document.head.appendChild(s);
  });

  function init() {
    if (!window.DB_CONFIG) {
      console.error("Missing DB_CONFIG from config.js");
      return;
    }
    // Singleton
    if (!window.firebase?.apps?.length) {
      firebase.initializeApp(window.DB_CONFIG);
    }
    const auth = firebase.auth();
    const db   = firebase.database();

    const helpers = {
      auth, db,
      onAuth: (cb) => auth.onAuthStateChanged(cb),
      requireAuth: (cb) => auth.onAuthStateChanged(u => {
        if (!u) location.href = "index.html";
        else cb(u);
      }),
      signOut: () => auth.signOut().catch(console.error),
      serverTs: () => firebase.database.ServerValue.TIMESTAMP,
      me: () => auth.currentUser,
      uid: () => auth.currentUser?.uid || null,
      email: () => auth.currentUser?.email || null,
      isAdmin: async () => {
        const uid = helpers.uid(); if (!uid) return false;
        try {
          const snap = await db.ref("roles/" + uid).get();
          return snap.val() === "admin";
        } catch (e) { console.error(e); return false; }
      },
      // Townhall
      listenTownhall: (onUpdate) => {
        return db.ref("townhall/messages").limitToLast(50)
          .on("value", s => {
            const list = [];
            s.forEach(ch => list.push(ch.val()));
            onUpdate(list);
          });
      },
      sendTownhall: async (text) => {
        const u = helpers.me();
        if (!u) return;
        const ref = db.ref("townhall/messages").push();
        await ref.set({
          id: ref.key,
          uid: u.uid,
          email: u.email || "",
          name: u.displayName || (u.email || "").split("@")[0],
          text, ts: helpers.serverTs()
        });
      },
      // Claims review writer — conforms to your rules
      writeClaimReview: async (claimId, decision, comment) => {
        const u = helpers.me(); if (!u) throw new Error("No auth");
        const ref = db.ref(`claims/intake/${claimId}/reviews/${u.uid}`);
        await ref.set({
          uid: u.uid,
          email: u.email || "",
          decision, comment: comment || "",
          ts: helpers.serverTs()
        });
      },
      getClaimReview: async (claimId, uid) => {
        const snap = await db.ref(`claims/intake/${claimId}/reviews/${uid}`).get();
        return snap.exists() ? snap.val() : null;
      }
    };

    window.DB = helpers;
    document.dispatchEvent(new Event("db-ready"));
  }
})();
</script>
