import { z } from 'zod'

// ── Re-export access level values from DB types ───────────────────────────────
// Keep in sync with public.access_level enum in Supabase
const ACCESS_LEVELS = ['SUMMARY_ONLY', 'INDICATORS', 'INDICATORS_AND_BUDGET', 'FULL'] as const

// ─────────────────────────────────────────────────────────────────────────────
// Programs
// ─────────────────────────────────────────────────────────────────────────────

export const programSchema = z.object({
  name:             z.string().min(3).max(200),
  objective:        z.string().max(500).optional().nullable(),
  total_budget:     z.number().positive().optional().nullable(),
  currency:         z.string().length(3).default('USD'),
  tags:             z.array(z.string().max(50)).max(10).optional().default([]),
  status:           z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).optional().default('PLANNING'),
  visibility:       z.enum(['PRIVATE', 'DONOR_ONLY', 'PUBLIC']).optional().default('PRIVATE'),
  start_date:       z.string().datetime({ offset: true }).optional().nullable(),
  end_date:         z.string().datetime({ offset: true }).optional().nullable(),
  location:         z.string().max(200).optional().nullable(),
  location_country: z.string().max(100).optional().nullable(),
  location_region:  z.string().max(100).optional().nullable(),
  description:      z.string().max(2000).optional().nullable(),
  primary_funder:   z.string().max(200).optional().nullable(),
  logframe_url:     z.string().url().optional().nullable(),
})

export type ProgramPayload = z.infer<typeof programSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Indicators
// ─────────────────────────────────────────────────────────────────────────────

export const indicatorSchema = z.object({
  program_id:       z.string().uuid(),
  name:             z.string().min(2).max(300),
  target_value:     z.number().positive(),
  unit:             z.string().max(50),
  baseline_value:   z.number().optional().nullable(),
  frequency:        z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONCE']).optional().default('MONTHLY'),
  visible_to_donors: z.boolean().optional().default(false),
  description:      z.string().max(500).optional().nullable(),
  sort_order:       z.number().int().nonnegative().optional().default(0),
})

export type IndicatorPayload = z.infer<typeof indicatorSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Expenditures
// ─────────────────────────────────────────────────────────────────────────────

export const expenditureSchema = z.object({
  amount:           z.number().positive().max(10_000_000),
  description:      z.string().min(3).max(500),
  transaction_date: z.string().datetime({ offset: true }),
  budget_category_id: z.string().uuid().optional().nullable(),
  reference_number:   z.string().max(100).optional().nullable(),
  vendor:             z.string().max(200).optional().nullable(),
  receipt_url:        z.string().url().optional().nullable(),
})

export type ExpenditurePayload = z.infer<typeof expenditureSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Budget Category
// ─────────────────────────────────────────────────────────────────────────────

export const budgetCategorySchema = z.object({
  program_id:       z.string().uuid(),
  name:             z.string().min(2).max(200),
  allocated_amount: z.number().nonnegative().max(100_000_000).optional().default(0),
  currency:         z.string().length(3).optional().default('USD'),
  description:      z.string().max(500).optional().nullable(),
  color:            z.string().max(20).optional().nullable(),
  sort_order:       z.number().int().nonnegative().optional().default(0),
})

export type BudgetCategoryPayload = z.infer<typeof budgetCategorySchema>

// ─────────────────────────────────────────────────────────────────────────────
// Donor Invite
// ─────────────────────────────────────────────────────────────────────────────

export const donorInviteSchema = z.object({
  email:               z.string().email(),
  access_level:        z.enum(ACCESS_LEVELS),
  expires_at:          z.string().datetime({ offset: true }).optional(),
  donor_name:          z.string().max(200).optional().nullable(),
  organization_name:   z.string().max(200).optional().nullable(),
  message:             z.string().max(1000).optional().nullable(),
  can_download_reports: z.boolean().optional().default(false),
  program_id:          z.string().uuid(),
})

