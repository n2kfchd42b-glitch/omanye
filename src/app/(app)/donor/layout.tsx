import { requireDonorAuth } from '@/lib/auth/server'
import DonorTopBar from '@/components/donor/DonorTopBar'
import { COLORS } from '@/lib/tokens'

export default async function DonorLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireDonorAuth()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      <DonorTopBar
        donorName={user.profile.full_name}
        donorEmail={user.email}
      />
      {children}
    </div>
  )
}
