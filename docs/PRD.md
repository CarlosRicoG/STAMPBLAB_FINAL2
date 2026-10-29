# PRD — STAMPLAB (tienda y panel administrativo para estampados)

Versión 1.0 · 2026-10-28 · Estado: documento de producto derivado del sistema existente y de la auditoría (`AUDITORIA.md`, en esta misma carpeta).

## 1. Resumen

STAMPLAB es una aplicación web para un taller de estampados. Tiene dos partes:

- **Tienda (cliente):** ver catálogo, cotizar diseños personalizados, comprar y seguir pedidos.
- **Panel administrativo:** atender cotizaciones, gestionar pedidos, inventario, compras a proveedores, usuarios y roles.

## 2. Problema y objetivos

**Problema.** Un taller de estampados vende por catálogo y por encargo (diseños a medida). Sin un sistema, las cotizaciones se pierden en chats, el stock no cuadra, los pagos por transferencia no se concilian y el cliente no sabe en qué va su pedido.

**Objetivos**
1. Que el cliente pueda cotizar o comprar sin intermediarios y vea el estado de su pedido.
2. Que el administrador tenga una sola bandeja de trabajo del día ("Hoy").
3. Que el inventario sea confiable: nunca vender lo que no hay ni reponer lo que no se descontó.
4. Que el precio que el cliente aprueba sea el que se cobra.
5. Que los datos personales de los clientes estén protegidos (Ley 1581 de 2012, Colombia).

**Fuera de alcance (hoy):** factura electrónica DIAN, IVA y retenciones, pagos en línea con pasarela, pagos parciales y saldos, envíos con transportadora, multi-sucursal, app móvil nativa (existe PWA instalable).

## 3. Usuarios y roles

| Rol | Descripción | Acceso |
|---|---|---|
| Visitante | Sin sesión | Catálogo, login, registro y recuperar contraseña |
| Cliente (rol 2) | Persona que compra o cotiza | Lo anterior + sus pedidos, cotizaciones, perfil y carrito |
| Administrador (rol 1) | Dueño o encargado del taller | Todo el panel `/dashboard` |

Hoy el backend distingue solo administrador y no administrador. El CRUD de roles, permisos y privilegios existe, pero no restringe nada (ver requisito RF-30).

## 4. Requisitos funcionales

### 4.1 Cuenta y acceso
- **RF-01** Registro público: siempre crea clientes. Campos: documento, nombre, correo, teléfono, dirección, contraseña (mínimo 8, letras y números).
- **RF-02** Login con token de sesión de 2 h, renovación mientras se usa y cierre de sesión que invalida el token.
- **RF-03** Recuperar y restablecer contraseña por correo (enlace con vigencia de 1 h). Cambiar la contraseña cierra las demás sesiones.
- **RF-04** El cliente edita su perfil. Un administrador gestiona usuarios y clientes.
- **RF-05** Tras iniciar sesión, el cliente vuelve a la página que quería abrir.

### 4.2 Catálogo
- **RF-10** Catálogo público de productos con variantes (color y talla), insumos (telas), técnicas y partes de la prenda.
- **RF-11** Imágenes de productos y técnicas guardadas como archivos (máximo 5 MB; png, jpg, webp, gif).
- **RF-12** El administrador crea, edita, activa o desactiva productos, colores, tallas, insumos y técnicas.

### 4.3 Inventario
- **RF-20** Cada variante (producto + color + talla + tela opcional) tiene su stock entero, mayor o igual que 0.
- **RF-21** El stock se descuenta al crear el pedido y se repone solo cuando se cancela un pedido **Pendiente** (o vence sin pago).
- **RF-22** Dos compradores simultáneos no pueden comprar la misma unidad.
- **RF-23** Un pedido nunca repone stock que no descontó (por ejemplo, líneas de "prenda propia del cliente").
- **RF-24** Una variante desactivada no se puede vender.
- **RF-25** Alerta "stock bajo" por debajo de `STOCK_MINIMO`.

### 4.4 Cotizaciones
- **RF-40** El cliente cotiza productos del catálogo o prendas propias, con diseños (técnica, parte, imagen) y ve un estimado antes de enviar.
- **RF-41** El administrador asigna costos por diseño (a mano o con "Aplicar tarifas") y aprueba. El cliente recibe aviso.
- **RF-42** **Precio congelado:** una vez aprobada, la cotización no admite cambios de costos ni de cantidades.
- **RF-43** El cliente acepta o rechaza una cotización aprobada. Al aceptar se crea el pedido por el **mismo total aprobado**, con una línea por talla cotizada y reserva de stock.
- **RF-44** Una cotización sin respuesta pasa a "Vencida" tras `VIGENCIA_COTIZACION_DIAS` días. Si ya está aprobada, los días cuentan desde la aprobación (`FechaAprobacion`); si no, desde que se creó.
- **RF-75** Aviso previo, una sola vez: el cliente recibe notificación y correo 24 h antes de que se cancele un pedido sin pago y 1 día antes de que venza una cotización aprobada.
- **RF-45** Estados: Pendiente, En revisión, Aprobada, Rechazada, Cancelada, Procesada (ya convertida) y Vencida.

