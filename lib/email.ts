type BrevoSendParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function isEmailConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY &&
      process.env.OTP_FROM_EMAIL &&
      process.env.OTP_FROM_NAME,
  );
}

async function brevoSend(p: BrevoSendParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY!;
  const fromEmail = process.env.OTP_FROM_EMAIL!;
  const fromName = process.env.OTP_FROM_NAME!;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: p.to }],
      subject: p.subject,
      htmlContent: p.html,
      textContent: p.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = `Your verification code: ${code}`;
  const text = `Your verification code is ${code}. It expires in 10 minutes.

If you didn't request this, you can ignore this email.

— ps-shin's portfolio demo`;
  const html = `<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.6; color: #0a0a0a;">
  <div style="max-width: 480px; margin: 32px auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
    <p style="margin: 0 0 16px; font-size: 13px; color: #71717a; letter-spacing: 0.08em; text-transform: uppercase;">Verification code</p>
    <p style="margin: 0 0 24px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.2em;">${code}</p>
    <p style="margin: 0 0 8px; font-size: 14px; color: #52525b;">This code expires in 10 minutes.</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #52525b;">If you didn't request it, just ignore this email.</p>
    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">— ps-shin's portfolio demo</p>
  </div>
</body></html>`;
  await brevoSend({ to, subject, html, text });
}
