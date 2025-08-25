(function(){
  if(!window.firebaseConfig) { console.error('Missing firebaseConfig'); return; }
  if(!firebase.apps.length)  { firebase.initializeApp(window.firebaseConfig); }

  const auth = firebase.auth();
  const db   = firebase.database();

  // Presence helper
  function setPresence(uid){
    const ref = db.ref('presence/global/'+uid);
    ref.onDisconnect().remove();
    ref.set({ uid, ts: firebase.database.ServerValue.TIMESTAMP });
  }

  // Gate: if signed out, send to index.html; if on index and signed in, bounce to profile.
  auth.onAuthStateChanged((user)=>{
    const onIndex = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname === '/';
    if(user){
      setPresence(user.uid);
      if(onIndex) location.href = 'profile.html';
    }else{
      if(!onIndex) location.href = 'index.html';
    }
  });

  // expose for pages if needed
  window.auth = auth;
  window.db   = db;
})();
