import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/email/send — Phase 8C: Centralized Email SMTP Relay
//
// Pure SMTP transport — server knows nothing about templates or email types.
// Caller provides everything: to, subject, html, cc, bcc, attachments.
// Auth: x-api-key header validated against EMAIL_API_KEY env var.
// ═══════════════════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(
  emails: string | string[] | undefined,
  fieldName: string,
): string | null {
  if (!emails) return null;
  const list = Array.isArray(emails) ? emails : [emails];
  for (const email of list) {
    if (!EMAIL_REGEX.test(email.trim())) {
      return `Invalid email address in '${fieldName}': ${email}`;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. API Key Authentication ──────────────────────────────────────────
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.EMAIL_API_KEY;

    if (!expectedKey) {
      console.error(
        "[EMAIL_ERROR] EMAIL_API_KEY environment variable is not set",
      );
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      console.warn(
        "[EMAIL_AUTH] Unauthorized request — invalid or missing API key",
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // ── 2. Parse & Validate Body ───────────────────────────────────────────
    const body = await request.json();
    const { to, subject, html, text, cc, bcc, replyTo, attachments } = body;

    // Required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, subject, and html are required",
        },
        { status: 400 },
      );
    }

    // ── 3. Validate Email Addresses ────────────────────────────────────────
    const toError = validateEmails(to, "to");
    if (toError) {
      return NextResponse.json(
        { success: false, error: toError },
        { status: 400 },
      );
    }

    const ccError = validateEmails(cc, "cc");
    if (ccError) {
      return NextResponse.json(
        { success: false, error: ccError },
        { status: 400 },
      );
    }

    const bccError = validateEmails(bcc, "bcc");
    if (bccError) {
      return NextResponse.json(
        { success: false, error: bccError },
        { status: 400 },
      );
    }

    if (replyTo && !EMAIL_REGEX.test(replyTo.trim())) {
      return NextResponse.json(
        { success: false, error: `Invalid replyTo email: ${replyTo}` },
        { status: 400 },
      );
    }

    // ── 4. Decode Base64 Attachments ───────────────────────────────────────
    let processedAttachments:
      | Array<{ filename: string; content: Buffer; contentType?: string }>
      | undefined;

    if (attachments && Array.isArray(attachments)) {
      processedAttachments = attachments.map(
        (att: { filename: string; content: string; contentType?: string }) => ({
          filename: att.filename,
          content: Buffer.from(att.content, "base64"),
          contentType: att.contentType,
        }),
      );
    }

    // ── 5. Send Email ──────────────────────────────────────────────────────
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      attachments: processedAttachments,
    });

    if (!result.success) {
      console.error("[EMAIL_ERROR]", { to, subject, error: result.error });
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email" },
        { status: 500 },
      );
    }

    // ── 6. Success ─────────────────────────────────────────────────────────
    console.log("[EMAIL_API]", {
      to,
      subject,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("[EMAIL_ERROR] Unhandled:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
