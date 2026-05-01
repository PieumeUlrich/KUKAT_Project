import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE === 'true', // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify((err) => {
  if (err) console.error('Email transporter error:', err.message);
  else     console.log('Email transporter ready.');
});

const sendOTP = async (toEmail, otp, firstName = '') => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      toEmail,
    subject: 'KUKAT — Your password reset code',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'DM Sans',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:14px;border:1px solid #E2E8F0;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#0B2B40;padding:28px 36px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#F59E0B;width:36px;height:36px;border-radius:9px;
                          text-align:center;vertical-align:middle;">
                          <span style="color:#0B2B40;font-size:18px;font-weight:800;">✈</span>
                        </td>
                        <td style="padding-left:12px;">
                          <span style="color:#fff;font-size:1.4rem;font-weight:700;">KUKAT</span>
                          <span style="color:rgba(255,255,255,0.5);font-size:0.85rem;
                            display:block;">Travel Agency</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px;">
                    <p style="color:#0F172A;font-size:1rem;font-weight:600;margin:0 0 8px;">
                      Hi ${firstName || 'there'},
                    </p>
                    <p style="color:#64748B;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">
                      We received a request to reset your KUKAT account password.
                      Use the code below to complete your reset. This code expires in
                      <strong style="color:#0B2B40;">15 minutes</strong>.
                    </p>

                    <!-- OTP box -->
                    <div style="background:#F8FAFC;border:2px dashed #E2E8F0;
                      border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                      <p style="color:#64748B;font-size:0.8rem;font-weight:600;
                        text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">
                        Your reset code
                      </p>
                      <p style="color:#0B2B40;font-size:2.4rem;font-weight:800;
                        letter-spacing:0.15em;margin:0;font-family:monospace;">
                        ${otp}
                      </p>
                    </div>

                    <p style="color:#64748B;font-size:0.85rem;line-height:1.6;margin:0 0 8px;">
                      If you did not request a password reset, you can safely ignore this email.
                      Your password will not change.
                    </p>
                    <p style="color:#64748B;font-size:0.85rem;line-height:1.6;margin:0;">
                      For security, never share this code with anyone.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#F8FAFC;padding:20px 36px;
                    border-top:1px solid #E2E8F0;">
                    <p style="color:#94A3B8;font-size:0.78rem;margin:0;text-align:center;">
                      © ${new Date().getFullYear()} KUKAT Travel Agency · Calgary, AB
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

export { sendOTP };
export default transporter;