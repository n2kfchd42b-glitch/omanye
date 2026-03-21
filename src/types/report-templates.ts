// ── OMANYE Report Template Types ─────────────────────────────────────────────

import type { ReportType, ReportSection } from '@/types/reports'

export type DetailLevel = 'summary' | 'standard' | 'detailed'

export interface TemplateSection {
  section_key:  ReportSection
  included:     boolean
  detail_level: DetailLevel
  custom_label?: string
  order:        number
}

export interface TemplateBranding {
  primary_color?: string  // hex, overrides navy
  accent_color?:  string  // hex, overrides gold
  logo_url?:      string  // public URL
}

export interface ReportTemplate {
  id:              string
  organization_id: string
  donor_id:        string | null  // null = org-level default
  template_name:   string
  report_type:     ReportType
  sections:        TemplateSection[]
  branding:        TemplateBranding
  is_default:      boolean
  created_by:      string | null
  created_at:      string
  updated_at:      string
  // Joined
  donor_name?:     string | null
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface CreateTemplatePayload {
  donor_id?:     string | null
  template_name: string
  report_type:   ReportType
  sections:      TemplateSection[]
  branding?:     TemplateBranding
}

export interface UpdateTemplatePayload {
  template_name?: string
  sections?:      TemplateSection[]
  branding?:      TemplateBranding
}

// ── Default section list factory ──────────────────────────────────────────────

import { ALL_SECTIONS } from '@/types/reports'

export function defaultSections(): TemplateSection[] {
  return ALL_SECTIONS.map((key, i) => ({
    section_key:  key,
    included:     key !== 'APPENDIX',
    detail_level: 'standard' as DetailLevel,
    order:        i + 1,
  }))
}
