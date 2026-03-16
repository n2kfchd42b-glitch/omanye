// ── OMANYE — Send Team Invitation Edge Function ───────────────────────────────
// Triggered by POST /api/team/invite via supabase.functions.invoke()
// Sends branded invitation email via Resend.
//
// Environment variables required:
//   RESEND_API_KEY   — Resend API key
//   SITE_URL         — e.g. https://app.omanye.com
//   FROM_EMAIL       — e.g. noreply@omanye.com

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SITE_URL       = Deno.env.get('SITE_URL')       ?? 'https://app.omanye.com'
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL')      ?? 'noreply@omanye.com'

// ── Role descriptions ─────────────────────────────────────────────────────────

const ROLE_COPY: Record<string, { label: string; description: string; bullets: string[] }> = {
  NGO_ADMIN: {
    label:       'Admin',
    description: 'Full access — manage team, settings, and donors',
    bullets: [
      'Manage all programs and indicators',
      'Invite and manage team members',
      'Control donor access and visibility',
      'Manage organization settings',
      'Access all reports and field data',
    ],
  },
  NGO_STAFF: {
    label:       'Staff',
    description: 'Can create and edit programs, submit field data, generate reports',
    bullets: [
      'Create and update programs and indicators',
      'Submit and manage field data',
      'Generate and submit reports',
      'View donor access information',
    ],
  },
  NGO_VIEWER: {
    label:       'Viewer',
    description: 'Read-only access — view programs and reports',
    bullets: [
      'View all programs and indicators',
      'Read reports and field data summaries',
      'Monitor program progress',
    ],
  },
}

// ── HTML email template ───────────────────────────────────────────────────────

function buildEmailHtml(opts: {
  orgName:      string
  orgLogoUrl:   string | null
  recipientName: string | null
  inviterName:  string
  role:         string
  message:      string | null
  inviteUrl:    string
  expiresAt:    string
}): string {
  const roleCopy   = ROLE_COPY[opts.role] ?? ROLE_COPY.NGO_VIEWER
  const greeting   = opts.recipientName ? `Hi ${opts.recipientName.split(' ')[0]},` : 'Hello,'
  const expiry     = new Date(opts.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const bulletList = roleCopy.bullets.map(b => `
    <li style="margin-bottom:6px; font-size:14px; color:#4A6355; line-height:1.5">
      <span style="color:#D4AF5C; margin-right:6px">✓</span>${b}
    </li>`).join('')

  const logoHtml = opts.orgLogoUrl
    ? `<img src="${opts.orgLogoUrl}" alt="${opts.orgName}" style="height:36px; margin-bottom:4px; border-radius:4px" />`
    : `<div style="display:inline-block; width:36px; height:36px; background:#D4AF5C; border-radius:8px; font-family:Palatino,Georgia,serif; font-weight:700; font-size:18px; color:#0D2B1E; text-align:center; line-height:36px">O</div>`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to join ${opts.orgName} on OMANYE</title>
</head>
<body style="margin:0; padding:0; background:#F4FAF6; font-family:'Instrument Sans',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAF6; padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(13,43,30,0.08)">

          <!-- Header -->
          <tr>
            <td style="background:#0D2B1E; padding:28px 36px 24px">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:12px">${logoHtml}</td>
                  <td style="vertical-align:middle">
                    <div style="font-family:Palatino,Georgia,serif; font-size:11px; font-weight:700; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2px">${opts.orgName}</div>
                    <div style="font-family:Palatino,Georgia,serif; font-size:16px; font-weight:700; color:#D4AF5C; letter-spacing:0.5px">OMANYE</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px">

              <h1 style="font-family:Palatino,Georgia,serif; font-size:22px; font-weight:700; color:#0D2B1E; margin:0 0 16px">
                You've been invited to join ${opts.orgName}
              </h1>

              <p style="font-size:15px; color:#4A6355; margin:0 0 20px; line-height:1.6">
                ${greeting}<br/><br/>
                <strong>${opts.inviterName}</strong> has invited you to join <strong>${opts.orgName}</strong>
                as a <strong>${roleCopy.label}</strong> on OMANYE.
              </p>

              ${opts.message ? `
              <div style="background:#EAF7EE; border-left:3px solid #D4AF5C; border-radius:0 8px 8px 0; padding:14px 18px; margin-bottom:24px">
                <p style="font-size:14px; color:#2C3E35; margin:0; line-height:1.6; font-style:italic">"${opts.message}"</p>
                <p style="font-size:12px; color:#7A9688; margin:8px 0 0">— ${opts.inviterName}</p>
              </div>
              ` : ''}

              <!-- Role card -->
              <div style="background:#F4FAF6; border:1px solid #C8EDD8; border-radius:12px; padding:20px 22px; margin-bottom:24px">
                <div style="font-size:11px; font-weight:700; color:#7A9688; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px">Your Role</div>
                <div style="display:flex; align-items:center; margin-bottom:8px">
                  <span style="background:#0D2B1E; color:#ffffff; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:0.5px">${roleCopy.label}</span>
                </div>
                <p style="font-size:13px; color:#4A6355; margin:0 0 12px; line-height:1.5">${roleCopy.description}</p>
                <ul style="margin:0; padding-left:0; list-style:none">
                  ${bulletList}
                </ul>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                <tr>
                  <td>
                    <a href="${opts.inviteUrl}"
                       style="display:inline-block; background:#D4AF5C; color:#0D2B1E; font-weight:700; font-size:15px;
                              padding:14px 32px; border-radius:10px; text-decoration:none; letter-spacing:0.2px">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px; color:#7A9688; margin:0 0 4px">
                Or copy this link into your browser:
              </p>
              <p style="font-size:12px; color:#2E7D52; word-break:break-all; margin:0 0 20px">
                ${opts.inviteUrl}
              </p>

              <p style="font-size:12px; color:#94A3B8; margin:0; padding-top:16px; border-top:1px solid #C8EDD8">
                This invitation expires on <strong>${expiry}</strong>.
                If you don't have an OMANYE account, you can create one when you accept.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0D2B1E; padding:20px 36px; text-align:center">
              <p style="font-family:Palatino,Georgia,serif; font-size:13px; color:#D4AF5C; margin:0 0 4px; letter-spacing:0.5px">OMANYE</p>
              <p style="font-size:11px; color:rgba(255,255,255,0.4); margin:0">NGO Workspace &amp; Donor Transparency Platform</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Edge function handler ─────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json() as {
      invitation_id: string
      token:         string
      email:         string
      full_name?:    string | null
      role:          string
      message?:      string | null
      org_name:      string
      org_logo_url?: string | null
      inviter_name:  string
      expires_at:    string
    }

    const inviteUrl = `${SITE_URL}/team/join/${body.token}`

    const html = buildEmailHtml({
      orgName:       body.org_name,
      orgLogoUrl:    body.org_logo_url ?? null,
      recipientName: body.full_name ?? null,
      inviterName:   body.inviter_name || 'Your team admin',
      role:          body.role,
      message:       body.message ?? null,
      inviteUrl,
      expiresAt:     body.expires_at,
    })

    const subject = `${body.inviter_name} invited you to join ${body.org_name} on OMANYE`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `OMANYE <${FROM_EMAIL}>`,
        to:      [body.email],
        subject,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text()
      console.error('Resend error:', resendError)
      return new Response(JSON.stringify({ error: 'Email delivery failed', detail: resendError }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
