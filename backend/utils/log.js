// Log de depuracion: solo en desarrollo (silencioso con NODE_ENV=production). Los errores siguen usando console.error.
module.exports = (...args) => {
    if (process.env.NODE_ENV !== 'production') console.log(...args);
};
