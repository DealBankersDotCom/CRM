#!/usr/bin/env node
/**
 * grant-wholesaler.js
 * Toggle Wholesaler gate flags for a user.
 *
 * Usage:
 *   node scripts/grant-wholesaler.js --uid <UID> --acq --dispo
 *   node scripts/grant-wholesaler.js --uid <UID> --off (to disable both)
 */

const admin = require("firebase-admin");
const minimist = require("minimist");

(async function(){
  const argv = minimist(process.argv.slice(2));
  const uid = argv.uid || argv.u;
  if (!uid) { console.error("Missing --uid"); process.exit(1); }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://deal-bankers-default-rtdb.firebaseio.com"
    });
  }
  const db = admin.database();

  const acq = !!argv.acq && !argv.off;
  const dispo = !!argv.dispo && !argv.off;

  const payload = { acqEnabled: acq, dispoEnabled: dispo };
  await db.ref(`userSettings/${uid}/wholesaler`).update(payload);
  console.log("Updated gate:", { uid, ...payload });
  process.exit(0);
})().catch(err=>{ console.error(err); process.exit(1); });
