import type { ReactNode } from 'react';
import { isArgentina, type LegalDocKey, type PublicLegalInfo } from '../../lib/legal';

// ============================================================================
// Documentos legales del negocio.
// Se generan en cada render con los datos actuales: no hay copias guardadas.
// Reglas:
//   - si un dato no fue cargado por el negocio, no se muestra ni se inventa;
//   - solo se describen los módulos que el plan del negocio incluye
//     (has_reservas / has_shop / has_landing vienen de la RPC pública).
// Si se modifican estos textos, actualizar LEGAL_TEMPLATE_UPDATED_AT en src/lib/legal.ts.
// ============================================================================

function clean(v: string | null | undefined): string {
  return (v || '').trim();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-medium text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-foreground">{children}</div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-muted-foreground">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function ContactLinks({ d }: { d: PublicLegalInfo }) {
  const email = clean(d.contact_email);
  const phone = clean(d.phone);
  if (!email && !phone) {
    return <>a través de los medios de contacto que el negocio publica en su página</>;
  }
  return (
    <>
      {email && <>por email a <a className="text-primary underline underline-offset-4" href={`mailto:${email}`}>{email}</a></>}
      {email && phone && ' o '}
      {phone && <>por teléfono al <a className="text-primary underline underline-offset-4" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a></>}
    </>
  );
}

// Bloque con los datos identificatorios del negocio. Solo muestra lo cargado.
export function BusinessIdentity({ d }: { d: PublicLegalInfo }) {
  const location = [d.address, d.city, d.province, d.country].map(clean).filter(Boolean).join(', ');
  const rows: [string, ReactNode][] = [];
  rows.push(['Nombre comercial', d.business_name]);
  if (clean(d.legal_name)) rows.push(['Titular o razón social', clean(d.legal_name)]);
  if (clean(d.tax_id)) rows.push(['CUIT', clean(d.tax_id)]);
  if (location) rows.push(['Domicilio', location]);
  if (clean(d.contact_email)) rows.push(['Email', clean(d.contact_email)]);
  if (clean(d.phone)) rows.push(['Teléfono', clean(d.phone)]);

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function holderSentence(d: PublicLegalInfo, lead: string): ReactNode {
  const name = d.business_name;
  const holder = clean(d.legal_name);
  const cuit = clean(d.tax_id);
  const location = [d.address, d.city, d.province, d.country].map(clean).filter(Boolean).join(', ');
  return (
    <>
      {lead} <strong className="text-foreground">{holder || name}</strong>
      {holder && holder !== name && <>, que opera con el nombre comercial <strong className="text-foreground">{name}</strong></>}
      {cuit && <>, CUIT {cuit}</>}
      {location && <>, con domicilio en {location}</>}
      .
    </>
  );
}

// Qué usa el negocio según su plan.
function pageWord(d: PublicLegalInfo): string {
  return d.has_landing || d.has_reservas || d.has_shop ? 'esta página' : 'su página de enlaces';
}

// ----------------------------------------------------------------------------
// POLÍTICA DE PRIVACIDAD
// ----------------------------------------------------------------------------
function PrivacyPolicy({ d }: { d: PublicLegalInfo }) {
  const name = d.business_name;
  const ar = isArgentina(d.country);
  const pays = d.has_reservas || d.has_shop;

  const dataItems: ReactNode[] = [];
  if (d.has_reservas) {
    dataItems.push(<><strong className="text-foreground">Al reservar un turno:</strong> nombre, teléfono, email, el servicio elegido, la fecha y el horario, y el estado del pago cuando corresponde.</>);
    dataItems.push(<><strong className="text-foreground">Al anotarte en la lista de espera:</strong> nombre, teléfono, email, la fecha y el horario deseados y el servicio que te interesa.</>);
  }
  if (d.has_shop) {
    dataItems.push(<><strong className="text-foreground">Al comprar en la tienda:</strong> nombre, email, teléfono y el detalle del pedido (productos, talles, cantidades y montos).</>);
  }
  dataItems.push(<><strong className="text-foreground">Al escribir al negocio o completar un formulario:</strong> la información que decidas enviar.</>);
  dataItems.push(<><strong className="text-foreground">Al navegar:</strong> datos técnicos básicos, como la dirección IP y el tipo de navegador, que los servicios de alojamiento registran para funcionar y protegerse.</>);

  const purposes: ReactNode[] = [];
  if (d.has_reservas) purposes.push('Registrar, confirmar y administrar tus reservas.');
  if (d.has_shop) purposes.push('Registrar y administrar tus pedidos.');
  purposes.push(pays
    ? 'Comunicarse con vos por temas relacionados con tu reserva, tu compra o tu consulta.'
    : 'Responder tus consultas y comunicarse con vos.');
  if (pays) purposes.push('Procesar los pagos que realices online.');
  purposes.push('Cumplir obligaciones legales, contables o impositivas del negocio.');
  purposes.push('Mantener la seguridad de la página y prevenir usos indebidos.');

  const providers: ReactNode[] = [];
  providers.push(d.has_reservas || d.has_shop
    ? 'BookingBio, como plataforma de la página, las reservas y la tienda.'
    : 'BookingBio, como plataforma de la página.');
  providers.push('Supabase, para la base de datos y el almacenamiento de archivos.');
  providers.push('Vercel, para el alojamiento del sitio web.');
  if (pays) providers.push('Mercado Pago, cuando realizás un pago online.');
  if (d.has_reservas) providers.push('Un servicio de envío de correos electrónicos, para las confirmaciones.');
  if (d.has_reservas) providers.push('Google Calendar, si el negocio sincroniza su agenda con ese servicio.');

  return (
    <>
      <p className="text-[15px] leading-7 text-foreground">
        Esta política explica qué datos personales recibe {name} a través de {pageWord(d)}, para qué los usa
        y cómo podés ejercer tus derechos sobre ellos.
      </p>

      <Section title="Quién es responsable de tus datos">
        <p>{holderSentence(d, 'El responsable es')}</p>
        <p>Podés comunicarte con el responsable <ContactLinks d={d} />.</p>
        <p>
          Esta página funciona sobre BookingBio, una plataforma tecnológica que {name} utiliza para publicar su
          página{d.has_reservas && ', gestionar reservas'}{d.has_shop && ' y vender online'}. BookingBio trata los
          datos por cuenta del negocio y solo para prestar el servicio de la plataforma.
        </p>
      </Section>

      <Section title="Qué datos podés proporcionar">
        <List items={dataItems} />
        {pays && (
          <p>
            Los datos de tu tarjeta o medio de pago los ingresás directamente en Mercado Pago. Ni {name} ni
            BookingBio los reciben ni los guardan.
          </p>
        )}
      </Section>

      <Section title="Para qué se usan">
        <List items={purposes} />
        <p>
          Si {name} quisiera usar tus datos para otra finalidad, como enviarte promociones, deberá informártelo
          y, cuando la ley lo exija, pedir tu consentimiento.
        </p>
      </Section>

      <Section title="Con quién se comparten">
        <p>
          {name} no cede tus datos a terceros, salvo a los proveedores tecnológicos necesarios para que la
          página funcione o cuando lo exija una autoridad competente. Según lo que uses, pueden intervenir:
        </p>
        <List items={providers} />
        <p>Algunos de estos proveedores pueden alojar la información en servidores ubicados fuera de tu país.</p>
      </Section>

      <Section title="Cuánto tiempo se conservan">
        <p>
          Tus datos se conservan mientras sean necesarios para las finalidades descritas y para cumplir
          obligaciones legales. Después se eliminan o se anonimizan.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Podés pedir acceso a tus datos, su rectificación, actualización o supresión, y oponerte a su uso para
          fines que no sean necesarios para {pays ? 'tu reserva o compra' : 'atender tu consulta'}. Para hacerlo,
          comunicate con el responsable <ContactLinks d={d} />.
        </p>
        {ar && (
          <>
            <p>
              Esta política se rige por la Ley N.º 25.326 de Protección de Datos Personales. El titular de los
              datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a
              intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme
              lo establecido en el artículo 14, inciso 3 de la Ley N.º 25.326.
            </p>
            <p>
              La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley
              N.º 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
              afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de
              datos personales.
            </p>
          </>
        )}
      </Section>

      <Section title="Seguridad">
        <p>
          Se aplican medidas técnicas razonables para proteger tus datos, como conexiones cifradas y accesos
          restringidos. Ningún sistema es completamente infalible, por lo que no se puede garantizar una
          seguridad absoluta.
        </p>
      </Section>

      <Section title="Cambios en esta política">
        <p>
          Esta política puede actualizarse. La versión vigente es siempre la publicada en esta página, con su
          fecha de última actualización.
        </p>
      </Section>
    </>
  );
}

// ----------------------------------------------------------------------------
// POLÍTICA DE COOKIES
// Basada en lo que el código usa realmente (revisado el 2026-09-11):
//   - localStorage: negocio visitado, carrito de la tienda, tema visual.
//   - sessionStorage: avisos emergentes cerrados.
//   - SDK de Mercado Pago y Google Fonts: se cargan en todas las páginas.
//   - Opcionales desde la landing: Google Analytics, Google Tag Manager,
//     Meta Pixel, TikTok Pixel, scripts personalizados, Google Maps,
//     YouTube y Vimeo.
// ----------------------------------------------------------------------------
function CookiesPolicy({ d }: { d: PublicLegalInfo }) {
  const name = d.business_name;
  const pays = d.has_reservas || d.has_shop;

  const storageItems: ReactNode[] = ['Recordar qué negocio estás visitando.'];
  if (d.has_shop) storageItems.push('Guardar los productos que agregaste al carrito de la tienda.');
  storageItems.push('Recordar tus preferencias de visualización.');
  if (d.has_landing) storageItems.push('No volver a mostrarte un aviso emergente que ya cerraste durante la visita.');

  const thirdParty: ReactNode[] = [];
  if (pays) {
    thirdParty.push(<><strong className="text-foreground">Mercado Pago:</strong> la página carga su herramienta de pagos, que puede usar cookies o identificadores propios con fines de seguridad y prevención de fraude.</>);
  }
  thirdParty.push(<><strong className="text-foreground">Google Fonts:</strong> se usa para mostrar tipografías. Al cargarlas, tu navegador se conecta con servidores de Google.</>);

  return (
    <>
      <p className="text-[15px] leading-7 text-foreground">
        Esta política explica qué cookies y tecnologías similares pueden usarse cuando visitás {pageWord(d)} de {name}.
      </p>

      <Section title="Qué son">
        <p>
          Las cookies son pequeños archivos que un sitio guarda en tu navegador. Hay tecnologías parecidas, como
          el almacenamiento local del navegador, que cumplen funciones similares: recordar información entre una
          página y otra o entre una visita y la siguiente.
        </p>
      </Section>

      <Section title="Almacenamiento necesario para que la página funcione">
        <p>
          La plataforma BookingBio no utiliza cookies propias con fines publicitarios ni de medición. Sí usa el
          almacenamiento de tu navegador para:
        </p>
        <List items={storageItems} />
        <p>Esta información queda en tu dispositivo y es necesaria para que la página funcione correctamente.</p>
      </Section>

      <Section title="Servicios de terceros incluidos en la página">
        <List items={thirdParty} />
      </Section>

      {d.has_landing && (
        <Section title="Herramientas que el negocio puede activar">
          <p>
            {name} puede agregar a su página herramientas externas. Solo funcionan si el negocio las activó y, en
            ese caso, pueden instalar sus propias cookies:
          </p>
          <List items={[
            'Medición y publicidad: Google Analytics, Google Tag Manager, Meta Pixel y TikTok Pixel, u otros códigos de seguimiento que el negocio agregue.',
            'Contenido integrado: mapas de Google Maps y videos de YouTube o Vimeo.',
          ]} />
          <p>El uso de esas cookies se rige por las políticas de cada proveedor.</p>
        </Section>
      )}

      <Section title="Cómo controlarlas">
        <p>
          Podés ver, bloquear o borrar las cookies y los datos guardados desde la configuración de tu navegador.
          Si los bloqueás, algunas funciones {d.has_shop ? ', como el carrito de la tienda, ' : ''}pueden dejar de funcionar.
        </p>
        <p>Si tenés consultas, podés comunicarte con {name} <ContactLinks d={d} />.</p>
      </Section>
    </>
  );
}

// ----------------------------------------------------------------------------
// CONDICIONES DE RESERVA (del negocio, no de BookingBio)
// Solo se muestra si el negocio tiene reservas o tienda.
// No existe configuración de cancelación en el sistema: se remite al negocio.
// ----------------------------------------------------------------------------
function BookingConditions({ d }: { d: PublicLegalInfo }) {
  const name = d.business_name;
  const ar = isArgentina(d.country);
  const country = clean(d.country);

  const intro = d.has_reservas && d.has_shop
    ? 'a las reservas de turnos y a las compras que realizás'
    : d.has_reservas ? 'a las reservas de turnos que realizás' : 'a las compras que realizás';

  const role: ReactNode[] = [];
  role.push(d.has_shop && d.has_reservas
    ? 'presta los servicios y vende los productos que se ofrecen en esta página;'
    : d.has_shop ? 'vende los productos que se ofrecen en esta página;' : 'presta los servicios que se ofrecen en esta página;');
  role.push('establece los precios, los horarios y la disponibilidad;');
  if (d.has_reservas) role.push('acepta o rechaza las reservas según sus propias condiciones;');
  role.push('responde por la información que publica;');
  role.push('responde por la relación comercial con sus clientes.');

  return (
    <>
      <p className="text-[15px] leading-7 text-foreground">
        Estas condiciones se aplican {intro} a {name} a través de esta página.
      </p>

      <Section title="Quién presta el servicio">
        <p>{holderSentence(d, 'Esta página y los servicios que ofrece corresponden a')}</p>
        <p>{name} es quien:</p>
        <List items={role} />
      </Section>

      <Section title="El rol de BookingBio">
        <p>
          BookingBio proporciona la plataforma tecnológica que {name} usa para crear su página
          {d.has_reservas && ', gestionar reservas'}{d.has_shop && ', vender online'} y otras funcionalidades que
          haya contratado. BookingBio no presta los servicios ni vende los productos del negocio, no fija sus
          precios ni condiciones y no es parte de la relación comercial entre vos y {name}.
        </p>
        <p>Las consultas y reclamos sobre servicios, productos, precios o pagos se dirigen a {name}.</p>
      </Section>

      {d.has_reservas && (
        <Section title="Cómo funciona la reserva">
          <List items={[
            'Elegís un servicio, una fecha y un horario entre los que el negocio tiene disponibles.',
            'Completás tus datos de contacto. Es importante que sean correctos para que el negocio pueda comunicarse con vos.',
            'Cuando la reserva requiere un pago online, se procesa a través de Mercado Pago y queda sujeta también a sus términos y condiciones.',
            'La reserva queda sujeta a las condiciones de atención de ' + name + '.',
          ]} />
        </Section>
      )}

      <Section title="Precios y pagos">
        <p>
          Los precios y la moneda los define {name} y son los que se muestran al momento de
          {d.has_reservas ? ' reservar' : ''}{d.has_reservas && d.has_shop ? ' o' : ''}{d.has_shop ? ' comprar' : ''}.
          Los reintegros, cuando correspondan, los gestiona el negocio.
        </p>
      </Section>

      {d.has_reservas && (
        <Section title="Cancelaciones y reprogramaciones">
          <p>
            Las condiciones para cancelar o reprogramar un turno, y si corresponde algún reintegro, las define {name}.
            Si necesitás cancelar o cambiar tu reserva, comunicate con el negocio lo antes posible <ContactLinks d={d} />.
          </p>
        </Section>
      )}

      {d.has_shop && (
        <Section title="Compras en la tienda">
          <p>
            En las compras, {name} es el vendedor y responde por los productos, el stock, los precios, las entregas,
            los cambios y las devoluciones.
          </p>
        </Section>
      )}

      <Section title="Tus derechos como consumidor">
        <p>
          Nada de lo indicado en estas condiciones limita los derechos que te reconoce la normativa de defensa del
          consumidor aplicable.
          {ar && (
            <> En Argentina, esto incluye la Ley N.º 24.240 de Defensa del Consumidor y el derecho a revocar la
            aceptación dentro de los 10 días corridos en las compras realizadas a distancia.</>
          )}
        </p>
      </Section>

      <Section title="Contacto">
        <p>Para cualquier consulta o reclamo, comunicate con {name} <ContactLinks d={d} />.</p>
        {country && <p>Estas condiciones se rigen por las leyes de {country}.</p>}
      </Section>
    </>
  );
}

export function LegalDocument({ doc, d }: { doc: LegalDocKey; d: PublicLegalInfo }) {
  if (doc === 'cookies') return <CookiesPolicy d={d} />;
  if (doc === 'condiciones') return <BookingConditions d={d} />;
  return <PrivacyPolicy d={d} />;
}
