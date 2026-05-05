/**
 * Postmark Email Integration
 *
 * Sends transactional emails via the Postmark API. Used for:
 * 1. Notifying the DavidPM team when a purchase inquiry is submitted
 * 2. Sending the prospect an instant confirmation with next steps
 * 3. Notifying the DavidPM team when a general contact form is submitted
 * 4. Sending the contact submitter an instant confirmation
 *
 * Requires POSTMARK_SERVER_TOKEN and PURCHASE_NOTIFY_EMAIL in env.
 * (Contact form notifications also route to PURCHASE_NOTIFY_EMAIL — it
 * is the single inbound address for all DavidPM sales/contact traffic.)
 *
 * @see https://postmarkapp.com/developer/api/email-api
 */

import { env } from '$env/dynamic/private';

/**
 * The "from" address for all outbound emails.
 * Must be a verified sender signature in your Postmark account.
 */
const FROM_ADDRESS = 'support@davidpm.pro';

/**
 * Send an email via Postmark's REST API.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param htmlBody - HTML body content
 * @param textBody - Plain text fallback
 */
async function sendEmail(
	to: string,
	subject: string,
	htmlBody: string,
	textBody: string
): Promise<void> {
	const token = env.POSTMARK_SERVER_TOKEN;

	if (!token) {
		console.warn('[Postmark] POSTMARK_SERVER_TOKEN not configured — email skipped:', subject);
		return;
	}

	const response = await fetch('https://api.postmarkapp.com/email', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': token
		},
		body: JSON.stringify({
			From: FROM_ADDRESS,
			To: to,
			Subject: subject,
			HtmlBody: htmlBody,
			TextBody: textBody,
			MessageStream: 'outbound'
		})
	});

	if (!response.ok) {
		const body = await response.text();
		console.error(`[Postmark] Failed to send email to ${to}: ${response.status} ${body}`);
		throw new Error(`Postmark send failed: ${response.status}`);
	}
}

/**
 * Shape of the dashboard inquiry form data.
 *
 * A single submission type covers two user intents — direct purchase and
 * meeting request — which branch the email templates below. The older
 * `organizationSize` field was removed because the source-code license
 * model is size-agnostic and the field was not being persisted.
 */
export interface PurchaseInquiry {
	name: string;
	email: string;
	organizationName: string;
	message: string;
	/** 'purchase' = send agreement + invoice. 'meeting' = route to sales. */
	requestType: 'purchase' | 'meeting';
	/** Optional sales-agent attribution captured from the form. */
	salesAgent: string | null;
}

/**
 * Send the internal notification email when a dashboard inquiry is submitted.
 * This goes to the DavidPM team (PURCHASE_NOTIFY_EMAIL). Subject line and
 * body copy vary by requestType so the team can triage at a glance.
 */
export async function sendInquiryNotification(inquiry: PurchaseInquiry): Promise<void> {
	const notifyEmail = env.PURCHASE_NOTIFY_EMAIL;
	if (!notifyEmail) {
		console.warn('[Postmark] PURCHASE_NOTIFY_EMAIL not configured — notification skipped');
		return;
	}

	const kindLabel = inquiry.requestType === 'meeting' ? 'Meeting request' : 'Purchase inquiry';
	const subject = `${kindLabel} from ${inquiry.name} — ${inquiry.organizationName}`;

	const agentRow = inquiry.salesAgent
		? `
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Sales agent</td>
    <td style="padding: 8px 12px;">${escapeHtml(inquiry.salesAgent)}</td>
  </tr>`
		: '';

	const htmlBody = `
<h2>New Primer ${escapeHtml(kindLabel)}</h2>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Name</td>
    <td style="padding: 8px 12px;">${escapeHtml(inquiry.name)}</td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Email</td>
    <td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(inquiry.email)}">${escapeHtml(inquiry.email)}</a></td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Organization</td>
    <td style="padding: 8px 12px;">${escapeHtml(inquiry.organizationName)}</td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Request type</td>
    <td style="padding: 8px 12px;">${escapeHtml(kindLabel)}</td>
  </tr>${agentRow}
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Message</td>
    <td style="padding: 8px 12px;">${escapeHtml(inquiry.message).replace(/\n/g, '<br>')}</td>
  </tr>
</table>
<p style="margin-top: 24px; color: #666;">
  Reply to this email to reach the prospect directly at ${escapeHtml(inquiry.email)}.
</p>
`;

	const agentLine = inquiry.salesAgent ? `\nSales agent: ${inquiry.salesAgent}` : '';
	const textBody = `New Primer ${kindLabel}

Name: ${inquiry.name}
Email: ${inquiry.email}
Organization: ${inquiry.organizationName}
Request type: ${kindLabel}${agentLine}

Message:
${inquiry.message}

Reply to this email to reach the prospect at ${inquiry.email}.`;

	await sendEmail(notifyEmail, subject, htmlBody, textBody);
}

/**
 * Send the prospect an instant confirmation email with next steps.
 *
 * Copy branches on requestType: direct buyers get the agreement/invoice
 * next-steps list; meeting requesters get a "we'll reach out to schedule"
 * message instead.
 */
