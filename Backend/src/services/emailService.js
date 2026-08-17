const nodemailer = require('nodemailer')

let transporter = null

async function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    console.log(`Using SMTP configurations from .env: ${host}:${port}`)
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port == 465,
      auth: { user, pass },
    })
  } else {
    console.log('No SMTP config found in environment variables. Setting up Ethereal Mail...')
    try {
      const testAccount = await nodemailer.createTestAccount()
      console.log('Ethereal Mail Test Account Created successfully.')
      console.log(`Username: ${testAccount.user}`)
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    } catch (err) {
      console.warn('Failed to create Ethereal Mail test account. Falling back to log-only transporter:', err.message)
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n====================================')
          console.log('EMAIL SENT (MOCK/LOG-ONLY):')
          console.log(`To: ${mailOptions.to}`)
          console.log(`Subject: ${mailOptions.subject}`)
          console.log(`Body: ${mailOptions.text}`)
          console.log('====================================\n')
          return { messageId: 'mock-id-' + Date.now() }
        },
      }
    }
  }

  return transporter
}

async function sendOtpEmail(email, otp) {
  try {
    const tx = await getTransporter()
    const fromAddress = process.env.SMTP_FROM || '"QuickChat Security" <security@quickchat.com>'
    
    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Your QuickChat Verification OTP',
      text: `Your verification OTP is: ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #c084fc; text-align: center;">QuickChat Verification</h2>
          <hr style="border: 0; border-top: 1px solid #f3f4f6;" />
          <p style="font-size: 16px; color: #374151;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">Thank you for choosing QuickChat. Use the following One-Time Password (OTP) to complete your verification:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; background-color: #f3f4f6; padding: 10px 24px; border-radius: 8px; border: 1px dashed #c7d2fe;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin-top: 30px;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    }

    const info = await tx.sendMail(mailOptions)
    console.log(`OTP Email sent to ${email}. Message ID: ${info.messageId}`)
    
    const nodemailerUrl = nodemailer.getTestMessageUrl(info)
    if (nodemailerUrl) {
      console.log(`[Ethereal Preview URL]: ${nodemailerUrl}`)
    }
    
    return { success: true, etherealUrl: nodemailerUrl || null }
  } catch (err) {
    console.error('Error sending OTP email:', err)
    throw err
  }
}

module.exports = {
  sendOtpEmail,
}
