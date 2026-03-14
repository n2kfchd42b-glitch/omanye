import React from 'react'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'

export const metadata = { title: 'Settings' }

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-mist/60 last:border-0">
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-sm font-medium text-forest">{label}</p>
        {description && <p className="text-xs text-fern/50 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <div
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer ${
        defaultChecked ? 'bg-moss' : 'bg-mist'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          defaultChecked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure your OMANYE workspace</p>
      </div>

      <div className="space-y-5">
        {/* Workspace */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workspace</CardTitle>
              <CardSubtitle>General organization settings</CardSubtitle>
            </div>
          </CardHeader>
          <SettingRow label="Organization Name" description="Displayed across all reports and exports">
            <input defaultValue="OMANYE Field Office" className="input w-56 text-xs py-1.5" />
          </SettingRow>
          <SettingRow label="Country of Operation" description="Primary operating country">
            <select className="select w-40 text-xs py-1.5">
              <option>Ghana</option>
              <option>Nigeria</option>
              <option>Kenya</option>
              <option>Ethiopia</option>
            </select>
          </SettingRow>
          <SettingRow label="Fiscal Year Start">
            <select className="select w-40 text-xs py-1.5">
              <option>January</option>
              <option>April</option>
              <option>July</option>
              <option>October</option>
            </select>
          </SettingRow>
          <SettingRow label="Default Currency">
            <select className="select w-32 text-xs py-1.5">
              <option>USD</option>
              <option>GHS</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </SettingRow>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardSubtitle>Control what alerts you receive</CardSubtitle>
            </div>
          </CardHeader>
          <SettingRow label="Field submission alerts" description="Notify when new data is submitted">
            <Toggle defaultChecked />
          </SettingRow>
          <SettingRow label="Flagged data warnings" description="Alert on data quality issues">
            <Toggle defaultChecked />
          </SettingRow>
          <SettingRow label="Report published" description="Notify team when reports are published">
            <Toggle />
          </SettingRow>
          <SettingRow label="Donor disbursements" description="Alert on new donor payments received">
            <Toggle defaultChecked />
          </SettingRow>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Data & Privacy</CardTitle>
              <CardSubtitle>Manage beneficiary data handling</CardSubtitle>
            </div>
          </CardHeader>
          <SettingRow label="Anonymize beneficiary exports" description="Remove PII from exported reports">
            <Toggle defaultChecked />
          </SettingRow>
          <SettingRow label="Require 2FA for field officers" description="Enforce two-factor authentication">
            <Toggle />
          </SettingRow>
          <SettingRow label="Auto-archive completed projects" description="Move closed projects after 6 months">
            <Toggle defaultChecked />
          </SettingRow>
        </Card>

        {/* Save */}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary text-sm">Cancel</button>
          <button className="btn-primary text-sm">Save Changes</button>
        </div>
      </div>
    </div>
  )
}
