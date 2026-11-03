import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CAMPAIGN = "caravane-11"
const GROUPS = ["A", "B", "C", "D", "E"]
const SEED = [
  ["A", "safaa", "Safaa"],
  ["A", "yahya", "Yahya"],
  ["A", "nour", "Nour"],
  ["A", "fatiha", "Fatiha"],
  ["A", "badr", "Badr"],
  ["A", "nadia", "Nadia"],
  ["B", "zineb", "Zineb"],
  ["B", "hamza", "Hamza"],
  ["B", "aicha", "Aicha"],
  ["B", "yusur", "Yusur"],
  ["B", "salma", "Salma"],
  ["B", "moncef", "Moncef"],
  ["C", "yassir", "Yassir"],
  ["C", "bouchra", "Bouchra"],
  ["C", "zakaria", "Zakaria"],
  ["C", "mouhcine", "Mouhcine"],
  ["C", "maroua", "Maroua"],
  ["C", "wissal", "Wissal"],
  ["D", "bouchra", "Bouchra"],
  ["D", "hasnaa", "Hasnaa"],
  ["D", "ilyass", "Ilyass"],
  ["D", "mohamed", "Mohamed"],
  ["D", "ahmed", "Ahmed"],
  ["D", "malak", "Malak"],
  ["E", "ashraf", "Ashraf"],
  ["E", "chaymaa", "Chaymaa"],
  ["E", "salma_harama", "Salma Harama"],
  ["E", "ali_bousfiha", "Ali Bousfiha"]
]

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
  return String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40)
}

function front(row) {
  const group = String(row.group_id || "").replace(CAMPAIGN + "-", "")
  const id = String(row.id || "")
  const prefix = group + "-"
  return {
    key: id,
    group,
    id: id.indexOf(prefix) === 0 ? id.slice(prefix.length) : id,
    name: row.name
  }
}

function visible(row) {
  const group = String(row.group_id || "").replace(CAMPAIGN + "-", "")
  return GROUPS.indexOf(group) >= 0 && String(row.id || "").indexOf("X-") !== 0
}

async function ensureGroups() {
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
  return sb("/rest/v1/amc_groups?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: GROUPS.concat(["X"]).map((code) => ({
      id: CAMPAIGN + "-" + code,
      campaign_id: CAMPAIGN,
      code,
      label: code === "X" ? "Retirés" : "Groupe " + code
    }))
  })
}

async function loadRows() {
  return sb("/rest/v1/amc_members?group_id=like." + CAMPAIGN + "-*&select=id,group_id,name,sort_order&order=sort_order.asc")
}

async function seedMissing(rows) {
  const ids = new Set((rows || []).map((row) => row.id))
  for (let i = 0; i < SEED.length; i += 1) {
    const group = SEED[i][0]
    const id = group + "-" + SEED[i][1]
    if (ids.has(id) || ids.has("X-" + id)) continue
    const saved = await sb("/rest/v1/amc_members", {
      method: "POST",
      prefer: "return=minimal",
      body: { id, group_id: CAMPAIGN + "-" + group, name: SEED[i][2], sort_order: i + 1 }
    })
    if (saved.ok) ids.add(id)
  }
}

async function tombstone(memberId) {
  await sb("/rest/v1/amc_members?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: { id: "X-" + memberId, group_id: CAMPAIGN + "-X", name: "retiré", sort_order: 0 }
  })
}

async function clearTombstone(memberId) {
  await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent("X-" + memberId), {
    method: "DELETE",
    prefer: "return=minimal"
  })
}

function admin(req) {
  const session = sessionOf(req)
  if (!session) return { error: reply({ message: "Connexion requise." }, 401) }
  if (session.role !== "admin") return { error: reply({ message: "Seuls les admins gèrent les noms." }, 403) }
  return { session }
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  let found = await loadRows()
  if (!found.ok) return reply({ message: "La liste des noms ne répond pas." }, 502)
  const ids = new Set((Array.isArray(found.data) ? found.data : []).map((row) => row.id))
  const missing = SEED.filter((row) => !ids.has(row[0] + "-" + row[1]) && !ids.has("X-" + row[0] + "-" + row[1]))
  if (missing.length) {
    const ready = await ensureGroups()
    if (!ready || !ready.ok) return reply({ message: "La liste des noms ne répond pas." }, 502)
    await sb("/rest/v1/amc_members", {
      method: "POST",
      prefer: "return=minimal",
      body: missing.map((row, index) => ({
        id: row[0] + "-" + row[1],
        group_id: CAMPAIGN + "-" + row[0],
        name: row[2],
        sort_order: index + 1
      }))
    })
    found = await loadRows()
    if (!found.ok) return reply({ message: "La liste des noms ne répond pas." }, 502)
  }
  const members = (Array.isArray(found.data) ? found.data : []).filter(visible).map(front)
  members.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name, "fr"))
  return reply({ members }, 200)
}

