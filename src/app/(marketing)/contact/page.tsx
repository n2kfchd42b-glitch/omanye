'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const serif = { fontFamily: 'var(--font-fraunces),Georgia,serif' }
const sans  = { fontFamily: 'var(--font-instrument),system-ui,sans-serif' }

const SUBJECTS = [
  'General Inquiry',
  'Enterprise Sales',
  'Demo Request',
  'Support',
  'Partnership',
]

const EMAIL_GENERAL  = process.env.NEXT_PUBLIC_CONTACT_EMAIL_GENERAL  ?? 'hello@omanye.io'
const EMAIL_SALES    = process.env.NEXT_PUBLIC_CONTACT_EMAIL_SALES    ?? 'sales@omanye.io'
const EMAIL_SUPPORT  = process.env.NEXT_PUBLIC_CONTACT_EMAIL_SUPPORT  ?? 'support@omanye.io'

const CONTACT_ITEMS = [
  { label: 'General',          email: EMAIL_GENERAL, Icon: Mail },
  { label: 'Sales & Enterprise', email: EMAIL_SALES,  Icon: MessageSquare },
  { label: 'Support',          email: EMAIL_SUPPORT, Icon: MessageSquare },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    subject: SUBJECTS[0],
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    setErrorMsg('')

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('contact_submissions').insert({
      name: form.name,
      email: form.email,
      organization: form.organization || null,
      subject: form.subject,
      message: form.message,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(`Something went wrong. Please email us directly at ${EMAIL_GENERAL}.`)
    } else {
      setStatus('sent')
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16" style={{ background: '#0F1B33' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF5C', ...sans }}>
            Contact
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: 'white', ...serif }}>
            Get in touch
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)', ...sans }}>
            Have a question, want a demo, or exploring an enterprise arrangement?
            We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — contact info */}
            <div>
              <h2 className="text-2xl font-bold mb-8" style={{ color: '#0F1B33', ...serif }}>
                Reach us directly
              </h2>
              <div className="flex flex-col gap-5 mb-12">
                {CONTACT_ITEMS.map(({ label, email, Icon }) => (
                  <div key={email} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(212,175,92,0.1)', color: '#D4AF5C' }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(15,27,51,0.4)', ...sans }}>
                        {label}
                      </p>
                      <a
                        href={`mailto:${email}`}
                        className="text-base font-medium transition-colors duration-150"
                        style={{ color: '#0F1B33', ...sans }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF5C')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0F1B33')}
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-2xl p-6"
                style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.07)' }}
              >
                <h3 className="font-semibold mb-2 text-base" style={{ color: '#0F1B33', ...serif }}>
                  Response times
                </h3>
                <div className="flex flex-col gap-2 text-sm" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>
                  <div className="flex justify-between">
                    <span>General inquiries</span>
                    <span className="font-medium" style={{ color: '#0F1B33' }}>Within 2 business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demo requests</span>
                    <span className="font-medium" style={{ color: '#0F1B33' }}>Within 1 business day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support (Pro)</span>
                    <span className="font-medium" style={{ color: '#0F1B33' }}>Within 4 hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div>
              {status === 'sent' ? (
                <div
                  className="rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full"
                  style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.07)' }}
                >
                  <CheckCircle size={48} style={{ color: '#D4AF5C' }} className="mb-5" />
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#0F1B33', ...serif }}>
                    Message received
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>
                    Thank you for reaching out. We&apos;ll get back to you within 2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Name */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'rgba(15,27,51,0.75)', ...sans }}
                    >
                      Name <span style={{ color: '#D4AF5C' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
                      style={{
                        background: '#F8F8F6',
                        border: '1px solid rgba(15,27,51,0.12)',
                        color: '#0F1B33',
                        ...sans,
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#D4AF5C')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(15,27,51,0.12)')}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(15,27,51,0.75)', ...sans }}>
                      Email <span style={{ color: '#D4AF5C' }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@organization.org"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
                      style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.12)', color: '#0F1B33', ...sans }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#D4AF5C')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(15,27,51,0.12)')}
                    />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(15,27,51,0.75)', ...sans }}>
                      Organization
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={form.organization}
                      onChange={handleChange}
                      placeholder="Your NGO or organization name"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
                      style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.12)', color: '#0F1B33', ...sans }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#D4AF5C')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(15,27,51,0.12)')}
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(15,27,51,0.75)', ...sans }}>
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150 cursor-pointer"
                      style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.12)', color: '#0F1B33', ...sans }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#D4AF5C')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(15,27,51,0.12)')}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(15,27,51,0.75)', ...sans }}>
                      Message <span style={{ color: '#D4AF5C' }}>*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150 resize-none"
                      style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.12)', color: '#0F1B33', ...sans }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#D4AF5C')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(15,27,51,0.12)')}
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-sm" style={{ color: '#C0392B', ...sans }}>{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{
                      background: status === 'sending' ? 'rgba(212,175,92,0.6)' : '#D4AF5C',
                      color: '#0F1B33',
                      cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                      ...sans,
                    }}
                  >
                    {status === 'sending' ? (
                      <>Sending…</>
                    ) : (
                      <><Send size={16} /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
