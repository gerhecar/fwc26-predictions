import nodemailer from 'nodemailer'
import type { PredictionExport } from '../predictions/json-export'

export async function sendPredictionEmail(
  data: PredictionExport,
): Promise<{ success: boolean; error?: string }> {
  const recipient = 'german.herrero@bull.com'
  const subject = `[World Cup Prediction] New Bet - ${data.user.display_name} - ${data.betName}`

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
        text: `Prediction submitted by ${data.user.display_name} (${data.user.id}) at ${data.submittedAt}\n\nBet Name: ${data.betName}\nPrediction ID: ${data.predictionId}\nChampion: ${data.champion}\n\nSee attached JSON for full details.`,
        attachments: [
          {
            filename: `bet-${data.user.display_name.toLowerCase().replace(/\s+/g, '-')}-${data.betName.toLowerCase().replace(/\s+/g, '-')}.json`,
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
