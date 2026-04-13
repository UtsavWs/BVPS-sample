const otpEmailHtml = (otp, purpose = "verification", fullName = "User") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BPVS OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; max-width: 500px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding: 30px 30px 20px 30px;">
              <img src="https://res.cloudinary.com/dfdsdnjng/image/upload/v1773471761/BPVS_Logo_azzykc.png" alt="BPVS Logo" width="160" height="auto" style="height: auto; width: 160px; max-width: 100%; display: block; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #1B3A5C; font-weight: 700; text-align: center;">Your Verification Code</h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.5; text-align: center;">
                Hello ${fullName},<br><br>
                Use the following OTP code to complete your ${purpose}. This code is secure and will expire in <strong style="color: #111827;">${process.env.OTP_EXPIRE_MINUTES || 5} minutes</strong>.
              </p>
              <div style="background-color: #fff7f5; border: 1px dashed #C1512D; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #C1512D; display: block; margin-left: 12px;">${otp}</span>
              </div>
              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5; text-align: center;">
                If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #f3f4f6; padding: 20px 40px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; 2026 BPVS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { otpEmailHtml };
