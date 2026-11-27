/**
 * Datos de la Política de Tratamiento de Datos Personales (Ley 1581 de 2012 y Decreto 1377 de 2013).
 *
 * ⚠ BORRADOR PENDIENTE DE REVISIÓN LEGAL ⚠
 * El texto de la política (src/components/landing/Privacidad.jsx) es un borrador que el negocio debe revisar con su
 * asesor legal antes de publicarlo. Los datos del responsable NO se inventan: reemplaza cada marcador entre corchetes
 * por el dato real. Al aprobar la versión definitiva:
 *   1. completa RESPONSABLE (sin corchetes),
 *   2. cambia VERSION_POLITICA (p. ej. '1.1-2026-12-15') y FECHA_POLITICA si el texto aprobado difiere de este,
 *   3. si cambian las finalidades, pide de nuevo la autorización a los usuarios ya registrados (Decreto 1377, art. 5).
 * La versión se guarda con cada autorización (usuarios.PrivacidadVersion): es la prueba de qué texto aceptó cada persona.
 * Este aviso interno NO se muestra al público.
 */

/**
 * Versión de la política vigente. Se envía al registrarse y queda guardada como prueba de la autorización, y se muestra
 * al público (por eso no lleva "borrador": el estado de revisión legal solo consta en este comentario).
 */
export const VERSION_POLITICA = "1.0-2026-11-27";

/** Fecha de entrada en vigencia que se muestra en la página. */
export const FECHA_POLITICA = "27 de noviembre de 2026";

/** Responsable del tratamiento (Ley 1581, art. 3 lit. e). Completar con los datos reales. */
export const RESPONSABLE = Object.freeze({
    razonSocial: "[RAZÓN SOCIAL]",
    nombreComercial: "StampLab",
    nit: "[NIT]",
    direccion: "[DIRECCIÓN DEL DOMICILIO PRINCIPAL]",
    ciudad: "[CIUDAD], Colombia",
    correo: "[CORREO PARA CONSULTAS Y RECLAMOS DE DATOS PERSONALES]",
    telefono: "[TELÉFONO DE CONTACTO]",
    sitioWeb: "[SITIO WEB]",
    // Área o persona encargada de atender peticiones, consultas y reclamos (Decreto 1377, art. 13 num. 6)
    areaEncargada: "[ÁREA O CARGO RESPONSABLE DE ATENDER LAS SOLICITUDES]",
});

/** Plazos legales (Ley 1581, arts. 14 y 15), en días hábiles. */
export const PLAZOS = Object.freeze({
    consultaDias: 10,
    consultaProrrogaDias: 5,
    reclamoDias: 15,
    reclamoProrrogaDias: 8,
    subsanarReclamoDias: 5,
});

/** ¿Quedan marcadores sin completar? (útil para revisiones internas; no se muestra al público) */
export const hayMarcadoresPendientes = () => Object.values(RESPONSABLE).some((v) => /\[[^\]]+\]/.test(v));
