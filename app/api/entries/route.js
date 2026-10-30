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
const NAMES = {
  safaa: "Safaa", yahya: "Yahya", nour: "Nour", fatiha: "Fatiha", badr: "Badr", nadia: "Nadia",
  zineb: "Zineb", hamza: "Hamza", aicha: "Aicha", yusur: "Yusur", salma: "Salma", moncef: "Moncef",
  yassir: "Yassir", bouchra: "Bouchra", zakaria: "Zakaria", mouhcine: "Mouhcine", maroua: "Maroua", wissal: "Wissal",
  hasnaa: "Hasnaa", ilyass: "Ilyass", mohamed: "Mohamed", ahmed: "Ahmed", malak: "Malak",
  ashraf: "Ashraf", chaymaa: "Chaymaa"
}
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
  livres: ["Livres", "pièce", false, 11],
  argent: ["Dons", "MAD", true, 10]
}

const ITEM_SCOPE = {
  "mohamedyahyajbir@gmail.com": { deny: ["livres"] },
  "marouaabid1607@gmail.com": { allow: ["livres"] }
}

function itemAllowed(email, item) {
  const scope = ITEM_SCOPE[String(email || "").toLowerCase()]
  if (!scope) return true
  if (scope.allow) return scope.allow.indexOf(item) >= 0
  if (scope.deny) return scope.deny.indexOf(item) < 0
  return true
}

async function storedItem(id) {
  const found = await sb("/rest/v1/amc_entries?id=eq." + id + "&campaign_id=eq." + CAMPAIGN + "&select=item_id")
  if (!found.ok) return { error: dbMessage(found) }
  const row = Array.isArray(found.data) ? found.data[0] : null
  if (!row) return { missing: true }
  return { item: row.item_id }
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

function jwtPayload(key) {
  const parts = key.split(".")
  if (parts.length !== 3) return null
  try { return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) } catch (err) { return null }
}

