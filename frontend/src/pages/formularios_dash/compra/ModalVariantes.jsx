import { FaEye, FaPlus } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { money, TH } from "./compraUtils";
import { Badge, Btn, Label, Input, Select, Modal, StockBadge, TR, TD } from "./ui";

/* Modales de variantes de un producto: ver las existentes y crear una nueva */
const ModalVariantes = ({
    prodSel, modalVerVar, setModalVerVar, loadingVar, variantesModal, handleAbrirNuevaVar,
    modalNuevaVar, setModalNuevaVar, handleGuardarNuevaVar, creandoVar, nuevaVarForm, setNuevaVarF, colores, tallas, telas,
}) => (
    <>
        {/* ════════════════════════════════════════
                  MODAL: Ver Variantes
              ════════════════════════════════════════ */}
        <Modal show={modalVerVar} onHide={() => setModalVerVar(false)} size="lg"
            title={<><FaEye style={{ marginRight: 8 }} />Variantes — {prodSel?.Nombre}</>}
            footer={<>
                <Btn variant="outline-accent" onClick={() => { setModalVerVar(false); handleAbrirNuevaVar(prodSel); }}><FaPlus size={11} /> Nueva variante</Btn>
                <Btn variant="secondary" onClick={() => setModalVerVar(false)}>Cerrar</Btn>
            </>}>
            {loadingVar ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                    <p style={{ color: C.muted, fontSize: 13 }}>Cargando variantes...</p>
                </div>
            ) : variantesModal.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px", background: C.accentSoft, borderRadius: 14 }}>
                    <p style={{ color: C.muted, marginBottom: 14 }}>Este producto no tiene variantes registradas.</p>
                    <Btn variant="primary" onClick={() => { setModalVerVar(false); handleAbrirNuevaVar(prodSel); }}>
                        <FaPlus size={12} /> Crear primera variante
                    </Btn>
                </div>
            ) : (
                <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr>{["Color", "Talla", "Tela", "Stock", "Estado"].map((h, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {variantesModal.map((v, i) => (
                                <TR key={v.InventarioID} idx={i}>
                                    <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{v.color?.Nombre || "—"}</td>
                                    <TD>{v.talla?.Nombre || "—"}</TD>
                                    <TD><Badge type={v.tela ? "violet" : "muted"}>{v.tela?.Nombre || "Sin tela"}</Badge></TD>
                                    <TD center><StockBadge stock={v.Stock} /></TD>
                                    <TD center><Badge type={v.Estado ? "success" : "muted"}>{v.Estado ? "Activa" : "Inactiva"}</Badge></TD>
                                </TR>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>

        {/* ════════════════════════════════════════
                  MODAL: Crear Nueva Variante
              ════════════════════════════════════════ */}
        <Modal show={modalNuevaVar} onHide={() => setModalNuevaVar(false)} size="sm"
            title={<><FaPlus style={{ marginRight: 8 }} />Nueva Variante — {prodSel?.Nombre}</>}
            footer={
                <>
                    <Btn variant="secondary" onClick={() => setModalNuevaVar(false)}>Cancelar</Btn>
                    <Btn variant="success" onClick={handleGuardarNuevaVar} disabled={creandoVar}>
                        {creandoVar
                            ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creando...</>
                            : <><FaPlus size={12} /> Crear Variante</>}
                    </Btn>
                </>
            }>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                    { label: "Color", key: "ColorID", required: true, items: colores, valKey: "ColorID", labKey: "Nombre" },
                    { label: "Talla", key: "TallaID", required: true, items: tallas, valKey: "TallaID", labKey: "Nombre" },
                    { label: "Tela", key: "TelaID", required: false, items: telas, valKey: "InsumoID", labKey: "Nombre", extra: t => ` (${money(t.PrecioTela)})` },
                ].map(({ label, key, required, items, valKey, labKey, extra }) => (
                    <div key={key}>
                        <Label required={required}>{label}</Label>
                        <Select value={nuevaVarForm[key]} onChange={e => setNuevaVarF(p => ({ ...p, [key]: e.target.value }))}>
                            <option value="">{required ? "Seleccionar..." : "Sin tela"}</option>
                            {items.map(item => <option key={item[valKey]} value={item[valKey]}>{item[labKey]}{extra ? extra(item) : ""}</option>)}
                        </Select>
                    </div>
                ))}
                <div>
                    <Label>Stock inicial</Label>
                    <Input type="number" min="0" value={nuevaVarForm.Stock} onChange={e => setNuevaVarF(p => ({ ...p, Stock: e.target.value }))} />
                </div>
            </div>
        </Modal>
    </>
);

export default ModalVariantes;
