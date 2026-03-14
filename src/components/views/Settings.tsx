'use client'

import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { FormField, Input, Select, Textarea } from '../atoms/FormField'
import { useToast } from '../Toast'

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-moss' : 'bg-mist'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ── Setting row ───────────────────────────────────────────────────────────────

function SettingRow({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-mist/60 last:border-0 gap-6">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-forest">{label}</p>
        {description && <p className="text-xs text-fern/55 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

function SettingsCard({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="font-fraunces text-base font-semibold text-forest">{title}</h3>
        {subtitle && <p className="text-xs text-fern/55 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Settings view ─────────────────────────────────────────────────────────────

const NOTIF_DEFAULTS = {
  submissions: true,
  flaggedData: true,
  reportPublished: false,
  donorDisbursements: true,
  weeklyDigest: true,
  milestones: false,
}

const DATA_DEFAULTS = {
  anonymizeExports: true,
  require2FA: false,
  autoArchive: true,
  auditLog: true,
}

export function Settings() {
  const { success } = useToast()
  const [notif, setNotif] = useState(NOTIF_DEFAULTS)
  const [data,  setData]  = useState(DATA_DEFAULTS)
  const [orgName,    setOrgName]    = useState('OMANYE Field Office')
  const [country,    setCountry]    = useState('GH')
  const [currency,   setCurrency]   = useState('USD')
  const [fiscalYear, setFiscalYear] = useState('January')
  const [saved, setSaved] = useState(false)

  const saveAll = () => {
    setSaved(true)
    success('Settings saved', 'Your workspace preferences have been updated.')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-fraunces text-2xl font-semibold text-forest">Settings</h2>
        <p className="text-sm text-fern/60 mt-0.5">Manage your OMANYE workspace preferences</p>
      </div>

      {/* Workspace */}
      <SettingsCard title="Workspace" subtitle="General organisation settings">
        <div className="space-y-4">
          <FormField label="Organisation name" htmlFor="s-orgname">
            <Input id="s-orgname" value={orgName} onChange={e => setOrgName(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country" htmlFor="s-country">
              <Select id="s-country" value={country} onChange={e => setCountry(e.target.value)}
                options={[
                  { value: 'GH', label: 'Ghana' }, { value: 'NG', label: 'Nigeria' },
                  { value: 'KE', label: 'Kenya' }, { value: 'ET', label: 'Ethiopia' },
                ]} />
            </FormField>
            <FormField label="Currency" htmlFor="s-currency">
              <Select id="s-currency" value={currency} onChange={e => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($)' }, { value: 'GHS', label: 'GHS (₵)' },
                  { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' },
                ]} />
            </FormField>
          </div>
          <FormField label="Fiscal year start" htmlFor="s-fiscal">
            <Select id="s-fiscal" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
              options={['January','April','July','October'].map(m => ({ value: m, label: m }))} />
          </FormField>
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard title="Notifications" subtitle="Control what alerts you receive">
        <SettingRow label="Field submission alerts" description="Notify when new data is submitted">
          <Toggle checked={notif.submissions} onChange={v => setNotif(n => ({ ...n, submissions: v }))} />
        </SettingRow>
        <SettingRow label="Flagged data warnings" description="Alert when data quality issues are detected">
          <Toggle checked={notif.flaggedData} onChange={v => setNotif(n => ({ ...n, flaggedData: v }))} />
        </SettingRow>
        <SettingRow label="Report published" description="Notify team when reports are published">
          <Toggle checked={notif.reportPublished} onChange={v => setNotif(n => ({ ...n, reportPublished: v }))} />
        </SettingRow>
        <SettingRow label="Donor disbursements" description="Alert on new donor payments received">
          <Toggle checked={notif.donorDisbursements} onChange={v => setNotif(n => ({ ...n, donorDisbursements: v }))} />
        </SettingRow>
        <SettingRow label="Weekly digest" description="Summary email every Monday morning">
          <Toggle checked={notif.weeklyDigest} onChange={v => setNotif(n => ({ ...n, weeklyDigest: v }))} />
        </SettingRow>
        <SettingRow label="Program milestones" description="Notify when a program reaches key targets">
          <Toggle checked={notif.milestones} onChange={v => setNotif(n => ({ ...n, milestones: v }))} />
        </SettingRow>
      </SettingsCard>

      {/* Data & Privacy */}
      <SettingsCard title="Data & Privacy" subtitle="Manage beneficiary data handling and security">
        <SettingRow label="Anonymize beneficiary exports" description="Remove PII from all exported reports">
          <Toggle checked={data.anonymizeExports} onChange={v => setData(d => ({ ...d, anonymizeExports: v }))} />
        </SettingRow>
        <SettingRow label="Require 2FA for field officers" description="Enforce two-factor authentication on login">
          <Toggle checked={data.require2FA} onChange={v => setData(d => ({ ...d, require2FA: v }))} />
        </SettingRow>
        <SettingRow label="Auto-archive completed programs" description="Move closed programs to archive after 6 months">
          <Toggle checked={data.autoArchive} onChange={v => setData(d => ({ ...d, autoArchive: v }))} />
        </SettingRow>
        <SettingRow label="Enable audit log" description="Track all data changes for compliance">
          <Toggle checked={data.auditLog} onChange={v => setData(d => ({ ...d, auditLog: v }))} />
        </SettingRow>
      </SettingsCard>

      {/* Danger zone */}
      <SettingsCard title="Danger Zone" subtitle="Irreversible workspace actions">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-red-200 bg-red-50/30">
            <div>
              <p className="text-sm font-medium text-red-700">Export all workspace data</p>
              <p className="text-xs text-red-500/70 mt-0.5">Download a full archive of all programs, submissions, and documents.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex-shrink-0 ml-4">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-red-200 bg-red-50/30">
            <div>
              <p className="text-sm font-medium text-red-700">Delete workspace</p>
              <p className="text-xs text-red-500/70 mt-0.5">Permanently delete all data. This action cannot be undone.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors flex-shrink-0 ml-4">
              Delete
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <button onClick={saveAll}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
