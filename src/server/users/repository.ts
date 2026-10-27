import '@tanstack/react-start/server-only'
import { and, asc, count, eq } from 'drizzle-orm'
import { parsePermissions, parseRole } from '~/lib/permissions'
import type { Permission, Role } from '~/lib/permissions'
import { getDb } from '~/server/db/client'
import { user } from '~/server/db/schema'

export interface AccountRow {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
  banned: boolean
  createdAt: Date
}

const columns = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: user.permissions,
  banned: user.banned,
  createdAt: user.createdAt,
}

function toAccount(row: { role: string; permissions: string[] } & Omit<AccountRow, 'role' | 'permissions'>): AccountRow {
  return { ...row, role: parseRole(row.role), permissions: parsePermissions(row.permissions) }
}

export async function listAccounts(): Promise<AccountRow[]> {
  const rows = await getDb().select(columns).from(user).orderBy(asc(user.createdAt))
  return rows.map(toAccount)
}

export async function getAccount(id: string): Promise<AccountRow | null> {
  const [row] = await getDb().select(columns).from(user).where(eq(user.id, id))
  return row ? toAccount(row) : null
}

export async function countActiveAdmins(): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(user)
    .where(and(eq(user.role, 'admin'), eq(user.banned, false)))
  return row?.n ?? 0
}

/** Admins keep no module list: they can use everything anyway. */
export async function updateAccount(id: string, input: { name: string; role: Role; permissions: Permission[] }) {
  const [row] = await getDb()
    .update(user)
    .set({
      name: input.name,
      role: input.role,
      permissions: input.role === 'admin' ? [] : input.permissions,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))
    .returning(columns)
  return row ? toAccount(row) : null
}

/** Id → name of every account, for "created by" and "edited by" labels. Names only, never emails. */
export async function listAccountNames(): Promise<{ id: string; name: string }[]> {
  return getDb().select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name))
}
