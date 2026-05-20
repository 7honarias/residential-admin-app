export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryColor: string;
  date: string;
  dateISO: string;
  readTime: string;
  author: string;
  authorRole: string;
  tags: string[];
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "ley-675-de-2001-guia-completa-propiedad-horizontal",
    title: "Ley 675 de 2001: La Guía Completa para Administradores de Propiedad Horizontal",
    excerpt:
      "Todo lo que necesitas saber sobre la ley que regula los conjuntos residenciales y edificios en Colombia: obligaciones, derechos y artículos clave para la administración diaria.",
    category: "Marco Legal",
    categoryColor: "indigo",
    date: "15 de mayo de 2026",
    dateISO: "2026-05-15",
    readTime: "8 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "ley 675",
      "propiedad horizontal",
      "administración",
      "copropiedad",
      "conjunto residencial",
    ],
    featured: true,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">La <strong>Ley 675 de 2001</strong> es el marco jurídico que regula toda la propiedad horizontal en Colombia. Conocerla a fondo no es opcional para el administrador de un conjunto residencial o edificio: es una obligación legal y la base de una gestión profesional.</p>

<h2>¿Qué es la Ley 675 de 2001?</h2>
<p>Promulgada el 3 de agosto de 2001, la Ley 675 regula el régimen de la propiedad horizontal en Colombia. Aplica a todos los inmuebles sometidos a este régimen: edificios, conjuntos residenciales, conjuntos comerciales y de uso mixto.</p>
<p>Su objetivo principal es establecer los derechos y obligaciones de los propietarios de bienes privados dentro de una copropiedad, así como las normas para la administración de los bienes comunes.</p>

<h2>Conceptos Fundamentales que Todo Administrador Debe Dominar</h2>

<h3>Bienes Privados vs. Bienes Comunes</h3>
<p>La ley distingue claramente entre:</p>
<ul>
  <li><strong>Bienes privados o de dominio particular:</strong> los apartamentos, oficinas o locales de propiedad exclusiva de cada copropietario.</li>
  <li><strong>Bienes comunes:</strong> los que pertenecen a todos los copropietarios en proporción a sus coeficientes. Incluyen zonas sociales, parqueaderos comunes, estructura del edificio, redes de servicios, entre otros.</li>
  <li><strong>Bienes comunes esenciales:</strong> aquellos indispensables para la existencia, estabilidad, conservación y seguridad del edificio, que no pueden ser desafectados (Art. 23).</li>
</ul>

<h3>El Coeficiente de Copropiedad</h3>
<p>Definido en el artículo 26, el coeficiente de copropiedad determina la participación porcentual de cada propietario en los bienes comunes, en las obligaciones de gastos y en los derechos de votación. Es calculado por el urbanizador o constructor antes de someter el inmueble al régimen.</p>

<h2>Órganos de Dirección y Administración (Arts. 36-55)</h2>
<p>La ley establece tres órganos principales:</p>

<h3>1. La Asamblea General de Copropietarios</h3>
<p>Es el máximo órgano de decisión. Está conformada por todos los propietarios de bienes privados o sus representantes. Sus decisiones son obligatorias para todos, incluso para ausentes y disidentes. Se distingue entre:</p>
<ul>
  <li><strong>Asamblea Ordinaria:</strong> debe realizarse dentro de los tres primeros meses del año para aprobar el presupuesto, los estados financieros y elegir al administrador y al consejo.</li>
  <li><strong>Asamblea Extraordinaria:</strong> se convoca cuando las necesidades de la copropiedad lo exijan, para temas específicos.</li>
</ul>

<h3>2. El Consejo de Administración</h3>
<p>Obligatorio en conjuntos con más de 30 unidades privadas. Actúa como órgano de control y asesoría del administrador. Sus integrantes son elegidos por la asamblea.</p>

<h3>3. El Administrador</h3>
<p>Representante legal de la persona jurídica que surge de la propiedad horizontal. Puede ser propietario, empleado o empresa especializada. Sus funciones están detalladas en el artículo 51 de la ley.</p>

<h2>Artículo 51: Las Funciones del Administrador</h2>
<p>Este es posiblemente el artículo más importante para el administrador. Sus funciones incluyen:</p>
<ul>
  <li>Convocar y presidir la asamblea general y el consejo de administración.</li>
  <li>Llevar bajo su dependencia la contabilidad del conjunto.</li>
  <li>Administrar con diligencia y cuidado los bienes de dominio de la persona jurídica.</li>
  <li>Cuidar y vigilar los bienes comunes y ejecutar los actos de administración, conservación y disposición.</li>
  <li>Cobrar y recaudar las cuotas de administración y las sanciones.</li>
  <li>Elevar a escritura pública y registrar las reformas al reglamento aprobadas por la asamblea.</li>
  <li>Representar judicial y extrajudicialmente a la persona jurídica.</li>
  <li>Notificar a los propietarios el incumplimiento de sus obligaciones.</li>
  <li>Hacer efectivas las sanciones por incumplimiento de obligaciones.</li>
</ul>

<h2>Las Cuotas de Administración: Obligación Ineludible</h2>
<p>Según el artículo 29, cada propietario contribuye a las expensas comunes del edificio en proporción a su coeficiente de copropiedad, salvo que el reglamento establezca otro criterio. La mora en el pago genera intereses de mora y puede llevar a proceso ejecutivo.</p>

<h2>El Reglamento de Propiedad Horizontal</h2>
<p>Es el estatuto de la copropiedad, un documento de obligatorio cumplimiento para todos. Regula la convivencia, el uso de bienes comunes, las sanciones y los procedimientos internos. El reglamento puede ser modificado por la asamblea con las mayorías que establece la misma ley.</p>

<h2>Sanciones por Incumplimiento</h2>
<p>La ley prevé un procedimiento sancionatorio para los copropietarios que incumplan el reglamento. El artículo 59 establece que estas sanciones deben estar previstas en el reglamento y aplicarse garantizando el debido proceso: comunicación escrita, descargos y decisión motivada.</p>

