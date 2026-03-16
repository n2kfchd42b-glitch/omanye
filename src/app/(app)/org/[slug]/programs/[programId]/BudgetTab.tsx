'use client'

import React, { useState, useTransition } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle,
  DollarSign, TrendingDown, Wallet, Percent, Loader2,
  ArrowRightLeft, ChevronDown, ChevronUp, FileText,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import type { OmanyeRole } from '@/lib/supabase/database.types'
import type {
  BudgetCategory,
  Expenditure,
  BudgetAmendment,
  FundingTranche,
  BudgetSummary,
  CategorySpend,
  CreateBudgetCategoryPayload,
  SubmitExpenditurePayload,
  CreateBudgetAmendmentPayload,
  CreateFundingTranchePayload,
  UpdateFundingTranchePayload,
} from '@/lib/budget'
import {
  EXPENDITURE_STATUS_LABELS,
  EXPENDITURE_STATUS_COLORS,
  TRANCHE_STATUS_LABELS,
  TRANCHE_STATUS_COLORS,
  CATEGORY_COLORS,
} from '@/lib/budget'
import {
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
  submitExpenditure,
  listExpenditures,
  approveExpenditure,
  rejectExpenditure,
  voidExpenditure,
  deleteExpenditure,
  createBudgetAmendment,
  listBudgetAmendments,
  createFundingTranche,
  listFundingTranches,
  updateFundingTranche,
} from '@/app/actions/budget'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  programId:      string
  organizationId: string
  currency:       string
  totalBudget:    number | null
  userRole:       OmanyeRole
  currentUserId:  string
  // Initial server-fetched data
  initialCategories:  BudgetCategory[]
  initialCategorySpend: CategorySpend[]
  initialExpenditures: Expenditure[]
  initialSummary:     BudgetSummary | null
  initialTranches:    FundingTranche[]
  initialAmendments:  BudgetAmendment[]
}

// ── Sub-section type ──────────────────────────────────────────────────────────

type Section = 'overview' | 'expenditures' | 'categories' | 'tranches' | 'amendments'

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }: {
  label:   string
  value:   string
  sub?:    string
  icon:    React.ReactNode
  accent?: string
}) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: accent ?? COLORS.fern }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.stone }}>{sub}</div>}
    </div>
  )
}

// ── Status Dot ────────────────────────────────────────────────────────────────

