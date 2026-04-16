import { NextResponse } from "next/server";

const BACKEND_URL = process.env.MOBILE_APP_BACKEND_URL;

/**
 * Webhook de Bold.
 * Bold envía notificaciones POST a esta URL cuando una transacción cambia de estado.
 *
 * Flujo:
 * 1. Recibe el POST de Bold
 * 2. Responde 200 inmediatamente (Bold requiere respuesta en < 2s)
 * 3. Reenvía el payload al lambda process-bold-webhook para procesamiento
 */
export async function POST(request: Request) {
  // Leer body como texto crudo (necesario para verificación HMAC)
  const rawBody = await request.text();
  const boldSignature = request.headers.get("x-bold-signature") || "";

  // Reenviar al lambda de procesamiento (fire & forget)
  if (BACKEND_URL) {
    fetch(`${BACKEND_URL}/process-bold-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bold-signature": boldSignature,
      },
      body: rawBody,
    }).catch((err) =>
      console.error("[Bold Webhook] Error forwarding to lambda:", err)
    );
  } else {
    console.error("[Bold Webhook] MOBILE_APP_BACKEND_URL not configured");
  }

  // Responder 200 inmediatamente a Bold
  return NextResponse.json({ message: "OK" }, { status: 200 });
}
