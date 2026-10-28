import { useEffect, useState } from "react";

const esStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export default function InstalarApp() {
  const [evento, setEvento] = useState(null);
  const [instalada, setInstalada] = useState(esStandalone());
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvento(e); };
    const onInstalled = () => { setInstalada(true); setEvento(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (instalada) return null;

  const instalar = async () => {
    if (!evento) { setAyuda(true); return; }
    evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") setInstalada(true);
    setEvento(null);
  };

  const pasos = esIOS()
    ? ["Abre esta página en Safari.", "Toca el botón Compartir.", "Elige «Agregar a pantalla de inicio»."]
    : ["Abre esta página en Chrome o Edge.", "Haz clic en el icono de instalar (⊕) al final de la barra de direcciones, o en el menú ⋮ → «Instalar StampLab».", "Confirma con «Instalar»; la app quedará en tu escritorio."];

  return (
    <>
      <button
        onClick={instalar}
        aria-label="Cómo instalar la aplicación"
        style={{
          position: "fixed", left: 16, bottom: 16, zIndex: 1050, display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", border: 0, borderRadius: 999, color: "#fff", fontWeight: 700, fontSize: 13,
          background: "linear-gradient(135deg, #4f8ef7, #7c3aed)", boxShadow: "0 8px 20px rgba(124,58,237,.35)", cursor: "pointer",
        }}
      >
        <i className="fa-solid fa-download" /> Cómo instalar
      </button>

      {ayuda && (
        <div
          onClick={() => setAyuda(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%" }}>
            <h5 style={{ marginBottom: 12 }}>Instalar StampLab</h5>
            <ol style={{ paddingLeft: 20, marginBottom: 16 }}>
              {pasos.map((p) => <li key={p} style={{ marginBottom: 8 }}>{p}</li>)}
            </ol>
            <button className="btn btn-primary w-100" onClick={() => setAyuda(false)}>Entendido</button>
          </div>
        </div>
      )}
    </>
  );
}
