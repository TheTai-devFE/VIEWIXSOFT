import { useRouter } from '@tanstack/react-router'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { buttonPrimary, buttonSecondary, Panel, SaveStatus } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { FooterSettings } from '~/lib/admin-schemas'
import { resetFooterSettingsFn, saveFooterSettingsFn } from '~/server/functions/site-admin'

interface Props {
  initial: FooterSettings
}

export function FooterEditor({ initial }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [data, setData] = useState<FooterSettings>(initial)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const [resetState, setResetState] = useState<SaveState>({ kind: 'idle' })

  const handleLegalChange = (field: keyof FooterSettings['legalEntity'], val: string) => {
    setData((prev) => ({
      ...prev,
      legalEntity: {
        ...prev.legalEntity,
        [field]: val,
      },
    }))
  }

  const handleAddressLineChange = (index: number, val: string) => {
    setData((prev) => {
      const nextLines = [...prev.legalEntity.addressLines]
      nextLines[index] = val
      return {
        ...prev,
        legalEntity: {
          ...prev.legalEntity,
          addressLines: nextLines,
        },
      }
    })
  }

  const addAddressLine = () => {
    setData((prev) => ({
      ...prev,
      legalEntity: {
        ...prev.legalEntity,
        addressLines: [...prev.legalEntity.addressLines, ''],
      },
    }))
  }

  const removeAddressLine = (index: number) => {
    setData((prev) => {
      const nextLines = prev.legalEntity.addressLines.filter((_, i) => i !== index)
      return {
        ...prev,
        legalEntity: {
          ...prev.legalEntity,
          addressLines: nextLines.length > 0 ? nextLines : [''],
        },
      }
    })
  }

  const handleContactChange = (index: number, field: 'department' | 'email' | 'phone', val: string) => {
    setData((prev) => {
      const nextContacts = [...prev.contacts]
      const current = nextContacts[index]
      if (current) {
        nextContacts[index] = { ...current, [field]: val }
      }
      return { ...prev, contacts: nextContacts }
    })
  }

  const addContact = () => {
    setData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { department: '', email: '', phone: '' }],
    }))
  }

  const removeContact = (index: number) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }))
  }

  const handleSocialUrlChange = (network: string, val: string) => {
    setData((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.network === network ? { ...s, url: val } : s)),
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ kind: 'saving' })
    try {
      // Clean up empty lines from addressLines
      const cleanedData: FooterSettings = {
        ...data,
        legalEntity: {
          ...data.legalEntity,
          addressLines: data.legalEntity.addressLines.filter((l) => l.trim().length > 0),
        },
        contacts: data.contacts.filter((c) => c.department.trim().length > 0 || c.email.trim().length > 0),
      }

      if (cleanedData.legalEntity.addressLines.length === 0) {
        setState({ kind: 'error', message: 'Please enter at least one address line.' })
        return
      }

      const res = await saveFooterSettingsFn({ data: cleanedData })
      if (!res.ok) {
        setState({ kind: 'error', message: res.error })
        return
      }
      setState({ kind: 'saved' })
      await router.invalidate()
    } catch {
      setState({ kind: 'error', message: 'Saving failed. Please check your network connection.' })
    }
  }

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Khôi phục footer mặc định?',
      description: 'Toàn bộ thông tin footer quay về cấu hình gốc trong src/data/footer.ts. Những gì đã sửa ở đây sẽ mất.',
      confirmText: 'Khôi phục',
      tone: 'danger',
    })
    if (!confirmed) return
    setResetState({ kind: 'saving' })
    try {
      const res = await resetFooterSettingsFn()
      if (!res.ok) {
        setResetState({ kind: 'error', message: res.error })
        return
      }
      setResetState({ kind: 'saved' })
      await router.invalidate()
      window.location.reload()
    } catch {
      setResetState({ kind: 'error', message: 'Reset failed. Please check connection.' })
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* 1. Legal Entity & Address */}
      <Panel
        title="Company & Legal Entity"
        description="Official registered business entity details displayed in the footer."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="legal-name">Legal company name</Label>
            <Input
              id="legal-name"
              value={data.legalEntity.name}
              onChange={(e) => handleLegalChange('name', e.target.value)}
              placeholder="e.g. Shenzhen Viewix Electronic Technology Co., Limited"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="legal-registration">Business Registration No. / Tax ID</Label>
            <Input
              id="legal-registration"
              value={data.legalEntity.businessRegistrationNo}
              onChange={(e) => handleLegalChange('businessRegistrationNo', e.target.value)}
              placeholder="e.g. 80978409-000-08-26-2"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="legal-hotline">Hotline / Phone (optional)</Label>
            <Input
              id="legal-hotline"
              value={data.legalEntity.hotline ?? ''}
              onChange={(e) => handleLegalChange('hotline', e.target.value)}
              placeholder="e.g. +84 (0) 28 1234 5678"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Registered business address lines</Label>
            <button
              type="button"
              onClick={addAddressLine}
              className="inline-flex items-center gap-1 text-xs text-signal-400 hover:text-signal-300"
            >
              <Plus className="size-3.5" />
              Add line
            </button>
          </div>
          {data.legalEntity.addressLines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={line}
                onChange={(e) => handleAddressLineChange(idx, e.target.value)}
                placeholder={`Address line ${idx + 1}`}
                required={idx === 0}
              />
              {data.legalEntity.addressLines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddressLine(idx)}
                  className="rounded-md p-2 text-ink-400 hover:text-destructive hover:bg-ink-800"
                  aria-label={`Remove address line ${idx + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* 2. Department Contacts */}
      <Panel
        title="Department Contacts"
        description="Public contact emails and phone numbers shown in the Contact section of the footer."
      >
        <div className="space-y-4">
          {data.contacts.map((contact, idx) => (
            <div
              key={idx}
              className="grid items-end gap-3 rounded-xl border border-ink-800 bg-ink-950 p-4 sm:grid-cols-[1fr_1.5fr_1fr_auto]"
            >
              <div className="space-y-1">
                <Label htmlFor={`contact-dept-${idx}`}>Department</Label>
                <Input
                  id={`contact-dept-${idx}`}
                  value={contact.department}
                  onChange={(e) => handleContactChange(idx, 'department', e.target.value)}
                  placeholder="e.g. Sales, Support"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`contact-email-${idx}`}>Email</Label>
                <Input
                  id={`contact-email-${idx}`}
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                  placeholder="email@viewix.hk"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`contact-phone-${idx}`}>Phone (optional)</Label>
                <Input
                  id={`contact-phone-${idx}`}
                  value={contact.phone ?? ''}
                  onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                  placeholder="+84 901 234 567"
                />
              </div>

              <button
                type="button"
                onClick={() => removeContact(idx)}
                className="rounded-md p-2 text-ink-400 hover:text-destructive hover:bg-ink-800"
                aria-label={`Remove contact ${contact.department || idx + 1}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addContact}
            className="inline-flex items-center gap-1.5 text-sm text-signal-400 hover:text-signal-300"
          >
            <Plus className="size-4" />
            Add new contact department
          </button>
        </div>
      </Panel>

      {/* 3. Social Media Links */}
      <Panel
        title="Social Media Links"
        description="Leave URL blank if you do not want an icon to show up on the production footer."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {data.socials.map((s) => (
            <div key={s.network} className="space-y-1.5">
              <Label htmlFor={`social-${s.network}`} className="capitalize">
                {s.label} URL
              </Label>
              <Input
                id={`social-${s.network}`}
                value={s.url}
                onChange={(e) => handleSocialUrlChange(s.network, e.target.value)}
                placeholder={`https://${s.network}.com/...`}
              />
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Copyright */}
      <Panel
        title="Copyright Notice"
        description="The bottom copyright text line shown across the entire website."
      >
        <div className="space-y-1.5">
          <Label htmlFor="copyright-text">Copyright line</Label>
          <Input
            id="copyright-text"
            value={data.copyright}
            onChange={(e) => setData((prev) => ({ ...prev, copyright: e.target.value }))}
            placeholder="© 2026 Viewixsoft. All rights reserved."
            required
          />
        </div>
      </Panel>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={state.kind === 'saving'}
            className={buttonPrimary}
          >
            {state.kind === 'saving' ? 'Saving…' : 'Save footer changes'}
          </button>
          <SaveStatus state={state} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetState.kind === 'saving'}
            className={buttonSecondary}
          >
            <RotateCcw className="size-3.5" />
            Reset to defaults
          </button>
          <SaveStatus state={resetState} />
        </div>
      </div>
    </form>
  )
}
