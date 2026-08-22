type SecurityEvent =
  | "auth.login_failed"
  | "auth.login_succeeded"
  | "ratelimit.blocked"
  | "upload.rejected"
  | "account.deleted"
  | "email.changed"
  | "password.reset_requested"
  | "notification.reported";

/**
 * Structured security log lines. Rendered as single-line JSON so Vercel's
 * log drain and any downstream alerting can filter on event names.
 */
export function logSecurityEvent(
  event: SecurityEvent,
  details: Record<string, unknown> = {}
) {
  console.warn(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "security",
      event,
      ...details,
    })
  );
}
