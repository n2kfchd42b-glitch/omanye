import type { Metadata } from 'next'
import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: {
    default: 'OMANYE — NGO Workspace & Donor Transparency',
    template: '%s | OMANYE',
  },
  description:
    'One platform for NGOs to manage programs, track indicators, and share progress with donors on their own terms.',
  openGraph: {
    title: 'OMANYE — NGO Workspace & Donor Transparency',
    description:
      'One platform for NGOs to manage programs, track indicators, and share progress with donors on their own terms.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OMANYE — NGO Workspace & Donor Transparency',
    description:
      'One platform for NGOs to manage programs, track indicators, and share progress with donors on their own terms.',
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
