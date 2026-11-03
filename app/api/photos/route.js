import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "amc-photos"
const ACCESS = [
  ["zouzou.douni@gmail.com", "Zineb Elagbi"],
  ["achetoukch96@gmail.com", "Chaimaa Achetouk"],
  ["bouchroub.a@gmail.com", "Ashraf"],
  ["yassirkrami01@gmail.com", "Yassir"],
  ["abassihamza14@gmail.com", "Hamza"],
  ["hassnaalachgar1995@gmail.com", "Hassnaa"],
  ["scaliougirl@gmail.com", "Bouchra"],
  ["s.safaasamih@gmail.com", "Safaa"],
  ["mohamedyahyajbir@gmail.com", "Yahya"],
  ["marouaabid1607@gmail.com", "Maroua"]
]
const LINKED = {
  "zouzou.douni@gmail.com": "B-zineb",
  "bouchroub.a@gmail.com": "E-ashraf",
  "yassirkrami01@gmail.com": "C-yassir",
  "abassihamza14@gmail.com": "B-hamza",
  "hassnaalachgar1995@gmail.com": "D-hasnaa",
  "s.safaasamih@gmail.com": "A-safaa",
  "mohamedyahyajbir@gmail.com": "A-yahya",
  "marouaabid1607@gmail.com": "C-maroua"
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

function fileOfEmail(email) {
  return String(email || "").toLowerCase().replace(/@/g, "_at_").replace(/\./g, "_") + ".jpg"
}

function knownEmail(email) {
  return ACCESS.some((row) => row[0] === email)
}

async function storage(path, options) {
  const env = supabase()
  if (!env) return { ok: false, status: 503, data: { message: "Base non reliée." } }
  const headers = {
    apikey: env.key,
    Authorization: "Bearer " + env.key,
    "User-Agent": "flow-amc-server"
  }
  if (options && options.type) headers["Content-Type"] = options.type
  if (options && options.upsert) headers["x-upsert"] = "true"
  const res = await fetch(env.url + "/storage/v1" + path, {
    method: (options && options.method) || "GET",
    headers,
    body: options && options.raw ? options.raw : options && options.body ? JSON.stringify(options.body) : undefined
  })
  const text = await res.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch (err) { data = { message: text.slice(0, 180) } }
  }
  return { ok: res.ok, status: res.status, data, url: env.url }
}

async function ensureBucket() {
  const made = await storage("/bucket", {
    method: "POST",
    type: "application/json",
    body: { id: BUCKET, name: BUCKET, public: true }
  })
  if (made.ok || made.status === 409 || made.status === 400) return { ok: true }
  return made
}

async function listed(prefix) {
  const found = await storage("/object/list/" + BUCKET, {
    method: "POST",
    type: "application/json",
    body: { prefix, limit: 200, offset: 0, sortBy: { column: "name", order: "asc" } }
  })
  if (!found.ok) return found
  const rows = Array.isArray(found.data) ? found.data : []
  const map = {}
  rows.forEach((row) => {
    if (!row || !row.name || row.id == null) return
    map[row.name] = row.updated_at || row.created_at || ""
  })
  return { ok: true, map, url: found.url }
}

function publicUrl(base, folder, file, version) {
  return base + "/storage/v1/object/public/" + BUCKET + "/" + folder + "/" + file + (version ? "?v=" + encodeURIComponent(version) : "")
}

export async function GET(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  const env = supabase()
  if (!env) return reply({ access: {}, members: {}, linked: LINKED }, 200)
  const pair = await Promise.all([listed("access/"), listed("member/")])
  const accessList = pair[0]
  const memberList = pair[1]
  const access = {}
  const members = {}
  if (accessList.ok) {
    ACCESS.forEach((row) => {
      const file = fileOfEmail(row[0])
      if (accessList.map[file]) access[row[0]] = publicUrl(env.url, "access", file, accessList.map[file])
    })
  }
  if (memberList.ok) {
    Object.keys(memberList.map).forEach((name) => {
      if (!/^[A-E]-[a-z0-9_]{2,40}\.jpg$/.test(name)) return
      members[name.slice(0, -4)] = publicUrl(env.url, "member", name, memberList.map[name])
    })
  }
  const body = { access, members, linked: LINKED }
  if (session.role === "admin") {
    body.accessList = ACCESS.map((row) => ({ email: row[0], name: row[1], photo: access[row[0]] || "" }))
  }
  return reply(body, 200)
}

export async function POST(req) {
  const session = sessionOf(req)
  if (!session) return reply({ message: "Connexion requise." }, 401)
  if (session.role !== "admin") return reply({ message: "Seuls les admins ajoutent une photo." }, 403)
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const kind = String(body.kind || "")
  const id = String(body.id || "").trim().toLowerCase()
  const match = String(body.data || "").match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return reply({ message: "Choisissez une photo." }, 400)
  const bytes = Buffer.from(match[1], "base64")
  if (bytes.length < 80 || bytes.length > 400000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return reply({ message: "La photo est trop lourde ou illisible." }, 400)
  }
  let path = ""
  let also = ""
  if (kind === "access") {
    if (!knownEmail(id)) return reply({ message: "Cet accès est inconnu." }, 400)
    path = "access/" + fileOfEmail(id)
    if (LINKED[id]) also = "member/" + LINKED[id] + ".jpg"
  } else if (kind === "member") {
    if (!/^[a-e]-[a-z0-9_]{2,40}$/.test(id)) return reply({ message: "Ce nom est inconnu." }, 400)
    path = "member/" + id.toUpperCase().slice(0, 1) + id.slice(1) + ".jpg"
  } else {
    return reply({ message: "Photo impossible à ranger." }, 400)
  }
  const ready = await ensureBucket()
  if (!ready.ok) return reply({ message: "Le stockage des photos n'est pas activé." }, 502)
  const saved = await storage("/object/" + BUCKET + "/" + path, {
    method: "POST",
    type: "image/jpeg",
    upsert: true,
    raw: bytes
  })
  if (!saved.ok) return reply({ message: "La photo n'a pas été enregistrée." }, 502)
  if (also) {
    await storage("/object/" + BUCKET + "/" + also, {
      method: "POST",
      type: "image/jpeg",
      upsert: true,
      raw: bytes
    })
  }
  return reply({ message: "Photo enregistrée." }, 200)
}
