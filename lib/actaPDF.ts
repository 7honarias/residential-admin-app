/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generador del Acta de Asamblea de Propietarios
 * Cumple con los requisitos de la Ley 675 de 2001 (Régimen de Propiedad Horizontal)
 * y la Ley 527 de 1999 (Firmas Electrónicas - Comercio Electrónico)
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface SignatureData {
  role: "SECRETARIO" | "PRESIDENTE_CONSEJO";
  fullName: string;
  documentId: string;
  email: string;
  signatureDataUrl: string; // Canvas base64
  signedAt: string; // ISO timestamp
}

export interface ActaData {
  // Metadata del acta
  actaNumber: string;
  assemblyType: "ORDINARIA" | "EXTRAORDINARIA";
  city: string;
  convocatoriaForm: string;

  // Datos del conjunto
  complexName: string;

  // Datos de la asamblea
  assemblyTitle: string;
  scheduledFor: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  quorumPercentage: number;
  attendeesCount: number;

  // Contenido
  agenda: { id: string; text: string; status: string }[];
  polls: any[];
  logs: any[];
  attendanceList: any[];

  // Firmas
  signatures: SignatureData[];
}

// Colores corporativos
const COLORS = {
  primary: [30, 41, 59] as [number, number, number],     // slate-800
  secondary: [79, 70, 229] as [number, number, number],  // indigo-600
  light: [248, 250, 252] as [number, number, number],    // slate-50
  text: [15, 23, 42] as [number, number, number],        // slate-900
  muted: [100, 116, 139] as [number, number, number],    // slate-500
  border: [226, 232, 240] as [number, number, number],   // slate-200
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)} a las ${formatTime(iso)}`;
}

/**
 * Genera el PDF del Acta de Asamblea de Propietarios.
 * El documento resultante es de solo lectura (sin campos de formulario).
 * @returns Blob del PDF generado
 */
export function generateActaPDF(data: ActaData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${data.complexName} · Acta No. ${data.actaNumber} · Página ${doc.getCurrentPageInfo().pageNumber}`,
      margin,
      10,
    );
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, 13, pageW - margin, 13);
  };

  const sectionTitle = (text: string) => {
    addPageIfNeeded(20);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), margin + 4, y + 5.5);
    doc.setFont("helvetica", "normal");
    y += 12;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(text, contentW - indent);
    addPageIfNeeded(lines.length * 5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 2;
  };

  const labelValue = (label: string, value: string) => {
    addPageIfNeeded(6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.muted);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(value, margin + 45, y);
    y += 6;
  };

  // ── PORTADA / ENCABEZADO ──────────────────────────────────────────────────────
  // Franja superior azul
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ACTA DE ASAMBLEA GENERAL DE PROPIETARIOS", pageW / 2, 14, { align: "center" });

  doc.setFontSize(11);
  doc.text(`${data.complexName.toUpperCase()}`, pageW / 2, 23, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Asamblea ${data.assemblyType} · Acta No. ${data.actaNumber}`,
    pageW / 2,
    31,
    { align: "center" },
  );

  y = 50;

  // Línea decorativa
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── SECCIÓN 1: DATOS GENERALES ────────────────────────────────────────────────
  sectionTitle("Primera · Datos Generales de la Asamblea");

  labelValue("Tipo de Asamblea", `General ${data.assemblyType}`);
  labelValue("Ciudad y Fecha", `${data.city}, ${formatDate(data.scheduledFor)}`);
  labelValue("Lugar de Reunión", data.address || "Instalaciones del conjunto");
  labelValue("Hora de Inicio", data.startDate ? formatTime(data.startDate) : formatTime(data.scheduledFor));
  if (data.endDate) labelValue("Hora de Finalización", formatTime(data.endDate));
  labelValue("Convocatoria", data.convocatoriaForm);
  labelValue("Generado el", formatDateTime(new Date().toISOString()));

  y += 4;

  // ── SECCIÓN 2: VERIFICACIÓN DE QUÓRUM ────────────────────────────────────────
  sectionTitle("Segunda · Verificación del Quórum");

  bodyText(
    `Se verificó la asistencia de ${data.attendeesCount} unidades residenciales, ` +
    `representando el ${data.quorumPercentage}% del coeficiente total de copropiedad. ` +
    `${data.quorumPercentage >= 50
      ? "Se constata que existe QUÓRUM LEGAL suficiente para deliberar y decidir (mínimo 50% + 1)."
      : "NOTA: El porcentaje de quórum no alcanzó el mínimo legal del 50%, por lo tanto las decisiones adoptadas tendrán el valor de segunda convocatoria según el artículo 46 de la Ley 675 de 2001."
    }`,
  );

  y += 4;

  if (data.attendanceList.length > 0) {
    const presentList = data.attendanceList.filter((a) => a.is_present);
    if (presentList.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Unidad", "Coeficiente (%)", "Asistente", "Tipo"]],
        body: presentList.map((a) => [
          `${a.block ? `${a.block}-` : ""}${a.number}`,
          `${a.coefficient ?? "—"}%`,
          a.attendee_name || "Propietario",
          a.is_proxy ? "Apoderado" : "Propietario",
        ]),
        headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        tableWidth: contentW,
        didDrawPage: () => addPageHeader(),
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ── SECCIÓN 3: ORDEN DEL DÍA ─────────────────────────────────────────────────
  sectionTitle("Tercera · Orden del Día");

  if (data.agenda.length === 0) {
    bodyText("No se registraron puntos en el orden del día.");
  } else {
    data.agenda.forEach((item, idx) => {
      addPageIfNeeded(7);
      const status = item.status === "COMPLETED" ? "✓ Tratado" : "○ Pendiente";
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.text);
      doc.text(`${idx + 1}.`, margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(item.text, contentW - 10);
      doc.text(lines, margin + 8, y);
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(status, pageW - margin, y, { align: "right" });
      y += lines.length * 5 + 3;
    });
  }

  y += 4;

  // ── SECCIÓN 4: DESARROLLO DE LA REUNIÓN (Bitácora) ───────────────────────────
  sectionTitle("Cuarta · Desarrollo de la Reunión");

  if (data.logs.length === 0) {
    bodyText("No se registraron eventos en la bitácora de la asamblea.");
  } else {
    const typeLabel: Record<string, string> = {
      SYSTEM: "Sistema",
      POLL: "Votación",
      NOTE: "Nota del Secretario",
    };
    data.logs.forEach((log) => {
      addPageIfNeeded(10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.secondary);
      doc.text(`[${log.time}] ${typeLabel[log.type] ?? log.type}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      y += 4;
      const lines = doc.splitTextToSize(log.text, contentW - 4);
      doc.text(lines, margin + 4, y);
      y += lines.length * 4.5 + 3;
    });
  }

  y += 4;

  // ── SECCIÓN 5: VOTACIONES ────────────────────────────────────────────────────
  const closedPolls = data.polls.filter((p) => p.status === "CLOSED");

  if (closedPolls.length > 0) {
    sectionTitle("Quinta · Votaciones Realizadas");

    closedPolls.forEach((poll, idx) => {
      addPageIfNeeded(30);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.text);
      doc.text(`Votación ${idx + 1}: ${poll.question}`, margin, y);
      y += 5;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.muted);
      doc.text(
        `Tipo de mayoría: ${poll.majority_type === "SIMPLE" ? "Mayoría Simple" : "Mayoría Calificada"}`,
        margin,
        y,
      );
      y += 5;

      const totalVotes = poll.options.reduce(
        (acc: number, o: any) => acc + (o.votes ?? 0),
        0,
      );

      autoTable(doc, {
        startY: y,
        head: [["Opción", "Votos", "Porcentaje", "Resultado"]],
        body: poll.options.map((opt: any) => {
          const pct = opt.percentage ?? 0;
          const mayoriaRequired = poll.majority_type === "SIMPLE" ? 50 : 70;
          const aprobado = pct > mayoriaRequired ? "APROBADO" : "—";
          return [opt.label, opt.votes ?? 0, `${pct}%`, aprobado];
        }),
        foot: [["TOTAL VOTOS", totalVotes, "100%", ""]],
        headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: "bold" },
        footStyles: { fillColor: COLORS.light, fontSize: 8, fontStyle: "bold", textColor: COLORS.text },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        tableWidth: contentW,
        didDrawPage: () => addPageHeader(),
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  // ── SECCIÓN 6: CONSTANCIAS ───────────────────────────────────────────────────
  sectionTitle("Sexta · Constancias y Cierre");

  const endTimeText = data.endDate
    ? `Siendo las ${formatTime(data.endDate)}`
    : "Una vez tratados todos los puntos del orden del día";

  bodyText(
    `${endTimeText}, se declara terminada la sesión de la asamblea general ` +
    `${data.assemblyType.toLowerCase()} de propietarios del ${data.complexName}. ` +
    `La presente acta fue aprobada y firmada electrónicamente de conformidad con la ` +
    `Ley 675 de 2001 y la Ley 527 de 1999.`,
  );

  y += 6;

  // Información de generación
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text("Documento generado digitalmente mediante la plataforma de gestión residencial.", margin + 4, y + 5);
  doc.text(`Timestamp de generación: ${new Date().toISOString()} UTC`, margin + 4, y + 11);
  y += 20;

  // ── SECCIÓN 7: FIRMAS ELECTRÓNICAS ──────────────────────────────────────────
  addPageIfNeeded(90);

  sectionTitle("Séptima · Firmas Electrónicas de Certificación");

  bodyText(
    "Las siguientes firmas electrónicas fueron capturadas mediante autenticación " +
    "en la plataforma y tienen plena validez jurídica según la Ley 527 de 1999.",
  );
  y += 6;

  const sigBoxW = (contentW - 10) / 2;

  data.signatures.forEach((sig, idx) => {
    const sigX = margin + idx * (sigBoxW + 10);

    addPageIfNeeded(75);

    // Caja de firma
    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(sigX, y, sigBoxW, 70, 2, 2, "FD");

    // Rol
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(sigX, y, sigBoxW, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const roleLabel =
      sig.role === "SECRETARIO" ? "SECRETARIO(A) DE LA ASAMBLEA" : "PRESIDENTE DEL CONSEJO DE ADMINISTRACIÓN";
    doc.text(roleLabel, sigX + sigBoxW / 2, y + 5.5, { align: "center" });

    // Imagen de la firma
    if (sig.signatureDataUrl && sig.signatureDataUrl.length > 100) {
      try {
        doc.addImage(sig.signatureDataUrl, "PNG", sigX + 5, y + 12, sigBoxW - 10, 28);
      } catch {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.muted);
        doc.text("[Firma digital adjunta]", sigX + sigBoxW / 2, y + 28, { align: "center" });
      }
    }

    // Línea de firma
    doc.setDrawColor(...COLORS.border);
    doc.line(sigX + 5, y + 43, sigX + sigBoxW - 5, y + 43);

    // Datos del firmante
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    const nameLine = doc.splitTextToSize(sig.fullName, sigBoxW - 6);
    doc.text(nameLine, sigX + sigBoxW / 2, y + 48, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(`C.C. ${sig.documentId}`, sigX + sigBoxW / 2, y + 53, { align: "center" });
    doc.text(`${sig.email}`, sigX + sigBoxW / 2, y + 58, { align: "center" });
    doc.text(`Firmado: ${new Date(sig.signedAt).toLocaleString("es-CO")}`, sigX + sigBoxW / 2, y + 63, {
      align: "center",
    });
  });

  y += 78;

  // ── PIE DE PÁGINA en todas las páginas ───────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Ley 675 de 2001 · Régimen de Propiedad Horizontal Colombia`,
      margin,
      pageH - 7,
    );
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  return doc.output("blob");
}
