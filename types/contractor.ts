/**
 * contractor_profiles table row (full, including private fields)
 */
export interface ContractorProfile {
  id: string
  display_name: string
  email: string | null
  photo_url: string | null
  role: string
  bio: string | null
  rate_usd: number
  location: string
  availability: string
  skills: string[]
  linkedin_url: string | null
  portfolio_url: string | null
  cv_url: string | null
  pool_type: 'marketplace' | 'vetted'
  profile_status: 'pending' | 'approved' | 'rejected'
  user_id: string | null
  source: string
  created_at: string
  updated_at: string
}

/**
 * Public-safe shape returned by /api/contractors/public
 * No email, no CV URL (too private), no user_id.
 */
export interface PublicContractor {
  id: string
  display_name: string
  photo_url: string | null
  role: string
  bio: string | null
  rate_usd: number           // 0 = "on request"
  location: string
  availability: string
  skills: string[]
  linkedin_url: string | null
  portfolio_url: string | null
  pool_type: 'marketplace' | 'vetted'
}