<h2>Conclusión</h2>
<p>La Ley 675 de 2001 es el pilar de toda gestión de propiedad horizontal en Colombia. Un administrador que la domina puede tomar decisiones informadas, evitar litigios costosos y construir una relación de confianza con los copropietarios. Si tu conjunto aún no digitaliza sus procesos de administración, es el momento de hacerlo.</p>
    `,
  },
  {
    slug: "funciones-administrador-propiedad-horizontal-colombia",
    title: "Funciones del Administrador de Propiedad Horizontal: Responsabilidades Legales y Buenas Prácticas",
    excerpt:
      "Conoce en detalle las obligaciones legales, financieras y operativas del administrador de un conjunto residencial o edificio en Colombia según la Ley 675.",
    category: "Gestión",
    categoryColor: "emerald",
    date: "10 de mayo de 2026",
    dateISO: "2026-05-10",
    readTime: "7 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "administrador",
      "funciones",
      "propiedad horizontal",
      "gestión",
      "obligaciones",
    ],
    featured: true,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">El administrador de propiedad horizontal es mucho más que una persona que cobra administración y atiende quejas. Es el representante legal de la persona jurídica de la copropiedad y su gestión tiene consecuencias legales, financieras y de convivencia que afectan a todos los copropietarios.</p>

<h2>¿Quién Puede Ser Administrador?</h2>
<p>Según el artículo 50 de la Ley 675 de 2001, el administrador puede ser:</p>
<ul>
  <li>Un propietario del mismo conjunto elegido por la asamblea.</li>
  <li>Una persona natural contratada externamente.</li>
  <li>Una empresa administradora de propiedad horizontal.</li>
</ul>
<p>En conjuntos con más de 30 unidades privadas, debe actuar junto al consejo de administración. En todos los casos, el administrador debe otorgar garantías de su gestión según lo determine el reglamento.</p>

<h2>Funciones Legales del Administrador (Art. 51)</h2>

<h3>Representación Legal</h3>
<p>El administrador representa a la persona jurídica ante terceros, entidades públicas y privadas, juzgados y autoridades. Firma contratos, presenta declaraciones tributarias y responde por las obligaciones de la copropiedad.</p>

<h3>Convocatoria de Asambleas</h3>
<p>Debe convocar la asamblea ordinaria dentro de los primeros tres meses del año y las extraordinarias cuando lo requiera la situación. La convocatoria debe hacerse con al menos 15 días hábiles de anticipación (ordinaria) o mínimo 5 días (extraordinaria).</p>

<h3>Ejecución de Decisiones</h3>
<p>Todas las decisiones que tome la asamblea o el consejo de administración deben ser ejecutadas por el administrador. No puede ignorarlas ni modificarlas unilateralmente.</p>

<h2>Funciones Financieras: El Núcleo de la Gestión</h2>

<h3>Recaudo de Cuotas</h3>
<p>El administrador es responsable de cobrar oportunamente las cuotas de administración, las cuotas extraordinarias aprobadas por la asamblea y las sanciones económicas. Debe establecer mecanismos de cobro claros: notificaciones, paz y salvo, y en casos extremos, proceso ejecutivo.</p>

<h3>Manejo del Presupuesto</h3>
<p>Debe presentar a la asamblea ordinaria el presupuesto del año siguiente, detallando ingresos proyectados (cuotas ordinarias) y egresos (personal, servicios, mantenimiento, seguros, fondo de imprevistos). La asamblea lo aprueba o modifica.</p>

<h3>Estados Financieros</h3>
<p>Al cierre del año, el administrador presenta los estados financieros: balance general, estado de resultados, flujo de caja y notas contables. En conjuntos de más de 30 unidades, estos deben ser revisados por un revisor fiscal.</p>

<h3>Fondo de Imprevistos</h3>
<p>La ley obliga a constituir un fondo de imprevistos equivalente mínimo al 1% del presupuesto anual. El administrador debe asegurarse de que este aporte se haga mes a mes y que el fondo no sea utilizado para gastos corrientes.</p>

<h2>Funciones Operativas y de Mantenimiento</h2>
<ul>
  <li><strong>Mantenimiento preventivo:</strong> programar y supervisar el mantenimiento de ascensores, bombas de agua, zonas comunes, redes eléctricas e hidráulicas.</li>
  <li><strong>Vigilancia y seguridad:</strong> coordinar el personal de vigilancia o la empresa de seguridad.</li>
  <li><strong>Seguros:</strong> contratar y mantener vigente el seguro de la copropiedad (póliza de incendio y terremoto como mínimo).</li>
  <li><strong>Personal:</strong> contratar, supervisar y liquidar al personal de servicios generales y portería, cumpliendo la normativa laboral.</li>
</ul>

<h2>Responsabilidades Frente a Terceros</h2>
<p>El administrador puede incurrir en responsabilidad civil y hasta penal si:</p>
<ul>
  <li>No cumple con las obligaciones tributarias de la persona jurídica.</li>
  <li>Realiza gastos no autorizados por el presupuesto o la asamblea.</li>
  <li>Incumple contratos con proveedores.</li>
  <li>No paga las obligaciones laborales del personal.</li>
</ul>

<h2>Buenas Prácticas del Administrador Moderno</h2>
<ol>
  <li><strong>Comunicación permanente:</strong> informar mensualmente a los copropietarios sobre el estado financiero, obras en curso y novedades del conjunto.</li>
  <li><strong>Transparencia financiera:</strong> publicar el estado de cuenta en zonas comunes o a través de plataformas digitales.</li>
  <li><strong>Documentación rigurosa:</strong> guardar todos los contratos, actas, comprobantes y correspondencia.</li>
  <li><strong>Capacitación continua:</strong> actualizarse en normativa laboral, tributaria y de propiedad horizontal.</li>
  <li><strong>Uso de tecnología:</strong> adoptar software especializado para el control de cartera, gestión de visitantes y comunicación con residentes.</li>
</ol>

<h2>Conclusión</h2>
<p>El rol del administrador es complejo y multidimensional. Quien lo ejerce debe ser meticuloso, transparente y proactivo. La tecnología es hoy el mejor aliado para reducir la carga operativa y dedicar más tiempo a la gestión estratégica del conjunto.</p>
    `,
  },
  {
    slug: "como-realizar-asamblea-copropietarios-legal",
    title: "Cómo Realizar una Asamblea de Copropietarios Legalmente Válida en Colombia",
    excerpt:
      "Guía paso a paso para convocar, realizar y documentar una asamblea de propietarios cumpliendo todos los requisitos de la Ley 675: quórum, convocatoria, votaciones y actas.",
    category: "Asambleas",
    categoryColor: "purple",
    date: "5 de mayo de 2026",
    dateISO: "2026-05-05",
    readTime: "9 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "asamblea",
      "copropietarios",
      "quórum",
      "votaciones",
      "acta",
      "propiedad horizontal",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">Una asamblea de copropietarios mal convocada o mal documentada puede ser impugnada judicialmente, dejando sin efectos decisiones importantes para el conjunto. Conoce el procedimiento correcto para garantizar la validez de tus asambleas.</p>

<h2>Tipos de Asamblea según la Ley 675</h2>

<h3>Asamblea General Ordinaria</h3>
<p>Debe realizarse dentro de los <strong>tres primeros meses de cada año</strong>. Su agenda obligatoria incluye:</p>
<ul>
  <li>Examen y aprobación de los estados financieros del año anterior.</li>
  <li>Aprobación del presupuesto del año en curso.</li>
  <li>Elección del consejo de administración (si el período está vencido).</li>
  <li>Elección del revisor fiscal (si aplica).</li>
  <li>Elección o ratificación del administrador.</li>
</ul>

<h3>Asamblea General Extraordinaria</h3>
<p>Se convoca cuando lo exijan necesidades urgentes o imprevistas del conjunto. Solo puede tratar los temas incluidos en la convocatoria.</p>

<h3>Asamblea de Propietarios No Presencial</h3>
<p>La ley permite asambleas virtuales siempre que se garantice la participación activa de los asistentes y la verificación de su identidad. Esta modalidad se consolidó después de la pandemia.</p>

<h2>Paso 1: La Convocatoria</h2>
<p>La convocatoria debe enviarse con al menos:</p>
<ul>
  <li><strong>15 días hábiles</strong> de anticipación para asambleas ordinarias.</li>
  <li><strong>5 días hábiles</strong> para asambleas extraordinarias (salvo que el reglamento establezca un plazo mayor).</li>
</ul>
<p>Debe contener:</p>
<ul>
  <li>Fecha, hora y lugar (o enlace virtual).</li>
  <li>Orden del día detallado.</li>
  <li>Documentos de apoyo (estados financieros, presupuesto propuesto).</li>
  <li>Información sobre representación por poder (formato de poder adjunto).</li>
</ul>
<p><strong>Medios de convocatoria válidos:</strong> correo electrónico a la dirección registrada, comunicación escrita entregada en el inmueble o publicada en zona común. Se recomienda usar ambos medios y conservar evidencia de entrega.</p>

<h2>Paso 2: Verificación del Quórum</h2>
<p>El quórum es el porcentaje mínimo de coeficientes representados que debe estar presente para que la asamblea pueda sesionar válidamente.</p>

<h3>Quórum Deliberatorio (para sesionar)</h3>
<ul>
  <li><strong>Primera convocatoria:</strong> más del 50% de los coeficientes.</li>
  <li><strong>Segunda convocatoria:</strong> puede sesionar con cualquier número de asistentes (no se requiere quórum mínimo), siempre que hayan transcurrido mínimo una hora desde la hora fijada para la primera convocatoria.</li>
</ul>

<h3>Quórum Decisorio (para aprobar)</h3>
<p>Varía según el tipo de decisión:</p>
<ul>
  <li><strong>Mayoría simple</strong> (más del 50% de los coeficientes presentes): decisiones ordinarias de administración.</li>
  <li><strong>Mayoría calificada del 70%</strong> del total de coeficientes: desafectación de bienes comunes no esenciales, cambio de destinación de bienes comunes.</li>
  <li><strong>Unanimidad</strong>: extinción de la propiedad horizontal, cambios en los coeficientes de copropiedad.</li>
</ul>

<h2>Paso 3: La Mesa Directiva</h2>
<p>Al inicio de la sesión se elige una mesa directiva conformada por un presidente, un secretario y un comisario (este último para dar fe de los resultados de votación). Pueden ser copropietarios o sus delegados.</p>

<h2>Paso 4: Verificación de Poderes</h2>
<p>Los propietarios pueden hacerse representar por apoderados con poder escrito. El poder debe indicar:</p>
<ul>
  <li>Nombre del poderdante y número de unidad(es) que representa.</li>
  <li>Nombre del apoderado.</li>
  <li>Indicación expresa de la asamblea para la que se otorga el poder.</li>
  <li>Firma del poderdante.</li>
</ul>
<p><strong>Importante:</strong> El administrador, el revisor fiscal y sus familiares no pueden actuar como apoderados en la asamblea (Art. 45, Ley 675).</p>

<h2>Paso 5: Desarrollo de la Sesión</h2>
<ol>
  <li>Verificación de asistencia y quórum.</li>
  <li>Elección de mesa directiva.</li>
  <li>Aprobación del orden del día.</li>
  <li>Desarrollo de cada punto del orden del día con las deliberaciones correspondientes.</li>
  <li>Votaciones: pueden ser públicas (alzada de mano) o secretas (escrutadas por el comisario).</li>
  <li>Cierre y firma del acta.</li>
</ol>

<h2>Paso 6: El Acta de Asamblea</h2>
<p>Es el documento que da fe de lo ocurrido. Debe contener:</p>
<ul>
  <li>Fecha, hora y lugar.</li>
  <li>Lista de asistentes con nombre, unidad y coeficiente.</li>
  <li>Verificación de quórum.</li>
  <li>Orden del día aprobado.</li>
  <li>Resumen de deliberaciones.</li>
  <li>Resultado de cada votación con los coeficientes a favor, en contra y abstenciones.</li>
  <li>Firma del presidente y el secretario.</li>
</ul>
<p>El acta debe publicarse o notificarse a los copropietarios dentro de los 20 días hábiles siguientes a la asamblea.</p>

<h2>Errores Comunes que Invalidan una Asamblea</h2>
<ul>
  <li>No enviar la convocatoria con el plazo mínimo legal.</li>
  <li>No incluir en la convocatoria todos los temas a tratar.</li>
  <li>Aceptar poderes con defectos formales.</li>
  <li>No verificar correctamente el quórum deliberatorio.</li>
  <li>Tomar decisiones que requieren mayoría especial con simple mayoría.</li>
  <li>No registrar adecuadamente el acta.</li>
</ul>

<h2>Conclusión</h2>
<p>Una asamblea bien gestionada es la base de la gobernanza del conjunto. Con preparación, orden y las herramientas adecuadas, puede convertirse en un espacio de participación efectiva en lugar de una fuente de conflictos.</p>
    `,
  },
  {
    slug: "presupuesto-anual-copropiedad-guia-paso-a-paso",
    title: "Presupuesto Anual de Copropiedad: Guía Completa para Administradores",
    excerpt:
      "Aprende a elaborar, presentar y gestionar el presupuesto anual de tu conjunto residencial o edificio: categorías de ingresos y gastos, fondo de imprevistos y cálculo de cuotas.",
    category: "Finanzas",
    categoryColor: "emerald",
    date: "28 de abril de 2026",
    dateISO: "2026-04-28",
    readTime: "8 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "presupuesto",
      "finanzas",
      "propiedad horizontal",
      "cuota de administración",
      "contabilidad",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">El presupuesto anual es la herramienta financiera más importante de cualquier copropiedad. Una elaboración rigurosa garantiza que el conjunto cuente con los recursos necesarios para su operación, mantenimiento y reservas, sin sobrecargar a los copropietarios.</p>

<h2>¿Qué es el Presupuesto de Copropiedad?</h2>
<p>Es un documento contable que proyecta los ingresos y egresos de la persona jurídica de propiedad horizontal para el período de un año. Debe ser presentado por el administrador y aprobado por la asamblea general ordinaria.</p>
<p>Una vez aprobado, es de obligatorio cumplimiento. Los gastos no presupuestados que superen cierto monto requieren aprobación del consejo o de una asamblea extraordinaria.</p>

<h2>Estructura del Presupuesto: Ingresos</h2>

<h3>Cuotas Ordinarias de Administración</h3>
<p>La principal fuente de ingresos. Se calcula dividiendo el total de egresos proyectados entre la suma de los coeficientes, obteniendo el valor por coeficiente. Luego se multiplica por el coeficiente de cada unidad para obtener la cuota individual.</p>
<p><strong>Fórmula básica:</strong> Total egresos anuales / 12 meses / suma de coeficientes = valor por coeficiente mensual.</p>

<h3>Cuotas Extraordinarias</h3>
<p>Para proyectos específicos no cubiertos por las cuotas ordinarias (remodelación de zona social, cambio de ascensores, etc.). Requieren aprobación de asamblea.</p>

<h3>Otros Ingresos</h3>
<ul>
  <li>Arrendamiento de parqueaderos visitantes o zonas comunes.</li>
  <li>Sanciones económicas por incumplimiento del reglamento.</li>
  <li>Rendimientos financieros de los fondos del conjunto.</li>
  <li>Ingresos por alquiler de vallas publicitarias (si aplica).</li>
</ul>

<h2>Estructura del Presupuesto: Egresos</h2>

<h3>1. Gastos de Personal</h3>
<p>Generalmente el rubro más alto en conjuntos medianos y grandes:</p>
<ul>
  <li>Salarios del personal de vigilancia (propio o empresa).</li>
  <li>Salarios del personal de servicios generales.</li>
  <li>Salario del administrador o honorarios.</li>
  <li>Prestaciones sociales: cesantías, primas, vacaciones, aportes parafiscales.</li>
  <li>Dotaciones.</li>
</ul>

<h3>2. Servicios Públicos de Áreas Comunes</h3>
<ul>
  <li>Energía eléctrica de zonas comunes y parqueaderos.</li>
  <li>Agua y alcantarillado de zonas comunes.</li>
  <li>Gas natural (si aplica para zonas comunes).</li>
  <li>Internet y telefonía de administración.</li>
</ul>

<h3>3. Mantenimiento y Reparaciones</h3>
<ul>
  <li>Contrato de mantenimiento de ascensores.</li>
  <li>Mantenimiento de bomba de agua, planta eléctrica, sistemas contra incendios.</li>
  <li>Jardinería y mantenimiento de zonas verdes.</li>
  <li>Pintura y mantenimiento de fachadas y zonas comunes.</li>
  <li>Reparaciones menores.</li>
</ul>

<h3>4. Seguros</h3>
<p>Obligación legal. Incluir al menos:</p>
<ul>
  <li>Póliza de incendio y terremoto sobre bienes comunes.</li>
  <li>Póliza de responsabilidad civil extracontractual.</li>
  <li>Seguro de equipos (si aplica para ascensores, equipos de zonas comunes).</li>
</ul>

<h3>5. Gastos Administrativos</h3>
<ul>
  <li>Honorarios del revisor fiscal (si aplica).</li>
  <li>Honorarios contables.</li>
  <li>Gastos legales.</li>
  <li>Papelería, comunicaciones y correspondencia.</li>
  <li>Software de administración.</li>
</ul>

<h3>6. Fondo de Imprevistos (Obligatorio)</h3>
<p>La Ley 675 exige que se destine mínimo el <strong>1% del presupuesto anual</strong> al fondo de imprevistos. Este dinero se acumula y solo puede usarse para atender gastos imprevistos o de urgencia. Muchos conjuntos presupuestan entre el 3% y el 5% para una reserva más sólida.</p>

<h2>Errores Frecuentes en la Elaboración del Presupuesto</h2>
<ol>
  <li><strong>No incluir el ajuste por inflación:</strong> los costos de personal y servicios aumentan cada año. Ignorar este ajuste genera déficit.</li>
  <li><strong>Presupuestar sin revisar contratos vigentes:</strong> los contratos de vigilancia, aseo o mantenimiento pueden haber variado.</li>
  <li><strong>No separar el fondo de imprevistos:</strong> algunos conjuntos lo incluyen en gastos generales y luego no tienen reservas.</li>
  <li><strong>Subestimar la cartera morosa:</strong> si hay un porcentaje de copropietarios que históricamente no pagan, el presupuesto debe considerar esta realidad en el cálculo de ingresos esperados.</li>
  <li><strong>No proyectar el mantenimiento mayor:</strong> obras de largo aliento como el mantenimiento de la cubierta o la fachada deben planificarse con varios años de anticipación.</li>
</ol>

<h2>Cómo Presentar el Presupuesto en la Asamblea</h2>
<ol>
  <li>Prepare un resumen ejecutivo por categorías (1 página).</li>
  <li>Muestre la comparación con el presupuesto del año anterior.</li>
  <li>Explique las variaciones significativas.</li>
  <li>Detalle cómo impacta en la cuota mensual por tipo de unidad.</li>
  <li>Prepare escenarios alternativos si los copropietarios proponen recortes.</li>
</ol>

<h2>Conclusión</h2>
<p>Un presupuesto bien elaborado es el primer paso hacia una administración transparente y eficiente. Documéntalo, socialízalo y controla su ejecución mensualmente. La diferencia entre un buen y un mal administrador a menudo se ve en cómo maneja las finanzas del conjunto.</p>
    `,
  },
  {
    slug: "cartera-morosa-propiedad-horizontal-como-cobrar",
    title: "Cartera Morosa en Propiedad Horizontal: Estrategias Efectivas de Cobro",
    excerpt:
      "Guía práctica para administradores sobre cómo prevenir y gestionar la mora en el pago de cuotas de administración: proceso prejudicial, judicial y mejores prácticas.",
    category: "Finanzas",
    categoryColor: "emerald",
    date: "20 de abril de 2026",
    dateISO: "2026-04-20",
    readTime: "7 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "cartera morosa",
      "cobro",
      "cuota de administración",
      "mora",
      "proceso ejecutivo",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">La cartera morosa es uno de los problemas más frecuentes y costosos en la administración de propiedad horizontal. Sin ingresos suficientes, el conjunto no puede cumplir sus obligaciones, deteriora las áreas comunes y genera conflictos entre copropietarios. Conoce las herramientas legales y operativas para gestionarla efectivamente.</p>

<h2>Marco Legal: La Obligación de Pagar</h2>
<p>El artículo 29 de la Ley 675 establece que cada propietario de bien privado está obligado a contribuir a las expensas necesarias para la administración, conservación y reparación de los bienes comunes. Esta obligación es propter rem, es decir, va con el inmueble: el nuevo propietario responde por las deudas del anterior.</p>
<p>El artículo 30 establece que el incumplimiento genera intereses de mora a la tasa máxima legal permitida, y que el administrador puede imponer sanciones adicionales según el reglamento.</p>

<h2>Prevención: El Mejor Cobro es el que no se Necesita</h2>

<h3>Facilitación del Pago</h3>
<ul>
  <li>Ofrecer múltiples medios de pago: transferencia bancaria, pago en línea, PSE.</li>
  <li>Enviar el estado de cuenta mensualmente antes de la fecha de pago.</li>
  <li>Establecer débito automático para quien lo solicite.</li>
  <li>Enviar recordatorio de pago 5 días antes del vencimiento.</li>
</ul>

<h3>Comunicación Proactiva</h3>
<ul>
  <li>Publicar mensualmente el estado financiero del conjunto.</li>
  <li>Mostrar cómo se usa cada peso recaudado.</li>
  <li>Reconocer públicamente (con su consentimiento) a los copropietarios al día.</li>
</ul>

<h2>Gestión de la Mora: Proceso Escalonado</h2>

<h3>Nivel 1: Recordatorio Amistoso (1-30 días de mora)</h3>
<p>Comunicación amable recordando el saldo pendiente. Puede ser por WhatsApp, correo o notificación en la app. Muchos casos se resuelven en esta etapa porque el copropietario simplemente olvidó el pago.</p>

<h3>Nivel 2: Notificación Formal (31-60 días de mora)</h3>
<p>Comunicación escrita formal indicando el saldo, los intereses de mora acumulados y las consecuencias del incumplimiento según el reglamento. Solicitar respuesta en 10 días hábiles.</p>

<h3>Nivel 3: Acuerdo de Pago (61-90 días de mora)</h3>
<p>Ofrecer un plan de pago con cuotas. El administrador puede acordar hasta 6-12 cuotas sin necesidad de aprobación de asamblea (según el reglamento). Cualquier acuerdo debe formalizarse por escrito.</p>
<p><strong>Consejo:</strong> No suspender los intereses de mora durante el acuerdo de pago; sí puede condonarlos parcialmente con aprobación del consejo o la asamblea como incentivo.</p>

<h3>Nivel 4: Restricción de Servicios (si lo permite el reglamento)</h3>
<p>Algunos reglamentos permiten restringir el acceso a servicios no esenciales como salón comunal, canchas deportivas o piscina a quienes estén en mora. Nunca se pueden restringir servicios esenciales (agua, acceso al inmueble).</p>

<h3>Nivel 5: Cobro Jurídico — Proceso Ejecutivo</h3>
<p>Agotada la gestión prejudicial, el administrador inicia un proceso ejecutivo ante un juez civil. Los documentos base de la ejecución son:</p>
<ul>
  <li>Las actas de asamblea donde se aprueba el presupuesto (título ejecutivo).</li>
  <li>El reglamento de propiedad horizontal.</li>
  <li>El estado de cuenta certificado por el administrador o el revisor fiscal.</li>
</ul>
<p>El proceso ejecutivo busca el embargo y remate del bien inmueble o de otros bienes del deudor para satisfacer la deuda.</p>

<h2>¿Se Puede Vender un Inmueble con Deudas de Administración?</h2>
<p>Técnicamente sí, pero el artículo 29 de la Ley 675 establece que el nuevo propietario responde solidariamente por las deudas de administración. En la práctica, las notarías exigen el paz y salvo de la copropiedad para la escrituración. El administrador está en su derecho de negarlo a un moroso.</p>

<h2>Manejo Contable de la Cartera</h2>
<ul>
  <li>Clasificar la cartera por antigüedad: 0-30 días, 31-60, 61-90, más de 90 días.</li>
  <li>Crear una provisión para deudas difíciles de cobrar (cartera de más de 180 días).</li>
  <li>Reportar mensualmente al consejo el estado de la cartera.</li>
  <li>No mezclar los ingresos por cuotas con los ingresos por intereses de mora en los estados financieros.</li>
</ul>

<h2>Tecnología para el Control de Cartera</h2>
<p>Un software especializado permite:</p>
<ul>
  <li>Ver en tiempo real qué unidades están al día y cuáles en mora.</li>
  <li>Enviar recordatorios automáticos por correo o notificación push.</li>
  <li>Que los residentes consulten su saldo desde el celular.</li>
  <li>Generar reportes de cartera por antigüedad con un clic.</li>
  <li>Registrar acuerdos de pago y hacer seguimiento automático.</li>
</ul>

<h2>Conclusión</h2>
<p>La gestión de cartera requiere constancia, claridad y procesos bien definidos. Los conjuntos que tienen sistemas claros de cobro, facilitan el pago y actúan oportunamente en la mora tienden a mantener niveles de recaudo superiores al 95%. Esto se traduce en un conjunto bien mantenido y una administración que genera confianza.</p>
    `,
  },
  {
    slug: "consejo-administracion-propiedad-horizontal-funciones",
    title: "Consejo de Administración en Propiedad Horizontal: Funciones, Elección y Responsabilidades",
    excerpt:
      "Todo lo que necesitas saber sobre el consejo de administración de una copropiedad: cuándo es obligatorio, cómo se elige, qué puede y qué no puede hacer, y su relación con el administrador.",
    category: "Gobierno Corporativo",
    categoryColor: "purple",
    date: "12 de abril de 2026",
    dateISO: "2026-04-12",
    readTime: "6 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "consejo de administración",
      "propiedad horizontal",
      "gobierno",
      "copropiedad",
      "funciones",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">El consejo de administración es un órgano fundamental en la gobernanza de las copropiedades medianas y grandes. Actúa como puente entre la asamblea general y el administrador, y su correcto funcionamiento puede marcar la diferencia entre una copropiedad bien gestionada y una plagada de conflictos.</p>

<h2>¿Cuándo es Obligatorio el Consejo de Administración?</h2>
<p>Según el artículo 53 de la Ley 675 de 2001, el consejo de administración es <strong>obligatorio en conjuntos de más de 30 unidades privadas</strong>. En conjuntos más pequeños, el reglamento puede crearlo de forma voluntaria.</p>
<p>Cuando no hay consejo de administración (sea por no ser obligatorio o por no haber sido elegido), sus funciones son asumidas por la asamblea general.</p>

<h2>Composición y Elección</h2>
<p>El número de integrantes del consejo lo determina el reglamento de propiedad horizontal. Lo más común es entre 3 y 7 miembros principales con sus respectivos suplentes.</p>
<p><strong>Requisitos:</strong></p>
<ul>
  <li>Ser propietario de un bien privado en el conjunto.</li>
  <li>Estar al día en el pago de cuotas de administración.</li>
  <li>No tener sanciones vigentes por incumplimiento del reglamento.</li>
</ul>
<p>Son elegidos por la asamblea general para períodos de uno o dos años (según el reglamento). El administrador <strong>no puede ser miembro del consejo</strong>.</p>

<h2>Funciones del Consejo de Administración</h2>

<h3>Control y Supervisión</h3>
<ul>
  <li>Supervisar la gestión del administrador y exigirle informes periódicos.</li>
  <li>Revisar los estados financieros y el manejo del presupuesto.</li>
  <li>Controlar que se ejecuten las decisiones de asamblea.</li>
  <li>Verificar el estado de los bienes comunes y la calidad de los servicios contratados.</li>
</ul>

<h3>Decisiones de Gestión Ordinaria</h3>
<p>El reglamento suele delegar en el consejo la aprobación de gastos que superen un determinado monto sin llegar al nivel de asamblea. Esto agiliza la gestión sin necesidad de convocar asambleas frecuentes.</p>

<h3>Sanciones</h3>
<p>El consejo generalmente conoce los procesos sancionatorios contra copropietarios que incumplen el reglamento. Escucha descargos y decide las sanciones que aplica el administrador.</p>

<h3>Apoyo al Administrador</h3>
<ul>
  <li>Asesorar al administrador en decisiones importantes.</li>
  <li>Avalar contratos de alto valor.</li>
  <li>Participar en procesos de selección de proveedores estratégicos.</li>
</ul>

<h2>Lo que el Consejo NO Puede Hacer</h2>
<p>Esta es una fuente frecuente de conflictos. El consejo no puede:</p>
<ul>
  <li><strong>Reemplazar al administrador</strong> en la representación legal ni en sus funciones ejecutivas.</li>
  <li><strong>Dar instrucciones directas al personal</strong> del conjunto (porteros, servicios generales). Debe hacerlo a través del administrador.</li>
  <li><strong>Contratar directamente</strong> proveedores o servicios sin que el administrador suscriba el contrato.</li>
  <li><strong>Tomar decisiones</strong> que la ley o el reglamento reservan a la asamblea general.</li>
  <li><strong>Invertir o manejar directamente</strong> los fondos del conjunto.</li>
</ul>

<h2>Reuniones del Consejo</h2>
<p>El reglamento establece la periodicidad de las reuniones. Lo más común es mensual. Para sesionar válidamente, se requiere:</p>
<ul>
  <li>Quórum según el reglamento (generalmente mayoría simple de sus miembros).</li>
  <li>Convocatoria previa (mínimo 3 días hábiles en muchos reglamentos).</li>
  <li>Elaboración de acta de cada reunión, firmada por el presidente y el secretario de la sesión.</li>
</ul>

<h2>Conflictos Frecuentes con el Administrador</h2>
<p>La relación consejo-administrador puede ser tensa cuando:</p>
<ul>
  <li>El consejo intenta microgestionar la operación diaria.</li>
  <li>El administrador no informa oportunamente al consejo.</li>
  <li>Hay desacuerdos sobre el manejo del presupuesto.</li>
  <li>Miembros del consejo tienen intereses personales en contratos del conjunto.</li>
</ul>
<p>La clave es una delimitación clara de funciones, comunicación permanente y respeto por los roles de cada órgano.</p>

<h2>Responsabilidad de los Miembros del Consejo</h2>
<p>Aunque los consejeros son voluntarios, sus decisiones pueden generar responsabilidad civil. Si aprueban gastos ilegales, favorecen a proveedores indebidamente o incumplen sus deberes de vigilancia, pueden ser demandados por los copropietarios.</p>

<h2>Consejos para un Consejo Efectivo</h2>
<ol>
  <li>Establecer un plan de trabajo anual alineado con el presupuesto.</li>
  <li>Documentar todas las decisiones en actas.</li>
  <li>Rotar los roles (presidente, secretario) para distribuir la carga.</li>
  <li>Capacitar a los nuevos miembros sobre sus funciones y el reglamento.</li>
  <li>Usar plataformas digitales para compartir documentos y comunicarse con el administrador.</li>
</ol>

<h2>Conclusión</h2>
<p>Un consejo de administración activo, bien informado y respetuoso de sus límites es el mejor aliado del administrador y el mejor garante de los derechos de los copropietarios. Invierte tiempo en elegir personas comprometidas y en formalizar su funcionamiento.</p>
    `,
  },
  {
    slug: "coeficiente-copropiedad-que-es-como-se-calcula",
    title: "Coeficiente de Copropiedad: Qué Es, Cómo Se Calcula y Por Qué Importa",
    excerpt:
      "Entende qué determina el coeficiente de copropiedad, cómo afecta el valor de tu cuota de administración y los derechos de voto en la asamblea, y cómo puede modificarse.",
    category: "Marco Legal",
    categoryColor: "indigo",
    date: "5 de abril de 2026",
    dateISO: "2026-04-05",
    readTime: "5 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "coeficiente",
      "copropiedad",
      "cuota",
      "votación",
      "propiedad horizontal",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">El coeficiente de copropiedad es uno de los conceptos más importantes y menos comprendidos en la propiedad horizontal. Define cuánto paga cada propietario, cuánto vota en la asamblea y qué porcentaje de los bienes comunes le corresponde.</p>

<h2>Definición Legal</h2>
<p>Según el artículo 26 de la Ley 675 de 2001, el coeficiente de copropiedad indica <strong>la participación porcentual de cada propietario en los bienes comunes del edificio o conjunto</strong>. También sirve para:</p>
<ul>
  <li>Calcular la cuota de administración que debe pagar cada unidad.</li>
  <li>Determinar el peso del voto de cada propietario en la asamblea.</li>
  <li>Calcular la participación en las utilidades o pérdidas de la persona jurídica.</li>
</ul>

<h2>¿Cómo se Calcula el Coeficiente?</h2>
<p>El coeficiente es calculado por el urbanizador o constructor antes de protocolizar el reglamento de propiedad horizontal. Se basa en factores objetivos que la ley no especifica con detalle, pero que típicamente incluyen:</p>
<ul>
  <li><strong>Área privada:</strong> el factor principal en la mayoría de los casos.</li>
  <li><strong>Destinación del inmueble:</strong> residencial vs. comercial.</li>
  <li><strong>Ubicación dentro del edificio:</strong> pisos superiores pueden tener mayor valor.</li>
  <li><strong>Acceso a bienes comunes:</strong> unidades con acceso a parqueadero propio pueden tener coeficiente diferente.</li>
</ul>
<p><strong>Ejemplo simplificado:</strong> Si un conjunto tiene 10 apartamentos de 80 m² y 5 de 60 m², el total de área privada es (10×80) + (5×60) = 1.100 m². El coeficiente de un apartamento de 80 m² sería 80/1.100 = 7,27%. El de uno de 60 m² sería 60/1.100 = 5,45%.</p>

<h2>Coeficiente y Cuota de Administración</h2>
<p>La forma más común de calcular la cuota mensual:</p>
<pre>Cuota mensual = (Presupuesto anual / 12) × coeficiente del apartamento</pre>
<p>Algunos conjuntos optan por cuotas iguales para todas las unidades (independiente del coeficiente) o por un sistema mixto. Esto debe estar definido en el reglamento y aprobado por la asamblea.</p>

<h2>Coeficiente y Derecho al Voto</h2>
<p>En la asamblea, <strong>cada copropietario vota con el peso de su coeficiente</strong>, no con un voto por persona. Esto significa que el dueño de un apartamento más grande tiene más influencia en las decisiones.</p>
<p>Por eso, en conjuntos donde hay un propietario con muchos inmuebles (como el constructor que aún no ha vendido), esa persona puede tener el control de la asamblea.</p>

<h2>¿Puede Modificarse el Coeficiente?</h2>
<p>Sí, pero es un proceso complejo. Requiere:</p>
<ul>
  <li>Aprobación unánime de la asamblea general de copropietarios.</li>
  <li>Reforma del reglamento de propiedad horizontal.</li>
  <li>Elevación a escritura pública y registro en la Oficina de Instrumentos Públicos.</li>
</ul>
<p>La unanimidad requerida hace que la modificación del coeficiente sea prácticamente imposible en conjuntos grandes. Por eso es crucial que sea bien calculado desde el inicio.</p>

<h2>Errores Frecuentes</h2>
<ul>
  <li>Confundir el coeficiente con el área del apartamento (no son lo mismo en todos los casos).</li>
  <li>Cobrar cuotas iguales sin verificar si el reglamento lo permite.</li>
  <li>No incluir parqueaderos o depósitos en el cálculo del coeficiente cuando tienen área privada.</li>
  <li>No actualizar el coeficiente al hacer ampliaciones o subdivisiones de unidades privadas.</li>
</ul>

<h2>Conclusión</h2>
<p>El coeficiente es la base matemática de la vida en copropiedad. Entenderlo permite al administrador explicar de forma transparente por qué algunas unidades pagan más que otras, y a los copropietarios entender su peso real en las decisiones colectivas.</p>
    `,
  },
  {
    slug: "fondo-imprevistos-propiedad-horizontal",
    title: "Fondo de Imprevistos en Propiedad Horizontal: Obligación Legal y Manejo Correcto",
    excerpt:
      "Qué es el fondo de imprevistos, por qué es obligatorio según la Ley 675, cuánto debe constituirse, para qué puede usarse y cómo debe manejarse contablemente.",
    category: "Finanzas",
    categoryColor: "emerald",
    date: "28 de marzo de 2026",
    dateISO: "2026-03-28",
    readTime: "5 min",
    author: "Equipo Vestap",
    authorRole: "Especialistas en Gestión de Copropiedades",
    tags: [
      "fondo de imprevistos",
      "reservas",
      "finanzas",
      "propiedad horizontal",
      "ley 675",
    ],
    featured: false,
    content: `
<p class="text-xl text-slate-600 leading-relaxed mb-8">El fondo de imprevistos es una de las obligaciones financieras más desconocidas y frecuentemente incumplidas en la gestión de propiedad horizontal. Su ausencia puede poner en serios aprietos al conjunto ante gastos inesperados.</p>

<h2>¿Qué es el Fondo de Imprevistos?</h2>
<p>Es una reserva económica obligatoria que las copropiedades deben constituir y mantener para atender gastos imprevistos o de urgencia que no estén contemplados en el presupuesto ordinario.</p>
<p>Está regulado por el <strong>artículo 35 de la Ley 675 de 2001</strong>, que establece la obligación de su constitución y las reglas básicas de su uso.</p>

<h2>¿Cuánto Debe Ser el Fondo?</h2>
<p>La ley establece que el fondo de imprevistos debe constituirse con un aporte <strong>mínimo del 1% del presupuesto anual de gastos</strong>. Este es el mínimo legal; el reglamento o la asamblea pueden establecer un porcentaje mayor.</p>
<p><strong>Recomendación práctica:</strong> Los administradores con experiencia sugieren destinar entre el 3% y el 5% del presupuesto anual. Un conjunto con presupuesto de $100 millones al año tendría un fondo de imprevistos de $3 a $5 millones anuales, que se acumula año a año hasta alcanzar un nivel de reserva suficiente.</p>

<h2>¿Para Qué Puede Usarse?</h2>
<p>Exclusivamente para:</p>
<ul>
  <li>Atender gastos imprevistos de conservación o reparación de bienes comunes.</li>
  <li>Cubrir gastos de urgencia que no puedan esperar a la aprobación de una cuota extraordinaria.</li>
  <li>Afrontar situaciones de emergencia (desastres naturales, daños estructurales urgentes).</li>
</ul>

<h3>¿Para qué NO puede usarse?</h3>
<ul>
  <li><strong>Cubrir déficits del presupuesto ordinario.</strong></li>
  <li>Pagar nómina o gastos corrientes cuando hay falta de liquidez por mora.</li>
  <li>Financiar obras o mejoras que deberían aprobarse como cuota extraordinaria.</li>
  <li>Ser "prestado" al administrador o a copropietarios.</li>
</ul>

<h2>Manejo Contable del Fondo</h2>
<p>El fondo de imprevistos debe manejarse en una <strong>cuenta bancaria separada</strong> de la cuenta de operación ordinaria. Esto garantiza que el dinero esté disponible cuando se necesite y que no sea usado inadvertidamente para gastos corrientes.</p>
<p>En los estados financieros:</p>
<ul>
  <li>Se registra como un pasivo o una reserva en el patrimonio de la persona jurídica.</li>
  <li>Los aportes mensuales van al debe del fondo.</li>
  <li>Los usos (con soporte y autorización) van al haber.</li>
  <li>El saldo debe reportarse mensualmente al consejo de administración.</li>
</ul>

<h2>¿Quién Autoriza el Uso del Fondo?</h2>
<p>Depende del reglamento, pero generalmente:</p>
<ul>
  <li>El administrador, con aprobación del consejo, para montos menores.</li>
  <li>La asamblea general para montos significativos.</li>
  <li>Solo el administrador en situaciones de emergencia comprobada, con posterior rendición de cuentas.</li>
</ul>

<h2>Errores Comunes</h2>
<ol>
  <li><strong>No constituirlo:</strong> muchos conjuntos simplemente omiten este aporte. Es una violación legal.</li>
  <li><strong>Mezclarlo con los fondos operativos:</strong> si está en la misma cuenta, inevitablemente se usa para gastos corrientes.</li>
  <li><strong>No reportarlo:</strong> los copropietarios tienen derecho a saber el saldo del fondo.</li>
  <li><strong>Usarlo para cubrir cartera morosa:</strong> la solución correcta para la mora es el cobro jurídico, no usar el fondo.</li>
</ol>

<h2>Conclusión</h2>
<p>El fondo de imprevistos es el "colchón financiero" del conjunto. Un administrador responsable lo constituye desde el primer mes de gestión, lo mantiene separado y lo reporta con transparencia. Es la diferencia entre un conjunto preparado para imprevistos y uno que debe pedir cuotas extraordinarias de emergencia ante cada eventualidad.</p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((p) => p.featured).slice(0, 3);
}

export function getRecentPosts(limit = 3): BlogPost[] {
  return blogPosts.slice(0, limit);
}

export function getRelatedPosts(current: BlogPost, limit = 3): BlogPost[] {
  return blogPosts
    .filter(
      (p) =>
        p.slug !== current.slug &&
        (p.category === current.category ||
          p.tags.some((t) => current.tags.includes(t)))
    )
    .slice(0, limit);
}