### 4.5 Pedidos y pagos
- **RF-50** El cliente compra desde el carrito (carrito sincronizado entre equipos). Cada línea indica producto, color y talla. El precio nunca se toma del navegador: el servidor lo valida contra el catálogo.
- **RF-51** Entrega por retiro en tienda o envío a domicilio (`COSTO_ENVIO` fijado por el servidor).
- **RF-52** Pago por transferencia (con comprobante) o contraentrega. El administrador puede rechazar un comprobante con motivo.
- **RF-53** Un pedido por transferencia sin pago pasadas `PLAZO_PAGO_HORAS` horas se cancela solo y devuelve el stock.
- **RF-54** Estados y transiciones válidas: Pendiente → Pagada → En producción → Lista para entrega → Entregada. Se puede cancelar antes de entregar. Entregada y Cancelada son finales.
- **RF-55** Línea de tiempo del pedido, fecha estimada de entrega, comprobante PDF descargable y "Volver a pedir".
- **RF-56** El administrador crea pedidos para un cliente (nunca para otro administrador).

### 4.6 Compras y proveedores
- **RF-60** Registro de proveedores y compras de insumos y productos. Una compra suma stock y se puede revertir solo si el stock resultante no queda negativo.

### 4.7 Notificaciones y operación
- **RF-70** Campana de notificaciones en la aplicación (activas e historial) y correo, para cliente y administrador.
- **RF-71** Bandeja "Hoy" del administrador: cotizaciones por atender, comprobantes por revisar, pedidos por avanzar y stock bajo.
- **RF-72** Indicadores del panel exportables a PDF.
- **RF-73** Mantenimiento automático cada hora (vencimientos y limpieza de notificaciones).
- **RF-74** Respaldo de `uploads/` y de la base de datos.

### 4.8 Administración de acceso
- **RF-30** (pendiente, ver §7) Los roles personalizados deben restringir realmente las acciones del panel según sus permisos y privilegios.

## 5. Requisitos no funcionales

| Área | Requisito |
|---|---|
| Seguridad | Ninguna ruta pública lee archivos fuera de la carpeta de imágenes. El secreto de sesión es obligatorio en producción. Contraseñas con hash. El texto con HTML se rechaza. Intentos de login, recuperación y registro limitados por IP. |
| Privacidad | Cumplir la Ley 1581 de 2012: solo se piden los datos necesarios, cada cliente ve únicamente lo suyo y el sistema no expone hashes ni datos de sesión. |
| Integridad | Todo movimiento de stock y de estado ocurre en transacción con bloqueo de filas. |
| Rendimiento | Listados de ventas y cotizaciones paginados, con tope de 1000 filas por página. |
| Disponibilidad | Despliegue con Docker (MySQL, API y web). Frontend como PWA. |
| Accesibilidad y móvil | Diseño responsive sin scroll lateral a 390 px. |
| Mantenibilidad | IDs de estado centralizados. Pruebas automáticas unitarias, de integración y E2E. |

## 6. Métricas de éxito

- 0 diferencias entre stock físico y stock del sistema atribuibles a errores del software.
- 100 % de los pedidos creados desde una cotización con el mismo total que el cliente aprobó.
- Tiempo desde que el cliente envía una cotización hasta que recibe precio (indicador de gestión, medible en el historial de estados).
- 0 hallazgos críticos abiertos en cada auditoría.

## 7. Decisiones pendientes del negocio

Estas decisiones cambian el comportamiento del sistema y no las tomó el código por su cuenta:

1. **Cancelar un pedido ya pagado:** hoy no devuelve stock ni registra reembolso. ¿Debe devolver el stock? ¿Se maneja reembolso?
2. **Pedidos sin pago que no son por transferencia** (contraentrega o creados desde una cotización): hoy nunca vencen y mantienen stock reservado. ¿Se fija un plazo o un límite de pedidos pendientes por cliente?
4. **Roles personalizados (RF-30):** ¿se necesitan empleados con permisos parciales? Hoy solo existe un administrador único.
5. **IVA, descuentos e impuestos:** hoy no existen. ¿Se necesitan en el total?
6. **Pagos parciales o anticipos** en pedidos por encargo.
7. **Cambio de contraseña o correo:** ¿pedir la contraseña actual antes de cambiarlos?

## 8. Alcance de la versión actual y riesgos

**Riesgos abiertos** (detalle y estado en `AUDITORIA.md`):
- Roles personalizados sin efecto real.
- Un token de un usuario eliminado puede seguir válido hasta 2 h en otras instancias del servidor.
