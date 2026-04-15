const nodemailer = require("nodemailer");

/**
 * Creates the transporter lazily (on first call) so that
 * environment variables are guaranteed to be loaded.
 * This is critical for Vercel serverless where env vars
 * may not be available at module-parse time.
 */
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Strip HTML tags to produce a plain-text fallback.
 * Emails with BOTH html + text are far less likely to be flagged as spam.
 */
const htmlToPlainText = (html) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&copy;/g, "©")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Sends an email.
 * @param {Object} options - { to, subject, html, text? }
 *
 * Gmail SMTP deliverability rules enforced here:
 *  - "From" address MUST equal EMAIL_USER (SPF/DKIM alignment).
 *  - Envelope sender (Return-Path) MUST equal EMAIL_USER.
 *  - Message-ID domain MUST match the From domain.
 *  - One-click List-Unsubscribe headers (RFC 8058) → big deliverability boost.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const emailUser = process.env.EMAIL_USER;
  if (!emailUser) throw new Error("EMAIL_USER env var is not set");

  const senderDomain = emailUser.split("@")[1];
  const fromName = process.env.EMAIL_FROM_NAME || "BPVS";
  // Force From address to equal EMAIL_USER for SPF/DKIM alignment with Gmail.
  const fromAddress = `"${fromName}" <${emailUser}>`;

  // RFC-compliant Message-ID using the sending domain.
  const messageId = `<${Date.now()}.${Math.random()
    .toString(36)
    .slice(2)}@${senderDomain}>`;

  const mailOptions = {
    from: fromAddress,
    sender: emailUser,
    replyTo: emailUser,
    envelope: { from: emailUser, to },
    to,
    subject,
    html,
    text: text || htmlToPlainText(html),
    messageId,
    headers: {
      "List-Unsubscribe": `<mailto:${emailUser}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Entity-Ref-ID": messageId,
      "X-Mailer": "BPVS-Mailer",
    },
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
