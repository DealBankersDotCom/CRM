// app-auth.js
// Uses Firebase v10+ CDN modules. Requires window.firebaseConfig from config.js.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function $(s){ return document.querySelector(s); }
function toast(msg){ alert(msg); }

function ensureConfig(){
  if (!window.firebaseConfig || !window.firebaseConfig.apiKey){
    throw new Error("Missing firebaseConfig (config.js).");
  }
}

function initFirebase(){
  ensureConfig();
  const app = initializeApp(window.firebaseConfig);
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(()=>{});
  return { app, auth };
}

function gotoPortal(){
  // Always land on profile.html when signed in
  location.href = "profile.html";
}

export const DB = (()=>{
  let auth = null;

  function wireLogin(){
    try{
      auth = initFirebase().auth;
    }catch(e){
      console.error(e);
      // Fallback: let the page still navigate so UX isn't dead.
      $("#enterBtn")?.addEventListener("click", ()=>location.href="profile.html");
      $("#googleBtn")?.addEventListener("click", ()=>location.href="profile.html");
      return;
    }

    const emailEl = $("#email");
    const passEl  = $("#password");

    $("#enterBtn")?.addEventListener("click", async ()=>{
      const email = (emailEl?.value || "").trim();
      const pass  = (passEl?.value || "").trim();
      if(!email || !pass){ toast("Enter email and password."); return; }
      try{
        await signInWithEmailAndPassword(auth, email, pass);
        gotoPortal();
      }catch(err){
        console.error(err);
        toast(err?.message || "Sign-in failed.");
      }
    });

    $("#password")?.addEventListener("keydown", (ev)=>{
      if(ev.key === "Enter") $("#enterBtn")?.click();
    });

    $("#googleBtn")?.addEventListener("click", async ()=>{
      try{
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        gotoPortal();
      }catch(err){
        console.error(err);
        toast(err?.message || "Google sign-in failed.");
      }
    });

    // If already signed in, bounce straight to portal
    onAuthStateChanged(auth, (u)=>{
      if(u) gotoPortal();
    });
  }

  return { wireLogin };
})();

// Auto-wire when loaded on index.html
if (document.querySelector("#enterBtn")) {
  DB.wireLogin();
}
