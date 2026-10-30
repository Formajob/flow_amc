import { NextResponse } from 'next/server'

export async function GET(request) {
  const origin = request.headers.get('origin')
  if (origin !== 'https://acx-flow.vercel.app') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const url = new URL(request.url)
  const email = url.searchParams.get('email')?.toLowerCase()
  const amcAuth = await import('../../../lib/amc-auth')
  const adminEmails = ['zouzou.douni@gmail.com', 'ouzou.douni@gmail.com']
  if (adminEmails.includes(email) || (process.env.AMC_ACCESS_EMAILS?.split(',').map(e => e.toLowerCase()).includes(email))) {
    return NextResponse.json({ space: 'amc' })
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
