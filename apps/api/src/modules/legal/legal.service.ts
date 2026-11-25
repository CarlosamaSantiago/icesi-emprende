import { Injectable } from '@nestjs/common';

/** Bump when the policy text changes: new registrations record the version they accepted (HU-45 CA2). */
export const VERSION_POLITICA_DATOS = '2026-1';

@Injectable()
export class LegalService {
  /**
   * HU-45: PLACEHOLDER text. The final wording (Ley 1581 de 2012, responsable, finalidades, derechos del titular)
   * must be provided by the university's legal office before production.
   */
  tratamientoDatos() {
    return {
      version: VERSION_POLITICA_DATOS,
      titulo: 'Política de tratamiento de datos personales',
      secciones: [
        {
          titulo: 'Responsable',
          texto:
            'Icesi Emprende, iniciativa del CIEI de la Universidad Icesi, es responsable del tratamiento de tus datos personales.',
        },
        {
          titulo: 'Datos que recolectamos',
          texto:
            'Nombre, correo institucional, programa y semestre académico, y la información de tus pedidos y emprendimientos.',
        },
        {
          titulo: 'Finalidades',
          texto:
            'Gestionar tu cuenta, procesar pedidos, generar indicadores institucionales y contactarte sobre tu actividad en la plataforma.',
        },
        {
          titulo: 'Tus derechos',
          texto:
            'Puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos escribiendo al CIEI.',
        },
      ],
    };
  }
}
