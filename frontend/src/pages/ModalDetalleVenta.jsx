import React from 'react';
import { FaCreditCard, FaTruck, FaInfoCircle } from 'react-icons/fa';

const ModalDetalleVenta = ({ venta, onClose }) => {
    if (!venta) return null;

    const estadoNombre = venta.estado?.Nombre || "Sin estado";
    const estadoBadges = {
        'Pendiente': { bg: '#ffc107', color: '#000' },
        'Pagada': { bg: '#28a745', color: '#fff' },
        'En Producción': { bg: '#17a2b8', color: '#fff' },
        'Lista para Entrega': { bg: '#007bff', color: '#fff' },
        'Entregada': { bg: '#28a745', color: '#fff' },
        'Cancelada': { bg: '#dc3545', color: '#fff' }
    };

    const estadoStyle = estadoBadges[estadoNombre] || { bg: '#6c757d', color: '#fff' };

    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                maxWidth: '1100px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)',
                    color: 'white',
                    padding: '25px 30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>
                            Venta #{venta.VentaID}
                        </h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
                            {formatearFecha(venta.FechaVenta)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: 'transparent',
                            border: '2px solid white',
                            color: 'white',
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '30px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {/* Cliente, Estado y Total */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        {/* Cliente */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <h6 style={{ color: '#666', fontSize: '0.85rem', marginBottom: '10px', fontWeight: '600' }}>
                                CLIENTE
                            </h6>
                            <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                                {venta.usuario?.Nombre || "Sin nombre"}
                            </p>
                            <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                                Doc: {venta.DocumentoID || "N/A"}
                            </p>
                            <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                                {venta.usuario?.Correo || "Sin correo"}
                            </p>
                        </div>

                        {/* Estado */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <h6 style={{ color: '#666', fontSize: '0.85rem', marginBottom: '10px', fontWeight: '600' }}>
                                ESTADO
                            </h6>
                            <span style={{
                                display: 'inline-block',
                                backgroundColor: estadoStyle.bg,
                                color: estadoStyle.color,
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                marginTop: '5px'
                            }}>
                                {estadoNombre}
                            </span>
                        </div>

                        {/* Total */}
                        <div style={{
                            backgroundColor: '#d4edda',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '2px solid #28a745'
                        }}>
                            <h6 style={{ color: '#155724', fontSize: '0.85rem', marginBottom: '10px', fontWeight: '600' }}>
                                TOTAL
                            </h6>
                            <p style={{ margin: '5px 0', color: '#155724', fontSize: '0.9rem' }}>
                                Subtotal: ${parseFloat(venta.Subtotal || 0).toLocaleString()}
                            </p>
                            <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>
                                ${parseFloat(venta.Total || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* 🔹 MÉTODO DE PAGO - FUERA DEL BUCLE DE PRODUCTOS */}
                    {venta.MetodoPago ? (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0',
                            marginBottom: '30px'
                        }}>
                            <h6 style={{ color: '#666', fontSize: '0.95rem', marginBottom: '15px', fontWeight: '600' }}>
                                MÉTODO DE PAGO
                            </h6>
                            
                            {venta.MetodoPago === 'transferencia' ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <FaCreditCard style={{ color: '#007bff', fontSize: '1.3rem' }} />
                                        <span style={{
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            Transferencia Bancaria
                                        </span>
                                    </div>
                                    {venta.FechaTransferencia && (
                                        <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#666' }}>
                                            <strong>Fecha de transferencia:</strong> {formatearFecha(venta.FechaTransferencia)}
                                        </p>
                                    )}
                                    {venta.ComprobanteTransferencia && (
                                        <div style={{ marginTop: '15px' }}>
                                            <p style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600' }}>
                                                Comprobante de pago:
                                            </p>
                                            <div style={{ textAlign: 'center' }}>
                                                <img
                                                    src={venta.ComprobanteTransferencia}
                                                    alt="Comprobante de pago"
                                                    style={{
                                                        maxWidth: '300px',
                                                        maxHeight: '400px',
                                                        border: '2px solid #ddd',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                    onClick={() => window.open(venta.ComprobanteTransferencia, '_blank')}
                                                />
                                                <p style={{ color: '#999', marginTop: '10px', fontSize: '0.85rem' }}>
                                                    Haz clic para ampliar
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : venta.MetodoPago === 'contraentrega' ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <FaTruck style={{ color: '#28a745', fontSize: '1.3rem' }} />
                                        <span style={{
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            Pago Contraentrega
                                        </span>
                                    </div>
                                    <div style={{
                                        backgroundColor: '#e7f3e7',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #c3e6cb'
                                    }}>
                                        <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                                            <strong>Receptor:</strong> {venta.NombreReceptor}
                                        </p>
                                        <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                                            <strong>Teléfono:</strong> {venta.TelefonoEntrega}
                                        </p>
                                        <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                                            <strong>Dirección:</strong> {venta.DireccionEntrega}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '15px',
                            borderRadius: '10px',
                            border: '1px solid #ffc107',
                            marginBottom: '30px',
                            textAlign: 'center'
                        }}>
                            <FaInfoCircle style={{ color: '#856404', fontSize: '1.2rem', marginBottom: '8px' }} />
                            <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                                <strong>Venta presencial</strong> - Sin método de pago registrado
                            </p>
                        </div>
                    )}

                    {/* PRODUCTOS */}
                    <h5 style={{
                        color: '#333',
                        marginBottom: '20px',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        borderBottom: '2px solid #1976d2',
                        paddingBottom: '10px'
                    }}>
                        Productos Vendidos
                    </h5>

                    {venta.detalles && venta.detalles.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {venta.detalles.map((detalle, index) => (
                                <div
                                    key={index}
                                    style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '10px',
                                        padding: '20px',
                                        backgroundColor: '#fafafa',
                                        display: 'flex',
                                        gap: '20px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    {/* Imagen del producto */}
                                    <div style={{
                                        minWidth: '120px',
                                        height: '120px',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid #ddd'
                                    }}>
                                        {detalle.producto?.ImagenProducto ? (
                                            <img
                                                src={detalle.producto.ImagenProducto}
                                                alt={detalle.producto?.Nombre}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Información del producto */}
                                    <div style={{ flex: 1 }}>
                                        <h6 style={{
                                            color: '#1976d2',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            marginBottom: '12px'
                                        }}>
                                            {detalle.producto?.Nombre || "Producto sin nombre"}
                                        </h6>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '10px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                                    <strong>Cantidad:</strong> {detalle.Cantidad}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                                    <strong>Color:</strong> {detalle.color?.Nombre || "N/A"}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                                    <strong>Talla:</strong> {detalle.talla?.Nombre || "N/A"}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                                    <strong>P. Unit:</strong> ${parseFloat(detalle.PrecioUnitario || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Subtotal del producto */}
                                        <div style={{
                                            backgroundColor: '#e3f2fd',
                                            padding: '10px 15px',
                                            borderRadius: '6px',
                                            marginTop: '10px'
                                        }}>
                                            <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem' }}>
                                                Subtotal: ${(detalle.Cantidad * parseFloat(detalle.PrecioUnitario || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{
                            textAlign: 'center',
                            color: '#666',
                            padding: '40px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                        }}>
                            No hay productos en esta venta
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    borderTop: '1px solid #e0e0e0',
                    padding: '20px 30px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: '#f8f9fa'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 25px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem'
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalleVenta;