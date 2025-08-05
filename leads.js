function exportLeadsToCRM() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const addressIndex = headers.indexOf("Address");
  const contactIndex = headers.indexOf("Contact");
  const phoneIndex = headers.indexOf("Phone");
  const notesIndex = headers.indexOf("Deal Details"); // 👈 NEW LINE

  const leadsMap = {};

  for (let i = 1; i < data.length; i++) {
    const address = (data[i][addressIndex] || "").toString().trim();
    const name = (data[i][contactIndex] || "").toString().trim();
    const phone = (data[i][phoneIndex] || "").toString().trim();
    const note = (data[i][notesIndex] || "").toString().trim(); // 👈 NEW LINE

    if (!address) continue;

    if (!leadsMap[address]) {
      leadsMap[address] = {
        contacts: [],
        notes: note
      };
    }

    if (name || phone) {
      const alreadyExists = leadsMap[address].contacts.some(
        c => c.name === name && c.phone === phone
      );
      if (!alreadyExists) leadsMap[address].contacts.push({ name, phone });
    }

    // If note exists and is more informative than previous, update it
    if (note && note.length > leadsMap[address].notes.length) {
      leadsMap[address].notes = note;
    }
  }

  // Build output
  let js = "const leads = [\n";
  for (const address in leadsMap) {
    const { contacts, notes } = leadsMap[address];
    const contactList = contacts
      .map(c => `    { name: "${c.name}", phone: "${c.phone}" }`)
      .join(",\n");

    const safeNote = notes.replace(/"/g, '\\"'); // escape quotes in notes
    js += `  {\n    address: "${address}",\n    contacts: [\n${contactList}\n    ],\n    notes: "${safeNote}"\n  },\n`;
  }
  js += "];";

  const html = `
    <html>
      <body style="font-family: monospace; padding: 20px;">
        <h2>✅ CRM Leads Output</h2>
        <pre id="output">${js}</pre>
        <p style="color:gray; font-size:12px;">Click inside and press Ctrl+A then Ctrl+C to copy manually.</p>
      </body>
    </html>
  `;

  SpreadsheetApp.getUi()
    .showModalDialog(HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600), 'CRM Leads Output');
}
