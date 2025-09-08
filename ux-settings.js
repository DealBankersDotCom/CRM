(function(){
  const el = (id)=>document.getElementById(id);
  const fields = ['theme','drivingMode','uiScale','defaultPortal','portals_contractor','portals_wholesaler','portals_investor','portals_privateMoney','portals_selfManager','haptics','voiceInput'];
  const theme = el('ux_theme'), driving = el('ux_driving'), scale = el('ux_scale'), portal = el('ux_portal');
  const c_con = el('ux_p_contractor'), c_who = el('ux_p_wholesaler'), c_inv = el('ux_p_investor'), c_pm = el('ux_p_pm'), c_sm = el('ux_p_sm');
  const haptics = el('ux_haptics'), voice = el('ux_voice');
  const saveBtn = el('ux_save'), status = el('ux_status');

  firebase.auth().onAuthStateChanged(async (u)=>{
    if(!u) return;
    try{
      const snap = await firebase.database().ref('userSettings/'+u.uid+'/ux').get();
      if(snap.exists()){
        const ux = snap.val();
        theme.value = ux.theme || 'neon';
        driving.checked = !!ux.drivingMode;
        scale.value = ux.uiScale || 'normal';
        portal.value = ux.defaultPortal || 'profile';
        c_con.checked = !!ux.portals?.contractor;
        c_who.checked = !!ux.portals?.wholesaler;
        c_inv.checked = !!ux.portals?.investor;
        c_pm.checked = !!ux.portals?.privateMoney;
        c_sm.checked = !!ux.portals?.selfManager;
        haptics.checked = !!ux.haptics;
        voice.checked = !!ux.voiceInput;
      }
    }catch(e){ console.warn(e); }
  });

  saveBtn.addEventListener('click', async ()=>{
    try{
      const u = firebase.auth().currentUser; if(!u) return alert('Sign in required');
      const ux = {
        theme: theme.value,
        drivingMode: driving.checked,
        uiScale: scale.value,
        defaultPortal: portal.value,
        haptics: haptics.checked,
        voiceInput: voice.checked,
        portals: {
          contractor: c_con.checked, wholesaler: c_who.checked, investor: c_inv.checked, privateMoney: c_pm.checked, selfManager: c_sm.checked
        }
      };
      await firebase.database().ref('userSettings/'+u.uid+'/ux').set(ux);
      status.textContent = 'Saved.'; setTimeout(()=>status.textContent='', 1500);
    }catch(e){ alert('Could not save UX settings'); }
  });
})();