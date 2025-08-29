// app-auth.js  (drop this in at repo root, replacing the file completely)
// Requires: <script defer src="./config.js"></script> loaded before this module.
// Purpose: Initialize Firebase Auth, wire email/password & Google sign-in on index.html.

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

/* ---------- Guard: firebaseConfig must exist ---------- */
if (!window.firebaseConfig) {
  console.error("Missing window.firebaseConfig. Ensure config.js is included BEFORE app-auth.js.");
  alert("Config missing. Reload the page, or check that config.js is included before app-auth.js.");
  throw new Error("firebaseConfig missing");
}

/* ---------- Initialize Firebase ---------- */
const app  = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence).catch(console.warn);

/* ---------- DOM helpers ---------- */
const qs = (s) => document.querySelector(s);
const emailEl   = qs("#email");
const passEl    = qs("#password");
const enterBtn  = qs("#enterBtn");
const googleBtn = qs("#googleBtn");

function setBusy(el, on) {
  if (!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

/* ---------- Email/Password Sign-in ---------- */
async function emailLogin() {
  try {
    const email = (emailEl?.value || "").trim();
    const pass  = (passEl?.value  || "").trim();
    if (!email || !pass) {
      alert("Enter email and password.");
      return;
    }
    setBusy(enterBtn, true);
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "profile.html";
  } catch (err) {
    console.error(err);
    alert(err && err.message ? err.message : "Sign-in failed.");
  } finally {
    setBusy(enterBtn, false);
  }
}

/* ---------- Google Sign-in ---------- */
async function googleLogin() {
  try {
    setBusy(googleBtn, true);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    location.href = "profile.html";
  } catch (err) {
    console.error(err);
    alert(err && err.message ? err.message : "Google sign-in failed.");
  } finally {
    setBusy(googleBtn, false);
  }
}

/* ---------- Wire events (if elements exist) ---------- */
enterBtn?.addEventListener("click", emailLogin);
passEl?.addEventListener("keydown", (e) => { if (e.key === "Enter") emailLogin(); });
googleBtn?.addEventListener("click", googleLogin);

/* ---------- Auto-redirect if already signed in ---------- */
onAuthStateChanged(auth, (user) => {
  if (user && !location.pathname.endsWith("/profile.html")) {
    location.href = "profile.html";
  }
});
