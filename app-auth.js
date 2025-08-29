<script type="module">
// app-auth.js — hardened header + auth shim (never leaves a blank page)

let _safeMode = false;

// ---------- Firebase (guarded) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let app=null, auth=null;
try {
  if (!window.firebaseConfig) throw new Error("firebaseConfig missing");
  app = window.firebaseApp || initializeApp(window.firebaseConfig);
  window.firebaseApp = app;
  auth = getAuth(app);
} catch (e) {
  console.warn("[DB] Safe mode auth:", e?.message || e);
  _safeMode = true;
}

// ---------- Namespace ----------
window.DB = window.DB || {};

// Google sign-in (used on index.html)
window.DB.googleSignIn = async () => {
  if (_safeMode) { location.href = "profile.html"; return; }
  const prov = new GoogleAuthProvider();
  await signInWithPopup(auth, prov);
  location.href = "profile.html";
};

// Require auth (never blank the page)
window.DB.requireAuth = (cb) => {
  if (_safeMode) { cb && cb(null); return; }
  onAuthStateChanged(auth, (u) => {
    if (!u) { location.href = "index.html"; return; }
    cb && cb(u);
  });
};

// Optional hook when auth readiness itself is enough
window.DB.maybeAuth = (cb) => {
  if (_safeMode) { cb && cb(null); return; }
  onAuthStateChanged(auth, (u)=> cb && cb(u));
};

// Global logout (always returns home)
window.DB.logout = async () => {
  try { if (!_safeMode) await signOut(auth); } catch(e){ console.warn(e); }
  location.href = "index.html";
};

// ---------- Shared header ----------
window.DB.renderHeader = (opts={}) => {
  if (document.querySelector(".db-topbar")) return;
  const bar = document.createElement("div");
  bar.className = "db-topbar";
  bar.innerHTML = `
    <style>
      .db-topbar{
        position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:.75rem;
        padding:.75rem 1rem; background:#0e1a22cc; backdrop-filter:saturate(1.2) blur(6px);
        border-bottom:1px solid #1f3442; box-shadow:0 6px 30px rgba(0,0,0,.25)
      }
      .db-brand{display:flex; align-items:center; gap:.5rem; font-weight:700; letter-spacing:.04em; color:#cfe8ff}
      .db-brand img{width:28px;height:28px;border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,.35)}
      .db-spacer{flex:1}
      .db-pill{
        appearance:none; border:1px solid #274454; background:#132937; color:#dceaf7;
        padding:.45rem .8rem; border-radius:999px; font-weight:600; font-size:.88rem; cursor:pointer
      }
      .db-pill:hover{background:#173345;border-color:#2f5c71}
      .gold{background:#6a4f06;border-color:#9b7b18;color:#ffefc3}
      .red{background:#3b1010;border-color:#6b1c1c}
      .blue{background:#0f2a47;border-color:#1d4b7a}
      @media(max-width:720px){ .db-pill{padding:.42rem .65rem; font-size:.84rem} }
    </style>
    <div class="db-brand">
      <img src="images/logo-32.png" onerror="this.src='icon (1).jpg'" alt="DB">
      <span>DEALBANKERS • PROFILE</span>
    </div>
    <div class="db-spacer"></div>
    <button class="db-pill gold" id="btnClaims">Claims Exchange</button>
    <button class="db-pill red"  id="btnSales">Sales</button>
    <button class="db-pill blue" id="btnSupport">Support</button>
    <button class="db-pill"      id="btnLogout">Log Out</button>
  `;
  document.body.prepend(bar);
  bar.querySelector("#btnClaims").onclick  = ()=> location.href = "claims-exchange.html";
  bar.querySelector("#btnSales").onclick   = ()=> location.href = "wholesaler.html?tab=acq";
  bar.querySelector("#btnSupport").onclick = ()=> location.href = "support.html";
  bar.querySelector("#btnLogout").onclick  = ()=> window.DB.logout();
};

window.DB._safeMode = _safeMode;
</script>
