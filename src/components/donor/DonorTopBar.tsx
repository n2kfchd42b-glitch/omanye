'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { signOut } from '@/app/actions/auth'

interface Props {
  donorName: string | null
  donorEmail: string
  /** Optional breadcrumb label for sub-pages (e.g. "Reports", "My Access") */
  breadcrumb?: string
}

const NAV_ITEMS = [
  { href: '/donor/dashboard',      label: 'Dashboard' },
  { href: '/donor/programs',       label: 'Programs' },
  { href: '/donor/reports',        label: 'Reports' },
  { href: '/donor/notifications',  label: 'Notifications' },
  { href: '/donor/access',         label: 'My Access' },
]

export default function DonorTopBar({ donorName, donorEmail, breadcrumb }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const displayName = donorName || donorEmail
  const initials = (donorName ?? donorEmail)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div style={{
      height: 58,
      background: COLORS.forest,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Logo + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/donor/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: '#D4AF5C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Palatino, Georgia, serif', fontWeight: 700, fontSize: 14, color: COLORS.forest,
          }}>O</div>
          <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0.5 }}>
            OMANYE
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>Donor Portal</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/donor/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right: Profile dropdown */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8,
            background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: COLORS.gold, color: COLORS.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
          <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
            borderRadius: 10, padding: '6px 0', minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${COLORS.mist}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{donorName ?? 'Donor'}</div>
              <div style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{donorEmail}</div>
            </div>

            <Link
              href="/donor/profile"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', fontSize: 13, color: COLORS.slate,
                textDecoration: 'none', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <User size={14} /> Profile & Settings
            </Link>

            <button
              onClick={() => signOut()}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', fontSize: 13, color: '#E53E3E',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,62,62,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
