const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    try {
        // Obtener el token del encabezado de la petición
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).json({ mensaje: 'Token no proporcionado' });
        }

        // Verificar el token
        const decoded = jwt.verify(token.replace('Bearer ', ''), 'clave_secreta');

        // Guardar los datos del usuario en la request
        req.usuario = decoded;

        // Continuar hacia la siguiente función
        next();

    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

module.exports = verificarToken;
