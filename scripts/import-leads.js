#!/usr/bin/env node
/**
 * import-leads.js
 *
 * God-mode importer for DealBankers RTDB.
 * - Reads Seller leads and Buyers list CSV files.
 * - Writes to Realtime Database under the target user's UID.
 * - Optional: generate a leads.js file (window.leads=[...]) for legacy pages.
 *
 * Usage:
 *   node scripts/import-leads.js --uid <UID> --sellers data/Sellerleads.csv --buyers data/Buyerslist.csv
 *   node scripts/import-leads.js --uid <UID> --sellers data/Sellerleads.csv --dryrun
 *   GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json> node scripts/import-leads.js ...
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const admin = require("firebase-admin");
const minimist = require("minimist");

/** ------------ helpers ------------- */
function slugify(s) {
  return String(s || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function clean(s) {
  if (s == null) return "";
  return String(s).replace(/\s+/g, " ").trim();
}
function phoneDigits(s) {
  const d = String(s || "").replace(/[^\d+]/g, "");
  return d || "";
}
function asBool(s) {
  if (typeof s === "boolean") return s;
  const v = String(s || "").toLowerCase();
  return ["y", "yes", "true", "1", "x"].includes(v);
}

/** ------------ parse CSV ------------- */
function readCsv(file) {
  if (!file) return [];
  const txt = fs.readFileSync(file, "utf8");
  const rows = parse(txt, { columns: true, skip_empty_lines: true });
  return rows;
}

/** ------------ mappers ------------- */
function mapSellerRow(row) {
  // Expected headers (flexible): location, Owner, Phone, Notes, Mailing, Taxes, Absentee, Deed, Exzemptions, ARV
  const address = clean(row.location || row.Address || row.address);
  if (!address) return null;

  const name = clean(row.Owner || row.owner || "");
  const phone = phoneDigits(row.Phone || row.phone || "");

  const out = {
    id: slugify(address),
    address,
    contacts: [],
    notes: clean(row.Notes || row.notes || ""),
    meta: {
      mailing: clean(row.Mailing || row.mailing || ""),
      taxes: clean(row.Taxes || row.taxes || ""),
      absentee: clean(row.Absentee || row.absentee || ""),
      deed: clean(row.Deed || row.deed || ""),
      exemptions: clean(row.Exzemptions || row.Exemptions || row.exemptions || ""),
      arv: clean(row.ARV || row.arv || ""),
      source: "csv-import",
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (name || phone) out.contacts.push({ name, phone });
  return out;
}

function mapBuyerRow(row) {
  // Flexible headers from provided CSV: FirstName, Last Name, Phone, Email, Notes, Location, Potential Money Partner, Contacted
  const first = clean(row.FirstName || row["First Name"] || row.first || "");
  const last  = clean(row["Last Name"] || row.Last || row.last || "");
  const name  = clean([first, last].filter(Boolean).join(" "));
  const phone = phoneDigits(row.Phone || row.phone || "");
  const email = clean(row.Email || row.email || "");

  if (!name && !phone && !email) return null;

  return {
    id: slugify(name || email || phone || ("buyer-" + Date.now())),
    name,
    phone,
    email,
    location: clean(row.Location || ""),
    notes: clean(row.Notes || ""),
    flags: {
      contacted: asBool(row.Contacted),
      potentialMoneyPartner: asBool(row["Potential Money Partner"] || row.pmp),
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/** ------------ write to RTDB ------------- */
async function writeBatchRTDB(db, basePath, list, keyField = "id") {
  const updates = {};
  for (const item of list) {
    const id = item[keyField] || slugify(item.address || item.name || ("item-" + Date.now()));
    updates[id] = item;
  }
  if (Object.keys(updates).length === 0) return { wrote: 0 };
  await db.ref(basePath).update(updates);
  return { wrote: Object.keys(updates).length };
}

/** Optional: generate legacy leads.js for front-end fallback */
function generateLeadsJS(sellerLeads, outPath) {
  const minimal = sellerLeads.map(l => ({
    address: l.address,
    contacts: l.contacts,
    notes: l.notes
  }));
  const js = "window.leads = " + JSON.stringify(minimal, null, 2) + ";\n";
  fs.writeFileSync(outPath, js, "utf8");
  return outPath;
}

/** ------------ main ------------- */
(async function main() {
  const argv = minimist(process.argv.slice(2));
  const uid = argv.uid || argv.u;
  const sellersCsv = argv.sellers || argv.s;
  const buyersCsv  = argv.buyers  || argv.b;
  const outLeadsJS = argv["make-leads-js"] || argv["leadsjs"] || null;
  const dryrun = !!argv.dryrun;

  if (!uid) {
    console.error("Missing --uid <UID>");
    process.exit(1);
  }
  if (!sellersCsv && !buyersCsv) {
    console.error("Provide at least one CSV via --sellers or --buyers");
    process.exit(1);
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: "https://deal-bankers-default-rtdb.firebaseio.com"
      });
    } catch (e) {
      console.error("Failed to init Firebase Admin SDK. Is GOOGLE_APPLICATION_CREDENTIALS set to a service account JSON?");
      throw e;
    }
  }
  const db = admin.database();

  let sellers = [];
  if (sellersCsv) {
    const rows = readCsv(sellersCsv);
    sellers = rows.map(mapSellerRow).filter(Boolean);
  }
  let buyers = [];
  if (buyersCsv) {
    const rows = readCsv(buyersCsv);
    buyers = rows.map(mapBuyerRow).filter(Boolean);
  }

  if (dryrun) {
    console.log(JSON.stringify({ uid, sellersCount: sellers.length, buyersCount: buyers.length, sampleSeller: sellers[0], sampleBuyer: buyers[0] }, null, 2));
    process.exit(0);
  }

  const res = { sellers: { wrote: 0 }, buyers: { wrote: 0 } };
  if (sellers.length) {
    res.sellers = await writeBatchRTDB(db, `acqLeads/${uid}`, sellers, "id");
  }
  if (buyers.length) {
    res.buyers  = await writeBatchRTDB(db, `buyers/${uid}`, buyers, "id");
  }

  console.log("RTDB import complete:", res);

  if (outLeadsJS && sellers.length) {
    const out = path.resolve(outLeadsJS);
    generateLeadsJS(sellers, out);
    console.log("Generated legacy leads.js:", out);
  }

  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