export async function POST(req) {
  const gate = admin(req)
  if (gate.error) return gate.error
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const group = String(body.group || "").trim().toUpperCase()
  const name = String(body.name || "").trim().replace(/\s+/g, " ")
  const id = slug(name)
  if (GROUPS.indexOf(group) < 0) return reply({ message: "Choisissez un groupe." }, 400)
  if (name.length < 2 || name.length > 60 || id.length < 2) return reply({ message: "Indiquez le nom complet." }, 400)
  const memberId = group + "-" + id
  const ready = await ensureGroups()
  if (!ready || !ready.ok) return reply({ message: "Le groupe n'a pas pu être préparé." }, 502)
  const existing = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(memberId) + "&select=id,name")
  if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
    return reply({ message: existing.data[0].name + " est déjà dans le groupe " + group + "." }, 409)
  }
  await clearTombstone(memberId)
  const listed = await sb("/rest/v1/amc_members?group_id=eq." + encodeURIComponent(CAMPAIGN + "-" + group) + "&select=id")
  const sort = (listed.ok && Array.isArray(listed.data) ? listed.data.length : 0) + 1
  const saved = await sb("/rest/v1/amc_members", {
    method: "POST",
    body: { id: memberId, group_id: CAMPAIGN + "-" + group, name, sort_order: sort }
  })
  if (!saved.ok) return reply({ message: "Le nom n'a pas été enregistré." }, 502)
  return reply({ message: name + " est ajouté au groupe " + group + ".", member: { key: memberId, group, id, name } }, 200)
}

export async function PATCH(req) {
  const gate = admin(req)
  if (gate.error) return gate.error
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const oldId = String(body.id || "").trim()
  const group = String(body.group || "").trim().toUpperCase()
  if (!/^[A-E]-[a-z0-9_]{2,40}$/.test(oldId) || GROUPS.indexOf(group) < 0) return reply({ message: "Choisissez un nom et un groupe." }, 400)
  const currentGroup = oldId.slice(0, 1)
  const slugId = oldId.slice(2)
  if (currentGroup === group) return reply({ message: "Ce nom est déjà dans ce groupe." }, 400)
  const found = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(oldId) + "&select=id,name")
  const row = found.ok && Array.isArray(found.data) ? found.data[0] : null
  if (!row) return reply({ message: "Ce nom n'est plus dans la liste." }, 404)
  const newId = group + "-" + slugId
  const clash = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(newId) + "&select=id,name")
  if (clash.ok && Array.isArray(clash.data) && clash.data[0]) {
    return reply({ message: "Un nom identique est déjà dans le groupe " + group + "." }, 409)
  }
  const ready = await ensureGroups()
  if (!ready || !ready.ok) return reply({ message: "Le groupe n'a pas pu être préparé." }, 502)
  await clearTombstone(newId)
  const created = await sb("/rest/v1/amc_members", {
    method: "POST",
    body: { id: newId, group_id: CAMPAIGN + "-" + group, name: row.name, sort_order: 99 }
  })
  if (!created.ok) return reply({ message: "Le groupe n'a pas été changé." }, 502)
  const moved = await sb("/rest/v1/amc_entries?member_id=eq." + encodeURIComponent(oldId), {
    method: "PATCH",
    prefer: "return=minimal",
    body: { member_id: newId, group_id: CAMPAIGN + "-" + group }
  })
  if (!moved.ok) return reply({ message: "Les saisies n'ont pas suivi le changement de groupe." }, 502)
  const removed = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(oldId), {
    method: "DELETE",
    prefer: "return=minimal"
  })
  if (!removed.ok) return reply({ message: "L'ancien groupe n'a pas pu être quitté." }, 502)
  await tombstone(oldId)
  return reply({ message: row.name + " est maintenant dans le groupe " + group + ".", member: { key: newId, group, id: slugId, name: row.name } }, 200)
}

export async function DELETE(req) {
  const gate = admin(req)
  if (gate.error) return gate.error
  const url = new URL(req.url)
  const memberId = String(url.searchParams.get("id") || "").trim()
  const force = url.searchParams.get("force") === "1"
  if (!/^[A-E]-[a-z0-9_]{2,40}$/.test(memberId)) return reply({ message: "Choisissez un nom." }, 400)
  const found = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(memberId) + "&select=id,name")
  const row = found.ok && Array.isArray(found.data) ? found.data[0] : null
  if (!row) return reply({ message: "Ce nom n'est plus dans la liste." }, 404)
  const lines = await sb("/rest/v1/amc_entries?member_id=eq." + encodeURIComponent(memberId) + "&select=id")
  const count = lines.ok && Array.isArray(lines.data) ? lines.data.length : 0
  if (count && !force) {
    const word = count > 1 ? "saisies" : "saisie"
    return reply({ message: row.name + " a " + count + " " + word + ".", entries: count }, 409)
  }
  if (count) {
    const cleared = await sb("/rest/v1/amc_entries?member_id=eq." + encodeURIComponent(memberId), {
      method: "DELETE",
      prefer: "return=minimal"
    })
    if (!cleared.ok) return reply({ message: "Les saisies de ce nom n'ont pas pu être retirées." }, 502)
  }
  const removed = await sb("/rest/v1/amc_members?id=eq." + encodeURIComponent(memberId), {
    method: "DELETE",
    prefer: "return=minimal"
  })
  if (!removed.ok) return reply({ message: "Le nom n'a pas été retiré." }, 502)
  await tombstone(memberId)
  return reply({ message: row.name + " est retiré." }, 200)
}
