import { FaSearch, FaUserPlus } from "react-icons/fa";

const Usuarios = () => {
    return (
        <div className="bg-white shadow rounded-lg p-6">
            {/* Título */}
            <h2 className="text-xl font-bold text-center mb-6">
                GESTION DE USUARIOS
            </h2>

            {/* Barra superior: Botón + Filtro */}
            <div className="flex justify-between items-center mb-6">
                {/* Botón agregar */}
                <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                    <FaUserPlus />
                    Agregar Usuario
                </button>

                {/* Input búsqueda */}
                <div className="flex items-center border border-gray-400 rounded px-2 py-1 w-72">
                    <FaSearch className="text-gray-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Filtrar por nombre..."
                        className="flex-1 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
                            <th className="border px-4 py-2">DOCUMENTO</th>
                            <th className="border px-4 py-2">NOMBRE</th>
                            <th className="border px-4 py-2">Correo</th>
                            <th className="border px-4 py-2">DIRECCION</th>
                            <th className="border px-4 py-2">TELEFONO</th>
                            <th className="border px-4 py-2">ROL</th>
                            <th className="border px-4 py-2">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="text-sm">
                            <td className="border px-4 py-2">197419744</td>
                            <td className="border px-4 py-2">Wilmer</td>
                            <td className="border px-4 py-2">Hole@gmail.com</td>
                            <td className="border px-4 py-2">Cll 65 #143</td>
                            <td className="border px-4 py-2">3149293233</td>
                            <td className="border px-4 py-2">Administrador</td>
                            <td className="border px-4 py-2 flex gap-2">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                    Ver
                                </button>
                                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                                    Editar
                                </button>
                                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Usuarios;
