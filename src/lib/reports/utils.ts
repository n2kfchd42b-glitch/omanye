import { REPORT_TYPE_LABELS } from '@/types/reports'
import type { ReportType } from '@/types/reports'

export function autoTitleForBulk(programName: string, type: ReportType, donorLabel: string): string {
  const now   = new Date()
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return `${programName} — ${REPORT_TYPE_LABELS[type]} — ${month} (${donorLabel})`
}
