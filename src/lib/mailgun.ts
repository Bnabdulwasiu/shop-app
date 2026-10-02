import FormData from "form-data";
import Mailgun from "mailgun.js";
import { formatMoney } from "./money";
import { isMailgunConfigured, SITE_URL } from "./supabase/config";

type ConfirmationEmailItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type ConfirmationEmailInput = {
  to: string;
  customerName: string;
  orderNumber: string;
  items: ConfirmationEmailItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingAddress: string;
};

export type SendEmailResult =
  | { sent: true; id: string | undefined }
  | { sent: false; reason: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderOrderEmail(input: ConfirmationEmailInput) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)} &times; ${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(
            item.lineTotalCents,
            input.currency
          )}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:12px;padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;">Thanks for your order, ${escapeHtml(
          input.customerName
        )}!</h1>
        <p style="margin:0 0 24px;color:#52525b;font-size:14px;">
          We&rsquo;ve received your order <strong>${escapeHtml(
            input.orderNumber
          )}</strong> and we&rsquo;re getting it ready to ship.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>${rows}</tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
          <tr>
            <td style="padding:4px 0;color:#52525b;">Subtotal</td>
            <td style="padding:4px 0;text-align:right;">${formatMoney(
              input.subtotalCents,
              input.currency
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#52525b;">Shipping</td>
            <td style="padding:4px 0;text-align:right;">${
              input.shippingCents === 0 ? "Free" : formatMoney(input.shippingCents, input.currency)
            }</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-weight:bold;">Total</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;">${formatMoney(
              input.totalCents,
              input.currency
            )}</td>
          </tr>
        </table>

        <h2 style="margin:28px 0 6px;font-size:14px;color:#18181b;">Shipping to</h2>
        <p style="margin:0;color:#52525b;font-size:14px;white-space:pre-line;">${escapeHtml(
          input.shippingAddress
        )}</p>

        <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">
          You can view your orders any time at
          <a href="${SITE_URL}/orders" style="color:#2563eb;">${SITE_URL}/orders</a>.
        </p>
      </div>
      <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:16px;">
        Shop &middot; This is an automated confirmation email.
      </p>
    </div>
  </body>
</html>`;
}

/**
 * Send the order confirmation email through Mailgun.
 * Returns a result object instead of throwing so a mail failure never loses an order.
 */
export async function sendOrderConfirmationEmail(
  input: ConfirmationEmailInput
): Promise<SendEmailResult> {
  if (!isMailgunConfigured) {
    console.warn(
      "[mailgun] Skipping confirmation email: MAILGUN_API_KEY / MAILGUN_DOMAIN are not set."
    );
    return { sent: false, reason: "Mailgun not configured" };
  }

  const domain = process.env.MAILGUN_DOMAIN as string;
  const fromAddress = process.env.MAILGUN_FROM || `Shop <postmaster@${domain}>`;

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY as string,
    // Use https://api.eu.mailgun.net here if your Mailgun domain lives in the EU region.
    url: process.env.MAILGUN_URL || "https://api.mailgun.net",
  });

  try {
    const result = await client.messages.create(domain, {
      from: fromAddress,
      to: [input.to],
      subject: `Your Shop order ${input.orderNumber} is confirmed`,
      text: `Thanks for your order ${input.orderNumber}. Total: ${formatMoney(
        input.totalCents,
        input.currency
      )}.`,
      html: renderOrderEmail(input),
    });

    return { sent: true, id: result.id };
  } catch (error) {
    console.error("[mailgun] Failed to send confirmation email:", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function isMailgunReady() {
  return isMailgunConfigured;
}
