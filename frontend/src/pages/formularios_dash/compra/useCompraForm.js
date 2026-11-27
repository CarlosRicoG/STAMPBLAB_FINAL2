import { useState } from "react";
import Swal from "sweetalert2";
import { getFechaHoyLocal, validarCompra, errorAlEnviar, payloadCompra } from "./compraUtils";

/**
 * Validación global y envío del formulario de compra.
 * Devuelve las comprobaciones del resumen, si se puede guardar y el manejador del submit.
 */
export default function useCompraForm({ formData, detalles, onSave }) {
    const [intentoEnvio, setIntentoEnvio] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { fechaFutura, checks, puedeGuardar } = validarCompra(formData, detalles, getFechaHoyLocal());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIntentoEnvio(true);
        const error = errorAlEnviar(formData, detalles, fechaFutura);
        if (error) return Swal.fire(...error);
        setSubmitting(true);
        try {
            await onSave(payloadCompra(formData, detalles));
        } finally { setSubmitting(false); }
    };

    return { intentoEnvio, submitting, fechaFutura, checks, puedeGuardar, handleSubmit };
}
