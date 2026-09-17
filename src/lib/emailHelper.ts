/**
 * SamplesWala Admin Support Email Notification Helper
 * Sends branded, responsive email notifications when staff reply to support tickets.
 */

const LOGO_URL = 'https://imagizer.imageshack.com/img924/3747/53oszD.png'
const SITE_URL = 'https://www.sampleswala.com'

interface SendTicketReplyEmailParams {
  to: string
  customerName?: string
  ticketNumber: string
  subject: string
  replyMessage: string
  agentName?: string
  status?: string
}

export async function sendTicketReplyNotificationEmail({
  to,
  customerName,
  ticketNumber,
  subject,
  replyMessage,
  agentName = 'SamplesWala Audio Engineer',
  status = 'in_progress',
}: SendTicketReplyEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[SUPPORT_EMAIL] RESEND_API_KEY is not set. Email notification skipped.')
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  const formattedName = customerName ? customerName.toUpperCase() : 'PRODUCER'
  const isResolved = status === 'resolved' || status === 'closed'
  const statusLabel = isResolved ? 'RESOLVED' : 'IN PROGRESS'
  const statusColor = isResolved ? '#00FF94' : '#FFE600'
  const ticketUrl = `${SITE_URL}/support?ticket=${encodeURIComponent(ticketNumber)}`

  // Escape HTML in user content
  const safeMessage = replyMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>')

  const safeSubject = subject
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Update: Ticket #${ticketNumber}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 25px 20px !important; }
      .header { padding: 30px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Top Accent Gradient Line -->
        <div style="max-width: 600px; width: 100%; height: 4px; background: linear-gradient(90deg, #FFE600, #0074E4, #00FF94);"></div>
        
        <table border="0" cellpadding="0" cellspacing="0" class="container" style="max-width: 600px; width: 100%; background-color: #0d0d0d; border: 1px solid #222222; border-top: none;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" class="header" style="padding: 40px 30px 30px 30px; background-color: #090909; border-bottom: 1px solid #1f1f1f;">
              <a href="${SITE_URL}" style="text-decoration: none; display: block;">
                <img src="${LOGO_URL}" alt="SamplesWala" width="190" style="display: block; margin: 0 auto; border: none; max-width: 100%; height: auto;" />
              </a>
              <div style="margin-top: 18px; display: inline-block; padding: 4px 12px; background-color: rgba(255, 230, 0, 0.1); border: 1px solid rgba(255, 230, 0, 0.25); border-radius: 4px;">
                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #FFE600;">
                  Official Engineer Response
                </span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content" style="padding: 35px 30px; background-color: #0d0d0d;">
              <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #888888; text-transform: uppercase; letter-spacing: 1.5px;">
                Hello ${formattedName},
              </p>
              
              <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 900; color: #ffffff; text-transform: uppercase; line-height: 1.4;">
                Update on Ticket <span style="color: #FFE600;">#${ticketNumber}</span>
              </h2>

              <!-- Ticket Info Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141414; border: 1px solid #252525; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #202020;">
                    <span style="font-size: 10px; font-weight: 800; color: #777777; text-transform: uppercase; letter-spacing: 1px;">Subject:</span>
                    <div style="font-size: 13px; font-weight: 700; color: #eeeeee; margin-top: 2px;">${safeSubject}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 11px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left">
                          <span style="color: #777777; font-weight: 700; text-transform: uppercase;">Ticket Status:</span>
                          <span style="color: ${statusColor}; font-weight: 900; text-transform: uppercase; margin-left: 6px;">
                            ${statusLabel}
                          </span>
                        </td>
                        <td align="right">
                          <span style="color: #777777; font-weight: 700; text-transform: uppercase;">Staff:</span>
                          <span style="color: #ffffff; font-weight: 800; margin-left: 6px;">${agentName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Engineer Reply Bubble -->
              <div style="background-color: #161a22; border: 1px solid #1f2937; border-left: 4px solid #0074E4; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #60a5fa; margin-bottom: 10px;">
                  Message from ${agentName}:
                </div>
                <div style="font-size: 14px; line-height: 1.7; color: #f3f4f6; font-family: inherit;">
                  ${safeMessage}
                </div>
              </div>

              <!-- Action CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #FFE600; border-radius: 6px; box-shadow: 0 4px 15px rgba(255, 230, 0, 0.2);">
                          <a href="${ticketUrl}" 
                             style="display: inline-block; padding: 14px 28px; font-size: 12px; font-weight: 900; color: #000000; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px;">
                            View &amp; Reply to Ticket
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11px; text-align: center; color: #777777; line-height: 1.5;">
                You can view the full conversation thread and send a follow-up reply directly on our support portal anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #080808; border-top: 1px solid #1a1a1a;">
              <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                SamplesWala Audio Diagnostics &amp; Engineering Support
              </p>
              <p style="margin: 0 0 14px 0; font-size: 10px; color: #444444;">
                Husen Nagar, Kolhewadi Road, Near Tajgarden, Sangamner 422605
              </p>
              <p style="margin: 0; font-size: 9px; color: #333333; text-transform: uppercase; font-weight: 700;">
                &copy; ${new Date().getFullYear()} SAMPLES WALA. ALL RIGHTS RESERVED.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Samples Wala Support <info@sampleswala.com>',
        to: [to],
        subject: `[Ticket #${ticketNumber}] Update: ${subject}`,
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const errData = await res.text()
      console.error('[RESEND_API_ERROR]', res.status, errData)
      return { success: false, error: errData }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[SEND_TICKET_EMAIL_EXCEPTION]', err)
    return { success: false, error: err?.message || 'Email sending failed' }
  }
}
