const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// 1. Configure Transporter using environment variables
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 2. The Trigger: Listens for new tickets in support_queue
exports.sendGodmodeAlert = functions.database.ref('/support_queue/{ticketId}')
 .onCreate(async (snapshot, context) => {
    const ticketId = context.params.ticketId;
    const data = snapshot.val();
    
    // Safety check: ensure email exists
    const userEmail = data.email |

| "Unknown User";
    const subject = data.subject |

| "General Inquiry";

    const mailOptions = {
      from: `"DealBankers Support" <${gmailEmail}>`,
      to: gmailEmail, // Sending to yourself
      subject: `🚨 Support Request: ${userEmail}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2>New Support Request</h2>
          <p><strong>User:</strong> ${userEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <br/>
          <a href="https://YOUR_ADMIN_PORTAL_URL/chat/${ticketId}" 
             style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
             ENTER GODMODE CHAT
          </a>
        </div>
      `
    };

    try {
      await mailTransport.sendMail(mailOptions);
      console.log(`Alert sent for ticket ${ticketId}`);
      // Mark as notified in DB so the UI knows help is requested
      return snapshot.ref.update({ adminNotified: true });
    } catch (error) {
      console.error('Email failed:', error);
      return null;
    }
  });
