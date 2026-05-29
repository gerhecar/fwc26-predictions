import { NextResponse } from 'next/server'
import { sendPredictionEmail } from '@/lib/email/send-prediction'
import type { PredictionExport } from '@/lib/predictions/json-export'

export async function POST(request: Request) {
  try {
    const body: PredictionExport & { token?: string } = await request.json()

    const { token, ...data } = body

    if (!data.user?.display_name) {
      return NextResponse.json(
        { error: 'Missing user display_name' },
        { status: 400 },
      )
    }

    if (!Object.keys(data.groupStage).length) {
      return NextResponse.json(
        { error: 'Missing groupStage data' },
        { status: 400 },
      )
    }

    const emailResult = await sendPredictionEmail(data)

    return NextResponse.json({
      success: true,
      submittedAt: data.submittedAt,
      champion: data.champion,
      emailSent: emailResult.success,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Prediction submission failed:', message)
    return NextResponse.json(
      { error: 'Failed to submit prediction' },
      { status: 500 },
    )
  }
}
