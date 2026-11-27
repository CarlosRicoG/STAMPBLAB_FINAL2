import { Link } from "react-router-dom";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { C } from "../../config/tokens";
import { RESPONSABLE as R, VERSION_POLITICA, FECHA_POLITICA, PLAZOS as P } from "../../config/privacidad";

/*
 * Política de Tratamiento de Datos Personales y Aviso de Privacidad (Ley 1581 de 2012, Decreto 1377 de 2013,
 * compilado en el Decreto 1074 de 2015). Página pública: /privacidad.
 * El texto es un borrador para revisión legal; los datos del responsable y la versión salen de config/privacidad.js.
 */

const CSS = `
.pv-page { background: ${C.bg}; font-family: 'Outfit', sans-serif; color: ${C.text}; padding: 48px 16px 64px; }
.pv-doc { max-width: 860px; margin: 0 auto; background: ${C.white}; border: 1px solid ${C.border}; border-radius: 20px; padding: 36px 40px; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
.pv-doc h1 { color: ${C.navy}; font-size: 28px; font-weight: 900; margin: 0 0 6px; line-height: 1.2; }
.pv-meta { color: ${C.muted}; font-size: 13px; margin: 0 0 24px; }
.pv-doc h2 { color: ${C.navy}; font-size: 18px; font-weight: 800; margin: 30px 0 10px; padding-top: 6px; }
.pv-doc p, .pv-doc li { font-size: 14.5px; line-height: 1.7; color: #334155; }
.pv-doc ul, .pv-doc ol { padding-left: 22px; margin: 0 0 12px; }
.pv-doc li { margin-bottom: 4px; }
.pv-box { background: ${C.accentSoft}; border: 1px solid ${C.accentBorder}; border-radius: 14px; padding: 16px 18px; margin: 12px 0 4px; }
.pv-box p { margin: 0 0 4px; }
.pv-toc { columns: 2; column-gap: 24px; font-size: 14px; background: ${C.bg}; border-radius: 14px; padding: 14px 18px 14px 36px; border: 1px solid ${C.border}; }
.pv-toc a { color: ${C.accent}; text-decoration: none; }
.pv-toc a:hover { text-decoration: underline; }
@media (max-width: 640px) { .pv-doc { padding: 24px 18px; } .pv-toc { columns: 1; } .pv-doc h1 { font-size: 23px; } }
`;

const SECCIONES = [
    ["responsable", "Responsable del tratamiento"],
    ["alcance", "Marco legal y alcance"],
    ["datos", "Datos que recogemos"],
    ["finalidades", "Finalidades del tratamiento"],
    ["autorizacion", "Autorización"],
    ["derechos", "Derechos del titular"],
    ["ejercer", "Cómo ejercer tus derechos"],
    ["terceros", "Encargados y transmisión de datos"],
    ["seguridad", "Seguridad y conservación"],
    ["vigencia", "Vigencia y cambios"],
];

