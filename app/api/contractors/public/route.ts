import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PublicContractor = {
  id: string; display_name: string; role: string | null; bio: string | null
  rate_usd: number; location: string; skills: string[]
}

// Cache for 60 seconds — talent browse doesn't need real-time updates
export const revalidate = 60

const CORS = {
  'Access-Control-Allow-Origin': 'https://staffingatlas.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

/**
 * GET /api/contractors/public
 *
 * Public read-only endpoint for the staffingatlas.com/talent/ browse page.
 * Returns approved marketplace profiles only.
 *
 * Optional query params:
 *   ?location=Philippines
 *   ?max_rate=50
 *   ?skills=React,Node.js  (comma-separated — must have all)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const maxRate = searchParams.get('max_rate')
    const skillsParam = searchParams.get('skills')

    const supabase = await createClient()

    let query = supabase
      .from('contractor_profiles')
      .select('id, name, role, bio, hourly_rate, country, skills')
      .eq('status', 'approved')
      .order('hourly_rate', { ascending: true })
      .limit(200)

    if (location) query = query.eq('country', location)
    if (maxRate && parseInt(maxRate) > 0) {
      query = query.or(`hourly_rate.is.null,hourly_rate.lte.${parseInt(maxRate)}`)
    }
    if (skillsParam) {
      const skills = skillsParam.split(',').map(s => s.trim()).filter(Boolean)
      if (skills.length > 0) query = query.contains('skills', skills)
    }

    const { data, error } = await query
    if (error) {
      console.error('[/api/contractors/public] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to load contractors' }, { status: 500, headers: CORS })
    }

    // Anonymize: first name + last initial only
    const contractors: PublicContractor[] = (data ?? []).map(row => {
      const parts = (row.name ?? '').trim().split(/\s+/)
      const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] ?? 'Contractor'
      return {
        id: row.id,
        display_name: display,
        role: row.role,
        bio: row.bio,
        rate_usd: Number(row.hourly_rate ?? 0),
        location: row.country ?? 'Remote',
        skills: row.skills ?? [],
      }
    })

    return NextResponse.json(
      { contractors, count: contractors.length },
      { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (err) {
    console.error('[/api/contractors/public] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Headers': 'Content-Type' } })
}