function keyProblem(url, key) {
  if (key.indexOf("sb_publishable_") === 0) return "C'est la clé publique. Dans Supabase, Settings, API Keys, copiez Secret, celle qui commence par sb_secret_."
  if (key.indexOf("sb_secret_") === 0) return ""
  if (key.indexOf("eyJ") !== 0) return "La clé ne commence ni par sb_secret_ ni par eyJ. Recopiez Secret depuis Settings, API Keys."
  const payload = jwtPayload(key)
  if (!payload) return "La clé est coupée. Copiez-la en entier, sur une seule ligne, sans guillemets."
  if (payload.role === "anon") return "C'est la clé anon. Il faut Secret (sb_secret_) ou l'ancienne clé service_role."
  if (payload.role && payload.role !== "service_role") return "Cette clé n'a pas le droit d'écrire. Prenez Secret dans API Keys."
  const ref = url.replace(/^https:\/\//, "").split(".")[0]
  if (payload.ref && payload.ref !== ref) return "Cette clé appartient à un autre projet que l'adresse AMC_SUPABASE_URL."
  return ""
}

function supabase() {
  const url = String(process.env.AMC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
  const key = cleanKey(process.env.AMC_SUPABASE_SERVICE_ROLE || "")
  if (!url.startsWith("https://") || url.indexOf(".supabase.co") < 0 || key.length < 20) return null
  const problem = keyProblem(url, key)
  if (problem) return { error: problem }
  return { url, key }
}

async function sb(path, options) {
  const env = supabase()
  if (!env) return { ok: false, status: 503, data: { message: "Base non reliée. AMC_SUPABASE_URL doit finir par .supabase.co, et AMC_SUPABASE_SERVICE_ROLE doit contenir la clé Secret. Redémarrez ensuite." } }
  if (env.error) return { ok: false, status: 503, data: { message: env.error } }
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
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

function dbMessage(result) {
  const data = result.data || {}
  const code = String(data.code || "")
  const raw = String(data.message || data.error || data.msg || data.hint || "")
  const details = String(data.details || "")
  if (result.status === 503 && raw) return raw
  if (result.status === 401 || /invalid api key|jwt/i.test(raw)) {
    return "Supabase refuse encore la clé. Ouvrez le projet FLOW, Settings, API Keys, copiez Secret (sb_secret_), remplacez la ligne, enregistrez, puis redémarrez."
  }
  if (code === "42501" || /row-level security|permission denied/i.test(raw)) {
    return "La base bloque l'écriture. La clé collée n'est pas service_role."
  }
  if (code === "42P01" || code === "PGRST205" || /does not exist|schema cache|Could not find the table/i.test(raw)) {
    return "Les tables AMC sont absentes. Dans Supabase, SQL Editor, exécutez base-amc.sql, puis réessayez."
  }
  if (result.status === 404) {
    return "Adresse Supabase introuvable. AMC_SUPABASE_URL doit être https://xxxx.supabase.co, sans /rest/v1."
  }
  if (code === "23503") return "Lien manquant en base. " + (details || raw)
  if (code === "23514") return "La quantité est refusée. Elle ne peut pas être 0."
  if (raw) return raw
  return "La base a répondu " + result.status + " sans détail."
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
  const qty = Number(String(body.qty || "").replace(",", "."))
  const note = String(body.note || "").slice(0, 240)
  if (!GROUPS[group] || GROUPS[group].indexOf(member) < 0) return { error: "Groupe ou membre inconnu." }
  if (!ITEMS[item]) return { error: "Article inconnu." }
  if (!qty || Number.isNaN(qty)) return { error: "La quantité ne peut pas être 0." }
  return {
    campaign_id: CAMPAIGN,
    group_id: CAMPAIGN + "-" + group,
    member_id: group + "-" + member,
    item_id: item,
    qty,
    note: note || null
  }
}

async function ensure(line) {
  const group = line.group_id.slice(CAMPAIGN.length + 1)
  const member = line.member_id.slice(group.length + 1)
  const item = ITEMS[line.item_id]
  const steps = [
    ["/rest/v1/amc_campaigns?on_conflict=id", {
      id: CAMPAIGN,
      name: "Caravane humanitaire",
      edition: 11,
      place: "Douar Ilissi",
      region: "Azilal",
      starts_on: "2026-12-26",
      ends_on: "2026-12-27",
      status: "collecte"
    }],
    ["/rest/v1/amc_groups?on_conflict=id", {
      id: line.group_id,
      campaign_id: CAMPAIGN,
      code: group,
      label: "Groupe " + group
    }],
    ["/rest/v1/amc_members?on_conflict=id", {
      id: line.member_id,
      group_id: line.group_id,
      name: NAMES[member] || member,
      sort_order: 1
    }],
    ["/rest/v1/amc_item_types?on_conflict=id", {
      id: line.item_id,
      label: item[0],
      unit: item[1],
      is_money: item[2],
      sort_order: item[3]
    }]
  ]
  for (let i = 0; i < steps.length; i++) {
    const saved = await sb(steps[i][0], {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=minimal",
      body: steps[i][1]
    })
    if (!saved.ok) return saved
  }
  return { ok: true }
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  const found = await sb("/rest/v1/amc_entries?campaign_id=eq." + CAMPAIGN + "&select=id,group_id,member_id,item_id,qty,author,note,created_at&order=created_at.desc&limit=500")
  if (!found.ok) return reply({ message: dbMessage(found) }, found.status === 503 ? 503 : 502)
  const rows = (Array.isArray(found.data) ? found.data : []).filter((row) => itemAllowed(session.email, row.item_id))
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
  if (!itemAllowed(session.email, line.item_id)) return reply({ message: "Cet article n'est pas ouvert pour cette session." }, 403)
  line.author = session.name || session.email || "Saisie"
  const ready = await ensure(line)
  if (!ready.ok) return reply({ message: dbMessage(ready) }, 502)
  const saved = await sb("/rest/v1/amc_entries", { method: "POST", body: line })
  if (!saved.ok) return reply({ message: dbMessage(saved) }, 502)
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
  const current = await storedItem(id)
  if (current.error) return reply({ message: current.error }, 502)
  if (current.missing) return reply({ message: "Saisie introuvable." }, 404)
  if (!itemAllowed(session.email, current.item) || !itemAllowed(session.email, line.item_id)) return reply({ message: "Cet article n'est pas ouvert pour cette session." }, 403)
  const ready = await ensure(line)
  if (!ready.ok) return reply({ message: dbMessage(ready) }, 502)
  const saved = await sb("/rest/v1/amc_entries?id=eq." + id + "&campaign_id=eq." + CAMPAIGN, { method: "PATCH", body: line })
  if (!saved.ok) return reply({ message: dbMessage(saved) }, 502)
  return reply({ ok: true }, 200)
}

export async function DELETE(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (!canWrite(session.role)) return reply({ message: "Cette session ne peut pas supprimer." }, 403)
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!id) return reply({ message: "Saisie introuvable." }, 400)
  const current = await storedItem(id)
  if (current.error) return reply({ message: current.error }, 502)
  if (current.missing) return reply({ message: "Saisie introuvable." }, 404)
  if (!itemAllowed(session.email, current.item)) return reply({ message: "Cet article n'est pas ouvert pour cette session." }, 403)
  const saved = await sb("/rest/v1/amc_entries?id=eq." + id + "&campaign_id=eq." + CAMPAIGN, { method: "DELETE", prefer: "return=minimal" })
  if (!saved.ok) return reply({ message: dbMessage(saved) }, 502)
  return reply({ ok: true }, 200)
}