export type DonorInvitePayload = z.infer<typeof donorInviteSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  program_id:             z.string().uuid(),
  title:                  z.string().min(3).max(300),
  report_type:            z.enum(['PROGRESS', 'QUARTERLY', 'ANNUAL', 'FIELD', 'DONOR_BRIEF', 'FINAL']),
  sections:               z.array(z.string()).max(20).optional().default([]),
  challenges:             z.string().max(2000).optional().nullable(),
  reporting_period_start: z.string().datetime({ offset: true }).optional().nullable(),
  reporting_period_end:   z.string().datetime({ offset: true }).optional().nullable(),
})

export type CreateReportPayload = z.infer<typeof createReportSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────────────────────

export const inviteTeamMemberSchema = z.object({
  email:       z.string().email(),
  role:        z.enum(['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']),
  full_name:   z.string().max(200).optional().nullable(),
  message:     z.string().max(1000).optional().nullable(),
  program_ids: z.array(z.string().uuid()).optional().default([]),
  expires_at:  z.string().datetime({ offset: true }).optional(),
})

export type InviteTeamMemberPayload = z.infer<typeof inviteTeamMemberSchema>

export const changeRoleSchema = z.object({
  role: z.enum(['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']),
})

export type ChangeRolePayload = z.infer<typeof changeRoleSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Field Forms & Submissions
// ─────────────────────────────────────────────────────────────────────────────

export const formFieldSchema = z.object({
  key:      z.string().min(1).max(100),
  label:    z.string().min(1).max(300),
  type:     z.enum(['text', 'number', 'select', 'date', 'boolean']),
  required: z.boolean().default(false),
  options:  z.array(z.string().max(200)).max(50).optional(),
})

export const fieldCollectionFormSchema = z.object({
  program_id:  z.string().uuid(),
  name:        z.string().min(2).max(200),
  description: z.string().max(500).optional().nullable(),
  fields:      z.array(formFieldSchema).min(1).max(50),
  active:      z.boolean().optional().default(true),
})

export const fieldSubmissionSchema = z.object({
  program_id:      z.string().uuid(),
  form_id:         z.string().uuid().optional().nullable(),
  submission_date: z.string().optional().nullable(),
  location_name:   z.string().max(200).optional().nullable(),
  location_lat:    z.number().min(-90).max(90).optional().nullable(),
  location_lng:    z.number().min(-180).max(180).optional().nullable(),
  data:            z.record(z.string(), z.unknown()).default({}),
  notes:           z.string().max(1000).optional().nullable(),
  attachments:     z.array(z.string()).optional().default([]),
  status:          z.enum(['SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED']).optional().default('SUBMITTED'),
  sync_source:     z.enum(['direct', 'batch_sync']).optional().default('direct'),
  device_metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const batchSubmissionSchema = z.object({
  submissions: z
    .array(
      fieldSubmissionSchema.extend({
        /** Client-generated idempotency key — deduplicated server-side */
        client_id: z.string().uuid(),
      })
    )
    .min(1)
    .max(50),
})

// ─────────────────────────────────────────────────────────────────────────────
// Auth (signup)
// ─────────────────────────────────────────────────────────────────────────────

export const ngoSignupSchema = z.object({
  email:             z.string().email(),
  password:          z.string().min(8).max(72),
  full_name:         z.string().min(2).max(200),
  organization_name: z.string().min(2).max(200),
  organization_slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
})

export const donorSignupSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8).max(72),
  full_name: z.string().min(2).max(200),
})

// ─────────────────────────────────────────────────────────────────────────────
// Notification preferences
// ─────────────────────────────────────────────────────────────────────────────

export const notificationPrefsSchema = z.object({
  email_notifications:      z.boolean(),
  notify_program_updates:   z.boolean(),
  notify_indicator_updates: z.boolean(),
  notify_expenditures:      z.boolean(),
  notify_reports:           z.boolean(),
  notify_field_submissions: z.boolean(),
  notify_team_changes:      z.boolean(),
  notify_donor_activity:    z.boolean(),
  notify_budget_warnings:   z.boolean(),
  funder_digest_enabled:    z.boolean().optional(),
})
