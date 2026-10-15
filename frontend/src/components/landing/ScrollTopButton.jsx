// ScrollToTopButton.jsx
import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import "../landing/ScrollToTopButton.css"; // Estilos del botón


const ScrollToTopButton = () => {
    const [visible, setVisible] = useState(false);

    // Mostrar el botón solo si hacemos scroll hacia abajo
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth", // scroll suave
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        <div className={`scroll-to-top ${visible ? "show" : ""}`} onClick={scrollToTop}>
            <FaArrowUp size={24} />
        </div>
    );
};

export default ScrollToTopButton;
