import { Link } from "react-router-dom";
import NavbarComponent from "../components/landing/NavBarLanding";
import FooterComponent from "../components/landing/footer";
import { C } from "../config/tokens";

export default function NoEncontrada() {
    return (
        <>
            <NavbarComponent />
            <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", fontFamily: "'Outfit', sans-serif", background: C.bg }}>
                <div style={{ textAlign: "center", maxWidth: 440 }}>
                    <p style={{ fontSize: 88, fontWeight: 900, margin: 0, lineHeight: 1, background: "linear-gradient(90deg,#4f8ef7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</p>
                    <h1 style={{ color: C.navy, fontSize: 26, margin: "12px 0 8px" }}>No encontramos esta página</h1>
                    <p style={{ color: C.muted, margin: "0 0 24px" }}>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link to="/landing" style={{ background: C.navy, color: C.white, padding: "11px 22px", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Ir al inicio</Link>
                        <Link to="/productosLanding" style={{ border: "1.5px solid #e2e8f0", color: C.navy, padding: "11px 22px", borderRadius: 12, fontWeight: 700, textDecoration: "none", background: C.white }}>Ver productos</Link>
                    </div>
                </div>
            </main>
            <FooterComponent />
        </>
    );
}
