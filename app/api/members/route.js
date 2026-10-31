import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CAMPAIGN = "caravane-11"
const GROUPS = ["A", "B", "C", "D", "E"]

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

function slug(name) {
  const folded = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  return folded.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40)
}

function front(row) {
  const group = String(row.group_id || "").replace(CAMPAIGN + "-", "")
  const id = String(row.id || "")
  const prefix = group + "-"
  return {
    group,
    id: id.indexOf(prefix) === 0 ? id.slice(prefix.length) : id,
    name: row.name
  }
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  const found = await sb("/rest/v1/amc_members?group_id=like." + CAMPAIGN + "-*&select=id,group_id,name,sort_order&order=sort_order.asc")
  if (!found.ok) return reply({ message: "La liste des noms ne répond pas." }, 502)
  const rows = Array.isArray(found.data) ? found.data.map(front) : []
  return reply({ members: rows }, 200)
}

export async function POST(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (session.role !== "admin") return reply({ message: "Seuls les admins ajoutent un nom." }, 403)
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const group = String(body.group || "").trim().toUpperCase()
  const name = String(body.name || "").trim().replace(/\s+/g, " ")
  const id = slug(name)
  if (GROUPS.indexOf(group) < 0) return reply({ message: "Choisissez un groupe." }, 400)
  if (name.length < 2 || name.length > 60 || id.length < 2) return reply({ message: "Indiquez le nom complet." }, 400)
  const groupId = CAMPAIGN + "-" + group
  const memberId = group + "-" + id
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
  if (!campaign.ok) return reply({ message: "Le groupe n'a pas pu être préparé." }, 502)
  const savedGroup = await sb("/rest/v1/amc_groups?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: { id: groupId, campaign_id: CAMPAIGN, code: group, label: "Groupe " + group }
  })
  if (!savedGroup.ok) return reply({ message: "Le groupe n'a pas pu être préparé." }, 502)
  const existing = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(memberId) + "&select=id,name")
  if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
    return reply({ message: existing.data[0].name + " est déjà dans le groupe " + group + "." }, 409)
  }
  const listed = await sb("/rest/v1/amc_members?group_id=eq." + encodeURIComponent(groupId) + "&select=id")
  const sort = (listed.ok && Array.isArray(listed.data) ? listed.data.length : 0) + 1
  const saved = await sb("/rest/v1/amc_members", {
    method: "POST",
    body: { id: memberId, group_id: groupId, name, sort_order: sort }
  })
  if (!saved.ok) return reply({ message: "Le nom n'a pas été enregistré." }, 502)
  return reply({ message: name + " est ajouté au groupe " + group + ".", member: { group, id, name } }, 200)
}
