import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

export async function PUT() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()
    const [existing] = await pool.execute(
      `SELECT id, results_json FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const rows = existing as Array<{ id: string; results_json: string }>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay resultados para publicar' }, { status: 400 })
    }

    const parsed = typeof rows[0].results_json === 'string'
      ? JSON.parse(rows[0].results_json)
      : rows[0].results_json

    // Validate all phases are complete before publishing
    const groupKeys = Object.keys(parsed.groupStage || {})
    if (groupKeys.length < 12) {
      return NextResponse.json({ error: 'Debes completar los 12 grupos' }, { status: 400 })
    }
    for (const key of groupKeys) {
      if (!Array.isArray(parsed.groupStage[key]) || parsed.groupStage[key].length !== 4) {
        return NextResponse.json({ error: `Grupo ${key} debe tener 4 equipos` }, { status: 400 })
      }
    }

    if (!Array.isArray(parsed.bestThirdPlaced) || parsed.bestThirdPlaced.length !== 8) {
      return NextResponse.json({ error: 'Debes seleccionar exactamente 8 terceros' }, { status: 400 })
    }

    const knockoutKeys = Object.keys(parsed.knockout || {})
    if (knockoutKeys.length < 31) {
      return NextResponse.json({ error: 'Debes completar todos los partidos de knockout' }, { status: 400 })
    }

    if (!parsed.champion) {
      return NextResponse.json({ error: 'Debes seleccionar un campeón' }, { status: 400 })
    }

    await pool.execute(
      `UPDATE official_results SET status = 'published', updated_by = ? WHERE id = ?`,
      [user.id, rows[0].id],
    )

    return NextResponse.json({ success: true, status: 'published' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Publish results failed:', message)
    return NextResponse.json(
      { error: 'Error al publicar resultados' },
      { status: 500 },
    )
  }
}
