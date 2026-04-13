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
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  // IMPORTANT: "from" MUST match the actual Gmail account sending the email.
  // Using a fake/different domain (e.g. noreply@bpvs.com) when sending via
  // Gmail SMTP causes SPF/DKIM failures → emails land in spam.
  const fromAddress =
    process.env.EMAIL_FROM ||
    `"BPVS" <${process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: fromAddress,
    replyTo: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text: htmlToPlainText(html),
    headers: {
      "X-Priority": "1",
      "X-Mailer": "BPVS App Mailer",
    },
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
