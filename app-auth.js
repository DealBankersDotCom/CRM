<!-- Save as: app-auth.js -->
<script type="module">
/*
  DealBankers — Auth bootstrap
  - Uses window.firebaseConfig from config.js
  - Wires Email/Password & Google sign-in
  - Persists session and redirects after login
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---- Guard: make sure config is available ----
if (!window.firebaseConfig) {
  console.error("Missing firebaseConfig. Ensure config.js is loaded before app-auth.js");
}

// ---- Init Firebase ----
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.warn);

const qs = (s) => document.querySelector(s);
const emailEl = qs('#email');
const passEl  = qs('#password');
const enterBtn = qs('#enterBtn');
const googleBtn = qs('#googleBtn');

// ---- Email/Password Sign-in ----
async function emailLogin() {
  try {
    const email = (emailEl?.value || "").trim();
    const pass  = (passEl?.value  || "").trim();
    if (!email || !pass) { alert("Enter email and password."); return; }
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = 'profile.html';
  } catch (err) {
    console.error(err);
    alert(err.message || "Login failed.");
  }
}

// ---- Google Sign-in ----
async function googleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    location.href = 'profile.html';
  } catch (err) {
    console.error(err);
    // Common causes: provider not enabled, domain not authorized
    alert(err.message || "Google sign-in failed.");
  }
}

// ---- Wire UI ----
enterBtn?.addEventListener('click', emailLogin);
passEl?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') emailLogin(); });
googleBtn?.addEventListener('click', googleLogin);

// ---- Auto-redirect if already signed in ----
onAuthStateChanged(auth, (user) => {
  if (user && !location.pathname.endsWith('/profile.html')) {
    location.href = 'profile.html';
  }
});
</script>
