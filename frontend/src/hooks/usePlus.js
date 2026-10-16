import { useEffect } from "react";

/**
 * Efectos globales de la vista del cliente. Llamar UNA vez por página:
 *  - revela con animación todo elemento .sx-reveal al entrar en pantalla (también los que se crean después)
 *  - actualiza --mx/--my en .sx-card/.sx-glass para el brillo que sigue al cursor
 *  - inclina .sx-tilt según el mouse
 *  - barra de progreso de scroll
 */
export default function usePlus() {
    useEffect(() => {
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add("sx-in"); io.unobserve(e.target); }
            }),
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );
        const seen = new WeakSet();
        const scan = () => document.querySelectorAll(".sx-reveal:not(.sx-in)").forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            if (reduce) el.classList.add("sx-in"); else io.observe(el);
        });
        scan();
        const mo = new MutationObserver(scan);
        mo.observe(document.body, { childList: true, subtree: true });

        const onMove = (e) => {
            const t = e.target.closest?.(".sx-card, .sx-glass, .sx-tilt");
            if (!t) return;
            const r = t.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            t.style.setProperty("--mx", x + "px");
            t.style.setProperty("--my", y + "px");
            if (t.classList.contains("sx-tilt") && !reduce) {
                const rx = ((y / r.height) - 0.5) * -9, ry = ((x / r.width) - 0.5) * 9;
                t.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
            }
        };
        const onLeave = (e) => {
            const t = e.target.closest?.(".sx-tilt");
            if (t) t.style.transform = "";
        };
        document.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseout", onLeave, { passive: true });

        const bar = document.createElement("div");
        bar.className = "sx-progress";
        document.body.appendChild(bar);
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const h = document.documentElement;
                const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
                bar.style.setProperty("--sx-p", String(Math.min(1, Math.max(0, p))));
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
            io.disconnect(); mo.disconnect(); bar.remove();
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseout", onLeave);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);
}
