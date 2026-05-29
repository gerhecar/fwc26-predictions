import nodemailer from 'nodemailer'
import type { PredictionExport } from '../predictions/json-export'

export async function sendPredictionEmail(
  data: PredictionExport,
): Promise<{ success: boolean; error?: string }> {
  const recipient = 'german.herrero@bull.com'
  const subject = `[World Cup Prediction] New Submitted Bet - ${data.user.display_name}`

  const jsonContent = JSON.stringify(data, null, 2)

  try {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      await transporter.sendMail({
        from: user,
        to: recipient,
        subject,
        text: `Prediction submitted by ${data.user.display_name} at ${data.submittedAt}\n\nChampion: ${data.champion}\nThird place: ${data.thirdPlaceWinner}\n\nSee attached JSON for full details.`,
        attachments: [
          {
            filename: `prediction-${data.user.display_name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`,
            content: jsonContent,
            contentType: 'application/json',
          },
        ],
      })

      return { success: true }
    }

    console.log('=== PREDICTION EMAIL (no SMTP configured) ===')
    console.log(`To: ${recipient}`)
    console.log(`Subject: ${subject}`)
    console.log('Attachment:', jsonContent)
    console.log('============================================')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Email send failed:', message)
    return { success: true }
  }
}
