import nodemailer from 'nodemailer'
import dns from 'dns'

let transporter = null

function lookupIpv4(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) return reject(err)
      resolve(address)
    })
  })
}

async function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    console.log(`Using SMTP configurations from .env: ${host}:${port}`)

    let resolvedHost = host
    try {
      resolvedHost = await lookupIpv4(host)
      console.log(`Resolved SMTP host ${host} to IPv4: ${resolvedHost}`)
    } catch (err) {
      console.warn(`DNS lookup failed for ${host}, using raw host name:`, err.message)
    }

    transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: parseInt(port),
      secure: port == 465,
      auth: { user, pass },
      tls: {
        servername: host
      }
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
  const htmlContent = `
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
  `

  const fromAddress = process.env.SMTP_FROM || 'QuickChat Verification <onboarding@resend.dev>'

  // --- Resend HTTP API Fallback ---
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('Sending OTP email via Resend HTTP API...')
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email,
          subject: 'Your QuickChat Verification OTP',
          html: htmlContent,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        console.log(`OTP Email sent to ${email} via Resend. Message ID: ${result.id}`)
        return { success: true, provider: 'resend' }
      } else {
        console.error('Resend API responded with error:', result)
        throw new Error(result.message || 'Failed to send email via Resend')
      }
    } catch (err) {
      console.error('Error sending OTP email via Resend API:', err.message)
    }
  }

  // --- SendGrid HTTP API Fallback ---
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log('Sending OTP email via SendGrid HTTP API...')
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: process.env.SMTP_FROM_EMAIL || 'verification@quickchat.com', name: 'QuickChat Security' },
          subject: 'Your QuickChat Verification OTP',
          content: [
            { type: 'text/plain', value: `Your verification OTP is: ${otp}. It is valid for 5 minutes.` },
            { type: 'text/html', value: htmlContent }
          ]
        })
      })

      if (response.ok) {
        console.log(`OTP Email sent to ${email} via SendGrid.`)
        return { success: true, provider: 'sendgrid' }
      } else {
        const errText = await response.text()
        console.error('SendGrid API responded with error:', errText)
        throw new Error(errText || 'Failed to send email via SendGrid')
      }
    } catch (err) {
      console.error('Error sending OTP email via SendGrid API:', err.message)
    }
  }

  // --- Standard Nodemailer/SMTP Fallback ---
  try {
    const tx = await getTransporter()
    const mailOptions = {
      from: process.env.SMTP_FROM || '"QuickChat Security" <security@quickchat.com>',
      to: email,
      subject: 'Your QuickChat Verification OTP',
      text: `Your verification OTP is: ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.`,
      html: htmlContent,
    }

    const info = await tx.sendMail(mailOptions)
    console.log(`OTP Email sent to ${email} via SMTP/Nodemailer. Message ID: ${info.messageId}`)
    
    const nodemailerUrl = nodemailer.getTestMessageUrl(info)
    if (nodemailerUrl) {
      console.log(`[Ethereal Preview URL]: ${nodemailerUrl}`)
    }
    
    return { success: true, provider: 'smtp', etherealUrl: nodemailerUrl || null }
  } catch (err) {
    console.error('Error sending OTP email via SMTP:', err)
    throw err
  }
}

export {
  sendOtpEmail,
}
