import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CAMPAIGN = "caravane-11"
const ITEMS = {
  pantalons: ["Pantalons", "pièce", false, 1],
  pulls: ["Pulls en laine", "pièce", false, 2],
  pyjamas: ["Pyjamas", "pièce", false, 3],
  peignoirs: ["Peignoirs", "pièce", false, 4],
  djellaba_f: ["Djellabas femmes", "pièce", false, 5],
  djellaba_h: ["Djellabas hommes", "pièce", false, 6],
  jackets: ["Jackets", "pièce", false, 7],
  manteaux: ["Manteaux", "pièce", false, 8],
  chales: ["Châles", "pièce", false, 9],
  livres: ["Livres", "pièce", false, 11]
}

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

function cleanKey(raw) {
  return String(raw || "").replace(/^\uFEFF/, "").trim().replace(/^['"]+|['"]+$/g, "").replace(/^Bearer\s+/i, "").replace(/\s+/g, "")
}

function supabase() {
  const url = String(process.env.AMC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
  const key = cleanKey(process.env.AMC_SUPABASE_SERVICE_ROLE || "")
  if (!url.startsWith("https://") || url.indexOf(".supabase.co") < 0 || key.length < 20) return null
  return { url, key }
}

async function sb(path, options) {
  const env = supabase()
  if (!env) return { ok: false, status: 503, data: { message: "Base non reliée." } }
  const headers = {
    apikey: env.key,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: (options && options.prefer) || "return=representation",
    "User-Agent": "flow-amc-server"
  }
  if (env.key.indexOf("eyJ") === 0) headers.Authorization = "Bearer " + env.key
  const res = await fetch(env.url + path, {
    method: (options && options.method) || "GET",
    headers,
    body: options && options.body ? JSON.stringify(options.body) : undefined
  })
  const text = await res.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch (err) { data = { message: text.slice(0, 180) } }
  }
  return { ok: res.ok, status: res.status, data }
}

function dbMessage(result) {
  const raw = result && result.data && (result.data.message || result.data.hint || result.data.error) || ""
  if (String(raw).indexOf("amc_prep_lines") >= 0) return "La table de préparation n'existe pas encore."
  return "La base n'a pas enregistré les quantités."
}

function qtyOf(value) {
  const n = Number(String(value == null ? "" : value).trim().replace(",", "."))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

async function ensureBase() {
  const campaign = await sb("/rest/v1/amc_campaigns?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: {
      id: CAMPAIGN,
      name: "Caravane humanitaire",
      edition: 11,
      place: "Douar Ilissi",
      region: "Azilal",
      starts_on: "2026-12-26",
      ends_on: "2026-12-27",
      status: "collecte"
    }
  })
  if (!campaign.ok) return campaign
  const items = Object.keys(ITEMS).map((id) => ({
    id,
    label: ITEMS[id][0],
    unit: ITEMS[id][1],
    is_money: ITEMS[id][2],
    sort_order: ITEMS[id][3]
  }))
  return sb("/rest/v1/amc_item_types?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: items
  })
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  const found = await sb("/rest/v1/amc_prep_lines?campaign_id=eq." + CAMPAIGN + "&select=item_id,ready_qty,rejected_qty,note,updated_at")
  if (!found.ok) return reply({ message: dbMessage(found) }, found.status === 503 ? 503 : 502)
  const rows = Array.isArray(found.data) ? found.data : []
  let updatedAt = ""
  const lines = rows.filter((row) => ITEMS[row.item_id]).map((row) => {
    if (row.updated_at && row.updated_at > updatedAt) updatedAt = row.updated_at
    return {
      item: row.item_id,
      ready: Number(row.ready_qty) || 0,
      rejected: Number(row.rejected_qty) || 0,
      note: row.note || ""
    }
  })
  return reply({ lines, updatedAt }, 200)
}

export async function POST(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (session.role !== "admin") return reply({ message: "Seuls les admins enregistrent la préparation." }, 403)
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const incoming = Array.isArray(body.lines) ? body.lines : []
  const byItem = {}
  for (let i = 0; i < incoming.length; i += 1) {
    const item = String(incoming[i].item || "")
    if (!ITEMS[item] || byItem[item]) continue
    const rejected = qtyOf(incoming[i].rejected)
    if (rejected == null) return reply({ message: "Une quantité est invalide." }, 400)
    byItem[item] = { rejected, note: String(incoming[i].note || "").trim().slice(0, 240) }
  }
  const ids = Object.keys(ITEMS)
  const counted = await sb("/rest/v1/amc_entries?campaign_id=eq." + CAMPAIGN + "&select=item_id,qty&limit=5000")
  if (!counted.ok) return reply({ message: "Le déclaré de la collecte ne répond pas." }, 502)
  const declared = {}
  ;(Array.isArray(counted.data) ? counted.data : []).forEach((row) => {
    if (!ITEMS[row.item_id]) return
    declared[row.item_id] = (declared[row.item_id] || 0) + (Number(row.qty) || 0)
  })
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]
    const rejected = byItem[id] ? byItem[id].rejected : 0
    const total = declared[id] || 0
    if (rejected > total) return reply({ message: ITEMS[id][0] + " : à écarter dépasse le déclaré." }, 400)
    if (rejected > 0 && !(byItem[id] && byItem[id].note)) return reply({ message: "Indiquez la raison pour " + ITEMS[id][0] + "." }, 400)
  }
  const readyBase = await ensureBase()
  if (!readyBase || !readyBase.ok) return reply({ message: "Les articles n'ont pas pu être préparés." }, 502)
  const now = new Date().toISOString()
  const saved = await sb("/rest/v1/amc_prep_lines?on_conflict=campaign_id,item_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: ids.map((id) => {
      const rejected = byItem[id] ? byItem[id].rejected : 0
      const total = declared[id] || 0
      return {
        campaign_id: CAMPAIGN,
        item_id: id,
        ready_qty: Math.max(0, Math.round((total - rejected) * 100) / 100),
        rejected_qty: rejected,
        note: byItem[id] ? byItem[id].note : "",
        updated_at: now
      }
    })
  })
  if (!saved.ok) return reply({ message: dbMessage(saved) }, saved.status === 503 ? 503 : 502)
  const readyTotal = ids.reduce((sum, id) => sum + Math.max(0, (declared[id] || 0) - (byItem[id] ? byItem[id].rejected : 0)), 0)
  return reply({ message: "Préparation enregistrée.", ready: readyTotal, updatedAt: now }, 200)
}
