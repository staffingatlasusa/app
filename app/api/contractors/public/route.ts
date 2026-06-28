import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PublicContractor = {
  id: string; display_name: string; photo_url: string | null;
  role: string; bio: string | null; rate_usd: number; location: string;
  availability: string | null; skills: string[]; linkedin_url: string | null;
  portfolio_url: string | null; pool_type: string;
}

// Cache for 60 seconds — talent browse doesn't need real-time updates
export const revalidate = 60

/**
 * GET /api/contractors/public
 *
 * Public read-only endpoint. No auth required.
 * Returns approved contractor profiles only (enforced by RLS).
 * Used by staffingatlas.com/talent/ browse page.
 *
 * Response shape: { contractors: PublicContractor[], count: number }
 *
 * Optional query params:
 *   ?pool=vetted|marketplace
 *   ?location=Philippines
 *   ?max_rate=50       (0 excluded from filtering — means "on request")
 *   ?availability=Full-time+%2840hr%29
 *   ?skills=React,Node.js  (comma-separated — AND logic: must have all)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pool        = searchParams.get('pool')
    const location    = searchParams.get('location')
    const maxRate     = searchParams.get('max_rate')
    const availability = searchParams.get('availability')
    const skillsParam = searchParams.get('skills')

    const supabase = createClient()

    let query = supabase
      .from('contractor_profiles')
      .select(`
        id,
        display_name,
        photo_url,
        role,
        bio,
        rate_usd,
        location,
        availability,
        skills,
        linkedin_url,
        portfolio_url,
        pool_type
      `)
      // profile_status = 'approved' is enforced by RLS public_read_approved policy
      // but we add it explicitly for clarity and to leverage the index
      .eq('profile_status', 'approved')
      .order('pool_type', { ascending: false })  // vetted first (v > m alphabetically desc)
      .order('rate_usd', { ascending: true })
      .limit(200)

    // Optional server-side filters (reduces payload size for filtered requests)
    if (pool && (pool === 'vetted' || pool === 'marketplace')) {
      query = query.eq('pool_type', pool)
    }
    if (location) {
      query = query.eq('location', location)
    }
    if (availability) {
      query = query.eq('availability', availability)
    }
    if (maxRate && parseInt(maxRate) > 0) {
      // Include contractors with rate_usd = 0 (on request) + those within range
      query = query.or(`rate_usd.eq.0,rate_usd.lte.${parseInt(maxRate)}`)
    }
    if (skillsParam) {
      const skills = skillsParam.split(',').map(s => s.trim()).filter(Boolean)
      if (skills.length > 0) {
        // Postgres array containment: skills array must contain ALL requested skills
        query = query.contains('skills', skills)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[/api/contractors/public] Supabase error:', error.message)
      return NextResponse.json(
        { error: 'Failed to load contractors' },
        { status: 500 }
      )
    }

    const contractors: PublicContractor[] = (data ?? []).map(row => ({
      id: row.id,
      display_name: row.display_name,
      photo_url: row.photo_url,
      role: row.role,
      bio: row.bio,
      rate_usd: row.rate_usd,
      location: row.location,
      availability: row.availability,
      skills: row.skills ?? [],
      linkedin_url: row.linkedin_url,
      portfolio_url: row.portfolio_url,
      pool_type: row.pool_type,
    }))

    return NextResponse.json(
      { contractors, count: contractors.length },
      {
        headers: {
          // Allow staffingatlas.com to call this cross-origin
          'Access-Control-Allow-Origin': 'https://staffingatlas.com',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (err) {
    console.error('[/api/contractors/public] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight CORS for cross-origin requests from staffingatlas.com
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://staffingatlas.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
