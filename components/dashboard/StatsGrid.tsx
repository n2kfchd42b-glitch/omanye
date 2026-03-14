import React from 'react'
import { Users, FolderOpen, FileText, HandHeart } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { formatNumber } from '@/lib/utils'
import { STATS } from '@/lib/mock-data'

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Beneficiaries"
        value={formatNumber(STATS.totalBeneficiaries)}
        subtext="across all active projects"
        trend={9}
        icon={<Users size={16} />}
        accent="green"
      />
      <StatCard
        label="Active Projects"
        value={STATS.activeProjects}
        subtext={`${STATS.fieldWorkers} field workers deployed`}
        trend={2}
        icon={<FolderOpen size={16} />}
        accent="green"
      />
      <StatCard
        label="Reports This Month"
        value={STATS.reportsThisMonth}
        subtext="3 awaiting review"
        trend={14}
        icon={<FileText size={16} />}
        accent="blue"
      />
      <StatCard
        label="Active Donors"
        value={STATS.donorsActive}
        subtext={`${STATS.grantsFunded} grants funded`}
        trend={-3}
        icon={<HandHeart size={16} />}
        accent="gold"
      />
    </div>
  )
}