function StatusDot({ status, colors }: { status: string; colors: { bg: string; text: string; dot: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
      background: colors.bg, color: colors.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}

// ── Main BudgetTab ────────────────────────────────────────────────────────────

export default function BudgetTab({
  programId,
  organizationId,
  currency,
  totalBudget,
  userRole,
  currentUserId,
  initialCategories,
  initialCategorySpend,
  initialExpenditures,
  initialSummary,
  initialTranches,
  initialAmendments,
}: Props) {
  const isAdmin = userRole === 'NGO_ADMIN'
  const canEdit = userRole === 'NGO_ADMIN' || userRole === 'NGO_STAFF'

  const [section, setSection]           = useState<Section>('overview')
  const [categories, setCategories]     = useState<BudgetCategory[]>(initialCategories)
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>(initialCategorySpend)
  const [expenditures, setExpenditures] = useState<Expenditure[]>(initialExpenditures)
  const [summary, setSummary]           = useState<BudgetSummary | null>(initialSummary)
  const [tranches, setTranches]         = useState<FundingTranche[]>(initialTranches)
  const [amendments, setAmendments]     = useState<BudgetAmendment[]>(initialAmendments)

  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // ── Refresh helpers ──────────────────────────────────────────────────────────

  async function refreshExpenditures() {
    const { data } = await listExpenditures(programId)
    if (data) setExpenditures(data)
  }

  async function refreshAmendments() {
    const { data } = await listBudgetAmendments(programId)
    if (data) setAmendments(data)
  }

  async function refreshTranches() {
    const { data } = await listFundingTranches(programId)
    if (data) setTranches(data)
  }

  // ── Section nav ──────────────────────────────────────────────────────────────

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'expenditures', label: 'Expenditures' },
    { id: 'categories',   label: 'Categories' },
    { id: 'tranches',     label: 'Funding Tranches' },
    ...(isAdmin ? [{ id: 'amendments' as Section, label: 'Amendments' }] : []),
  ]

  return (
    <div>
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${COLORS.mist}` }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: section === s.id ? 700 : 500,
              color: section === s.id ? COLORS.fern : COLORS.slate,
              background: 'none', border: 'none',
              borderBottom: `2px solid ${section === s.id ? COLORS.fern : 'transparent'}`,
              cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'overview'     && <OverviewSection summary={summary} categorySpend={categorySpend} totalBudget={totalBudget} currency={currency} />}
      {section === 'expenditures' && (
        <ExpendituresSection
          programId={programId}
          organizationId={organizationId}
          currency={currency}
          expenditures={expenditures}
          categories={categories}
          currentUserId={currentUserId}
          canEdit={canEdit}
          isAdmin={isAdmin}
          onRefresh={refreshExpenditures}
          setError={setError}
        />
      )}
      {section === 'categories' && (
        <CategoriesSection
          programId={programId}
          organizationId={organizationId}
          currency={currency}
          categories={categories}
          categorySpend={categorySpend}
          isAdmin={isAdmin}
          setCategories={setCategories}
          setCategorySpend={setCategorySpend}
          setError={setError}
        />
      )}
      {section === 'tranches' && (
        <TranchesSection
          programId={programId}
          organizationId={organizationId}
          currency={currency}
          tranches={tranches}
          isAdmin={isAdmin}
          onRefresh={refreshTranches}
          setError={setError}
        />
      )}
      {section === 'amendments' && isAdmin && (
        <AmendmentsSection
          programId={programId}
          organizationId={organizationId}
          currentUserId={currentUserId}
          amendments={amendments}
          categories={categories}
          currency={currency}
          onRefresh={refreshAmendments}
          setError={setError}
        />
      )}
    </div>
  )
}

// ── Overview Section ──────────────────────────────────────────────────────────

function OverviewSection({ summary, categorySpend, totalBudget, currency }: {
  summary:       BudgetSummary | null
  categorySpend: CategorySpend[]
  totalBudget:   number | null
  currency:      string
}) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const noData = !summary && categorySpend.length === 0

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Total Budget"    value={totalBudget ? fmt(totalBudget) : '—'} icon={<DollarSign size={14} />} />
        <StatCard label="Allocated"       value={summary ? fmt(summary.total_allocated) : '—'} icon={<Wallet size={14} />} />
        <StatCard label="Spent"           value={summary ? fmt(summary.total_spent) : '—'} icon={<TrendingDown size={14} />} accent={COLORS.amber} />
        <StatCard label="Remaining"       value={summary ? fmt(summary.total_remaining) : '—'} icon={<DollarSign size={14} />} accent={COLORS.fern} />
        <StatCard label="Burn Rate"       value={summary?.burn_rate_pct != null ? `${summary.burn_rate_pct}%` : '—'} icon={<Percent size={14} />} accent={COLORS.gold} />
      </div>

      {noData ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
          No budget data yet. Add categories to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Donut chart */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 16 }}>
              Budget Allocation
            </h3>
            {categorySpend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorySpend}
                    dataKey="allocated_amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {categorySpend.map((cat, i) => (
                      <Cell key={cat.category_id} fill={cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [fmt(val), 'Allocated']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.stone, fontSize: 13 }}>
                No categories yet
              </div>
            )}
          </div>

          {/* Horizontal bar: spend per category */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 16 }}>
              Spend by Category
            </h3>
            {categorySpend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categorySpend} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(val: number) => [fmt(val), 'Spent']} />
                  <Bar dataKey="spent" fill={COLORS.fern} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.stone, fontSize: 13 }}>
                No spend data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category breakdown table */}
      {categorySpend.length > 0 && (
        <div className="card" style={{ marginTop: 20, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Category', 'Allocated', 'Spent', 'Remaining', 'Burn Rate'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorySpend.map((cat, i) => (
                <tr key={cat.category_id} style={{ borderBottom: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length], display: 'inline-block' }} />
                      {cat.name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{fmt(cat.allocated_amount)}</td>
                  <td style={{ padding: '10px 16px' }}>{fmt(cat.spent)}</td>
                  <td style={{ padding: '10px 16px', color: cat.remaining < 0 ? COLORS.crimson : undefined }}>{fmt(cat.remaining)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ color: (cat.burn_rate_pct ?? 0) > 90 ? COLORS.crimson : (cat.burn_rate_pct ?? 0) > 70 ? COLORS.amber : COLORS.fern }}>
                      {cat.burn_rate_pct != null ? `${cat.burn_rate_pct}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Expenditures Section ──────────────────────────────────────────────────────

function ExpendituresSection({
  programId, organizationId, currency, expenditures, categories, currentUserId, canEdit, isAdmin, onRefresh, setError,
}: {
  programId:      string
  organizationId: string
  currency:       string
  expenditures:   Expenditure[]
  categories:     BudgetCategory[]
  currentUserId:  string
  canEdit:        boolean
  isAdmin:        boolean
  onRefresh:      () => Promise<void>
  setError:       (e: string | null) => void
}) {
  const fmt = (n: number) => formatCurrency(n, currency)

  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch]             = useState('')
  const [showSubmit, setShowSubmit]     = useState(false)
  const [reviewExp, setReviewExp]       = useState<Expenditure | null>(null)
  const [isPending, startTransition]    = useTransition()

  const catOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]
  const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'VOID']

  const filtered = expenditures.filter(e => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleApprove(id: string) {
    startTransition(async () => {
      setError(null)
      const { error } = await approveExpenditure(id, currentUserId)
      if (error) { setError(error); return }
      await onRefresh()
      setReviewExp(null)
    })
  }

  async function handleReject(id: string, notes?: string) {
    startTransition(async () => {
      setError(null)
      const { error } = await rejectExpenditure(id, currentUserId, notes)
      if (error) { setError(error); return }
      await onRefresh()
      setReviewExp(null)
    })
  }

  async function handleVoid(id: string) {
    if (!confirm('Mark this expenditure as void?')) return
    startTransition(async () => {
      setError(null)
      const { error } = await voidExpenditure(id)
      if (error) { setError(error); return }
      await onRefresh()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expenditure? This cannot be undone.')) return
    startTransition(async () => {
      setError(null)
      const { error } = await deleteExpenditure(id)
      if (error) { setError(error); return }
      await onRefresh()
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                border: `1px solid ${statusFilter === s ? COLORS.fern : COLORS.mist}`,
                background: statusFilter === s ? COLORS.foam : '#fff',
                color: statusFilter === s ? COLORS.fern : COLORS.slate,
                cursor: 'pointer',
              }}
            >
              {s === 'ALL' ? 'All' : EXPENDITURE_STATUS_LABELS[s as keyof typeof EXPENDITURE_STATUS_LABELS]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search description…"
          style={{
            padding: '7px 12px', fontSize: 13, border: `1px solid ${COLORS.mist}`, borderRadius: 8,
            flex: 1, minWidth: 160, outline: 'none', color: COLORS.charcoal,
          }}
        />
        {canEdit && (
          <button
            onClick={() => setShowSubmit(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: COLORS.fern, color: '#fff', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Submit Expenditure
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
          No expenditures found.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Date', 'Description', 'Category', 'Amount', 'Status', 'Submitted by', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <tr key={exp.id} style={{ borderBottom: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{formatDate(exp.transaction_date)}</td>
                  <td style={{ padding: '10px 14px', maxWidth: 200 }}>{exp.description}</td>
                  <td style={{ padding: '10px 14px', color: COLORS.slate }}>{exp.category_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{fmt(exp.amount)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusDot
                      status={EXPENDITURE_STATUS_LABELS[exp.status]}
                      colors={EXPENDITURE_STATUS_COLORS[exp.status]}
                    />
                  </td>
                  <td style={{ padding: '10px 14px', color: COLORS.slate }}>{exp.submitter_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {isAdmin && exp.status === 'PENDING' && (
                        <button
                          onClick={() => setReviewExp(exp)}
                          style={{
                            padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                            background: COLORS.foam, color: COLORS.fern, border: `1px solid ${COLORS.mist}`,
                            cursor: 'pointer',
                          }}
                        >
                          Review
                        </button>
                      )}
                      {isAdmin && exp.status === 'APPROVED' && (
                        <button onClick={() => handleVoid(exp.id)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, background: '#F1F5F9', color: COLORS.slate, border: `1px solid ${COLORS.mist}`, cursor: 'pointer' }}>
                          Void
                        </button>
                      )}
                      {(exp.submitted_by === currentUserId || isAdmin) && exp.status === 'PENDING' && (
                        <button onClick={() => handleDelete(exp.id)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, background: '#FEE2E2', color: COLORS.crimson, border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Expenditure Modal */}
      {showSubmit && (
        <SubmitExpenditureModal
          programId={programId}
          organizationId={organizationId}
          submittedBy={currentUserId}
          categories={categories}
          currency={currency}
          onClose={() => setShowSubmit(false)}
          onSuccess={async () => {
            setShowSubmit(false)
            await onRefresh()
          }}
          setError={setError}
        />
      )}

      {/* Review Modal */}
      {reviewExp && (
        <ReviewExpenditureModal
          exp={reviewExp}
          currency={currency}
          onApprove={() => handleApprove(reviewExp.id)}
          onReject={(notes) => handleReject(reviewExp.id, notes)}
          onClose={() => setReviewExp(null)}
          isPending={isPending}
        />
      )}
    </div>
  )
}

// ── Submit Expenditure Modal ──────────────────────────────────────────────────

function SubmitExpenditureModal({
  programId, organizationId, submittedBy, categories, currency, onClose, onSuccess, setError,
}: {
  programId:      string
  organizationId: string
  submittedBy:    string
  categories:     BudgetCategory[]
  currency:       string
  onClose:        () => void
  onSuccess:      () => Promise<void>
  setError:       (e: string | null) => void
}) {
  const [form, setForm] = useState<SubmitExpenditurePayload>({
    description:      '',
    amount:           0,
    currency,
    transaction_date: todayISO(),
  })
  const [isPending, startTransition] = useTransition()
  const [localError, setLocalError]  = useState<string | null>(null)

  const catOptions = [
    { value: '', label: 'No category' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  function set(key: keyof SubmitExpenditurePayload, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) { setLocalError('Description is required'); return }
    if (form.amount <= 0) { setLocalError('Amount must be greater than 0'); return }
    if (!form.transaction_date) { setLocalError('Transaction date is required'); return }
    setLocalError(null)
    startTransition(async () => {
      const { error } = await submitExpenditure(programId, organizationId, submittedBy, form)
      if (error) { setLocalError(error); return }
      await onSuccess()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,43,30,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 28, boxShadow: SHADOW.modal, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Submit Expenditure
        </h2>
        {localError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{localError}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 14 }}>
            <FormField label="Description" required>
              <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was this expense for?" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Amount" required>
                <Input type="number" min={0} step="0.01" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </FormField>
              <FormField label="Date" required>
                <Input type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Category">
              <Select options={catOptions} value={form.budget_category_id ?? ''} onChange={e => set('budget_category_id', e.target.value || undefined)} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Payment Method">
                <Input value={form.payment_method ?? ''} onChange={e => set('payment_method', e.target.value || undefined)} placeholder="e.g. Bank transfer" />
              </FormField>
              <FormField label="Reference #">
                <Input value={form.reference_number ?? ''} onChange={e => set('reference_number', e.target.value || undefined)} placeholder="Optional" />
              </FormField>
            </div>
            <FormField label="Notes">
              <Textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} rows={2} placeholder="Additional notes…" />
            </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} style={{ padding: '9px 20px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPending && <Loader2 size={13} className="spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Review Expenditure Modal ──────────────────────────────────────────────────

function ReviewExpenditureModal({ exp, currency, onApprove, onReject, onClose, isPending }: {
  exp:       Expenditure
  currency:  string
  onApprove: () => void
  onReject:  (notes?: string) => void
  onClose:   () => void
  isPending: boolean
}) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,43,30,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 28, boxShadow: SHADOW.modal }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Review Expenditure
        </h2>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 13, marginBottom: 20 }}>
          {[
            ['Description', exp.description],
            ['Amount',      fmt(exp.amount)],
            ['Date',        formatDate(exp.transaction_date)],
            ['Category',    exp.category_name ?? '—'],
            ['Submitted by', exp.submitter_name ?? '—'],
            ['Reference',   exp.reference_number ?? '—'],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <dt style={{ color: COLORS.slate, fontWeight: 600 }}>{k}</dt>
              <dd style={{ color: COLORS.charcoal, margin: 0 }}>{v}</dd>
            </React.Fragment>
          ))}
        </dl>

        {showRejectForm && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 6 }}>Rejection notes (optional)</label>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${COLORS.mist}`, borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Reason for rejection…"
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          {!showRejectForm ? (
            <button type="button" onClick={() => setShowRejectForm(true)} disabled={isPending} style={{ padding: '9px 18px', borderRadius: 8, background: '#FEE2E2', color: COLORS.crimson, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={13} /> Reject
            </button>
          ) : (
            <button type="button" onClick={() => onReject(rejectNotes || undefined)} disabled={isPending} style={{ padding: '9px 18px', borderRadius: 8, background: '#FEE2E2', color: COLORS.crimson, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {isPending && <Loader2 size={13} />} Confirm Reject
            </button>
          )}
          <button type="button" onClick={onApprove} disabled={isPending} style={{ padding: '9px 20px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />} Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Categories Section ────────────────────────────────────────────────────────

function CategoriesSection({
  programId, organizationId, currency, categories, categorySpend, isAdmin, setCategories, setCategorySpend, setError,
}: {
  programId:       string
  organizationId:  string
  currency:        string
  categories:      BudgetCategory[]
  categorySpend:   CategorySpend[]
  isAdmin:         boolean
  setCategories:   (cats: BudgetCategory[]) => void
  setCategorySpend:(cats: CategorySpend[]) => void
  setError:        (e: string | null) => void
}) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const [showAdd, setShowAdd]         = useState(false)
  const [editId, setEditId]           = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const [form, setForm] = useState<CreateBudgetCategoryPayload>({
    name: '', allocated_amount: 0, currency, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
  })

  function set(key: keyof CreateBudgetCategoryPayload, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    startTransition(async () => {
      setError(null)
      const { data, error } = await createBudgetCategory(programId, organizationId, form)
      if (error) { setError(error); return }
      if (data) setCategories([...categories, data])
      setShowAdd(false)
      setForm({ name: '', allocated_amount: 0, currency, color: CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length] })
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Expenditures will be unlinked.')) return
    startTransition(async () => {
      setError(null)
      const { error } = await deleteBudgetCategory(id)
      if (error) { setError(error); return }
      setCategories(categories.filter(c => c.id !== id))
    })
  }

  const spendMap = Object.fromEntries(categorySpend.map(c => [c.category_id, c]))

  return (
    <div>
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: COLORS.fern, color: '#fff', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={13} /> Add Category
          </button>
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="Name" required>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Staff & Personnel" />
              </FormField>
              <FormField label="Allocated Amount" required>
                <Input type="number" min={0} step="0.01" value={form.allocated_amount || ''} onChange={e => set('allocated_amount', parseFloat(e.target.value) || 0)} />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <FormField label="Description">
                <Input value={form.description ?? ''} onChange={e => set('description', e.target.value || undefined)} placeholder="Optional description" />
              </FormField>
              <FormField label="Color">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
                  {CATEGORY_COLORS.map(c => (
                    <button type="button" key={c} onClick={() => set('color', c)} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: form.color === c ? `2px solid ${COLORS.forest}` : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isPending} style={{ padding: '8px 16px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isPending ? <Loader2 size={13} /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
          No budget categories yet. {isAdmin && 'Add one to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map((cat, i) => {
            const spend = spendMap[cat.id]
            return (
              <div key={cat.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: COLORS.charcoal, fontSize: 14, marginBottom: 2 }}>{cat.name}</div>
                  {cat.description && <div style={{ fontSize: 12, color: COLORS.stone }}>{cat.description}</div>}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: COLORS.forest }}>{fmt(cat.allocated_amount)}</div>
                  {spend && <div style={{ fontSize: 11, color: COLORS.slate }}>Spent: {fmt(spend.spent)} · Remaining: {fmt(spend.remaining)}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(cat.id)} style={{ padding: '6px', borderRadius: 6, background: 'none', border: 'none', color: COLORS.stone, cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tranches Section ──────────────────────────────────────────────────────────

function TranchesSection({ programId, organizationId, currency, tranches, isAdmin, onRefresh, setError }: {
  programId:      string
  organizationId: string
  currency:       string
  tranches:       FundingTranche[]
  isAdmin:        boolean
  onRefresh:      () => Promise<void>
  setError:       (e: string | null) => void
}) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const [showAdd, setShowAdd]        = useState(false)
  const [editId, setEditId]          = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [newForm, setNewForm] = useState<CreateFundingTranchePayload>({
    tranche_number: tranches.length + 1,
    expected_amount: 0,
    currency,
    expected_date: todayISO(),
  })

  const [editForm, setEditForm] = useState<UpdateFundingTranchePayload>({})

  function setNew(key: keyof CreateFundingTranchePayload, val: unknown) {
    setNewForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      setError(null)
      const { error } = await createFundingTranche(programId, organizationId, newForm)
      if (error) { setError(error); return }
      await onRefresh()
      setShowAdd(false)
    })
  }

  async function handleUpdate(trancheId: string, e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      setError(null)
      const { error } = await updateFundingTranche(trancheId, editForm)
      if (error) { setError(error); return }
      await onRefresh()
      setEditId(null)
    })
  }

  const TRANCHE_STATUS_OPTIONS = [
    { value: 'EXPECTED',  label: 'Expected' },
    { value: 'RECEIVED',  label: 'Received' },
    { value: 'DELAYED',   label: 'Delayed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div>
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: COLORS.fern, color: '#fff', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={13} /> Add Tranche
          </button>
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="Tranche #" required>
                <Input type="number" min={1} value={newForm.tranche_number} onChange={e => setNew('tranche_number', parseInt(e.target.value))} />
              </FormField>
              <FormField label="Expected Amount" required>
                <Input type="number" min={0} step="0.01" value={newForm.expected_amount || ''} onChange={e => setNew('expected_amount', parseFloat(e.target.value) || 0)} />
              </FormField>
              <FormField label="Expected Date" required>
                <Input type="date" value={newForm.expected_date} onChange={e => setNew('expected_date', e.target.value)} />
              </FormField>
              <FormField label="Funder Name">
                <Input value={newForm.funder_name ?? ''} onChange={e => setNew('funder_name', e.target.value || undefined)} />
              </FormField>
            </div>
            <FormField label="Notes">
              <Textarea value={newForm.notes ?? ''} onChange={e => setNew('notes', e.target.value || undefined)} rows={2} />
            </FormField>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isPending} style={{ padding: '8px 16px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isPending ? <Loader2 size={13} /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tranches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
          No funding tranches recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tranches.map(t => {
            const colors = TRANCHE_STATUS_COLORS[t.status]
            return (
              <div key={t.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.forest, marginBottom: 4 }}>
                      Tranche {t.tranche_number}{t.funder_name ? ` — ${t.funder_name}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: COLORS.slate, flexWrap: 'wrap' }}>
                      <span>Expected: <strong>{fmt(t.expected_amount)}</strong> by {formatDate(t.expected_date)}</span>
                      {t.received_amount != null && (
                        <span>Received: <strong>{fmt(t.received_amount)}</strong>{t.received_date ? ` on ${formatDate(t.received_date)}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <StatusDot status={TRANCHE_STATUS_LABELS[t.status]} colors={colors} />
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditId(t.id)
                        setEditForm({ status: t.status, received_amount: t.received_amount ?? undefined, received_date: t.received_date ?? undefined, notes: t.notes ?? undefined })
                      }}
                      style={{ padding: '6px', background: 'none', border: 'none', color: COLORS.stone, cursor: 'pointer' }}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {editId === t.id && (
                  <form onSubmit={e => handleUpdate(t.id, e)} style={{ marginTop: 16, borderTop: `1px solid ${COLORS.mist}`, paddingTop: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <FormField label="Status">
                        <Select options={TRANCHE_STATUS_OPTIONS} value={editForm.status ?? t.status} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as typeof t.status }))} />
                      </FormField>
                      <FormField label="Received Amount">
                        <Input type="number" min={0} step="0.01" value={editForm.received_amount ?? ''} onChange={e => setEditForm(prev => ({ ...prev, received_amount: parseFloat(e.target.value) || undefined }))} />
                      </FormField>
                      <FormField label="Received Date">
                        <Input type="date" value={editForm.received_date ?? ''} onChange={e => setEditForm(prev => ({ ...prev, received_date: e.target.value || undefined }))} />
                      </FormField>
                      <FormField label="Notes">
                        <Input value={editForm.notes ?? ''} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value || undefined }))} />
                      </FormField>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => setEditId(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={isPending} style={{ padding: '7px 14px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Amendments Section ────────────────────────────────────────────────────────

function AmendmentsSection({ programId, organizationId, currentUserId, amendments, categories, currency, onRefresh, setError }: {
  programId:      string
  organizationId: string
  currentUserId:  string
  amendments:     BudgetAmendment[]
  categories:     BudgetCategory[]
  currency:       string
  onRefresh:      () => Promise<void>
  setError:       (e: string | null) => void
}) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const [showForm, setShowForm]      = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm]              = useState<CreateBudgetAmendmentPayload>({
    from_category_id: '',
    to_category_id:   '',
    amount:           0,
    reason:           '',
  })
  const [localError, setLocalError]  = useState<string | null>(null)

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  function set(key: keyof CreateBudgetAmendmentPayload, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.from_category_id) { setLocalError('Select source category'); return }
    if (!form.to_category_id)   { setLocalError('Select destination category'); return }
    if (form.from_category_id === form.to_category_id) { setLocalError('Source and destination must differ'); return }
    if (form.amount <= 0)       { setLocalError('Amount must be > 0'); return }
    if (!form.reason.trim())    { setLocalError('Reason is required'); return }
    setLocalError(null)
    startTransition(async () => {
      setError(null)
      const { error } = await createBudgetAmendment(programId, organizationId, currentUserId, form)
      if (error) { setError(error); return }
      await onRefresh()
      setShowForm(false)
      setForm({ from_category_id: '', to_category_id: '', amount: 0, reason: '' })
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: COLORS.slate, margin: 0 }}>
            Budget amendments are immutable — once recorded they cannot be changed. They represent approved transfers between categories.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: COLORS.fern, color: '#fff', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowRightLeft size={13} /> Record Amendment
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          {localError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{localError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="From Category" required>
                <Select options={[{ value: '', label: 'Select…' }, ...catOptions]} value={form.from_category_id} onChange={e => set('from_category_id', e.target.value)} />
              </FormField>
              <FormField label="To Category" required>
                <Select options={[{ value: '', label: 'Select…' }, ...catOptions]} value={form.to_category_id} onChange={e => set('to_category_id', e.target.value)} />
              </FormField>
              <FormField label="Amount" required>
                <Input type="number" min={0} step="0.01" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </FormField>
            </div>
            <FormField label="Reason" required>
              <Textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2} placeholder="Why is this amendment needed?" />
            </FormField>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#fff', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isPending} style={{ padding: '8px 16px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isPending ? <Loader2 size={13} /> : 'Record Amendment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {amendments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
          No budget amendments recorded yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Date', 'From', 'To', 'Amount', 'Reason', 'Approved by'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {amendments.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{formatDate(a.created_at)}</td>
                  <td style={{ padding: '10px 14px' }}>{a.from_category_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{a.to_category_name ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{fmt(a.amount)}</td>
                  <td style={{ padding: '10px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</td>
                  <td style={{ padding: '10px 14px', color: COLORS.slate }}>{a.approver_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
