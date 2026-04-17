// Email templates matching the BPVS web app design system:
const BRAND = {
  primary: "#C94621",
  primaryDark: "#A8432A",
  navy: "#1B3A5C",
  text: "#111111",
  muted: "#6b7280",
  cream: "#FEF8F6",
  warm: "#F9EDE8",
  border: "#F1D9CF",
  card: "#ffffff",
  pageBg: "#ffffff",
  font:
    "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  "https://res.cloudinary.com/dfdsdnjng/image/upload/v1776236900/BPVS_Logo_tqxhct.svg";

const header = () => `
  <tr>
    <td align="center" style="padding:32px 32px 8px 32px;background-color:${BRAND.card};">
      <img src="${LOGO_URL}" alt="BPVS" width="140" height="auto" style="display:block;border:0;outline:none;text-decoration:none;height:auto;width:140px;max-width:100%;" />
    </td>
  </tr>`;

const footer = () => `
  <tr>
    <td style="padding:20px 32px 28px 32px;background-color:${BRAND.cream};border-top:1px solid ${BRAND.border};" align="center">
      <p style="margin:0 0 6px 0;font-size:12px;color:${BRAND.muted};font-family:${BRAND.font};line-height:1.6;">
        You received this email because an action was requested on your BPVS account.
      </p>
      <p style="margin:0;font-size:12px;color:${BRAND.muted};font-family:${BRAND.font};">
        &copy; 2026 BPVS &middot; All rights reserved
      </p>
    </td>
  </tr>`;

const shell = (title, innerRows) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};font-family:${BRAND.font};color:${BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.pageBg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          ${header()}
          ${innerRows}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const otpEmailHtml = (otp, purpose = "verification", fullName = "User") => {
  const minutes = process.env.OTP_EXPIRE_MINUTES || 5;
  const inner = `
    <tr>
      <td style="padding:8px 40px 8px 40px;background-color:${BRAND.card};" align="center">
        <h1 style="margin:16px 0 8px 0;font-size:24px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.font};letter-spacing:-0.3px;">
          Verification Code
        </h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};font-family:${BRAND.font};">
          Use the code below to complete your ${purpose}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 8px 40px;background-color:${BRAND.card};">
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${BRAND.text};font-family:${BRAND.font};">
          Hi <strong>${fullName}</strong>,
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
          <tr>
            <td align="center" style="background-color:${BRAND.warm};border:1px solid ${BRAND.border};border-radius:12px;padding:22px 16px;">
              <div style="font-size:12px;font-weight:600;color:${BRAND.primary};letter-spacing:2px;text-transform:uppercase;font-family:${BRAND.font};margin-bottom:8px;">Your Code</div>
              <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:${BRAND.navy};font-family:${BRAND.font};">${otp}</div>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${BRAND.text};font-family:${BRAND.font};">
          This code expires in <strong style="color:${BRAND.primary};">${minutes} minutes</strong>. Please do not share it with anyone.
        </p>
        <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};font-family:${BRAND.font};">
          If you did not request this code, you can safely ignore this email — your account remains secure.
        </p>
      </td>
    </tr>`;
  return shell("BPVS verification code", inner);
};

const approvalEmailHtml = (fullName = "User") => {
  const loginUrl = `${process.env.FRONTEND_URL || "#"}/login`;
  const inner = `
    <tr>
      <td style="padding:8px 40px 8px 40px;background-color:${BRAND.card};" align="center">
        <div style="display:inline-block;background-color:${BRAND.warm};color:${BRAND.primary};font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;letter-spacing:0.5px;text-transform:uppercase;font-family:${BRAND.font};margin-top:12px;">
          Account Approved
        </div>
        <h1 style="margin:16px 0 8px 0;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.font};letter-spacing:-0.3px;">
          Welcome to BPVS
        </h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};font-family:${BRAND.font};">
          Your membership is now active.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;background-color:${BRAND.card};" align="center">
        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${BRAND.text};font-family:${BRAND.font};text-align:left;">
          Hi <strong>${fullName}</strong>,
        </p>
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:${BRAND.text};font-family:${BRAND.font};text-align:left;">
          Great news — an admin has reviewed and <strong style="color:${BRAND.primary};">approved</strong> your BPVS account. You can now log in and start connecting with the community.
        </p>
        
        <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:${BRAND.text};font-family:${BRAND.font};text-align:center;">
          We're glad to have you on board.
        </p>
        <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:${BRAND.text};font-family:${BRAND.font};text-align:center;">
          — The BPVS Team
        </p>
      </td>
    </tr>`;
  return shell("Your BPVS account is approved", inner);
};

module.exports = { otpEmailHtml, approvalEmailHtml };