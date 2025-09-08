(function(){
  const CSI16=[
    {id:1,name:'Division 01 — General Requirements'},
    {id:2,name:'Division 02 — Site Construction'},
    {id:3,name:'Division 03 — Concrete'},
    {id:4,name:'Division 04 — Masonry'},
    {id:5,name:'Division 05 — Metals'},
    {id:6,name:'Division 06 — Wood & Plastics'},
    {id:7,name:'Division 07 — Thermal & Moisture Protection'},
    {id:8,name:'Division 08 — Doors & Windows'},
    {id:9,name:'Division 09 — Finishes'},
    {id:10,name:'Division 10 — Specialties'},
    {id:11,name:'Division 11 — Equipment'},
    {id:12,name:'Division 12 — Furnishings'},
    {id:13,name:'Division 13 — Special Construction'},
    {id:14,name:'Division 14 — Conveying Systems'},
    {id:15,name:'Division 15 — Mechanical'},
    {id:16,name:'Division 16 — Electrical'}
  ];

  const divWrap = document.getElementById('divisions');
  CSI16.forEach(d=>{
    const id='div_'+d.id;
    const box=document.createElement('div');
    box.innerHTML=`<label style="display:flex;gap:8px;align-items:center">
      <input type="checkbox" id="${id}" data-div="${d.id}"/>
      <span>${d.name}</span>
    </label>`;
    divWrap.appendChild(box);
  });

  const share = document.getElementById('shareLoc');
  const meta = document.getElementById('locMeta');
  const errEl = document.getElementById('locErr');
  const btnGet = document.getElementById('btnGetLoc');
  const btnClear = document.getElementById('btnClearLoc');

  function setMeta(text){ meta.textContent=text; }

  function getPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        pos=>resolve(pos),
        err=>reject(err),
        {enableHighAccuracy:true, timeout:15000, maximumAge:0}
      );
    });
  }

  async function saveLocation(uid, coords){
    const payload = coords ? {
      lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy,
      sharing: !!share.checked, ts: firebase.database.ServerValue.TIMESTAMP
    } : { sharing:false, ts: firebase.database.ServerValue.TIMESTAMP };
    await firebase.database().ref('contractors/'+uid+'/location').set(payload);
    await firebase.database().ref('contractors_public/'+uid+'/location').set(payload); // public summary
  }

  async function saveProfile(uid){
    const level = document.getElementById('level').value;
    const availability = document.getElementById('availability').value;
    const headline = document.getElementById('headline').value.trim();
    const rate = document.getElementById('rate').value ? Number(document.getElementById('rate').value) : null;
    const bio = document.getElementById('bio').value.trim();

    const divisions = Array.from(divWrap.querySelectorAll('input[type=checkbox]:checked'))
      .map(c=>Number(c.dataset.div));

    // Placeholder signals (future: computed from modules & certs)
    const trainingScore = 0, certPoints = 0, endorsements = 0;
    const computed = computeLevel(trainingScore, certPoints, endorsements);

    const profile = {
      level, availability, headline, rate, bio, divisions,
      trainingScore, certPoints, endorsements, computed,
      updatedAt: new Date().toISOString()
    };

    await firebase.database().ref('contractors/'+uid+'/profile').set(profile);
    // minimal public projection
    await firebase.database().ref('contractors_public/'+uid+'/profile').set({
      level, availability, headline, rate, divisions, computed
    });
  }

  function computeLevel(trainingScore, certPoints, endorsements){
    // Simple weighted score you can tune later
    const score = (trainingScore*0.6 + certPoints*0.3 + endorsements*0.1) / 100;
    let band='Apprentice';
    if(score>=0.8) band='Master';
    else if(score>=0.6) band='Journeyman';
    else if(score>=0.4) band='Handyman';
    return { band, score: Number(score.toFixed(2)) };
  }

  // expose compute display
  window.computeLevel = computeLevel;

  // Bind buttons
  btnGet.addEventListener('click', async()=>{
    errEl.textContent='';
    setMeta('Requesting GPS…');
    try{
      const u = firebase.auth().currentUser; if(!u) return alert('Please sign in again.');
      const pos = await getPosition();
      await saveLocation(u.uid, pos.coords);
      setMeta(`Lat ${pos.coords.latitude.toFixed(6)}, Lng ${pos.coords.longitude.toFixed(6)} • ±${Math.round(pos.coords.accuracy)} m • sharing ${share.checked?'on':'off'}`);
    }catch(err){
      errEl.textContent = err && err.message ? err.message : 'Could not get location.';
      setMeta('Not sharing');
    }
  });

  btnClear.addEventListener('click', async()=>{
    errEl.textContent='';
    try{
      const u = firebase.auth().currentUser; if(!u) return alert('Please sign in again.');
      share.checked=false;
      await saveLocation(u.uid, null);
      setMeta('Not sharing');
    }catch(err){
      errEl.textContent = err && err.message ? err.message : 'Could not clear.';
    }
  });

  share.addEventListener('change', ()=>{
    setMeta(share.checked ? 'Sharing is ON (click Update to refresh coords)' : 'Not sharing');
  });

  // Save profile
  document.getElementById('btnSave').addEventListener('click', async()=>{
    try{
      const u=firebase.auth().currentUser; if(!u) return alert('Please sign in again.');
      await saveProfile(u.uid);
      alert('Profile saved.');
    }catch(err){
      alert('Could not save: '+(err && err.message || 'unknown error'));
    }
  });

  // Load existing values for convenience
  firebase.auth().onAuthStateChanged(async (u)=>{
    if(!u) return;
    try{
      const s1 = await firebase.database().ref('contractors/'+u.uid+'/profile').get();
      if(s1.exists()){
        const p = s1.val();
        document.getElementById('level').value = p.level || 'Journeyman';
        document.getElementById('availability').value = p.availability || 'Available now';
        document.getElementById('headline').value = p.headline || '';
        document.getElementById('rate').value = p.rate != null ? p.rate : '';
        document.getElementById('bio').value = p.bio || '';
        (p.divisions||[]).forEach(id=>{
          const cb = divWrap.querySelector(`[data-div="${id}"]`);
          if(cb) cb.checked = true;
        });
      }
      const s2 = await firebase.database().ref('contractors/'+u.uid+'/location').get();
      if(s2.exists()){
        const l=s2.val();
        share.checked = !!l.sharing;
        if(l.lat && l.lng){
          setMeta(`Lat ${Number(l.lat).toFixed(6)}, Lng ${Number(l.lng).toFixed(6)} • ±${Math.round(l.accuracy||0)} m • sharing ${share.checked?'on':'off'}`);
        } else {
          setMeta(share.checked ? 'Sharing is ON (no coordinates saved yet)' : 'Not sharing');
        }
      }
    }catch(e){ console.warn(e); }
  });
})();