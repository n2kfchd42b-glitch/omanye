// Server-only: Do NOT import in client components.
// @react-pdf/renderer renders entirely on the server.

import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'
import type { Report, ReportSection, GeneratedReportContent } from '@/types/reports'
import { SECTION_LABELS } from '@/types/reports'

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  navy:    '#0F1B33',
  gold:    '#D4AF5C',
  white:   '#FFFFFF',
  snow:    '#0F1B33',
  charcoal:'#FFFFFF',
  forest:  '#0F1B33',
  slate:   '#A0AEC0',
  stone:   '#6B7A99',
  mist:    '#2D3F5C',
  green:   '#38A169',
  amber:   '#D4AF5C',
  red:     '#E53E3E',
  lightBg: '#1A2B4A',
} as const

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Shared
  page: { backgroundColor: C.white, fontFamily: 'Helvetica', fontSize: 10 },
  coverPage: { backgroundColor: C.navy },

  // Cover
  coverInner:     { flex: 1, padding: 52, justifyContent: 'space-between' },
  coverTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wordmark:       { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 3 },
  adinkraWrap:    { alignItems: 'center', justifyContent: 'center' },
  coverMiddle:    { flex: 1, justifyContent: 'center', paddingTop: 48, paddingBottom: 40 },
  coverTitle:     { fontSize: 30, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1.3, marginBottom: 16 },
  coverSub:       { fontSize: 14, color: C.gold, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  coverMeta:      { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  coverDonor:     { fontSize: 11, color: C.gold, marginTop: 12 },
  goldLine:       { height: 2, backgroundColor: C.gold, marginBottom: 18, borderRadius: 1 },
  coverFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverFooterText:{ fontSize: 9, color: 'rgba(255,255,255,0.4)' },

  // Content pages
  header:         { backgroundColor: C.navy, padding: '12 24 10 24', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:    { fontSize: 10, color: C.white, fontFamily: 'Helvetica-Bold', flex: 1 },
  headerPage:     { fontSize: 9, color: 'rgba(255,255,255,0.6)' },
  headerGoldLine: { height: 2, backgroundColor: C.gold },
  body:           { flex: 1, padding: '20 32' },
  footer:         { borderTopWidth: 1, borderTopColor: C.mist, padding: '8 32', flexDirection: 'row', justifyContent: 'space-between' },
  footerText:     { fontSize: 8, color: C.stone },

  // Section
  sectionTitle:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.forest, marginBottom: 8, marginTop: 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.mist },
  prose:          { fontSize: 10, color: C.charcoal, lineHeight: 1.7, marginBottom: 8 },
  bulletRow:      { flexDirection: 'row', marginBottom: 5 },
  bullet:         { width: 14, fontSize: 10, color: C.gold },
  bulletText:     { flex: 1, fontSize: 10, color: C.charcoal, lineHeight: 1.6 },

  // Key-value
  kvRow:          { flexDirection: 'row', marginBottom: 6 },
  kvLabel:        { width: 120, fontSize: 10, color: C.slate, fontFamily: 'Helvetica-Bold' },
  kvValue:        { flex: 1, fontSize: 10, color: C.charcoal },

  // Stats row
  statsRow:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox:        { flex: 1, backgroundColor: C.snow, borderRadius: 6, padding: '10 12' },
  statNum:        { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.forest, marginBottom: 3 },
  statLabel:      { fontSize: 8, color: C.stone, textTransform: 'uppercase' },

  // Table
  table:          { marginBottom: 16 },
  tableHead:      { flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, padding: '5 8', marginBottom: 2 },
  tableHeadCell:  { fontSize: 8, color: C.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', flex: 1 },
  tableRow:       { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: C.mist },
  tableRowAlt:    { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: C.mist, backgroundColor: C.lightBg },
  tableCell:      { fontSize: 9, color: C.charcoal, flex: 1 },
  tableCellRight: { fontSize: 9, color: C.charcoal, flex: 1, textAlign: 'right' },

  // Status badge
  badgeGreen: { backgroundColor: '#38A16920', borderRadius: 4, padding: '2 5', alignSelf: 'flex-start' },
  badgeAmber: { backgroundColor: '#D4AF5C20', borderRadius: 4, padding: '2 5', alignSelf: 'flex-start' },
  badgeRed:   { backgroundColor: '#E53E3E20', borderRadius: 4, padding: '2 5', alignSelf: 'flex-start' },
  badgeGreenText: { fontSize: 8, color: '#38A169', fontFamily: 'Helvetica-Bold' },
  badgeAmberText: { fontSize: 8, color: '#D4AF5C', fontFamily: 'Helvetica-Bold' },
  badgeRedText:   { fontSize: 8, color: '#E53E3E', fontFamily: 'Helvetica-Bold' },

  // Budget bar
  barTrack: { height: 6, backgroundColor: C.mist, borderRadius: 3, flex: 1, marginTop: 3 },
  barFill:  { height: 6, borderRadius: 3 },

  // Field data card
  dispatchCard:   { backgroundColor: C.snow, borderRadius: 6, padding: '10 12', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.gold },
  dispatchTitle:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.forest, marginBottom: 3 },
  dispatchDate:   { fontSize: 8, color: C.stone, marginBottom: 4 },
  dispatchBody:   { fontSize: 9, color: C.charcoal, lineHeight: 1.6 },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function fmtCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// ── Adinkrahene (concentric circles) ─────────────────────────────────────────

function Adinkrahene() {
  // @react-pdf doesn't support SVG in all versions; use nested Views with border-radius
  const rings = [36, 26, 16, 8]
  return (
    <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((size, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: i % 2 === 0 ? C.gold : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </View>
  )
}

// ── Section status badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'on_track' | 'at_risk' | 'off_track' }) {
  if (status === 'on_track')  return <View style={s.badgeGreen}><Text style={s.badgeGreenText}>On Track</Text></View>
  if (status === 'at_risk')   return <View style={s.badgeAmber}><Text style={s.badgeAmberText}>At Risk</Text></View>
  return <View style={s.badgeRed}><Text style={s.badgeRedText}>Off Track</Text></View>
}

// ── Cover Page ────────────────────────────────────────────────────────────────

interface CoverProps {
  title:        string
  programName:  string
  orgName:      string
  period:       string
  donorName?:   string | null
  generatedAt:  string
  primaryColor: string
  accentColor:  string
}

function CoverPage({ title, programName, orgName, period, donorName, generatedAt, primaryColor, accentColor }: CoverProps) {
  return (
    <Page size="A4" style={[s.coverPage, { backgroundColor: primaryColor }]}>
      <View style={s.coverInner}>
        {/* Top row: wordmark + adinkra */}
        <View style={s.coverTop}>
          <Text style={s.wordmark}>OMANYE</Text>
          <Adinkrahene />
        </View>

        {/* Center: title + meta */}
        <View style={s.coverMiddle}>
          <View style={[s.goldLine, { backgroundColor: accentColor }]} />
          <Text style={s.coverTitle}>{title}</Text>
          <Text style={[s.coverSub, { color: accentColor }]}>{programName}</Text>
          <Text style={s.coverMeta}>{orgName}</Text>
          <Text style={s.coverMeta}>Reporting period: {period}</Text>
          {donorName && (
            <Text style={[s.coverDonor, { color: accentColor }]}>Prepared for {donorName}</Text>
          )}
        </View>

        {/* Footer */}
        <View style={s.coverFooter}>
          <Text style={s.coverFooterText}>Generated {generatedAt}</Text>
          <Text style={s.coverFooterText}>Confidential</Text>
        </View>
      </View>
    </Page>
  )
}

// ── Content Page wrapper ──────────────────────────────────────────────────────

function ContentPage({
  title, pageNum, orgName, primaryColor, accentColor, children,
}: {
  title: string; pageNum: number; orgName: string
  primaryColor: string; accentColor: string
  children: React.ReactNode
}) {
  return (
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: primaryColor }]}>
        <Text style={s.headerTitle}>{title}</Text>
        <Text style={s.headerPage}>Page {pageNum}</Text>
      </View>
      <View style={[s.headerGoldLine, { backgroundColor: accentColor }]} />

      {/* Body */}
      <View style={s.body}>{children}</View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerText}>OMANYE · {orgName} · Confidential</Text>
        <Text style={s.footerText}>Page {pageNum}</Text>
      </View>
    </Page>
  )
}

