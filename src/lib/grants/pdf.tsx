// Server-only: Do NOT import in client components.
// @react-pdf/renderer renders entirely on the server.

import React from 'react'
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import { SECTION_KEYS, SECTION_LABELS, type GrantSections } from '@/lib/grant-types'

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  navy:    '#0F1B33',
  gold:    '#D4AF5C',
  white:   '#FFFFFF',
  slate:   '#6B7A99',
  mist:    '#2D3F5C',
  light:   '#F7F8FA',
} as const

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily:      'Helvetica',
    fontSize:        10,
    color:           '#1A2B4A',
  },

  // Cover
  coverPage: { backgroundColor: C.navy },
  coverInner: {
    flex: 1, padding: 52, justifyContent: 'space-between',
  },
  coverTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  wordmark: {
    fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 3,
  },
  coverMiddle: {
    flex: 1, justifyContent: 'center', paddingTop: 48, paddingBottom: 40,
  },
  coverLabel: {
    fontSize: 11, color: C.gold, fontFamily: 'Helvetica-Bold',
    letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.white,
    lineHeight: 1.3, marginBottom: 14,
  },
  coverFunder: {
    fontSize: 13, color: C.gold, marginBottom: 6,
  },
  goldLine: {
    height: 2, backgroundColor: C.gold, marginBottom: 18, borderRadius: 1,
  },
  coverMeta: {
    fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4,
  },
  coverFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 9, color: 'rgba(255,255,255,0.4)',
  },
  coverFooterVersion: {
    fontSize: 9, color: C.gold,
  },

  // Content pages
  contentPage: {
    backgroundColor: C.white, padding: '40 48',
  },
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: `1 solid ${C.mist}`, paddingBottom: 8, marginBottom: 24,
  },
  pageHeaderTitle: {
    fontSize: 9, color: C.slate, fontFamily: 'Helvetica',
  },
  pageHeaderPage: {
    fontSize: 9, color: C.slate,
  },

  // Section
  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy,
    marginBottom: 10, paddingBottom: 6,
    borderBottom: `1.5 solid ${C.gold}`,
  },
  sectionBody: {
    fontSize: 10, lineHeight: 1.7, color: '#1A2B4A',
  },
  emptySection: {
    fontSize: 10, color: C.slate, fontStyle: 'italic',
    padding: '8 12', backgroundColor: C.light, borderRadius: 4,
  },
})

// ── GrantPdfTemplate ──────────────────────────────────────────────────────────

export interface GrantPdfProps {
  orgName:           string
  grantTitle:        string
  funderName:        string
  fundingAmount:     number
  currency:          string
  deadline:          string | null
  versionNumber:     number
  generatedAt:       string
  sections:          GrantSections
  brandingColor?:    string
}

export function GrantPdfTemplate({
  orgName, grantTitle, funderName, fundingAmount, currency,
  deadline, versionNumber, generatedAt, sections,
}: GrantPdfProps) {
  const formattedAmount = `${currency} ${Number(fundingAmount).toLocaleString()}`
  const formattedDate   = deadline
    ? new Date(deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not specified'
  const generatedDate   = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverInner}>
          <View style={s.coverTop}>
            <Text style={s.wordmark}>OMANYE</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Grant Proposal</Text>
          </View>

          <View style={s.coverMiddle}>
            <Text style={s.coverLabel}>Grant Proposal</Text>
            <View style={s.goldLine} />
            <Text style={s.coverTitle}>{grantTitle}</Text>
            <Text style={s.coverFunder}>Submitted to: {funderName}</Text>
            <Text style={s.coverMeta}>Organization: {orgName}</Text>
            <Text style={s.coverMeta}>Funding Requested: {formattedAmount}</Text>
            <Text style={s.coverMeta}>Application Deadline: {formattedDate}</Text>
          </View>

          <View style={s.coverFooter}>
            <Text style={s.coverFooterText}>
              Generated {generatedDate} · {orgName}
            </Text>
            <Text style={s.coverFooterVersion}>Version {versionNumber}</Text>
          </View>
        </View>
      </Page>

      {/* Content Pages — split into pairs of 2 sections per page */}
      {Array.from({ length: Math.ceil(SECTION_KEYS.length / 2) }, (_, i) => {
        const pageSections = SECTION_KEYS.slice(i * 2, i * 2 + 2)
        return (
          <Page key={i} size="A4" style={s.contentPage}>
            <View style={s.pageHeader}>
              <Text style={s.pageHeaderTitle}>{grantTitle} — {funderName}</Text>
              <Text style={s.pageHeaderPage}>{orgName} · v{versionNumber}</Text>
            </View>

            {pageSections.map(key => (
              <View key={key} style={s.sectionBlock}>
                <Text style={s.sectionTitle}>{SECTION_LABELS[key]}</Text>
                {sections[key]?.trim() ? (
                  <Text style={s.sectionBody}>{sections[key]}</Text>
                ) : (
                  <Text style={s.emptySection}>This section was not generated.</Text>
                )}
              </View>
            ))}
          </Page>
        )
      })}
    </Document>
  )
}