export async function sendInquiryConfirmation(inquiry: PurchaseInquiry): Promise<void> {
	if (inquiry.requestType === 'meeting') {
		const subject = 'Primer — We received your meeting request';

		const htmlBody = `
<p>Hi ${escapeHtml(inquiry.name)},</p>

<p>Thank you for your interest in Primer. We've received your request to talk
about ${escapeHtml(inquiry.organizationName)} and someone from our team will
reach out within one business day to schedule a time.</p>

<p>If you'd rather share anything before we meet — technical questions,
deployment constraints, timeline — reply to this email and we'll come
prepared.</p>

<p>— The DavidPM Team</p>
`;

		const textBody = `Hi ${inquiry.name},

Thank you for your interest in Primer. We've received your request to talk about ${inquiry.organizationName} and someone from our team will reach out within one business day to schedule a time.

If you'd rather share anything before we meet — technical questions, deployment constraints, timeline — reply to this email and we'll come prepared.

— The DavidPM Team`;

		await sendEmail(inquiry.email, subject, htmlBody, textBody);
		return;
	}

	// Direct-purchase path: send the agreement + invoice next-steps list.
	const subject = 'Primer License — We received your inquiry';

	const htmlBody = `
<p>Hi ${escapeHtml(inquiry.name)},</p>

<p>Thank you for your interest in Primer. We've received your inquiry for
${escapeHtml(inquiry.organizationName)} and will respond within one business day.</p>

<h3>What happens next</h3>
<ol>
  <li><strong>License agreement</strong> — We'll send you a license agreement for electronic signature.</li>
  <li><strong>Invoice</strong> — A $5,000 invoice for the perpetual source code license.</li>
  <li><strong>Source code delivery</strong> — Upon payment and signature, you'll receive access to download the complete Primer source code from your dashboard.</li>
</ol>

<p>The license is perpetual. You have the source code, deploy it on your infrastructure,
and modify it however you need. No subscription, no recurring fees, no vendor dependency.</p>

<p>If you have any questions before then, reply to this email.</p>

<p>— The DavidPM Team</p>
`;

	const textBody = `Hi ${inquiry.name},

Thank you for your interest in Primer. We've received your inquiry for ${inquiry.organizationName} and will respond within one business day.

What happens next:
1. License agreement — We'll send you a license agreement for electronic signature.
2. Invoice — A $5,000 invoice for the perpetual source code license.
3. Source code delivery — Upon payment and signature, you'll receive access to download the complete Primer source code from your dashboard.

The license is perpetual. You have the source code, deploy it on your infrastructure, and modify it however you need. No subscription, no recurring fees, no vendor dependency.

If you have any questions before then, reply to this email.

— The DavidPM Team`;

	await sendEmail(inquiry.email, subject, htmlBody, textBody);
}

/** Shape of the general contact form data */
export interface ContactMessage {
	name: string;
	email: string;
	company: string;
	message: string;
}

/**
 * Send the internal notification email when a contact form is submitted.
 * Routes to PURCHASE_NOTIFY_EMAIL (the single inbound DavidPM address).
 */
export async function sendContactNotification(contact: ContactMessage): Promise<void> {
	const notifyEmail = env.PURCHASE_NOTIFY_EMAIL;
	if (!notifyEmail) {
		console.warn('[Postmark] PURCHASE_NOTIFY_EMAIL not configured — contact notification skipped');
		return;
	}

	const orgLabel = contact.company || '(no company)';
	const subject = `Contact form: ${contact.name} — ${orgLabel}`;

	const htmlBody = `
<h2>New Primer Contact Form Submission</h2>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Name</td>
    <td style="padding: 8px 12px;">${escapeHtml(contact.name)}</td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Email</td>
    <td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Company</td>
    <td style="padding: 8px 12px;">${escapeHtml(contact.company) || '<em>Not provided</em>'}</td>
  </tr>
  <tr>
    <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Message</td>
    <td style="padding: 8px 12px;">${escapeHtml(contact.message).replace(/\n/g, '<br>')}</td>
  </tr>
</table>
<p style="margin-top: 24px; color: #666;">
  Reply to this email to reach ${escapeHtml(contact.name)} directly at ${escapeHtml(contact.email)}.
</p>
`;

	const textBody = `New Primer Contact Form Submission

Name: ${contact.name}
Email: ${contact.email}
Company: ${contact.company || '(not provided)'}

Message:
${contact.message}

Reply to this email to reach ${contact.name} at ${contact.email}.`;

	await sendEmail(notifyEmail, subject, htmlBody, textBody);
}

/**
 * Send the contact submitter an instant confirmation email.
 */
export async function sendContactConfirmation(contact: ContactMessage): Promise<void> {
	const subject = 'Primer — We received your message';

	const htmlBody = `
<p>Hi ${escapeHtml(contact.name)},</p>

<p>Thanks for reaching out to DavidPM. We've received your message and a real
person will read it. We typically respond within one business day.</p>

<p>For reference, here is what you sent us:</p>

<blockquote style="border-left: 3px solid #ccc; padding: 8px 16px; color: #555; margin: 16px 0;">
${escapeHtml(contact.message).replace(/\n/g, '<br>')}
</blockquote>

<p>If you need to add anything, just reply to this email — it will land in the
same inbox.</p>

<p>— The DavidPM Team</p>
`;

	const textBody = `Hi ${contact.name},

Thanks for reaching out to DavidPM. We've received your message and a real person will read it. We typically respond within one business day.

For reference, here is what you sent us:

${contact.message}

If you need to add anything, just reply to this email — it will land in the same inbox.

— The DavidPM Team`;

	await sendEmail(contact.email, subject, htmlBody, textBody);
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
