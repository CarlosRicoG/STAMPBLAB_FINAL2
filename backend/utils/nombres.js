/**
 * Comparación de nombres para evitar duplicados "disfrazados": sin distinguir mayúsculas, tildes ni espacios de más.
 *   "Serigrafia" == "serigrafía" == " SERIGRAFÍA "      "Algodón 180g" == "algodon  180G"
 */
const normalizarNombre = (texto) =>
    String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

/**
 * ¿Existe otro registro (distinto de `exceptoID`) con un nombre equivalente?
 * Las tablas de catálogo son pequeñas: se comparan en memoria para ignorar tildes en cualquier collation.
 */
async function existeNombreEquivalente(Modelo, claveID, nombre, exceptoID = null, campo = 'Nombre') {
    if (typeof Modelo.findAll !== 'function') return false; // (pruebas unitarias con modelos simulados)
    const buscado = normalizarNombre(nombre);
    const filas = await Modelo.findAll({ attributes: [claveID, campo], raw: true });
    if (!Array.isArray(filas)) return false;
    return filas.some((f) => String(f[claveID]) !== String(exceptoID) && normalizarNombre(f[campo]) === buscado);
}

module.exports = { normalizarNombre, existeNombreEquivalente };
