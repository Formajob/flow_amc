import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PEOPLE = [
  { email: "zouzou.douni@gmail.com", name: "Zineb Elagbi", role: "admin", hash: "scrypt$UXxn-BYhhLbhkwaRvfSRWw$9Iw3TwPgyspjE69Gp9ZO-BJGQPNOpjZFA2MqKUdnxfw" },
  { email: "achetoukch96@gmail.com", name: "Chaimaa Achetouk", role: "admin", hash: "scrypt$nvmeBj6SRWvK7L9NcoG9fA$LTviEaJNAoEg0RP_PEmYPAcFhMQEhqbBcS3vlZ41ckE" },
  { email: "bouchroub.a@gmail.com", name: "Ashraf", role: "membre", hash: "scrypt$rbHEaQbPd_pZ4E1WF89Qig$zj6T8h843I2pmIFFFL0dsA4nSn2WkE2XwRYJPAhjy8Q" },
  { email: "yassirkrami01@gmail.com", name: "Yassir", role: "membre", hash: "scrypt$zNXOF30NN_WG2Q_aXFXn_A$w46XL7pAfe6NNmIxKRPMbDET2kf2sVgVOMb4GtDQaNQ" },
  { email: "abassihamza14@gmail.com", name: "Hamza", role: "membre", hash: "scrypt$SAhm9gex49Xv2kRj9u8lVw$3lfdEmBjqVnUREo9v45P7MNxzcTfI0kx13I0cp8szLE" },
  { email: "hassnaalachgar1995@gmail.com", name: "Hassnaa", role: "membre", hash: "scrypt$i43k6ZYUmTvWbaQ-tKd8qA$7lB8InV6adhf07muehPDv_E_NiLHnKaBDYFHFQ5LLRE" },
  { email: "scaliougirl@gmail.com", name: "Bouchra", role: "membre", hash: "scrypt$bohPsCkB-l6XRXjQktBfGA$N3olTTYxHioyEnAI-WGHhUZPvuBQRGhX2NJw6v6nD2Q" },
  { email: "s.safaasamih@gmail.com", name: "Safaa", role: "membre", hash: "scrypt$zYX_zQy7mlqQ-5yDfVKEiA$ihQnwJSdIxLlU_YrVO5GlxsiVF_uT53puB6tkYM76ds" },
  { email: "mohamedyahyajbir@gmail.com", name: "Yahya", role: "saisie", hash: "scrypt$TKubEubWYe_pKZvYEIEmtA$Rl57aOaedqIwN5bI7ZXx-uQ6FPAYqDYRPovl4MNm3eE" }
]

function pagesFor(role) {
  if (role === "saisie") return ["collecte.html", "communiques.html"]
  return ["index.html", "collecte.html", "preparation.html", "transport.html", "distribution.html", "classement.html", "communiques.html"]
}

function checkPassword(password, stored) {
  const parts = String(stored || "").split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  if (!password || String(password).length < 8) return false
  try {
    const got = crypto.scryptSync(String(password), parts[1], 32)
    const exp = Buffer.from(parts[2], "base64url")
    return got.length === exp.length && crypto.timingSafeEqual(got, exp)
  } catch (err) {
    return false
  }
}

function secret() {
  const value = String(process.env.AMC_SESSION_SECRET || "")
  return value.length >= 16 ? value : "amc-localhost-session-2026"
}

function sign(data) {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url")
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url")
  return body + "." + sig
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

function cookieValue(req) {
  const raw = req.headers.get("cookie") || ""
  const item = raw.split(";").map((s) => s.trim()).find((s) => s.indexOf("amc_session=") === 0)
  if (!item) return ""
  try { return decodeURIComponent(item.slice("amc_session=".length)) } catch (err) { return "" }
}

function setCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return "amc_session=" + encodeURIComponent(token) + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200" + secure
}

function clearCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return "amc_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" + secure
}

function reply(body, status, cookie) {
  const res = NextResponse.json(body, { status })
  res.headers.set("Cache-Control", "no-store")
  if (cookie) res.headers.set("Set-Cookie", cookie)
  return res
}

export async function GET(req) {
  const data = readToken(cookieValue(req))
  if (!data) return reply({ message: "Connexion requise." }, 401)
  return reply({ email: data.email, name: data.name, role: data.role, pages: data.pages }, 200)
}

export async function DELETE() {
  return reply({ ok: true }, 200, clearCookie())
}

export async function POST(req) {
  let body = {}
  try { body = await req.json() } catch (err) { body = {} }
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const person = PEOPLE.find((p) => p.email === email)
  if (!person || !checkPassword(password, person.hash)) {
    return reply({ message: "Accès refusé." }, 401)
  }
  const role = person.role
  const data = { email, name: person.name, role, pages: pagesFor(role), exp: Date.now() + 12 * 60 * 60 * 1000 }
  return reply({ email, name: person.name, role, pages: data.pages }, 200, setCookie(sign(data)))
}