const Privacidad = () => (
    <>
        <style>{CSS}</style>
        <NavbarComponent />
        <main className="pv-page">
            <article className="pv-doc">
                <h1>Política de Tratamiento de Datos Personales</h1>
                <p className="pv-meta">Aviso de privacidad · Versión {VERSION_POLITICA} · Vigente desde el {FECHA_POLITICA}</p>

                <p>
                    En {R.nombreComercial} respetamos tu privacidad. Esta política explica qué datos personales recogemos cuando usas
                    nuestra tienda en línea, para qué los usamos, con quién los compartimos y cómo puedes conocerlos, actualizarlos,
                    rectificarlos o pedir que los suprimamos.
                </p>

                <nav aria-label="Contenido de la política">
                    <ol className="pv-toc">
                        {SECCIONES.map(([id, titulo]) => <li key={id}><a href={`#${id}`}>{titulo}</a></li>)}
                    </ol>
                </nav>

                <h2 id="responsable">1. Responsable del tratamiento</h2>
                <div className="pv-box">
                    <p><b>Razón social:</b> <span>{R.razonSocial}</span> ({R.nombreComercial})</p>
                    <p><b>NIT:</b> <span>{R.nit}</span></p>
                    <p><b>Domicilio:</b> {R.direccion}, {R.ciudad}</p>
                    <p><b>Correo para asuntos de datos personales:</b> <span>{R.correo}</span></p>
                    <p><b>Teléfono:</b> {R.telefono}</p>
                    <p><b>Sitio web:</b> {R.sitioWeb}</p>
                    <p><b>Área encargada de atender consultas y reclamos:</b> {R.areaEncargada}</p>
                </div>

                <h2 id="alcance">2. Marco legal y alcance</h2>
                <p>
                    Esta política se expide en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el
                    Decreto Único 1074 de 2015) y demás normas que las modifiquen o complementen. Aplica a los datos personales de
                    clientes, usuarios registrados y personas que solicitan cotizaciones o compran a través de la tienda en línea,
                    por cualquier medio (sitio web, correo electrónico o WhatsApp).
                </p>
                <p>
                    Para efectos de esta política, <b>dato personal</b> es cualquier información que identifique o haga identificable
                    a una persona natural; <b>titular</b> es la persona a quien se refieren los datos; <b>tratamiento</b> es cualquier
                    operación sobre ellos (recolección, almacenamiento, uso, circulación o supresión); y <b>encargado</b> es quien trata
                    los datos por cuenta del responsable.
                </p>

                <h2 id="datos">3. Datos que recogemos</h2>
                <ul>
                    <li><b>Datos de identificación:</b> nombre completo y número de documento de identidad.</li>
                    <li><b>Datos de contacto:</b> correo electrónico, número de teléfono y dirección.</li>
                    <li><b>Datos de entrega:</b> nombre, teléfono y dirección de quien recibe cada pedido.</li>
                    <li><b>Datos de pedidos y cotizaciones:</b> productos, cantidades, tallas, colores, valores, estados y fechas.</li>
                    <li><b>Comprobantes de pago:</b> la imagen del comprobante de transferencia que subes, que puede incluir tu nombre, tu banco y parte de tu número de cuenta.</li>
                    <li><b>Imágenes de diseño:</b> los logos, ilustraciones o fotos que subes para estampar y las observaciones que escribes sobre ellos.</li>
                    <li><b>Datos de la cuenta:</b> contraseña (guardada cifrada; nadie en {R.nombreComercial} puede leerla), fecha y versión de la política que aceptaste, y el carrito de compras guardado.</li>
                </ul>
                <p>
                    No solicitamos datos sensibles (origen racial o étnico, orientación política, convicciones religiosas, salud,
                    vida sexual o datos biométricos). Si una imagen de diseño que subes contiene datos sensibles o de terceros, debes
                    contar con la autorización de esas personas. La tienda no está dirigida a menores de edad: los menores solo pueden
                    comprar a través de su representante legal, respetando su interés superior y sus derechos fundamentales.
                </p>

                <h2 id="finalidades">4. Finalidades del tratamiento</h2>
                <p>Usamos tus datos personales únicamente para:</p>
                <ol>
                    <li>Crear y administrar tu cuenta de usuario e identificarte cuando inicias sesión.</li>
                    <li>Recibir, cotizar, producir y gestionar tus pedidos y cotizaciones de prendas y estampados.</li>
                    <li>Verificar los pagos por transferencia a partir de los comprobantes que subes, y gestionar reembolsos cuando proceda.</li>
                    <li>Coordinar la entrega o el envío a domicilio de tus pedidos, o su retiro en el punto de atención.</li>
                    <li>Enviarte avisos sobre el estado de tus pedidos, pagos y cotizaciones por correo electrónico, dentro de la aplicación y por WhatsApp.</li>
                    <li>Atender tus consultas, peticiones, quejas y reclamos.</li>
                    <li>Cumplir obligaciones legales, contables y tributarias (por ejemplo, conservar los soportes de las ventas) y atender requerimientos de autoridades competentes.</li>
                    <li>Mantener la seguridad de la plataforma y prevenir fraudes o usos indebidos.</li>
                </ol>
                <p>
                    No vendemos ni alquilamos tus datos, y no los usamos para publicidad de terceros. Si en el futuro quisiéramos
                    usarlos para una finalidad distinta (por ejemplo, enviarte promociones), te pediremos una nueva autorización.
                </p>

                <h2 id="autorizacion">5. Autorización</h2>
                <p>
                    Al crear tu cuenta te pedimos la autorización previa, expresa e informada para tratar tus datos con las finalidades
                    anteriores, mediante una casilla que debes marcar tú mismo (nunca viene marcada). Guardamos la fecha y la versión de
                    esta política que aceptaste como prueba de la autorización, y puedes pedirnos copia de ella en cualquier momento.
                </p>
                <p>
                    No se requiere autorización en los casos del artículo 10 de la Ley 1581 de 2012 (por ejemplo, información requerida
                    por una entidad pública en ejercicio de sus funciones o datos de naturaleza pública).
                </p>

                <h2 id="derechos">6. Derechos del titular</h2>
                <p>Como titular de los datos tienes derecho a:</p>
                <ol type="a">
                    <li><b>Conocer, actualizar y rectificar</b> tus datos personales, incluso los parciales, inexactos, incompletos o que induzcan a error.</li>
                    <li><b>Solicitar prueba de la autorización</b> que nos diste.</li>
                    <li><b>Ser informado</b>, previa solicitud, del uso que le hemos dado a tus datos.</li>
                    <li><b>Presentar quejas ante la Superintendencia de Industria y Comercio</b> por infracciones a la ley, una vez agotado el trámite de consulta o reclamo ante nosotros.</li>
                    <li><b>Revocar la autorización y/o solicitar la supresión</b> de tus datos cuando no se respeten los principios, derechos y garantías legales, siempre que no exista un deber legal o contractual de conservarlos.</li>
                    <li><b>Acceder gratuitamente</b> a tus datos personales objeto de tratamiento.</li>
                </ol>

                <h2 id="ejercer">7. Cómo ejercer tus derechos</h2>
                <p><b>Desde tu cuenta</b>, en la sección <Link to="/micuenta">Mi cuenta</Link>:</p>
                <ul>
                    <li><b>Editar perfil</b>: para actualizar o rectificar tus datos de contacto.</li>
                    <li><b>Descargar mis datos</b>: obtienes al instante una copia de tus datos personales, pedidos, cotizaciones y la prueba de tu autorización.</li>
                    <li><b>Eliminar mi cuenta y mis datos</b>: suprime tu cuenta y tus datos personales. Si tienes pedidos o cotizaciones en curso, primero deben terminar o cancelarse.</li>
                </ul>
                <p>
                    <b>Por correo electrónico</b> a <span>{R.correo}</span> o en {R.direccion}, {R.ciudad}, indicando tu nombre,
                    número de documento, la descripción de lo que solicitas, la dirección o correo donde quieres recibir la respuesta
                    y, si actúas en nombre del titular, el documento que acredite tu representación.
                </p>
                <ul>
                    <li>
                        <b>Consultas:</b> las responderemos en un término máximo de diez ({P.consultaDias}) días hábiles contados desde
                        su recibo. Si no es posible responder en ese plazo, te informaremos el motivo y la fecha de respuesta, que no
                        superará cinco ({P.consultaProrrogaDias}) días hábiles adicionales.
                    </li>
                    <li>
                        <b>Reclamos</b> (corrección, actualización, supresión o incumplimiento): los atenderemos en un término máximo de
                        quince ({P.reclamoDias}) días hábiles contados desde el día siguiente a su recibo. Si el reclamo está incompleto,
                        te pediremos completarlo dentro de los cinco ({P.subsanarReclamoDias}) días siguientes; si pasan dos (2) meses sin
                        que lo completes, entenderemos que desististe. Si no es posible atenderlo en el plazo, te informaremos el motivo
                        y la nueva fecha, que no superará ocho ({P.reclamoProrrogaDias}) días hábiles adicionales. Mientras se resuelve,
                        el dato quedará marcado como «reclamo en trámite».
                    </li>
                </ul>
                <p>
                    La supresión no procede cuando la ley nos obliga a conservar cierta información. En particular, las cifras de las
                    ventas y el número de documento asociado se conservan como soporte contable y tributario durante el tiempo que
                    exige la ley; al suprimir tu cuenta eliminamos tu nombre, correo, teléfono, dirección, datos de entrega,
                    comprobantes, imágenes de diseño, notificaciones y carrito.
                </p>

                <h2 id="terceros">8. Encargados y transmisión de datos</h2>
                <p>
                    Para prestar el servicio podemos compartir los datos estrictamente necesarios con encargados que los tratan por
                    nuestra cuenta y bajo nuestras instrucciones: proveedores de alojamiento web y bases de datos, el proveedor del
                    servicio de correo electrónico, WhatsApp (Meta Platforms) para los mensajes que nos envías o te enviamos, y la
                    empresa transportadora que entrega tu pedido. Algunos de estos proveedores pueden almacenar los datos fuera de
                    Colombia; en ese caso exigimos niveles adecuados de protección conforme a la ley. No transferimos tus datos a
                    terceros para sus propios fines.
                </p>

                <h2 id="seguridad">9. Seguridad y conservación</h2>
                <p>
                    Aplicamos medidas técnicas, humanas y administrativas para proteger tus datos: conexión cifrada, contraseñas
                    almacenadas con cifrado irreversible, sesiones que vencen y acceso al panel administrativo limitado al personal
                    autorizado. Conservamos tus datos mientras tengas una cuenta activa o mientras sean necesarios para las finalidades
                    descritas, y después solo lo que exija la ley (por ejemplo, los soportes contables).
                </p>

                <h2 id="vigencia">10. Vigencia y cambios</h2>
                <p>
                    Esta política (versión {VERSION_POLITICA}) rige desde el {FECHA_POLITICA}. Cualquier cambio sustancial te será
                    comunicado antes de aplicarse, por correo electrónico o en el sitio web, y si cambian las finalidades te pediremos
                    una nueva autorización. Las bases de datos estarán vigentes mientras {R.nombreComercial} desarrolle su objeto social.
                </p>
            </article>
        </main>
        <FooterComponent />
    </>
);

export default Privacidad;
