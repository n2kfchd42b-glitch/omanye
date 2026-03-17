'use client'

import React from 'react'
import { COLORS, FONTS } from '@/lib/tokens'
import { formatCurrency, formatDate } from '@/lib/utils'
import { IndicatorsTable } from './IndicatorsTable'
import { BudgetReportTable } from './BudgetReportTable'
import { OmanyeLogo } from '@/components/Logo'
import type { Report, ReportSection } from '@/types/reports'
import type { AccessLevel } from '@/lib/supabase/database.types'
import { SECTIONS_BY_ACCESS, SECTION_LABELS } from '@/types/reports'

interface Props {
  report:      Report
  accessLevel?: AccessLevel   // if set, filters sections for donor view
  showActions?: boolean
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: FONTS.heading,
      fontSize: 17, fontWeight: 700,
      color: COLORS.forest,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottom: `1px solid ${COLORS.mist}`,
    }}>
      {children}
    </h2>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
      <span style={{ minWidth: 140, color: COLORS.stone, fontWeight: 500 }}>{label}</span>
      <span style={{ color: COLORS.charcoal }}>{value}</span>
    </div>
  )
}

export function ReportPreview({ report, accessLevel }: Props) {
  const content = report.content
  const allSections = (report.sections as ReportSection[]) ?? []

  // Filter sections by access level if viewing as donor
  const visibleSections: ReportSection[] = accessLevel
    ? allSections.filter(s => SECTIONS_BY_ACCESS[accessLevel].includes(s))
    : allSections

  const hasSection = (s: ReportSection) => visibleSections.includes(s)

  const periodLabel = [
    report.reporting_period_start ? formatDate(report.reporting_period_start) : null,
    report.reporting_period_end   ? formatDate(report.reporting_period_end)   : null,
  ].filter(Boolean).join(' – ') || 'All time'

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(13,43,30,0.06)',
        padding: '40px 48px',
        fontFamily: FONTS.body,
      }}
    >
      {/* Report header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: FONTS.heading,
            fontSize: 26, fontWeight: 700,
            color: COLORS.forest,
            marginBottom: 6,
            lineHeight: 1.3,
          }}>
            {report.title}
          </h1>
          <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 2 }}>
            {report.program_name ?? 'Program Report'}
          </p>
          <p style={{ fontSize: 12, color: COLORS.stone }}>
            Reporting period: {periodLabel}
          </p>
          {report.generated_at && (
            <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>
              Generated {formatDate(report.generated_at)}
              {report.organization_name && ` · Prepared by ${report.organization_name}`}
            </p>
          )}
        </div>
        <div style={{ marginLeft: 24, flexShrink: 0, opacity: 0.7 }}>
          <OmanyeLogo size="sm" showTagline={false} variant="light" />
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 2, background: COLORS.gold, marginBottom: 32, borderRadius: 1 }} />

      {/* ── EXECUTIVE SUMMARY ── */}
      {hasSection('EXECUTIVE_SUMMARY') && content.executiveSummary && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.EXECUTIVE_SUMMARY}</SectionHeading>
          <div style={{
            background: COLORS.snow,
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: COLORS.charcoal, lineHeight: 1.7, marginBottom: 12 }}>
              {content.executiveSummary.program_name} is
              {content.executiveSummary.funder ? ` funded by ${content.executiveSummary.funder}` : ' an active program'}{' '}
              covering the period {content.executiveSummary.period}.
              {content.executiveSummary.objective && ` Objective: ${content.executiveSummary.objective}`}
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.forest, fontFamily: FONTS.heading }}>
                  {content.executiveSummary.overall_achievement_pct}%
                </p>
                <p style={{ fontSize: 11, color: COLORS.stone }}>Overall Achievement</p>
              </div>
              {content.executiveSummary.burn_rate_pct !== null && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.forest, fontFamily: FONTS.heading }}>
                    {content.executiveSummary.burn_rate_pct}%
                  </p>
                  <p style={{ fontSize: 11, color: COLORS.stone }}>Budget Utilisation</p>
                </div>
              )}
            </div>
          </div>
          {content.executiveSummary.key_highlights.length > 0 && (
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {content.executiveSummary.key_highlights.map((h, i) => (
                <li key={i} style={{ fontSize: 13, color: COLORS.charcoal, marginBottom: 4, lineHeight: 1.6 }}>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── PROGRAM OVERVIEW ── */}
      {hasSection('PROGRAM_OVERVIEW') && content.programOverview && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.PROGRAM_OVERVIEW}</SectionHeading>
          <MetaRow label="Program Name"  value={content.programOverview.name} />
          <MetaRow label="Objective"     value={content.programOverview.objective} />
          <MetaRow label="Location"      value={content.programOverview.location} />
          <MetaRow label="Primary Funder" value={content.programOverview.primary_funder} />
          <MetaRow label="Start Date"    value={content.programOverview.start_date ? formatDate(content.programOverview.start_date) : null} />
          <MetaRow label="End Date"      value={content.programOverview.end_date   ? formatDate(content.programOverview.end_date)   : null} />
          {content.programOverview.description && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: COLORS.stone, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Description
              </p>
              <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7 }}>
                {content.programOverview.description}
              </p>
            </div>
          )}
          {content.programOverview.tags.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {content.programOverview.tags.map(tag => (
                <span key={tag} style={{
                  padding: '2px 9px', borderRadius: 10,
                  background: COLORS.mist, color: COLORS.forest,
                  fontSize: 11, fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── KEY INDICATORS ── */}
      {hasSection('KEY_INDICATORS') && content.keyIndicators && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.KEY_INDICATORS}</SectionHeading>
          <IndicatorsTable indicators={content.keyIndicators} />
        </section>
      )}

      {/* ── BUDGET SUMMARY ── */}
      {hasSection('BUDGET_SUMMARY') && content.budgetSummary && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.BUDGET_SUMMARY}</SectionHeading>
          {/* Totals row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Allocated', value: formatCurrency(content.budgetSummary.total_allocated, content.budgetSummary.currency) },
              { label: 'Total Spent',     value: formatCurrency(content.budgetSummary.total_spent, content.budgetSummary.currency) },
              { label: 'Remaining',       value: formatCurrency(content.budgetSummary.total_remaining, content.budgetSummary.currency) },
              { label: 'Burn Rate',       value: `${content.budgetSummary.burn_rate_pct}%` },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: '1 1 140px',
                background: COLORS.snow,
                borderRadius: 8,
                padding: '12px 16px',
              }}>
                <p style={{ fontSize: 11, color: COLORS.stone, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, fontFamily: FONTS.heading }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <BudgetReportTable categories={content.budgetSummary.categories} currency={content.budgetSummary.currency} />
        </section>
      )}

      {/* ── FIELD DATA SUMMARY ── */}
      {hasSection('FIELD_DATA_SUMMARY') && content.fieldDataSummary && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.FIELD_DATA_SUMMARY}</SectionHeading>
          {content.fieldDataSummary.dispatches.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>
              No field dispatch updates recorded.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {content.fieldDataSummary.dispatches.map((d, i) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: COLORS.snow,
                  borderRadius: 8,
                  borderLeft: `3px solid ${COLORS.gold}`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, marginBottom: 4 }}>
                    {d.title}
                  </p>
                  <p style={{ fontSize: 11, color: COLORS.stone, marginBottom: 6 }}>
                    {d.date ? formatDate(d.date) : '—'}
                  </p>
                  {d.body_preview && (
                    <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.6 }}>
                      {d.body_preview}{d.body_preview.length >= 200 ? '…' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CHALLENGES ── */}
      {hasSection('CHALLENGES') && content.challenges !== undefined && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.CHALLENGES}</SectionHeading>
          {content.challenges ? (
            <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {content.challenges}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>
              No challenges documented.
            </p>
          )}
        </section>
      )}

      {/* ── APPENDIX ── */}
      {hasSection('APPENDIX') && content.appendix && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeading>{SECTION_LABELS.APPENDIX}</SectionHeading>

          {content.appendix.indicator_updates.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Indicator Updates
              </p>
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.mist}` }}>
                      {['Indicator', 'Value', 'Date'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '6px 10px',
                          fontWeight: 600, color: COLORS.slate,
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.appendix.indicator_updates.map((u, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.foam}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                        <td style={{ padding: '6px 10px', color: COLORS.charcoal }}>{u.indicator_name}</td>
                        <td style={{ padding: '6px 10px', color: COLORS.charcoal }}>{u.new_value.toLocaleString()} {u.unit}</td>
                        <td style={{ padding: '6px 10px', color: COLORS.stone }}>{formatDate(u.recorded_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {content.appendix.expenditure_totals.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expenditure by Category
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.mist}` }}>
                      {['Category', 'Total Spent'].map(h => (
                        <th key={h} style={{
                          textAlign: h === 'Category' ? 'left' : 'right', padding: '6px 10px',
                          fontWeight: 600, color: COLORS.slate,
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.appendix.expenditure_totals.map((e, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${COLORS.foam}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                        <td style={{ padding: '6px 10px', color: COLORS.charcoal }}>{e.category_name}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: COLORS.charcoal }}>
                          {formatCurrency(e.total_spent, e.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 40,
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.mist}`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, color: COLORS.stone, fontStyle: 'italic' }}>
          Generated by OMANYE · {report.generated_at ? formatDate(report.generated_at) : formatDate(report.created_at)}
        </p>
      </div>
    </div>
  )
}
