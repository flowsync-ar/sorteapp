import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Sorteapp",
  description: "Términos y Condiciones de uso de Sorteapp y de los sorteos mensuales.",
};

// Contenido legal transcripto verbatim del documento fuente (no reescribir
// ni resumir — ver instrucciones del batch de apply). Los campos entre "[ ]"
// son placeholders explícitos de datos reales pendientes, misma convención
// que env.local.example.
//
// TODO: la nota de advertencia y el checklist final de este documento están
// dirigidos a quien publica el sitio (no al visitante). Se renderizan tal
// cual porque son parte literal del contenido provisto, pero antes de un
// lanzamiento real conviene ocultarlos detrás de un flag de entorno o
// quitarlos una vez completados todos los placeholders.
export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl text-foreground">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {/* TODO: dato real */}
        <strong>[NOMBRE DE LA PLATAFORMA]</strong> — Última actualización:{" "}
        <strong>[DD/MM/AAAA]</strong>
      </p>

      <div
        role="note"
        aria-label="Nota interna antes de publicar"
        className="mt-8 rounded-xl border border-champagne/40 bg-champagne/10 p-4 text-sm text-foreground"
      >
        <strong>⚠️ Antes de publicar este documento</strong>: todos los campos
        entre corchetes <code>[ ]</code> son placeholders y tienen que
        completarse con datos reales y verificables. No publiqués esta página
        sin haber cargado el número de autorización de lotería vigente y los
        datos del escribano interviniente — son el corazón de la credibilidad
        legal de la plataforma.
      </div>

      <div className="prose-legal mt-10 space-y-8 text-muted-foreground">
        <section aria-labelledby="s1">
          <h2 id="s1" className="font-sans text-xl font-semibold text-foreground">
            1. Identificación del organizador
          </h2>
          <p className="mt-3">
            <strong>[RAZÓN SOCIAL COMPLETA]</strong>, CUIT{" "}
            <strong>[XX-XXXXXXXX-X]</strong>, con domicilio legal en{" "}
            <strong>[DOMICILIO COMPLETO, LOCALIDAD, PROVINCIA]</strong>, en
            adelante &ldquo;el Organizador&rdquo; o &ldquo;la
            Plataforma&rdquo;, es la entidad responsable de la
            comercialización de los cursos digitales y de la organización de
            los sorteos descritos en este documento.
          </p>
          <p className="mt-3">
            El presente documento regula el uso del sitio{" "}
            <strong>[DOMINIO DEL SITIO]</strong> (en adelante, &ldquo;el
            Sitio&rdquo;) y las condiciones bajo las cuales se comercializan
            los cursos digitales y se asignan las participaciones para los
            sorteos mensuales.
          </p>
          <p className="mt-3">
            La adquisición de un curso digital implica la lectura,
            comprensión y aceptación plena de estos Términos y Condiciones.
            Si no estás de acuerdo con alguna cláusula, no debés utilizar el
            Sitio ni realizar compras en él.
          </p>
        </section>

        <section aria-labelledby="s2">
          <h2 id="s2" className="font-sans text-xl font-semibold text-foreground">
            2. Objeto
          </h2>
          <p className="mt-3">
            El Organizador comercializa cursos digitales de formación en{" "}
            <strong>[ÁREA/TEMÁTICA DE LOS CURSOS]</strong>, detallados en la
            sección &ldquo;Catálogo&rdquo; del Sitio. Cada compra de un curso
            digital incluye, sin cargo adicional, la asignación de un número
            de participación de seis (6) cifras (rango 000000 a 999999) para
            el sorteo mensual vigente al momento de la compra, conforme a la
            mecánica descrita en la Cláusula 6.
          </p>
          <p className="mt-3">
            La entrega del curso digital es independiente del resultado del
            sorteo: todo comprador recibe el curso adquirido, resulte o no
            ganador.
          </p>
        </section>

        <section aria-labelledby="s3">
          <h2 id="s3" className="font-sans text-xl font-semibold text-foreground">
            3. Autorización legal del sorteo
          </h2>
          <p className="mt-3">
            Los sorteos organizados a través del Sitio cuentan con
            autorización de{" "}
            <strong>
              [ORGANISMO DE LOTERÍA PROVINCIAL / IAFAS / ENTIDAD COMPETENTE]
            </strong>
            , bajo el expediente/autorización N°{" "}
            <strong>[NÚMERO DE AUTORIZACIÓN]</strong>, vigente para la
            jurisdicción de <strong>[PROVINCIA/S ALCANZADA/S]</strong>.
          </p>
          <p className="mt-3">
            Podés verificar la vigencia de esta autorización directamente
            ante el organismo emisor. El Organizador se compromete a mantener
            publicado en el Sitio el comprobante de autorización
            correspondiente a cada edición del sorteo.
          </p>
        </section>

        <section aria-labelledby="s4">
          <h2 id="s4" className="font-sans text-xl font-semibold text-foreground">
            4. Escribanía interviniente
          </h2>
          <p className="mt-3">
            Cada sorteo es presenciado y certificado por{" "}
            <strong>[NOMBRE DEL ESCRIBANO/A]</strong>, Escribano/a
            Público/a, Matrícula N° <strong>[NÚMERO DE MATRÍCULA]</strong>,
            Registro N° <strong>[NÚMERO DE REGISTRO]</strong> de la
            Ciudad/Provincia de <strong>[JURISDICCIÓN]</strong>.
          </p>
          <p className="mt-3">
            El acta notarial de cada sorteo, con el detalle del número
            ganador y el procedimiento utilizado, se publica en el Sitio
            dentro de las <strong>[XX]</strong> horas posteriores a la
            realización del sorteo, en la sección &ldquo;Transparencia&rdquo;.
          </p>
        </section>

        <section aria-labelledby="s5">
          <h2 id="s5" className="font-sans text-xl font-semibold text-foreground">
            5. Precio y medios de pago
          </h2>
          <p className="mt-3">
            <strong>5.1 Precios.</strong> Los precios de cada tier de curso
            digital, expresados en pesos argentinos (ARS) e incluidos los
            impuestos aplicables, se muestran en el Sitio al momento de la
            compra. El Organizador se reserva el derecho de modificar los
            precios de futuras ediciones, sin efecto retroactivo sobre
            compras ya confirmadas.
          </p>
          <p className="mt-3">
            <strong>5.2 Medios de pago disponibles.</strong>
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>
              <strong>Mercado Pago</strong>: pago acreditado automáticamente.
              La participación queda confirmada de forma inmediata una vez
              que Mercado Pago notifica el pago como aprobado.
            </li>
            <li>
              <strong>Transferencia bancaria con comprobante</strong>: el
              comprador sube el comprobante de la transferencia a través del
              Sitio. Este pago queda en estado <em>pendiente de
              verificación</em> hasta que el equipo del Organizador lo valide
              manualmente, dentro de un plazo estimado de{" "}
              <strong>[48]</strong> horas hábiles. El número de participación
              se asigna recién cuando el pago es verificado; si el
              comprobante es rechazado (por ejemplo, por no coincidir el
              monto o los datos), se notifica al comprador y no se asigna
              número alguno, quedando la operación sin efecto.
            </li>
          </ul>
          <p className="mt-3">
            <strong>5.3 Datos para transferencia.</strong> Los datos de la
            cuenta destino se muestran únicamente en el flujo de checkout del
            Sitio y pueden actualizarse sin previo aviso por motivos de
            seguridad. El Organizador no solicita datos de transferencia por
            ningún otro canal (WhatsApp, redes sociales, email no
            institucional); cualquier solicitud por esas vías debe
            considerarse fraudulenta y reportarse de inmediato a{" "}
            <strong>[EMAIL/CANAL DE CONTACTO OFICIAL]</strong>.
          </p>
        </section>

        <section aria-labelledby="s6">
          <h2 id="s6" className="font-sans text-xl font-semibold text-foreground">
            6. Asignación de números de participación
          </h2>
          <p className="mt-3">
            <strong>6.1</strong> Cada edición mensual del sorteo tiene un
            rango propio de números de seis cifras (000000 a 999999), que se
            reinicia en cada nueva edición.
          </p>
          <p className="mt-3">
            <strong>6.2</strong> El número se asigna de forma aleatoria y
            única dentro de la edición vigente, en el momento en que el pago
            queda confirmado (automáticamente para Mercado Pago, o tras la
            verificación manual para comprobantes de transferencia). No es
            posible elegir ni reservar un número específico.
          </p>
          <p className="mt-3">
            <strong>6.3</strong> Si el cupo de una edición se agota antes de
            fin de mes, el Sitio dejará de ofrecer ese tier/edición y
            habilitará la edición siguiente, informándolo de forma visible.
          </p>
          <p className="mt-3">
            <strong>6.4</strong> Un mismo comprador puede adquirir más de un
            curso/número dentro de la misma edición, aumentando
            proporcionalmente sus chances de resultar ganador.
          </p>
        </section>

        <section aria-labelledby="s7">
          <h2 id="s7" className="font-sans text-xl font-semibold text-foreground">
            7. Mecánica del sorteo
          </h2>
          <p className="mt-3">
            <strong>7.1 Fecha y modalidad.</strong> El sorteo de cada edición
            se realiza el <strong>[DÍA]</strong> de cada mes, a las{" "}
            <strong>[HH:MM]</strong> (hora de Argentina), mediante{" "}
            <strong>
              [MECANISMO: ej. &ldquo;extracción de la Lotería Nacional /
              provincial correspondiente al día del sorteo&rdquo; o
              &ldquo;sistema de generación aleatoria auditado por el
              escribano interviniente&rdquo;]
            </strong>
            , transmitido en vivo por{" "}
            <strong>[CANAL: Instagram/YouTube/otro]</strong>.
          </p>
          <p className="mt-3">
            <strong>7.2 Determinación del ganador.</strong> Resulta ganador
            el participante cuyo número de seis cifras coincide con el
            resultado obtenido según el mecanismo descrito en 7.1, dentro de
            la edición correspondiente.
          </p>
          <p className="mt-3">
            <strong>7.3 Publicación y notificación.</strong> El resultado se
            publica en el Sitio y en las redes oficiales del Organizador
            dentro de las <strong>[24]</strong> horas del sorteo. Además, se
            notifica al ganador por <strong>[EMAIL/TELÉFONO]</strong>{" "}
            registrado en la compra.
          </p>
          <p className="mt-3">
            <strong>7.4 Reclamo del premio.</strong> El ganador dispone de{" "}
            <strong>[15/30]</strong> días corridos desde la publicación del
            resultado para contactar al Organizador y reclamar su premio,
            aportando la documentación que se le requiera para acreditar su
            identidad. Vencido ese plazo sin que el ganador se haya
            presentado,{" "}
            <strong>
              [DEFINIR: se declara desierto / se realiza un nuevo sorteo
              entre los números restantes, según lo autorizado por el
              organismo de lotería]
            </strong>
            .
          </p>
        </section>

        <section aria-labelledby="s8">
          <h2 id="s8" className="font-sans text-xl font-semibold text-foreground">
            8. Entrega de premios
          </h2>
          <p className="mt-3">
            <strong>8.1</strong> Los premios se entregan en las condiciones
            descritas para cada sorteo específico (ej. moto 0km, consola,
            vehículo), incluyendo, según el caso, patentamiento,
            transferencia de dominio o gastos de flete, cuyos costos y
            responsables se detallarán en las bases particulares de cada
            sorteo.
          </p>
          <p className="mt-3">
            <strong>8.2</strong> Los impuestos que graven la obtención del
            premio (por ejemplo, el Impuesto a los Premios de Juegos y
            Concursos, Ley 20.630, cuando resulte aplicable) son
            responsabilidad exclusiva del ganador, salvo que se indique
            expresamente lo contrario en las bases de esa edición.
          </p>
          <p className="mt-3">
            <strong>8.3</strong> El Organizador no se responsabiliza por
            demoras en la entrega atribuibles a la falta de presentación de
            documentación por parte del ganador o a terceros
            (transportistas, registros, etc.).
          </p>
        </section>

        <section aria-labelledby="s9">
          <h2 id="s9" className="font-sans text-xl font-semibold text-foreground">
            9. Requisitos para participar
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Ser mayor de 18 años.</li>
            <li>
              Residir en la República Argentina, en una jurisdicción
              alcanzada por la autorización vigente (Cláusula 3).
            </li>
            <li>
              Completar datos verídicos al momento de la compra (nombre, DNI,
              email, teléfono).
            </li>
            <li>
              No estar comprendido en las inhabilitaciones que, en su caso,
              establezca la normativa de lotería aplicable (por ejemplo,
              empleados del Organizador o de la escribanía interviniente y
              sus familiares directos, si así lo exige la autorización).
            </li>
          </ul>
        </section>

        <section aria-labelledby="s10">
          <h2 id="s10" className="font-sans text-xl font-semibold text-foreground">
            10. Cancelaciones, reembolsos y derecho de revocación
          </h2>
          <p className="mt-3">
            <strong>10.1</strong> Conforme al Artículo 34 de la Ley 24.240 de
            Defensa del Consumidor, el comprador tiene derecho a revocar la
            compra dentro de los diez (10) días corridos desde la
            confirmación de la operación, siempre que no haya accedido al
            contenido del curso digital ni haya tenido lugar el sorteo de la
            edición correspondiente a su número. Para ejercer este derecho,
            debe contactar a <strong>[EMAIL DE CONTACTO]</strong>.
          </p>
          <p className="mt-3">
            <strong>10.2</strong> Una vez que el comprador accedió al
            contenido del curso digital, el derecho de revocación queda
            limitado en los términos del Artículo 34 in fine de la Ley
            24.240, dado que se trata de contenido digital entregado con
            conformidad expresa del consumidor.
          </p>
          <p className="mt-3">
            <strong>10.3</strong> No se reembolsan compras confirmadas cuyo
            número ya haya participado en un sorteo ya realizado.
          </p>
        </section>

        <section aria-labelledby="s11">
          <h2 id="s11" className="font-sans text-xl font-semibold text-foreground">
            11. Propiedad intelectual
          </h2>
          <p className="mt-3">
            El contenido de los cursos digitales, así como los textos,
            imágenes, diseño y marca del Sitio, son propiedad del Organizador
            o de sus licenciantes, y están protegidos por la Ley 11.723 de
            Propiedad Intelectual. Se prohíbe su reproducción, distribución o
            explotación comercial sin autorización expresa.
          </p>
        </section>

        <section aria-labelledby="s12">
          <h2 id="s12" className="font-sans text-xl font-semibold text-foreground">
            12. Protección de datos personales
          </h2>
          <p className="mt-3">
            Los datos personales recabados durante el proceso de compra se
            tratan conforme a la Ley 25.326 de Protección de Datos
            Personales. El comprador tiene derecho de acceso, rectificación y
            supresión de sus datos, que puede ejercer escribiendo a{" "}
            <strong>[EMAIL DE CONTACTO]</strong>. La Agencia de Acceso a la
            Información Pública, en su carácter de Órgano de Control de la
            Ley 25.326, tiene la atribución de atender las denuncias y
            reclamos que se interpongan con relación al incumplimiento de las
            normas sobre protección de datos personales.
          </p>
        </section>

        <section aria-labelledby="s13">
          <h2 id="s13" className="font-sans text-xl font-semibold text-foreground">
            13. Limitación de responsabilidad
          </h2>
          <p className="mt-3">
            El Organizador no se responsabiliza por: (a) fallas técnicas
            ajenas a su control (caídas de Mercado Pago, del hosting o de
            conectividad del usuario) que impidan completar una compra; (b)
            el uso indebido de la cuenta o credenciales del comprador; (c)
            demoras en la verificación de comprobantes por causas de fuerza
            mayor.
          </p>
        </section>

        <section aria-labelledby="s14">
          <h2 id="s14" className="font-sans text-xl font-semibold text-foreground">
            14. Modificaciones
          </h2>
          <p className="mt-3">
            El Organizador podrá modificar estos Términos y Condiciones en
            cualquier momento. Las modificaciones se publicarán en esta misma
            página con su fecha de actualización y regirán para las compras
            realizadas con posterioridad a su publicación. Las compras ya
            confirmadas se rigen por la versión vigente al momento de la
            compra.
          </p>
        </section>

        <section aria-labelledby="s15">
          <h2 id="s15" className="font-sans text-xl font-semibold text-foreground">
            15. Legislación aplicable y jurisdicción
          </h2>
          <p className="mt-3">
            Este documento se rige por las leyes de la República Argentina.
            Para cualquier controversia derivada de su interpretación o
            aplicación, las partes se someten a la jurisdicción de los
            tribunales ordinarios de <strong>[JURISDICCIÓN]</strong>, sin
            perjuicio de las normas de protección al consumidor que habiliten
            al comprador a optar por el fuero correspondiente a su domicilio.
          </p>
        </section>

        <section aria-labelledby="s16">
          <h2 id="s16" className="font-sans text-xl font-semibold text-foreground">
            16. Contacto
          </h2>
          <p className="mt-3">
            Para consultas, reclamos o ejercicio de tus derechos como
            consumidor, podés escribirnos a{" "}
            <strong>[EMAIL DE CONTACTO]</strong> o{" "}
            <strong>[OTRO CANAL OFICIAL]</strong>.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-surface pt-8">
        <h2 className="font-sans text-lg font-semibold text-foreground">
          Checklist de datos reales pendientes de completar
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Razón social, CUIT y domicilio legal del Organizador</li>
          <li>Dominio definitivo del Sitio</li>
          <li>
            Organismo de lotería, número de expediente/autorización y
            jurisdicción alcanzada
          </li>
          <li>
            Datos completos del escribano/a (nombre, matrícula, registro,
            jurisdicción)
          </li>
          <li>
            Día y hora fija del sorteo mensual, mecanismo exacto de
            extracción
          </li>
          <li>Canal de transmisión en vivo</li>
          <li>
            Plazo de reclamo del premio y qué pasa si el ganador no se
            presenta
          </li>
          <li>Email/canal oficial de contacto</li>
          <li>
            Responsable de gastos de patentamiento/transferencia/flete por
            tipo de premio
          </li>
        </ul>
      </div>
    </article>
  );
}
