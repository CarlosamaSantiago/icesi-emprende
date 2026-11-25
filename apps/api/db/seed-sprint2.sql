-- ===============================================================
-- SPRINT 2 — datos de demostración. Se aplica justo después de seed.sql (ver migrate.ts).
-- Cubre: aprobación CIEI (HU-43), ventas/ranking/indicadores (HU-30..36), pagos (HU-44),
-- calificaciones (HU-37..39), notificaciones (HU-41/42) y Emprendimiento del Mes (HU-46).
-- ===============================================================
-- HU-43: un emprendimiento pendiente de aprobación del CIEI
INSERT INTO emprendimiento (id_emprendimiento, nombre, descripcion, logo_url, destacado, id_usuario, id_categoria, id_semestre, id_estado)
VALUES (9, 'PetCare Icesi', 'Accesorios y cuidado para mascotas de la comunidad universitaria.', NULL, FALSE, 4, 6, 1, 3);

-- 100 y 101 entregados con pago; 102 pendiente; 103 cancelado y reembolsado; 104 confirmado con pago fallido
INSERT INTO pedido (id_pedido, fecha_pedido, total, id_usuario, id_emprendimiento, id_estado) VALUES
  (100, now() - interval '40 days', 21000, 4, 3, 6),
  (101, now() - interval '10 days', 56000, 5, 3, 6),
  (102, now() - interval '2 days',  18000, 4, 5, 3),
  (103, now() - interval '5 days',  45000, 6, 4, 7),
  (104, now() - interval '3 days',  28000, 2, 6, 4);
INSERT INTO detalle_pedido (id_detalle, cantidad, precio_unitario, subtotal, id_pedido, id_producto) VALUES
  (100, 2, 10500, 21000, 100, 13),
  (101, 2, 28000, 56000, 101, 15),
  (102, 1, 18000, 18000, 102, 21),
  (103, 1, 45000, 45000, 103, 18),
  (104, 1, 28000, 28000, 104, 27);

-- HU-44: comisión CIEI 10 % y costo de pasarela 2 % del monto
INSERT INTO pago (id_pedido, estado, monto, comision_ciei, costo_pasarela, referencia, id_registrado_por) VALUES
  (100, 'CONFIRMADO',  21000, 2100.00, 420.00,  'TRX-0001', 3),
  (101, 'CONFIRMADO',  56000, 5600.00, 1120.00, 'TRX-0002', 3),
  (103, 'REEMBOLSADO', 45000, 0, 0, 'TRX-0003', 3),
  (104, 'FALLIDO',     28000, 0, 0, 'TRX-0004', 5);

-- HU-37 / HU-38: calificación de emprendimiento (una por pedido entregado)
INSERT INTO calificacion (puntuacion, comentario, id_usuario, id_emprendimiento, id_pedido) VALUES
  (5, 'Excelente cafe y muy buena atencion.', 4, 3, 100),
  (4, 'Los brownies llegaron perfectos.', 5, 3, 101);

-- HU-39: calificación de producto
INSERT INTO calificacion_producto (puntuacion, comentario, id_usuario, id_producto) VALUES
  (5, 'El latte de caramelo esta increible.', 4, 13),
  (4, 'Muy buenos, repetiria.', 5, 15);

-- HU-41 / HU-42: notificaciones de ejemplo
INSERT INTO notificacion (id_usuario, tipo, contenido, referencia_id, leida) VALUES
  (3, 'PEDIDO', 'Nuevo pedido #101 en CafeIcesi', 101, FALSE),
  (3, 'CALIFICACION', 'Recibiste una calificacion de 4 estrellas en CafeIcesi', 3, FALSE);

-- HU-46: Emprendimiento del Mes (mes actual, hora de Bogotá)
INSERT INTO emprendimiento_del_mes (id_emprendimiento, periodo, id_designado_por)
VALUES (3, to_char(now() AT TIME ZONE 'America/Bogota', 'YYYY-MM'), 1);

-- HU-45: el seed es anterior al consentimiento; se registra el de las cuentas demo
INSERT INTO consentimiento (id_usuario, version)
SELECT id_usuario, '2026-1' FROM usuario;
