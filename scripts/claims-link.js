<script>
// Central registry of claims + Google Docs preview links.
// Use email OR UID to assign. Replace "/edit" with "/preview" for fast embed.
const CLAIM_LINKS = [
  {
    id: "darlene",
    title: "Darlene v. [Counterparty] — Assignment & SOF",
    assignedTo: { email: "mitzidyane@gmail.com" }, // Mitzi
    docs: [
      {
        name: "Assignment of Claims",
        url: "https://docs.google.com/document/d/1LG0iYsi1YogCTmdFeFLFKQNIDZI-hzoYOQqJ07UHebQ/preview"
      },
      {
        name: "Statement of Facts",
        url: "https://docs.google.com/document/d/1O8fgDbWstzJUu045_SGg3cxlZRs1nGwjX_Ksr0IBJCk/preview"
      }
    ],
    status: "awaiting-client-review"
  },
  {
    id: "honcho",
    title: "Honcho v. [Counterparty] — Assignment & SOF",
    assignedTo: { uid: "bZtK9f6wAwYab20yawDbXRZdG6c2" }, // Alfred
    docs: [
      {
        name: "Assignment of Claims",
        url: "https://docs.google.com/document/d/1H-sx230TmpKJx-Mst1_sXAS39MJWwUiQXpx75tzuLro/preview"
      },
      {
        name: "Statement of Facts",
        url: "https://docs.google.com/document/d/1K72u3Fx4OGN3PbncLd1uwEqZ_olYpJrkUxByrDAs7ME/preview"
      }
    ],
    status: "awaiting-client-review"
  },
  {
    id: "madison",
    title: "Madison v. [Counterparty] — Assignment & SOF",
    assignedTo: null, // not yet known
    docs: [
      {
        name: "Assignment of Claims",
        url: "https://docs.google.com/document/d/1npndKHg7ejhqixWddrJ0tlrhDPgcva6d-Dl6oYI6KF0/preview"
      },
      {
        name: "Statement of Facts",
        url: "https://docs.google.com/document/d/1xhyO7RcQNyfSXb7mNHGoxyDKSaGOY1FVhAJyERc4ggM/preview"
      }
    ],
    status: "unassigned"
  }
];

// Persist registry under /claims/{meta,files} (admin-only writes per rules).
// This runs only for admin to bootstrap; safe to keep for idempotent sync.
async function syncClaimsRegistryIfAdmin(app, db, auth) {
  const uid = auth?.currentUser?.uid || null;
  if (!uid) return;

  const rolesSnap = await firebase.database().ref(`roles/${uid}`).get();
  const role = rolesSnap.exists() ? rolesSnap.val() : null;
  if (role !== "admin") return;

  const updates = {};
  for (const c of CLAIM_LINKS) {
    updates[`claims/meta/${c.id}`] = {
      title: c.title,
      assignedTo: c.assignedTo || null,
      status: c.status || "draft",
      updatedAt: Date.now()
    };
    updates[`claims/files/${c.id}`] = c.docs.map(d => ({ name: d.name, url: d.url }));
  }
  await firebase.database().ref().update(updates);
  console.log("Claims registry synced.");
}
</script>
