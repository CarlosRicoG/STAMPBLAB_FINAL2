// Cuenta a la que el cliente transfiere. Los datos vienen de /config-publica (variables PAGO_* del servidor);
// si el negocio no los configuró, no se muestra nada.
import { C } from "../../config/tokens";

const FILAS = [["Banco", "banco"], ["Tipo de cuenta", "tipoCuenta"], ["Número de cuenta", "cuenta"], ["Titular", "titular"], ["Documento", "documento"]];

const DatosDePago = ({ pago }) => {
    if (!pago?.cuenta) return null;
    const filas = FILAS.filter(([, clave]) => pago[clave]);
    return (
        <div data-testid="datos-pago" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", margin: "0 0 12px", background: C.accentSoft }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13.5, color: C.navy }}>Transfiere a esta cuenta</p>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13 }}>
                {filas.map(([etiqueta, clave]) => (
                    <div key={clave} style={{ display: "contents" }}>
                        <dt style={{ color: C.muted, fontWeight: 600 }}>{etiqueta}</dt>
                        <dd style={{ margin: 0, color: C.navy, fontWeight: 700, wordBreak: "break-word" }}>{pago[clave]}</dd>
                    </div>
                ))}
            </dl>
            {pago.nota && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted }}>{pago.nota}</p>}
        </div>
    );
};

export default DatosDePago;
