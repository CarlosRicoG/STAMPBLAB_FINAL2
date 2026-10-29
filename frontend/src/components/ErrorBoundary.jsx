import { Component } from "react";

// Captura errores de render y fallos de carga de chunks lazy para no dejar la pantalla en blanco.
export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Error de la aplicación:", error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "'Outfit',sans-serif" }}>
                <div>
                    <h2 style={{ color: "#1a2540", marginBottom: 8 }}>Algo salió mal</h2>
                    <p style={{ color: "#64748b", marginBottom: 20 }}>No pudimos cargar esta pantalla. Revisa tu conexión y vuelve a intentarlo.</p>
                    <button onClick={() => window.location.reload()}
                        style={{ background: "#1a2540", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>
                        Recargar
                    </button>
                </div>
            </div>
        );
    }
}
