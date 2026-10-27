// Creates an admin account for /admin, or resets an existing account's password
// and makes it an unlocked admin. Other accounts are managed in /admin/users.
//
//   node --env-file=.env scripts/create-admin.mjs admin@example.com
//
// The password is read from ADMIN_PASSWORD or prompted for, never passed as an
// argument (it would land in shell history).
import { createInterface } from 'node:readline/promises'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from 'better-auth/crypto'

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
if (!email.includes('@')) {
  console.error('Usage: node --env-file=.env scripts/create-admin.mjs <email>')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

let password = process.env.ADMIN_PASSWORD
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  password = await rl.question('Password (min 12 characters): ')
  rl.close()
}
if (!password || password.length < 12) {
  console.error('Password must be at least 12 characters.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const hash = await hashPassword(password)
const now = new Date()

const existing = await sql.query('select id from "user" where email = $1', [email])
const userId = existing[0]?.id ?? randomUUID()
if (!existing[0]) {
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, created_at, updated_at) values ($1, $2, $3, true, 'admin', $4, $4)`,
    [userId, email.split('@')[0], email, now],
  )
} else {
  // Running the script on an existing account makes it a working admin again (e.g. after a lock-out).
  await sql.query(`update "user" set role = 'admin', banned = false, ban_reason = null, ban_expires = null, updated_at = $1 where id = $2`, [now, userId])
}
const updated = await sql.query(
  `update account set password = $1, updated_at = $2 where user_id = $3 and provider_id = 'credential' returning id`,
  [hash, now, userId],
)
if (!updated[0]) {
  await sql.query(
    `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values ($1, $2, 'credential', $2, $3, $4, $4)`,
    [randomUUID(), userId, hash, now],
  )
}
console.log(`${existing[0] ? 'Updated' : 'Created'} admin ${email}`)
