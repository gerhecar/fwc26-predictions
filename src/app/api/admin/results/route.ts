import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import crypto from 'crypto'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT id, results_json, status, updated_by, updated_at
       FROM official_results
       ORDER BY updated_at DESC LIMIT 1`,
    )

    const results = rows as Array<{
      id: string
      results_json: string
      status: string
      updated_by: string
      updated_at: string
    }>

    if (results.length === 0) {
      return NextResponse.json({
        results: {
          groupStage: {},
          bestThirdPlaced: [],
          knockout: {},
          champion: null,
        },
        status: 'draft',
      })
    }

    const row = results[0]
    const parsed = typeof row.results_json === 'string'
      ? JSON.parse(row.results_json)
      : row.results_json

    return NextResponse.json({
      id: row.id,
      results: parsed,
      status: row.status,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Get official results failed:', message)
    return NextResponse.json(
      { error: 'Error al obtener resultados' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { groupStage, bestThirdPlaced, knockout, champion } = body

    const pool = getPool()

    // Check if a draft result row exists
    const [existing] = await pool.execute(
      `SELECT id FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const existingRows = existing as Array<{ id: string }>

    const resultsJson = JSON.stringify({ groupStage, bestThirdPlaced, knockout, champion })

    if (existingRows.length > 0) {
      await pool.execute(
        `UPDATE official_results SET results_json = ?, updated_by = ? WHERE id = ?`,
        [resultsJson, user.id, existingRows[0].id],
      )
    } else {
      const [tournamentRows] = await pool.execute(
        "SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026' LIMIT 1",
      )
      const tRows = tournamentRows as Array<{ id: string }>
      if (tRows.length === 0) {
        return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
      }

      const id = crypto.randomUUID()
      await pool.execute(
        `INSERT INTO official_results (id, tournament_id, results_json, updated_by)
         VALUES (?, ?, ?, ?)`,
        [id, tRows[0].id, resultsJson, user.id],
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Save official results failed:', message)
    return NextResponse.json(
      { error: 'Error al guardar resultados' },
      { status: 500 },
    )
  }
}
