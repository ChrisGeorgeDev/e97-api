/**
 * Raw fetch to Resend's HTTP API (https://api.resend.com/emails), not an npm
 * provider package — there's no official @strapi/provider-email-resend, and
 * the community packages for it are unmaintained/unofficial. This mirrors
 * the same pattern already used for Clerk (see invitation/services), a
 * direct fetch against the vendor's REST API rather than an SDK dependency.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendInterestRegistrationEmail(params: {
  investorName: string;
  accountName: string;
  opportunityTitle: string;
  amount: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.INTEREST_NOTIFICATION_EMAIL || 'info@east97.ca';

  if (!apiKey || !from) {
    strapi.log.warn(
      'RESEND_API_KEY/RESEND_FROM_EMAIL not set — skipping interest registration notification email'
    );
    return;
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(params.amount);

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Investment interest registered — ${params.opportunityTitle}`,
      html: `
        <p>A new investment interest registration has been recorded in the investor portal.</p>
        <ul>
          <li><strong>Investor:</strong> ${params.investorName}</li>
          <li><strong>Account:</strong> ${params.accountName}</li>
          <li><strong>Opportunity:</strong> ${params.opportunityTitle}</li>
          <li><strong>Amount:</strong> ${formattedAmount}</li>
        </ul>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status} - ${await response.text()}`);
  }
}
