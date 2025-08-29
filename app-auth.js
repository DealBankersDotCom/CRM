<script type="module">
// --- Firebase (modular CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getDatabase, ref, onChildAdded, push, serverTimestamp, get, child, set, update
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// --- CONFIG: expects window.firebaseConfig from config.js ---
if (!window.firebaseConfig) {
  console.error("Missing firebaseConfig (config.js).");
}
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// ------- Global helpers (used by all pages) -------
window.DB = { app, auth, db };

// Returns current user (or null)
window.currentUser = () => auth.currentUser || null;
// Returns UID safely
window.uid = () => (auth.currentUser ? auth.currentUser.uid : null);
// Quick role fetch (admin/wholesaler/etc)
window.getRole = async (u = uid()) => {
  if (!u) return null;
  const snap = await get(ref(db, `roles/${u}`));
  return snap.exists() ? snap.val() : null;
};
// Gate: require auth, optionally role
window.gate = async (opts = { role: null }) => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { reject(new Error("no-auth")); return; }
      if (!opts.role) { resolve(user); return; }
      const role = await getRole(user.uid);
      if (role === opts.role || role === "admin") resolve(user);
      else reject(new Error("no-role"));
    });
  });
};

// Google Sign-In / Sign-Out
window.signInGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
window.logout = async () => { await signOut(auth); location.href = "index.html"; };

// ------- Townhall chat (shared on profile.html) -------
window.initTownhall = () => {
  const list = document.querySelector("#chatList");
  const input = document.querySelector("#chatInput");
  const btn = document.querySelector("#chatSend");
  if (!list || !input || !btn) return;

  list.innerHTML = "";
  const roomRef = ref(db, "townhall/messages");
  onChildAdded(roomRef, (snap) => {
    const m = snap.val();
    const li = document.createElement("div");
    li.className = "chip";
    li.textContent = `${m.displayName || m.uid || "anon"} — ${m.text || ""}`;
    list.prepend(li);
  });

  const send = async () => {
    const u = currentUser();
    const text = input.value.trim();
    if (!u || !text) return;
    await push(roomRef, {
      uid: u.uid,
      displayName: u.displayName || u.email,
      text,
      ts: serverTimestamp()
    });
    input.value = "";
  };
  btn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
};

// ------- Phones (red/blue) mini-forms (modal-less) -------
window.openImmediateSupport = () => {
  const u = currentUser();
  const note = prompt("IMMEDIATE SUPPORT — describe the urgent need:");
  if (!u || !note) return;
  push(ref(db, `support/immediate`), {
    uid: u.uid, who: u.email || u.displayName, note, ts: serverTimestamp()
  }).then(()=>alert("Submitted. We'll reach out ASAP."));
};
window.openStandardSupport = () => {
  const u = currentUser();
  const note = prompt("STANDARD SUPPORT — how can we help?");
  if (!u || !note) return;
  push(ref(db, `support/standard`), {
    uid: u.uid, who: u.email || u.displayName, note, ts: serverTimestamp()
  }).then(()=>alert("Submitted. We'll get back soon."));
};

