'use client'

import Link from 'next/link'
import { Building2, HardHat } from 'lucide-react'

export default function SignupChooserPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <a href="https://staffingatlas.com" className="inline-block text-2xl font-black text-navy-deep mb-1 hover:opacity-80 transition-opacity">
            Staffing<span className="text-amber">Atlas</span>
            </a>
          <p className="text-slate-500 text-sm">Get started — choose how you want to use StaffingAtlas</p>
          <a href="https://staffingatlas.com" className="inline-block mt-2 text-xs text-slate-400 hover:text-navy transition-colors">&larr; Back to staffingatlas.com</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/signup/company"
            className="group bg-white border-2 border-slate-200 hover:border-navy rounded-2xl p-7 flex flex-col items-center text-center transition-all hover:shadow-md">
            <div className="w-14 h-14 bg-navy/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy/20 transition-colors">
              <Building2 className="text-navy" size={28} />
            </div>
            <h2 className="font-bold text-navy-deep text-lg mb-1">I&apos;m hiring</h2>
            <p className="text-sm text-slate-500 leading-relaxed">Post jobs, manage contractors, and scale your team with Philippine talent.</p>
            <span className="mt-5 inline-block px-5 py-2 bg-navy text-white text-sm font-semibold rounded-lg group-hover:bg-navy-deep transition-colors">
              Hire staff →
            </span>
          </Link>

          <Link href="/signup/contractor"
            className="group bg-white border-2 border-slate-200 hover:border-amber rounded-2xl p-7 flex flex-col items-center text-center transition-all hover:shadow-md">
            <div className="w-14 h-14 bg-amber/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber/20 transition-colors">
              <HardHat className="text-amber" size={28} />
            </div>
            <h2 className="font-bold text-navy-deep text-lg mb-1">I&apos;m a contractor</h2>
            <p className="text-sm text-slate-500 leading-relaxed">Join the marketplace, get matched with companies, and manage your work.</p>
            <span className="mt-5 inline-block px-5 py-2 bg-amber text-navy-deep text-sm font-semibold rounded-lg group-hover:bg-amber-light transition-colors">
              Find work →
            </span>
          </Link>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-navy font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
