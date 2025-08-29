<!-- app-auth.js -->
<script type="module">
// Uses your firebase config from config.js (do not commit secrets here)
import { firebaseConfig } from './config.js';

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getDatabase, ref, onChildAdded, push, serverTimestamp, update, get
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// -----------------------------
// Auth helpers exposed globally
// -----------------------------
window.DB = window.DB || {};
DB.auth = auth;
DB.db   = db;

DB.signInEmail = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  sessionStorage.setItem('uid', user.uid);
  return user;
};

DB.signInGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  sessionStorage.setItem('uid', user.uid);
  return user;
};

DB.signOut = async () => {
  sessionStorage.removeItem('uid');
  await signOut(auth);
  location.href = 'index.html';
};

DB.requireAuth = (target = 'index.html') =>
  new Promise((resolve)=>{
    onAuthStateChanged(auth, (user)=>{
      if (!user) { location.href = target; return; }
      sessionStorage.setItem('uid', user.uid);
      resolve(user);
    });
  });

// --------------
// Role utilities
// --------------
DB.getRole = async (uid) => {
  const snap = await get(ref(db, `roles/${uid}`));
  return snap.exists() ? snap.val() : null;
};

DB.isAdmin = async (uid) => (await DB.getRole(uid)) === 'admin';

// ----------------------
// Townhall chat bindings
// ----------------------
DB.bindTownhall = (els) => {
  // els: { list, input, sendBtn }
  const user = auth.currentUser;
  if (!user || !els?.list) return;

  const listRef = ref(db, 'townhall/messages');
  onChildAdded(listRef, (snap)=>{
    const m = snap.val();
    const li = document.createElement('div');
    li.style.margin = '6px 0';
    li.style.padding = '8px 10px';
    li.style.background = '#0d1620';
    li.style.border = '1px solid rgba(255,255,255,.06)';
    li.style.borderRadius = '10px';
    li.textContent = `${m.displayName || 'User'}: ${m.text || ''}`;
    els.list.prepend(li);
  });

  const send = async () => {
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = '';
    await push(listRef, {
      uid: user.uid,
      displayName: user.displayName || user.email || 'User',
      text, ts: serverTimestamp()
    });
  };
  els.sendBtn?.addEventListener('click', send);
  els.input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') send(); });
};

// -----------------------------
// Entry points for login page
// -----------------------------
DB.wireLogin = () => {
  const email = document.querySelector('#email');
  const pass  = document.querySelector('#password');
  const btn   = document.querySelector('#enterBtn');
  const gbtn  = document.querySelector('#googleBtn');

  const go = async () => {
    try{
      if(!email?.value || !pass?.value){ alert('Enter email and password.'); return; }
      await DB.signInEmail(email.value.trim(), pass.value.trim());
      location.href = 'profile.html';
    }catch(err){ alert(err.message || 'Login failed.'); }
  };
  btn?.addEventListener('click', go);
  pass?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') go(); });
  gbtn?.addEventListener('click', async ()=>{
    try{ await DB.signInGoogle(); location.href='profile.html'; }
    catch(err){ alert(err.message || 'Google sign-in failed.'); }
  });
};

// --------------------------
// Claims Exchange convenience
// --------------------------
DB.ensureSignedInToClaims = async () => {
  const u = await DB.requireAuth('index.html');
  return u;
};

export {};
</script>
