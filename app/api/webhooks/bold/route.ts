import { after, NextResponse } from "next/server";

const BACKEND_URL = process.env.MOBILE_APP_BACKEND_URL;

/**
 * Webhook de Bold.
 * Bold envía notificaciones POST a esta URL cuando una transacción cambia de estado.
 *
 * Flujo:
 * 1. Recibe el POST de Bold
 * 2. Responde 200 inmediatamente (Bold requiere respuesta en < 2s)
 * 3. Reenvía el payload al lambda process-bold-webhook para procesamiento
 *    usando `after()` para que el runtime no corte la ejecución al devolver la respuesta.
 */
export async function POST(request: Request) {
  // Leer body como texto crudo (necesario para verificación HMAC)
  const rawBody = await request.text();
  const boldSignature = request.headers.get("x-bold-signature") || "";

  if (!BACKEND_URL) {
    console.error("[Bold Webhook] MOBILE_APP_BACKEND_URL not configured");
  } else {
    // `after()` garantiza que el fetch se complete aunque la respuesta ya fue enviada
    after(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/process-bold-webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bold-signature": boldSignature,
          },
          body: rawBody,
        });
        if (!res.ok) {
          console.error(
            `[Bold Webhook] Lambda responded ${res.status}:`,
            await res.text()
          );
        }
      } catch (err) {
        console.error("[Bold Webhook] Error forwarding to lambda:", err);
      }
    });
  }

  // Responder 200 inmediatamente a Bold
  return NextResponse.json({ message: "OK" }, { status: 200 });
}
