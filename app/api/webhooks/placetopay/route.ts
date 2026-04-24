import { after, NextResponse } from "next/server";

const BACKEND_URL = process.env.MOBILE_APP_BACKEND_URL;

/**
 * Webhook de PlaceToPay.
 * PlaceToPay envía notificaciones POST a esta URL cuando una sesión de pago
 * cambia de estado (APPROVED, REJECTED, PENDING, etc.).
 *
 * Flujo:
 * 1. Recibe el POST de PlaceToPay
 * 2. Responde 200 inmediatamente (PlaceToPay requiere respuesta rápida)
 * 3. Reenvía el payload al lambda process-placetopay-notification usando `after()`
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!BACKEND_URL) {
    console.error("[PlaceToPay Webhook] MOBILE_APP_BACKEND_URL not configured");
  } else {
    after(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/process-placetopay-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: rawBody,
        });
        if (!res.ok) {
          console.error(
            `[PlaceToPay Webhook] Lambda responded ${res.status}:`,
            await res.text(),
          );
        }
      } catch (err) {
        console.error("[PlaceToPay Webhook] Error forwarding to lambda:", err);
      }
    });
  }

  return NextResponse.json({ message: "OK" }, { status: 200 });
}
