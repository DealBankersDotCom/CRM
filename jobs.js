// jobs.js — DealBankers Contractor Portal Activation 🚀

firebase.auth().onAuthStateChanged(async (u) => {
  if (!u) return (location.href = "index.html");
  window.USER = u;

  // Show "+ Post Job" for admins (branch managers)
  const roleSnap = await firebase
    .database()
    .ref("roles/" + u.uid)
    .get();

  const role = roleSnap.val();
  if (role === "admin" || role === "manager") {
    document.getElementById("btnPostJob").classList.remove("hidden");
    document.getElementById("btnPostJob").onclick = () =>
      location.href = "post-job.html";
  }

  initMap();
  loadJobs();
});

/* ==========================
   MAP INITIALIZATION
========================== */
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 29.4241, lng: -98.4936 }, // San Antonio default
    zoom: 10,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#0b131b" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#eaf6ff" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#142838" }] },
      {
        featureType: "water",
        stylers: [{ color: "#173c53" }]
      }
    ],
    disableDefaultUI: true
  });
}

/* ==========================
   LOAD JOBS FROM FIREBASE
========================== */
const jobsRef = firebase.database().ref("jobs");

function loadJobs() {
  const list = document.getElementById("jobsList");
  list.innerHTML = `<div class='meta'>Loading jobs…</div>`;

  jobsRef.on("child_added", (snap) => renderJob(snap.key, snap.val()));
  jobsRef.on("child_changed", (snap) => renderJob(snap.key, snap.val()));
}

function renderJob(jobId, job) {
  if (!job) return;

  const list = document.getElementById("jobsList");
  const el = document.createElement("div");
  el.className = "job-item";
  el.dataset.jobId = jobId;

  const bids = job.bids ? Object.keys(job.bids).length : 0;

  el.innerHTML = `
    <h4>${esc(job.title)}</h4>
    <div class="meta">${esc(job.address)}</div>
    <div class="meta">Status: <strong>${job.status || "Pending"}</strong></div>
    <div class="meta">Bids: ${bids}</div>
  `;

  el.onclick = () => openBidModal(jobId);
  list.appendChild(el);

  // map marker
  if (job.lat && job.lng) {
    new google.maps.Marker({
      position: { lat: job.lat, lng: job.lng },
      map,
      title: job.title
    });
  }
}

/* ==========================
   BID MODAL HANDLING
========================== */
let currentJobId = null;
const bidModal = document.getElementById("bidModal");

function openBidModal(jobId) {
  currentJobId = jobId;
  bidModal.style.display = "flex";
}

document.getElementById("cancelBid").onclick = () => {
  bidModal.style.display = "none";
};

document.getElementById("submitBid").onclick = async () => {
  if (!currentJobId) return;

  const price = document.getElementById("bidPrice").value.trim();
  const notes = document.getElementById("bidNotes").value.trim();

  if (!price) {
    alert("Please enter a bid amount.");
    return;
  }

  try {
    await firebase
      .database()
      .ref(`jobs/${currentJobId}/bids/${USER.uid}`)
      .set({
        price: parseFloat(price),
        notes,
        name: USER.displayName || USER.email,
        ts: firebase.database.ServerValue.TIMESTAMP
      });

    alert("✅ Bid submitted!");
    bidModal.style.display = "none";
    document.getElementById("bidPrice").value = "";
    document.getElementById("bidNotes").value = "";
  } catch (err) {
    console.error(err);
    alert("❌ Failed to submit bid. Check connection.");
  }
};

/* ==========================
   UTIL
========================== */
function esc(s) {
  return ("" + (s || "")).replace(/[&<>"']/g, (m) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}
