/**
 * HERRAMIENTA DE DIAGNÓSTICO - DASHBOARD API
 * 
 * ¿Cómo usar?
 * ============
 * 1. Abre DevTools presionando F12
 * 2. Ve a la pestaña "Console"
 * 3. Copia toda la función testDashboardAPI() de abajo
 * 4. Pégala en la consola y presiona Enter
 * 5. Lee el output para identificar qué está fallando
 */

async function testDashboardAPI() {
  // Obtener datos del estado auth almacenado
  const authState = localStorage.getItem("persist:root");
  let token = "";
  let complexId = "";

  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      const auth = JSON.parse(parsed.auth || "{}");
      token = auth.token || "";

      const complex = JSON.parse(parsed.complex || "{}");
      complexId = complex.activeComplex?.id || "";
    } catch (e) {
      console.warn("⚠️ No se pudo obtener datos del storage");
    }
  }

  // Usar valores por defecto si no se encuentran
  const API_URL =
    "https://uv3pq49c1c.execute-api.us-east-2.amazonaws.com/prod";
  const finalComplexId =
    complexId || "8c53f4f9-fa8c-41de-81ba-48f89ee6c0f6";
  const finalToken = token || ""; // Sin token por defecto

  const url = `${API_URL}/getDashboardData?complexId=${finalComplexId}`;

  console.log(
    "%c=== DIAGNÓSTICO DE API DASHBOARD ===",
    "color: #0066cc; font-weight: bold; font-size: 14px"
  );
  console.log("\n📋 INFORMACIÓN DE SOLICITUD:");
  console.log("  URL:", url);
  console.log("  Token presente:", !!finalToken);
  console.log("  Complex ID:", finalComplexId);

  try {
    console.log("\n⏳ Enviando solicitud...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${finalToken}`,
      },
      credentials: "include",
    });

    console.log(
      "%c✅ RESPUESTA RECIBIDA",
      "color: #22863a; font-weight: bold"
    );
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log("  Headers:");

    const headerInfo: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerInfo[key] = value;
      console.log(`    ${key}: ${value}`);
    });

    // Leer respuesta como texto
    const text = await response.text();

    console.log("\n📄 CONTENIDO DE RESPUESTA:");
    if (text.length === 0) {
      console.error("  ❌ RESPUESTA VACÍA");
    } else if (text.length < 500) {
      console.log("  " + text);
    } else {
      console.log("  Primeros 500 caracteres:");
      console.log("  " + text.substring(0, 500));
      console.log("  ...");
      console.log(`  (Total: ${text.length} caracteres)`);
    }

    // Intentar parsear JSON
    console.log("\n🔍 ANÁLISIS JSON:");
    try {
      const data = JSON.parse(text);
      console.log(
        "%c✅ JSON VÁLIDO - Parseado exitosamente",
        "color: #22863a; font-weight: bold"
      );

      // Validar estructura esperada
      console.log("\n📊 VALIDACIÓN DE ESTRUCTURA:");
      const hasData = {
        summary: !!data.summary,
        alerts: Array.isArray(data.alerts),
        charts: !!data.charts,
        lastUpdate: !!data.lastUpdate,
      };

      Object.entries(hasData).forEach(([key, has]) => {
        console.log(`  ${has ? "✓" : "✗"} ${key}`);
      });

      if (Object.values(hasData).every((v) => v)) {
        console.log(
          "\n" +
            "%c✅ ESTRUCTURA CORRECTA - El API está funcionando bien",
          "color: #22863a; font-weight: bold; font-size: 12px"
        );
      } else {
        console.warn(
          "\n" +
            "%c⚠️ ESTRUCTURA INCOMPLETA - Faltan campos en la respuesta",
          "color: #b08500; font-weight: bold; font-size: 12px"
        );
      }

      // Mostrar preview de datos
      console.log("\n📋 PREVIEW DE DATOS:");
      console.log(data);

      return data;
    } catch (parseError) {
      console.error(
        "%c❌ JSON INVÁLIDO",
        "color: #cb2431; font-weight: bold"
      );
      console.error("Error:", parseError);
      console.error(
        "La respuesta no es JSON válido. Puede ser HTML (página de error)."
      );

      // Intentar identificar qué es
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        console.error("  Parece ser HTML, posiblemente una página de error");
      } else if (text.includes("Error")) {
        console.error("  Parece contener un error o excepción");
      }
    }
  } catch (fetchError) {
    console.error(
      "%c❌ ERROR EN FETCH",
      "color: #cb2431; font-weight: bold"
    );
    console.error("Error:", fetchError);
    console.log(
      "\n🔧 POSIBLES CAUSAS Y SOLUCIONES:"
    );
    console.log(
      "  1. CORS: El backend no tiene headers Access-Control-Allow-Origin"
    );
    console.log(
      "  2. Timeout: La solicitud tardó demasiado en responder"
    );
    console.log(
      "  3. Conexión: Problema de red o servidor no accesible"
    );
    console.log(
      "  4. Certificado: Problema SSL/TLS con HTTPS"
    );
  }

  console.log(
    "\n" +
      "%c=== FIN DEL DIAGNÓSTICO ===",
    "color: #0066cc; font-weight: bold; font-size: 12px"
  );
}

// Hacer disponible en el contexto global
if (typeof window !== "undefined") {
  (window as any).testDashboardAPI = testDashboardAPI;
  console.log(
    "%c✅ Herramienta de diagnóstico cargada",
    "color: #22863a; font-weight: bold"
  );
  console.log(
    "%cEjecuta en la consola: testDashboardAPI()",
    "color: #0066cc; font-style: italic"
  );
}

export { testDashboardAPI };
