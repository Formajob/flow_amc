import { NextResponse } from 'next/server'

export async function GET(request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')?.toLowerCase()
  const amcAuth = await import('../../../lib/amc-auth')
  if (!amcAuth.isKnown(email)) return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })
  const role = amcAuth.getRole(email)
  return NextResponse.json({ role: role === 'admin' ? 'membre' : role, email })
}
