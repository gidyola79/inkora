type SendResult = { delivered: boolean };

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

function getBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return null;
  return {
    apiKey,
    senderEmail,
    senderName: process.env.BREVO_SENDER_NAME ?? "Inkora",
  };
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const config = getBrevoConfig();
  if (!config) {
    console.info(
      `[email] BREVO_API_KEY/BREVO_SENDER_EMAIL not set - skipping "${subject}" to ${to}`
    );
    return { delivered: false };
  }

  try {
    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: config.senderName, email: config.senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[email] Brevo rejected "${subject}" to ${to}: ${response.status} ${detail}`
      );
      return { delivered: false };
    }
    return { delivered: true };
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
    return { delivered: false };
  }
}

function layout(title: string, bodyHtml: string, footnote?: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f3ee;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;border:1px solid #e7e2d8;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <p style="margin:0;font-size:22px;letter-spacing:0.08em;color:#1a1a18;">INKORA</p>
                <h1 style="margin:18px 0 0 0;font-size:24px;line-height:1.25;color:#1a1a18;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;font-size:15px;line-height:1.65;color:#43413c;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                ${footnote ? `<p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:#8a867d;">${footnote}</p>` : ""}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#8a867d;">Inkora - Write. Publish. Be Heard.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:8px;padding:12px 26px;background-color:#1a1a18;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-family:Helvetica,Arial,sans-serif;">${label}</a>`;
}

function displayName(name: string, username?: string | null): string {
  if (name && name.trim()) return escapeHtml(name.trim());
  if (username) return `@${escapeHtml(username)}`;
  return "there";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string | null;
  url: string;
}): Promise<SendResult> {
  const greeting = displayName(params.name ?? "");
  const subject = "Verify your email for Inkora";
  const html = layout(
    "Confirm it's you",
    `<p>Hi ${greeting},</p>
     <p>Welcome to Inkora! Please confirm this email address so we know it belongs to you.</p>
     <p>${button(params.url, "Verify my email")}</p>
     <p>If the button doesn't work, copy this link into your browser:<br /><a href="${params.url}" style="color:#1a1a18;">${params.url}</a></p>`,
    "You can still use Inkora without verifying, but verifying keeps your account recoverable."
  );
  return sendEmail(params.to, subject, html);
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string | null;
  username?: string | null;
}): Promise<SendResult> {
  const greeting = displayName(params.name ?? "", params.username);
  const handle = params.username ? `@${escapeHtml(params.username)}` : null;
  const subject = "Welcome to Inkora";
  const html = layout(
    "You're in.",
    `<p>Hi ${greeting},</p>
     <p>Your account is live${handle ? ` and your handle is <strong>${handle}</strong>` : ""} - people can find, follow, and message you with it.</p>
     <p>A few things worth trying first:</p>
     <ul style="margin:8px 0;padding-left:20px;">
       <li>Publish your first article - drafts stay private until you're ready.</li>
       <li>Follow writers from Explore to build a feed that feels like yours.</li>
       <li>Turn any article into flashcards with one click.</li>
     </ul>
     <p>${button("https://inkorablog.vercel.app/dashboard", "Open your dashboard")}</p>`,
    "We only email you when something important happens - mentions, replies, and security updates."
  );
  return sendEmail(params.to, subject, html);
}

export async function sendResetPasswordEmail(params: {
  to: string;
  name?: string | null;
  url: string;
}): Promise<SendResult> {
  const greeting = displayName(params.name ?? "");
  const subject = "Reset your Inkora password";
  const html = layout(
    "Password reset",
    `<p>Hi ${greeting},</p>
     <p>We received a request to reset the password on your Inkora account. Click below to choose a new one.</p>
     <p>${button(params.url, "Choose a new password")}</p>
     <p>If the button doesn't work, copy this link into your browser:<br /><a href="${params.url}" style="color:#1a1a18;">${params.url}</a></p>`,
    "This link expires in one hour and can be used once. If you didn't ask for a reset, ignore this email - your password stays as it was."
  );
  return sendEmail(params.to, subject, html);
}
