'use client'

import React, { useState } from 'react'
import { UserPlus, Search, Mail } from 'lucide-react'
import { RoleBadge, StatusBadge } from '../atoms/Badge'
import { Avatar }    from '../atoms/Avatar'
import { useModal }  from '../Modal'
import { useToast }  from '../Toast'
import { FormField, Input, Select } from '../atoms/FormField'
import { TEAM }      from '@/lib/mock'
import { formatDate } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

const ROLE_OPTS: { value: UserRole; label: string }[] = [
  { value: 'admin',          label: 'Admin' },
  { value: 'coordinator',    label: 'Coordinator' },
  { value: 'field-officer',  label: 'Field Officer' },
  { value: 'm-and-e',        label: 'M&E Officer' },
  { value: 'viewer',         label: 'Viewer' },
]

function InviteForm({ onClose }: { onClose: () => void }) {
  const { success } = useToast()
  const [email, setEmail] = useState('')
  return (
    <div className="space-y-4">
      <FormField label="Email address" required htmlFor="inv-email">
        <Input id="inv-email" type="email" placeholder="colleague@organization.org"
          value={email} onChange={e => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Role" htmlFor="inv-role">
        <Select id="inv-role" options={ROLE_OPTS} placeholder="Select role…" />
      </FormField>
      <FormField label="Region" htmlFor="inv-region">
        <Select id="inv-region" options={[
          { value: 'Volta', label: 'Volta' }, { value: 'Northern', label: 'Northern' },
          { value: 'Ashanti', label: 'Ashanti' }, { value: 'Accra', label: 'Greater Accra' },
          { value: 'HQ', label: 'HQ / Accra' },
        ]} placeholder="Select region…" />
      </FormField>
      <div className="flex justify-end gap-2 pt-2 border-t border-mist">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-mist text-sm text-fern hover:bg-foam transition-colors">Cancel</button>
        <button onClick={() => { success('Invitation sent', `Invite sent to ${email || 'team member'}.`); onClose() }}
          className="px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
          Send Invite
        </button>
      </div>
    </div>
  )
}

export function Team() {
  const { open, close } = useModal()
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filtered = TEAM.filter(m => {
    const matchRole   = roleFilter === 'all' || m.role === roleFilter
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.region.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const roles = ['all', ...Array.from(new Set(TEAM.map(m => m.role)))]

  const ROLE_LABELS: Record<string, string> = {
    all:            'All',
    admin:          'Admin',
    coordinator:    'Coordinator',
    'field-officer':'Field Officer',
    'm-and-e':      'M&E',
    viewer:         'Viewer',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Team</h2>
          <p className="text-sm text-fern/60 mt-0.5">
            {TEAM.length} members · {TEAM.filter(t => t.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => open({ title: 'Invite Team Member', content: <InviteForm onClose={close} />, size: 'sm' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors"
        >
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none" />
          <input type="text" placeholder="Search team…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-mist bg-white text-forest placeholder:text-forest/35 focus:outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss w-52" />
        </div>
        <div className="flex gap-1 bg-foam rounded-lg p-1 border border-mist/60">
          {roles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                roleFilter === r ? 'bg-white text-forest shadow-sm' : 'text-fern/60 hover:text-fern'
              }`}>
              {ROLE_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist bg-snow">
                {['Member', 'Role', 'Region', 'Programs', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-mist/40 hover:bg-foam/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <p className="font-semibold text-forest">{m.name}</p>
                        <p className="text-xs text-fern/50">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge role={m.role} />
                  </td>
                  <td className="px-4 py-3.5 text-fern/70">{m.region}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-forest">{m.programs.length}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-fern/60">{formatDate(m.joinedAt)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="inline-flex items-center gap-1 text-xs text-fern hover:text-moss transition-colors">
                      <Mail size={11} /> Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
