import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CAMPAIGN = "caravane-11"
const GROUPS = {
  A: ["safaa", "yahya", "nour", "fatiha", "badr", "nadia"],
  B: ["zineb", "hamza", "aicha", "yusur", "salma", "moncef"],
  C: ["yassir", "bouchra", "zakaria", "mouhcine", "maroua", "wissal"],
  D: ["bouchra", "hasnaa", "ilyass", "mohamed", "ahmed", "malak"],
  E: ["ashraf", "chaymaa"]
}
const ITEMS = ["pantalons", "pulls", "pyjamas", "peignoirs", "djellaba_f", "djellaba_h", "jackets", "manteaux", "chales", "argent"]

function secret() {
  const value = String(process.env.AMC_SESSION_SECRET || "")
  return value.length >= 16 ? value : "amc-localhost-session-2026"
}

function readToken(token) {
  if (!token || token.indexOf(".") < 0) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const expected = crypto.createHmac("sha256", secret()).update(parts[0]).digest("base64url")
  const left = Buffer.from(parts[1])
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"))
    if (!data || data.exp < Date.now()) return null
    return data
  } catch (err) {
    return null
  }
}

function sessionOf(req) {
  const raw = req.headers.get("cookie") || ""
  const item = raw.split(";").map((s) => s.trim()).find((s) => s.indexOf("amc_session=") === 0)
  if (!item) return null
  try { return readToken(decodeURIComponent(item.slice("amc_session=".length))) } catch (err) { return null }
}

function reply(body, status) {
  const res = NextResponse.json(body, { status })
  res.headers.set("Cache-Control", "no-store")
  return res
}

function supabase() {
  const url = String(process.env.AMC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
  const key = String(process.env.AMC_SUPABASE_SERVICE_ROLE || "")
  if (!url.startsWith("https://") || key.length < 20) return null
  return { url, key }
}

async function sb(path, options) {
  const env = supabase()
  if (!env) return { ok: false, status: 503, data: { message: "Base non reliée. Ajoutez AMC_SUPABASE_SERVICE_ROLE dans .env.local, puis redémarrez." } }
  const res = await fetch(env.url + path, {
    method: (options && options.method) || "GET",
    headers: {
      apikey: env.key,
      Authorization: "Bearer " + env.key,
      "Content-Type": "application/json",
      Prefer: (options && options.prefer) || "return=representation"
    },
    body: options && options.body ? JSON.stringify(options.body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

function canWrite(role) {
  return role === "admin" || role === "saisie"
}

function front(row) {
  const group = String(row.group_id || "").replace(CAMPAIGN + "-", "")
  const member = String(row.member_id || "")
  const prefix = group + "-"
  return {
    id: row.id,
    group,
    member: member.indexOf(prefix) === 0 ? member.slice(prefix.length) : member,
    item: row.item_id,
    qty: Number(row.qty) || 0,
    author: row.author || "",
    note: row.note || "",
    at: row.created_at
  }
}

function checkLine(body) {
  const group = String(body.group || "").trim().toUpperCase()
  const member = String(body.member || "").trim().toLowerCase()
  const item = String(body.item || "").trim()
  const qty = Number(body.qty)
  const note = String(body.note || "").slice(0, 240)
  if (!GROUPS[group] || GROUPS[group].indexOf(member) < 0) return { error: "Groupe ou membre inconnu." }
  if (ITEMS.indexOf(item) < 0) return { error: "Article inconnu." }
  if (!qty || Number.isNaN(qty)) return { error: "La quantité ne peut pas être 0." }
  return {
    campaign_id: CAMPAIGN,
    group_id: CAMPAIGN + "-" + group,
    member_id: group + "-" + member,
    item_id: item,
    qty,
    note
  }
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  const found = await sb("/rest/v1/amc_entries?campaign_id=eq." + CAMPAIGN + "&select=id,group_id,member_id,item_id,qty,author,note,created_at&order=created_at.desc&limit=500")
  if (!found.ok) {
    const message = found.status === 503 ? found.data.message : "La base n'a pas renvoyé les saisies. Vérifiez que schema.sql a été exécuté."
    return reply({ message }, found.status === 503 ? 503 : 502)
  }
  const rows = Array.isArray(found.data) ? found.data : []
  return reply({ entries: rows.map(front) }, 200)
}

export async function POST(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (!canWrite(session.role)) return reply({ message: "Cette session ne peut pas saisir." }, 403)
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const line = checkLine(body)
  if (line.error) return reply({ message: line.error }, 400)
  line.author = session.name || session.email || "Saisie"
  const saved = await sb("/rest/v1/amc_entries", { method: "POST", body: line })
  if (!saved.ok) return reply({ message: "Enregistrement refusé par la base. Le groupe E doit être ajouté si vous le choisissez." }, 502)
  const row = Array.isArray(saved.data) ? saved.data[0] : saved.data
  return reply({ entry: front(row || line) }, 200)
}

export async function PATCH(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (!canWrite(session.role)) return reply({ message: "Cette session ne peut pas modifier." }, 403)
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const id = Number(body.id)
  if (!id) return reply({ message: "Saisie introuvable." }, 400)
  const line = checkLine(body)
  if (line.error) return reply({ message: line.error }, 400)
  const saved = await sb("/rest/v1/amc_entries?id=eq." + id + "&campaign_id=eq." + CAMPAIGN, { method: "PATCH", body: line })
  if (!saved.ok) return reply({ message: "Modification refusée." }, 502)
  return reply({ ok: true }, 200)
}

export async function DELETE(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (!canWrite(session.role)) return reply({ message: "Cette session ne peut pas supprimer." }, 403)
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!id) return reply({ message: "Saisie introuvable." }, 400)
  const saved = await sb("/rest/v1/amc_entries?id=eq." + id + "&campaign_id=eq." + CAMPAIGN, { method: "DELETE", prefer: "return=minimal" })
  if (!saved.ok) return reply({ message: "Suppression refusée." }, 502)
  return reply({ ok: true }, 200)
}