// ── Section renderers ─────────────────────────────────────────────────────────

function ExecSummarySection({ content }: { content: GeneratedReportContent['executiveSummary'] }) {
  if (!content) return null
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.EXECUTIVE_SUMMARY}</Text>

      {/* Stat boxes */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{content.overall_achievement_pct}%</Text>
          <Text style={s.statLabel}>Overall Achievement</Text>
        </View>
        {content.burn_rate_pct !== null && (
          <View style={s.statBox}>
            <Text style={s.statNum}>{content.burn_rate_pct}%</Text>
            <Text style={s.statLabel}>Budget Utilisation</Text>
          </View>
        )}
      </View>

      {/* Prose intro */}
      <Text style={s.prose}>
        {content.program_name} is
        {content.funder ? ` funded by ${content.funder}` : ' an active program'} covering the period {content.period}.
        {content.objective ? ` Objective: ${content.objective}` : ''}
      </Text>

      {/* Highlights */}
      {content.key_highlights.map((h, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bullet}>•</Text>
          <Text style={s.bulletText}>{h}</Text>
        </View>
      ))}
    </View>
  )
}

function ProgramOverviewSection({ content }: { content: GeneratedReportContent['programOverview'] }) {
  if (!content) return null
  const rows: [string, string | null | undefined][] = [
    ['Program Name',   content.name],
    ['Objective',      content.objective],
    ['Location',       content.location],
    ['Primary Funder', content.primary_funder],
    ['Start Date',     content.start_date ? fmtDate(content.start_date) : null],
    ['End Date',       content.end_date   ? fmtDate(content.end_date)   : null],
  ]
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.PROGRAM_OVERVIEW}</Text>
      {rows.filter(([, v]) => v).map(([label, value]) => (
        <View key={label} style={s.kvRow}>
          <Text style={s.kvLabel}>{label}</Text>
          <Text style={s.kvValue}>{value}</Text>
        </View>
      ))}
      {content.description && (
        <>
          <Text style={[s.kvLabel, { marginTop: 8 }]}>Description</Text>
          <Text style={[s.prose, { marginTop: 4 }]}>{content.description}</Text>
        </>
      )}
      {content.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {content.tags.map(tag => (
            <View key={tag} style={{ backgroundColor: C.mist, borderRadius: 4, padding: '2 6' }}>
              <Text style={{ fontSize: 8, color: C.forest }}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function KeyIndicatorsSection({ indicators }: { indicators: GeneratedReportContent['keyIndicators'] }) {
  if (!indicators || indicators.length === 0) return null
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.KEY_INDICATORS}</Text>
      <View style={s.table}>
        <View style={s.tableHead}>
          {['Indicator', 'Category', 'Target', 'Current', '% Achieved', 'Status'].map((h, i) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Text key={h} style={[s.tableHeadCell, i >= 2 ? { textAlign: 'right' as any } : {}]}>{h}</Text>
          ))}
        </View>
        {indicators.map((ind, i) => (
          <View key={ind.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, { flex: 2 }]}>{ind.name}</Text>
            <Text style={s.tableCell}>{ind.category}</Text>
            <Text style={s.tableCellRight}>{ind.target.toLocaleString()} {ind.unit}</Text>
            <Text style={s.tableCellRight}>{ind.current.toLocaleString()} {ind.unit}</Text>
            <Text style={s.tableCellRight}>{ind.pct_achieved}%</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <StatusBadge status={ind.status} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function BudgetSummarySection({ content }: { content: GeneratedReportContent['budgetSummary'] }) {
  if (!content) return null
  const currency = content.currency
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.BUDGET_SUMMARY}</Text>

      {/* Totals row */}
      <View style={s.statsRow}>
        {[
          { label: 'Total Allocated', value: fmtCurrency(content.total_allocated, currency) },
          { label: 'Total Spent',     value: fmtCurrency(content.total_spent, currency) },
          { label: 'Remaining',       value: fmtCurrency(content.total_remaining, currency) },
          { label: 'Burn Rate',       value: `${content.burn_rate_pct}%` },
        ].map(stat => (
          <View key={stat.label} style={s.statBox}>
            <Text style={[s.statNum, { fontSize: 13 }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Category table */}
      <View style={s.table}>
        <View style={s.tableHead}>
          {['Category', 'Allocated', 'Spent', 'Remaining', 'Burn Rate'].map((h, i) => (
            <Text key={h} style={[s.tableHeadCell, i > 0 ? { textAlign: 'right' } : {}]}>{h}</Text>
          ))}
        </View>
        {content.categories.map((cat, i) => {
          const barColor = cat.burn_rate_pct >= 90 ? C.red : cat.burn_rate_pct >= 70 ? C.amber : C.green
          return (
            <View key={cat.name} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCell, { flex: 2 }]}>{cat.name}</Text>
              <Text style={s.tableCellRight}>{fmtCurrency(cat.allocated, currency)}</Text>
              <Text style={s.tableCellRight}>{fmtCurrency(cat.spent, currency)}</Text>
              <Text style={s.tableCellRight}>{fmtCurrency(cat.remaining, currency)}</Text>
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[s.tableCellRight, { color: barColor }]}>{cat.burn_rate_pct}%</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${Math.min(cat.burn_rate_pct, 100)}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function FieldDataSection({ content }: { content: GeneratedReportContent['fieldDataSummary'] }) {
  if (!content) return null
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.FIELD_DATA_SUMMARY}</Text>
      {content.dispatches.length === 0 ? (
        <Text style={[s.prose, { fontStyle: 'italic', color: C.stone }]}>No field dispatch updates recorded.</Text>
      ) : (
        content.dispatches.map((d, i) => (
          <View key={i} style={s.dispatchCard}>
            <Text style={s.dispatchTitle}>{d.title}</Text>
            <Text style={s.dispatchDate}>{fmtDate(d.date)}</Text>
            {d.body_preview && (
              <Text style={s.dispatchBody}>{d.body_preview}{d.body_preview.length >= 200 ? '…' : ''}</Text>
            )}
          </View>
        ))
      )}
    </View>
  )
}

function ChallengesSection({ challenges }: { challenges: string | undefined | null }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.CHALLENGES}</Text>
      {challenges ? (
        <Text style={s.prose}>{challenges}</Text>
      ) : (
        <Text style={[s.prose, { fontStyle: 'italic', color: C.stone }]}>No challenges documented.</Text>
      )}
    </View>
  )
}

function AppendixSection({ content }: { content: GeneratedReportContent['appendix'] }) {
  if (!content) return null
  return (
    <View>
      <Text style={s.sectionTitle}>{SECTION_LABELS.APPENDIX}</Text>

      {content.indicator_updates.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate, marginBottom: 6, textTransform: 'uppercase' }}>
            Indicator Updates
          </Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              {['Indicator', 'Value', 'Date'].map(h => (
                <Text key={h} style={s.tableHeadCell}>{h}</Text>
              ))}
            </View>
            {content.indicator_updates.map((u, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2, fontSize: 8 }]}>{u.indicator_name}</Text>
                <Text style={[s.tableCell, { fontSize: 8 }]}>{u.new_value.toLocaleString()} {u.unit}</Text>
                <Text style={[s.tableCell, { fontSize: 8, color: C.stone }]}>{fmtDate(u.recorded_at)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {content.expenditure_totals.length > 0 && (
        <View>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate, marginBottom: 6, textTransform: 'uppercase' }}>
            Expenditure by Category
          </Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Category</Text>
              <Text style={[s.tableHeadCell, { textAlign: 'right' }]}>Total Spent</Text>
            </View>
            {content.expenditure_totals.map((e, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2, fontSize: 8 }]}>{e.category_name}</Text>
                <Text style={[s.tableCellRight, { fontSize: 8 }]}>{fmtCurrency(e.total_spent, e.currency)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

// ── Main Document ─────────────────────────────────────────────────────────────

export interface PdfBranding {
  primary_color?: string
  accent_color?:  string
  logo_url?:      string
}

export interface PdfTemplateProps {
  report:      Report
  orgName:     string
  donorName?:  string | null
  branding?:   PdfBranding | null
}

export function PdfTemplate({ report, orgName, donorName, branding }: PdfTemplateProps) {
  // Apply branding overrides to the palette at render time
  const primary = branding?.primary_color || C.navy
  const accent  = branding?.accent_color  || C.gold
  const content = report.content as GeneratedReportContent
  const sections = (report.sections ?? []) as ReportSection[]
  const hasSection = (s: ReportSection) => sections.includes(s)

  const periodLabel = [
    report.reporting_period_start,
    report.reporting_period_end,
  ].filter(Boolean).map(d => fmtDate(d)).join(' – ') || 'All time'

  const generatedAt = report.generated_at ? fmtDate(report.generated_at) : fmtDate(report.created_at)
  const reportTitle = report.title

  let pageNum = 1

  return (
    <Document
      title={reportTitle}
      author={orgName}
      subject={`${report.program_name ?? 'Program'} Report`}
      creator="OMANYE"
    >
      {/* Cover */}
      <CoverPage
        title={reportTitle}
        programName={report.program_name ?? 'Program'}
        orgName={orgName}
        period={periodLabel}
        donorName={donorName}
        generatedAt={generatedAt}
        primaryColor={primary}
        accentColor={accent}
      />

      {/* Content pages — each section on its own page */}
      {hasSection('EXECUTIVE_SUMMARY') && content.executiveSummary && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <ExecSummarySection content={content.executiveSummary} />
        </ContentPage>
      )}

      {hasSection('PROGRAM_OVERVIEW') && content.programOverview && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <ProgramOverviewSection content={content.programOverview} />
        </ContentPage>
      )}

      {hasSection('KEY_INDICATORS') && content.keyIndicators && content.keyIndicators.length > 0 && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <KeyIndicatorsSection indicators={content.keyIndicators} />
        </ContentPage>
      )}

      {hasSection('BUDGET_SUMMARY') && content.budgetSummary && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <BudgetSummarySection content={content.budgetSummary} />
        </ContentPage>
      )}

      {hasSection('FIELD_DATA_SUMMARY') && content.fieldDataSummary && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <FieldDataSection content={content.fieldDataSummary} />
        </ContentPage>
      )}

      {hasSection('CHALLENGES') && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <ChallengesSection challenges={content.challenges} />
        </ContentPage>
      )}

      {hasSection('APPENDIX') && content.appendix && (
        <ContentPage title={reportTitle} pageNum={++pageNum} orgName={orgName} primaryColor={primary} accentColor={accent}>
          <AppendixSection content={content.appendix} />
        </ContentPage>
      )}
    </Document>
  )
}
