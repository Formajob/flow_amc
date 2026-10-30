import { NextResponse } from 'next/server'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const auth = require('../../../lib/amc-auth.js')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const failures = new Map()

function rowOf(key) {
  const now = Date.now()
  const row = failures.get(key) || { n: 0, at: now }
  if (now - row.at > 15 * 60 * 1000) {
    row.n = 0
    row.at = now
  }
  failures.set(key, row)
  return row
}

function asReq(request) {
  return {
    headers: {
      cookie: request.headers.get('cookie') || '',
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') || '',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || ''
    }
  }
}

function json(body, status, cookie) {
  const res = NextResponse.json(body, { status })
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  if (cookie) res.headers.set('Set-Cookie', cookie)
  return res
}

export async function GET(request) {
  const session = auth.readSession(asReq(request))
  if (!session) return json({ message: 'Connexion requise.' }, 401)
  return json({
    email: session.email,
    name: session.name || '',
    role: session.role,
    pages: session.pages || [],
    items: session.items || null
  }, 200)
}

export async function DELETE(request) {
  return json({ ok: true }, 200, auth.clearCookie(asReq(request)))
}

export async function POST(request) {
  let body = {}
  try { body = await request.json() } catch (err) { body = {} }
  const email = String((body && body.email) || '').trim().toLowerCase()
  const password = String((body && body.password) || '')
  const ip = String(request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
  const key = email + '|' + ip
  if (rowOf(key).n >= 8) return json({ message: 'Trop d’essais. Réessayez dans un quart d’heure.' }, 429)
  const result = await auth.checkLogin(email, password)
  if (!result.ok) {
    rowOf(key).n += 1
    if (result.code === 'unconfigured' && result.role === 'admin') {
      return json({ message: 'L’accès admin n’est pas activé. Dans Vercel, définissez AMC_ADMIN_PASSWORD (8 caractères minimum) et AMC_SESSION_SECRET, puis redéployez.' }, 503)
    }
    if (result.code === 'unconfigured') return json({ message: 'Le mot de passe de ce membre n’est pas encore défini.' }, 503)
    const message = result.code === 'password' ? 'Mot de passe incorrect.' : 'Cette adresse n’a pas accès à l’espace AMC.'
    return json({ message }, 401)
  }
  if (!auth.secret()) {
    return json({ message: 'La session n’est pas activée. Dans Vercel, définissez AMC_SESSION_SECRET (16 caractères minimum), puis redéployez.' }, 503)
  }
  const token = auth.signSession(result.email, result.role, result.name, result.pages)
  if (!token) return json({ message: 'La session n’est pas activée. Dans Vercel, définissez AMC_SESSION_SECRET (16 caractères minimum), puis redéployez.' }, 503)
  return json({
    email: result.email,
    name: result.name || '',
    role: result.role,
    pages: result.pages || [],
    items: result.items || null
  }, 200, auth.cookieHeader(token, asReq(request)))
}