// ------- Claims Exchange mapping (Google Doc previews) -------
const CLAIM_LINKS = {
  // MITZI (Darlene case)
  "mitzidyane@gmail.com": [
    { label: "Assignment (Darlene)", url: "https://docs.google.com/document/d/1LG0iYsi1YogCTmdFeFLFKQNIDZI-hzoYOQqJ07UHebQ/edit?usp=drive_link" },
    { label: "Statement of Facts (Darlene)", url: "https://docs.google.com/document/d/1O8fgDbWstzJUu045_SGg3cxlZRs1nGwjX_Ksr0IBJCk/edit?usp=drive_link" },
  ],
  // HONCHO (Alfred via UID)
  "bZtK9f6wAwYab20yawDbXRZdG6c2": [
    { label: "Assignment (Honcho)", url: "https://docs.google.com/document/d/1H-sx230TmpKJx-Mst1_sXAS39MJWwUiQXpx75tzuLro/edit?usp=drive_link" },
    { label: "Statement of Facts (Honcho)", url: "https://docs.google.com/document/d/1K72u3Fx4OGN3PbncLd1uwEqZ_olYpJrkUxByrDAs7ME/edit?usp=drive_link" },
  ],
  // MADISON (no email known yet)
  "MADISON_PLACEHOLDER": [
    { label: "Assignment (Madison)", url: "https://docs.google.com/document/d/1npndKHg7ejhqixWddrJ0tlrhDPgcva6d-Dl6oYI6KF0/edit?usp=drive_link" },
    { label: "Statement of Facts (Madison)", url: "https://docs.google.com/document/d/1xhyO7RcQNyfSXb7mNHGoxyDKSaGOY1FVhAJyERc4ggM/edit?usp=drive_link" },
  ],
};
window.mountClaimsForUser = async (targetElId="claimsCards") => {
  const wrap = document.getElementById(targetElId);
  if (!wrap) return;
  wrap.innerHTML = "";

  const user = await new Promise((resolve) => {
    onAuthStateChanged(auth, resolve);
  });
  if (!user) {
    wrap.innerHTML = `<div class="card">Please sign in to view your claims.</div>`;
    return;
  }

  const key = user.email || user.uid;
  let links = CLAIM_LINKS[key];

  // If Madison signs in later with unknown email, you can manually map her UID here:
  if (!links && user.displayName && user.displayName.toLowerCase().includes("madison")) {
    links = CLAIM_LINKS["MADISON_PLACEHOLDER"];
  }

  if (!links) {
    wrap.innerHTML = `<div class="card">No claims assigned to ${key} yet.</div>`;
    return;
  }

  for (const doc of links) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${doc.label}</div>
      <iframe class="docframe" src="${doc.url.replace('/edit?','/preview?')}" loading="lazy"></iframe>
      <div class="row" style="gap:.5rem;margin-top:.5rem;">
        <button class="btn" onclick="window.open('${doc.url}','_blank')">Open in Google Docs</button>
        <button class="btn secondary" onclick="commentOnDoc('${doc.label}')">Comment</button>
        <button class="btn success" onclick="approveDoc('${doc.label}')">Approve (as to form)</button>
        <button class="btn danger" onclick="denyDoc('${doc.label}')">Deny</button>
      </div>
      <small>Approving means “approved as to form.” You are not signing. A DocuSign link will be sent for signature.</small>
    `;
    wrap.appendChild(card);
  }
};

// Store user feedback on a doc
window.commentOnDoc = async (label) => {
  const u = currentUser(); if (!u) return alert("Sign in first.");
  const text = prompt(`Comment for "${label}":`); if (!text) return;
  await push(ref(db, `claims/feedback/${u.uid}`), {
    label, kind: "comment", text, ts: serverTimestamp()
  });
  alert("Comment submitted.");
};
window.approveDoc = async (label) => {
  const u = currentUser(); if (!u) return alert("Sign in first.");
  await push(ref(db, `claims/feedback/${u.uid}`), {
    label, kind: "approve_form_only", ts: serverTimestamp()
  });
  alert("Marked as approved as to form. DocuSign will follow.");
};
window.denyDoc = async (label) => {
  const u = currentUser(); if (!u) return alert("Sign in first.");
  const why = prompt("Please provide a short reason:");
  await push(ref(db, `claims/feedback/${u.uid}`), {
    label, kind: "deny", reason: (why||""), ts: serverTimestamp()
  });
  alert("Marked as denied. Thank you.");
};

// ------- Admin quick view for Claims Admin (claims-admin.html) -------
window.mountClaimsAdmin = async (elId="claimsAdmin") => {
  const wrap = document.getElementById(elId);
  if (!wrap) return;
  try {
    await gate({ role: "admin" });
  } catch {
    wrap.innerHTML = `<div class="card">Admins only.</div>`;
    return;
  }

  const snap = await get(ref(db, "claims/feedback"));
  const rows = [];
  if (snap.exists()) {
    snap.forEach(userNode => {
      const uidKey = userNode.key;
      userNode.forEach(item => {
        const v = item.val();
        rows.push(`<tr>
          <td>${uidKey}</td>
          <td>${v.label||""}</td>
          <td>${v.kind||""}</td>
          <td>${v.reason||v.text||""}</td>
        </tr>`);
      });
    });
  }
  wrap.innerHTML = `
    <div class="card">
      <div class="card-title">Claims Feedback (live)</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>UID</th><th>Doc</th><th>Action</th><th>Comment/Reason</th></tr></thead>
          <tbody>${rows.join("") || `<tr><td colspan="4">No feedback yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
};

// ------- Simple nav activators used by portals -------
window.goto = (p) => location.href = p;

// ------- Make sure we expose “ready” for pages to hook ------
window.DB_READY = true;
</script>
