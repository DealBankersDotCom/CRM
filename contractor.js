firebase.initializeApp(window.firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const jobsRef = db.ref("jobs/list");
const presenceRef = db.ref("presence/global");

let user = null;

// === AUTH ===
auth.onAuthStateChanged(u=>{
  user = u;
  const status = document.getElementById("authStatus");

  if (!u) {
    status.innerHTML = `<a href="index.html" style="color:#2b74ff">Sign in</a>`;
    return;
  }

  status.textContent = u.email;
  loadSkills();
  attachJobs();
  trackLocation();
});

// === LOCATION ===
function trackLocation(){
  if(!navigator.geolocation) return;

  navigator.geolocation.watchPosition(pos=>{
    db.ref("contractors/"+user.uid+"/location").set({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  });
}


// === SKILLS (Badges) ===
function loadSkills(){
  db.ref("contractors/"+user.uid+"/skills").on("value", snap=>{
    const list = document.getElementById("skillsList");
    list.innerHTML = "";
    const skills = snap.val() || {};

    Object.keys(skills).forEach(s=>{
      const tag = document.createElement("span");
      tag.className = "badge";
      tag.textContent = s.toUpperCase();
      list.appendChild(tag);
    });
  });

  document.getElementById("editSkillsBtn").onclick = ()=> {
    document.getElementById("skillModal").style.display = "flex";
  };
}

document.getElementById("saveSkillsBtn").onclick = ()=>{
  const checks = document.querySelectorAll("#skillModal input[type=checkbox]");
  const skills = {};
  checks.forEach(c=>{ if(c.checked) skills[c.value] = true; });

  db.ref("contractors/"+user.uid+"/skills").set(skills);
  document.getElementById("skillModal").style.display="none";
};

document.getElementById("closeSkillModal").onclick = ()=>{
  document.getElementById("skillModal").style.display="none";
};


// === JOBS ===
function attachJobs(){
  jobsRef.on("child_added", snap=>{
    const job = snap.val();
    const div = document.createElement("div");
    div.className = "job-row";
    div.textContent = `${job.title} — ${job.city}`;
    document.getElementById("jobsList").appendChild(div);
  });
}
