import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { generateMetaTags } from '~/lib/seo/meta'
import { getLeadsFn, updateLeadStatusFn } from '~/server/functions/admin'
import { LEAD_STATUSES } from '~/lib/enums'
import type { Lead } from '~/server/db/schema'

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @) in visitor-supplied text. */
function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}
import { 
  Search, Download, Filter, RefreshCw, X, ChevronLeft, 
  ChevronRight, ArrowUpDown, CheckCircle2, Shield, Calendar 
} from 'lucide-react'

export const Route = createFileRoute('/admin/leads')({
  loader: async () => {
    const res = await getLeadsFn()
    return { initialLeads: res.leads, loadFailed: !res.ok }
  },
  head: () => {
    const seo = generateMetaTags({
      title: 'Admin Portal — Lead Management Dashboard',
      description: 'Internal lead pipeline management for Viewixsoft sales.',
      noindex: true,
      canonicalUrl: '/admin/leads',
    })
    return {
      meta: seo.meta,
      links: seo.links,
    }
  },
  component: AdminLeadsPage,
})

function AdminLeadsPage() {
  const { initialLeads, loadFailed } = Route.useLoaderData()
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerNotes, setDrawerNotes] = useState('')
  const [drawerStatus, setDrawerStatus] = useState('new')
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Filtered and searched leads
  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      const matchSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.company.toLowerCase().includes(search.toLowerCase()) ||
        lead.country.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchType = typeFilter === 'all' || lead.type === typeFilter

      return matchSearch && matchStatus && matchType
    })
  }, [leadsList, search, statusFilter, typeFilter])

  // Open drawer for lead details
  const handleOpenDrawer = (lead: Lead) => {
    setSelectedLead(lead)
    setDrawerStatus(lead.status)
    setDrawerNotes(lead.notes || '')
  }

  // Update status and notes
  const handleSaveStatus = async () => {
    if (!selectedLead) return
    setIsUpdating(true)
    setSaveError('')
    try {
      const res = await updateLeadStatusFn({
        data: {
          leadId: selectedLead.id,
          status: LEAD_STATUSES.find((st) => st === drawerStatus) ?? 'new',
          notes: drawerNotes,
        },
      })
      if (res.ok) {
        const updated = res.lead
        setLeadsList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setSelectedLead(updated)
      } else {
        setSaveError('This lead no longer exists. Refresh the list.')
      }
    } catch {
      setSaveError('Saving failed. Check your connection and try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['ID', 'Type', 'Name', 'Email', 'Company', 'Country', 'Screens', 'Status', 'UTM Source', 'Created At']
    const rows = filteredLeads.map((l) => [
      l.id,
      l.type,
      l.name,
      l.email,
      l.company,
      l.country,
      l.screenCount || 'N/A',
      l.status,
      l.utmSource || '',
      new Date(l.createdAt).toISOString(),
    ])

    const csvContent = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `viewixsoft-leads-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-signal-950 border border-signal-800 text-signal-400">new</span>
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-signal-950 border border-signal-800 text-signal-400">contacted</span>
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">qualified</span>
      case 'won':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-signal-950 border border-signal-800 text-signal-300 font-black">won</span>
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-ink-900 border border-ink-700 text-ink-400">lost</span>
      case 'spam':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-red-950 border border-red-800 text-red-400">spam</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-ink-900 text-ink-300">{status}</span>
    }
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {loadFailed && (
        <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
          Leads could not be loaded. Check DATABASE_URL and the server logs.
        </p>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-signal-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Authenticated Admin Console
          </div>
          <h1 className="text-3xl font-black text-ink-50 mt-1">Lead Management Dashboard</h1>
          <p className="text-xs text-ink-400">
            Total Captured Leads: {leadsList.length} • Filtered: {filteredLeads.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-900 hover:bg-ink-800 border border-ink-700 text-xs font-bold text-ink-50 uppercase tracking-wider transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-signal-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl panel border border-ink-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-ink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, contact name, email, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-ink-900 border border-ink-700 text-xs text-ink-50 placeholder-ink-500 focus:outline-none focus:border-signal-400"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-ink-700 text-xs text-ink-50 focus:outline-none focus:border-signal-400"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="spam">Spam</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-ink-700 text-xs text-ink-50 focus:outline-none focus:border-signal-400"
          >
            <option value="all">All Submission Types</option>
            <option value="demo">Demo Request</option>
            <option value="contact">Contact Enquiry</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl panel border border-ink-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-ink-900/90 border-b border-ink-800 text-ink-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Contact & Company</th>
                <th className="py-3.5 px-4">Products / Screens</th>
                <th className="py-3.5 px-4">Country</th>
                <th className="py-3.5 px-4">Acquisition (UTM)</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-ink-500">
                    No leads matching your current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-ink-900/60 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDrawer(lead)}
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-ink-50 text-sm group-hover:text-signal-400 transition-colors">
                        {lead.name}
                      </div>
                      <div className="text-ink-400 text-xs">{lead.company} {lead.jobTitle ? `• ${lead.jobTitle}` : ''}</div>
                      <div className="text-ink-500 text-[11px] font-mono">{lead.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-ink-50 font-medium">
                        {lead.products && lead.products.length > 0
                          ? lead.products.map(p => p.replace('Viewixsoft ', '')).join(', ')
                          : 'General'}
                      </div>
                      <div className="text-signal-400/80 font-mono text-[11px]">
                        {lead.screenCount || 'Fleet unspecified'}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-ink-300">
                      {lead.country}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-ink-400">
                      <div>{lead.utmSource ? `src: ${lead.utmSource}` : 'direct'}</div>
                      <div className="text-ink-500">{lead.utmCampaign ? `cmp: ${lead.utmCampaign}` : ''}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-ink-400 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDrawer(lead)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-signal-500 hover:text-ink-950 text-ink-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-ink-950 border-l border-ink-800 p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-signal-400">Lead Record #{selectedLead.id.slice(0, 8)}</span>
                  <h2 className="text-2xl font-bold text-ink-50">{selectedLead.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-lg text-ink-400 hover:text-ink-50 hover:bg-ink-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Update Select */}
              <div className="p-4 rounded-xl bg-ink-900/90 border border-ink-800 space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-ink-400 font-semibold">
                  Update Lead Pipeline Status:
                </label>
                <div className="flex gap-2">
                  <select
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-ink-950 border border-ink-700 text-xs text-ink-50 font-semibold focus:outline-none focus:border-signal-400"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="won">Won (Deal Closed)</option>
                    <option value="lost">Lost</option>
                    <option value="spam">Mark as Spam</option>
                  </select>
                  <button
                    onClick={handleSaveStatus}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-lg bg-signal-500 hover:bg-brand-gradient text-on-gradient font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {saveError && (
                  <p role="alert" className="text-xs text-destructive">
                    {saveError}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-ink-400 font-semibold">
                  Account Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-ink-900/50 border border-ink-850">
                    <span className="text-ink-500 block">Company:</span>
                    <span className="text-ink-50 font-semibold">{selectedLead.company}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-900/50 border border-ink-850">
                    <span className="text-ink-500 block">Email:</span>
                    <a href={`mailto:${selectedLead.email}`} className="text-signal-400 underline font-mono">
                      {selectedLead.email}
                    </a>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-900/50 border border-ink-850">
                    <span className="text-ink-500 block">Phone:</span>
                    <span className="text-ink-50 font-mono">{selectedLead.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-900/50 border border-ink-850">
                    <span className="text-ink-500 block">Country:</span>
                    <span className="text-ink-50 font-semibold">{selectedLead.country}</span>
                  </div>
                </div>
              </div>

              {/* Requirement Message */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-ink-400 font-semibold">
                  Client Message & Fleet Specs
                </h3>
                <div className="p-4 rounded-xl bg-ink-900/70 border border-ink-800 text-ink-300 text-xs leading-relaxed">
                  {selectedLead.message}
                </div>
              </div>

              {/* Internal Sales Notes */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-ink-400 font-semibold">
                  Internal Sales Notes
                </h3>
                <textarea
                  rows={3}
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  placeholder="Add notes from customer discovery call or deal next steps..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-ink-700 text-xs text-ink-50 focus:outline-none focus:border-signal-400"
                />
              </div>

              {/* Attribution and Technical Metadata */}
              <div className="p-4 rounded-xl bg-ink-900/40 border border-ink-850 space-y-1.5 text-[11px] font-mono text-ink-400">
                <div>IP Hash: <span className="text-ink-300">{selectedLead.ipHash}</span></div>
                <div>Referrer: <span className="text-ink-300">{selectedLead.referrer || 'Direct'}</span></div>
                <div>Landing Page: <span className="text-ink-300">{selectedLead.landingPage || '/'}</span></div>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-800 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-50 text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
