'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Plus, Save, Trash2, ToggleLeft, ToggleRight,
  Settings, Palette, Eye, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import type { ReportTemplate, TemplateSection, DetailLevel } from '@/types/report-templates'
import { defaultSections } from '@/types/report-templates'
import { REPORT_TYPES, REPORT_TYPE_LABELS, SECTION_LABELS, SECTION_DESCRIPTIONS } from '@/types/reports'
import type { ReportType } from '@/types/reports'

interface Props {
  orgSlug:           string
  organizationId:    string
  donor:             { id: string; full_name: string | null; email: string; organization_name: string | null }
  existingTemplates: ReportTemplate[]
}

const DETAIL_LEVEL_LABELS: Record<DetailLevel, string> = {
  summary:  'Summary',
  standard: 'Standard',
  detailed: 'Detailed',
}

const DETAIL_LEVEL_DESCRIPTIONS: Record<DetailLevel, string> = {
  summary:  'Headline figures + 2-sentence narrative',
  standard: 'Full section as normally generated',
  detailed: 'Standard + raw data tables',
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TemplateBuilderClient({
  orgSlug, donor, existingTemplates,
}: Props) {
  const router         = useRouter()
  const [, startTransition] = useTransition()

  // Index templates by report_type for quick lookup
  const templatesByType = React.useMemo(() => {
    const map: Record<string, { donor?: ReportTemplate; org?: ReportTemplate }> = {}
    for (const t of existingTemplates) {
      if (t.donor_id === donor.id) {
        map[t.report_type] = { ...map[t.report_type], donor: t }
      } else if (t.donor_id === null) {
        map[t.report_type] = { ...map[t.report_type], org: t }
      }
    }
    return map
  }, [existingTemplates, donor.id])

  const [activeType, setActiveType] = useState<ReportType>('PROGRESS')
  const entry    = templatesByType[activeType]
  const donorTpl = entry?.donor ?? null
  const orgTpl   = entry?.org   ?? null

  // Active editing state: start from donor template, fall back to org template, fall back to defaults
  const [sections, setSections] = useState<TemplateSection[]>(() =>
    (donorTpl ?? orgTpl)?.sections ?? defaultSections()
  )
  const [branding, setBranding] = useState<{ primary_color: string; accent_color: string; logo_url: string }>(() => ({
    primary_color: (donorTpl ?? orgTpl)?.branding?.primary_color ?? '#0F1B33',
    accent_color:  (donorTpl ?? orgTpl)?.branding?.accent_color  ?? '#D4AF5C',
    logo_url:      (donorTpl ?? orgTpl)?.branding?.logo_url       ?? '',
  }))
  const [templateName, setTemplateName] = useState(
    donorTpl?.template_name ?? `${REPORT_TYPE_LABELS[activeType]} — ${donor.full_name ?? donor.email}`
  )
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [saved, setSaved]             = useState(false)
  const [activeTab, setActiveTab]     = useState<'sections' | 'branding'>('sections')
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null)

  // When report type changes, reload editing state from matching template
  function switchType(rt: ReportType) {
    setActiveType(rt)
    const e   = templatesByType[rt]
    const tpl = e?.donor ?? e?.org ?? null
    setSections(tpl?.sections ?? defaultSections())
    setBranding({
      primary_color: tpl?.branding?.primary_color ?? '#0F1B33',
      accent_color:  tpl?.branding?.accent_color  ?? '#D4AF5C',
      logo_url:      tpl?.branding?.logo_url       ?? '',
    })
    setTemplateName(
      e?.donor?.template_name ?? `${REPORT_TYPE_LABELS[rt]} — ${donor.full_name ?? donor.email}`
    )
    setSaved(false)
  }

  function toggleSection(key: string) {
    setSections(prev => prev.map(s =>
      s.section_key === key ? { ...s, included: !s.included } : s
    ))
    setSaved(false)
  }

  function setDetailLevel(key: string, level: DetailLevel) {
    setSections(prev => prev.map(s =>
      s.section_key === key ? { ...s, detail_level: level } : s
    ))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const payload = {
        donor_id:      donor.id,
        template_name: templateName,
        report_type:   activeType,
        sections,
        branding: {
          primary_color: branding.primary_color || undefined,
          accent_color:  branding.accent_color  || undefined,
          logo_url:      branding.logo_url       || undefined,
        },
      }

      if (donorTpl) {
        // Update existing donor template
        await fetch(`/api/report-templates/${donorTpl.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new donor-specific template
        await fetch('/api/report-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setSaved(true)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!donorTpl) return
    setDeleting(true)
    try {
      await fetch(`/api/report-templates/${donorTpl.id}`, { method: 'DELETE' })
      startTransition(() => router.refresh())
    } finally {
      setDeleting(false)
    }
  }

  const donorLabel = donor.full_name ?? donor.email

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Header */}
      <div style={{ background: COLORS.forest, padding: '0 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 22, paddingBottom: 22 }}>
          <button
            onClick={() => router.push(`/org/${orgSlug}/donors`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', background: 'none', border: 'none', marginBottom: 14 }}
          >
            <ArrowLeft size={13} /> Back to Donors
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color={COLORS.gold} />
                <h1 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                  Report Templates
                </h1>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                {donorLabel}{donor.organization_name ? ` · ${donor.organization_name}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {donorTpl && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px',
                    background: 'rgba(239,68,68,0.15)', color: '#F87171',
                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  <Trash2 size={12} /> {deleting ? 'Deleting…' : 'Reset to Default'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px',
                  background: saved ? '#38A169' : COLORS.gold,
                  color: saved ? '#fff' : COLORS.forest,
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, transition: 'background 0.2s, color 0.2s',
                }}
              >
                {saving ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 32px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        {/* Report type sidebar */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Report Type
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {REPORT_TYPES.map(rt => {
              const hasDonorTpl = !!templatesByType[rt]?.donor
              return (
                <button
                  key={rt}
                  onClick={() => switchType(rt)}
                  style={{
                    padding: '9px 12px', borderRadius: 8, textAlign: 'left',
                    background: activeType === rt ? COLORS.forest : 'transparent',
                    color: activeType === rt ? '#fff' : COLORS.charcoal,
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{REPORT_TYPE_LABELS[rt]}</span>
                  {hasDonorTpl && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: activeType === rt ? COLORS.gold : COLORS.fern,
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 12, lineHeight: 1.5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.fern, display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
            = custom template saved
          </p>
        </div>

        {/* Editor */}
        <div>
          {/* Template name */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Template Name
            </label>
            <input
              value={templateName}
              onChange={e => { setTemplateName(e.target.value); setSaved(false) }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 7, fontSize: 13,
                border: `1px solid ${COLORS.mist}`, background: COLORS.snow,
                color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box',
              }}
            />
            {orgTpl && !donorTpl && (
              <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 6 }}>
                Inheriting from org default: <em>{orgTpl.template_name}</em>. Save to create a donor-specific override.
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
            {([
              { id: 'sections', label: 'Sections', icon: <Settings size={13} /> },
              { id: 'branding', label: 'Branding', icon: <Palette size={13} /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? COLORS.forest : COLORS.foam,
                  color: activeTab === tab.id ? '#fff' : COLORS.slate,
                  border: 'none', cursor: 'pointer',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Sections tab */}
          {activeTab === 'sections' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {sections.map((sec, i) => (
                <div
                  key={sec.section_key}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < sections.length - 1 ? `1px solid ${COLORS.mist}` : 'none',
                    background: sec.included ? '#fff' : COLORS.snow,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleSection(sec.section_key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 2 }}
                    >
                      {sec.included
                        ? <ToggleRight size={22} color={COLORS.fern} />
                        : <ToggleLeft  size={22} color={COLORS.stone} />
                      }
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sec.included ? 8 : 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: sec.included ? COLORS.forest : COLORS.stone }}>
                          {SECTION_LABELS[sec.section_key]}
                        </span>
                        <button
                          onClick={() => setExpandedDesc(expandedDesc === sec.section_key ? null : sec.section_key)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: COLORS.stone }}
                        >
                          {expandedDesc === sec.section_key ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {expandedDesc === sec.section_key && (
                        <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 8 }}>
                          {SECTION_DESCRIPTIONS[sec.section_key]}
                        </p>
                      )}

                      {/* Detail level selector */}
                      {sec.included && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['summary', 'standard', 'detailed'] as DetailLevel[]).map(level => (
                            <button
                              key={level}
                              onClick={() => setDetailLevel(sec.section_key, level)}
                              title={DETAIL_LEVEL_DESCRIPTIONS[level]}
                              style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: sec.detail_level === level ? COLORS.forest : COLORS.foam,
                                color: sec.detail_level === level ? '#fff' : COLORS.slate,
                                border: `1px solid ${sec.detail_level === level ? COLORS.forest : COLORS.mist}`,
                                cursor: 'pointer',
                              }}
                            >
                              {DETAIL_LEVEL_LABELS[level]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview badge */}
                    <div style={{ flexShrink: 0 }}>
                      <Eye size={13} color={sec.included ? COLORS.fern : COLORS.mist} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Branding tab */}
          {activeTab === 'branding' && (
            <div className="card" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 20, lineHeight: 1.6 }}>
                Override the PDF color palette and logo for reports sent to this donor.
                Leave blank to use the default Omanye navy/gold theme.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <BrandingField
                  label="Primary Color (header background)"
                  type="color"
                  value={branding.primary_color}
                  onChange={v => { setBranding(b => ({ ...b, primary_color: v })); setSaved(false) }}
                  placeholder="#0F1B33"
                />
                <BrandingField
                  label="Accent Color (gold accents)"
                  type="color"
                  value={branding.accent_color}
                  onChange={v => { setBranding(b => ({ ...b, accent_color: v })); setSaved(false) }}
                  placeholder="#D4AF5C"
                />
                <BrandingField
                  label="Logo URL"
                  type="url"
                  value={branding.logo_url}
                  onChange={v => { setBranding(b => ({ ...b, logo_url: v })); setSaved(false) }}
                  placeholder="https://your-org.com/logo.png"
                />
              </div>

              {/* Color preview swatch */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: branding.primary_color || '#0F1B33', border: `1px solid ${COLORS.mist}` }} />
                <div style={{ width: 40, height: 40, borderRadius: 8, background: branding.accent_color  || '#D4AF5C', border: `1px solid ${COLORS.mist}` }} />
                <span style={{ fontSize: 12, color: COLORS.stone }}>Preview swatch</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BrandingField({
  label, type, value, onChange, placeholder,
}: {
  label: string; type: 'color' | 'url'; value: string
  onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {type === 'color' && (
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${COLORS.mist}`, cursor: 'pointer', padding: 2 }}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 7, fontSize: 13,
            border: `1px solid ${COLORS.mist}`, background: COLORS.snow,
            color: COLORS.charcoal, outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
