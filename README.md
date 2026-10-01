# SIGAC · Frontend (Universidad Surcolombiana)

Aplicación Angular 22 para el **Sistema de Información para la Gestión de Actas y Consejos**.
La interfaz usa la paleta institucional del [Manual de Identidad e Imagen USCO](https://www.usco.edu.co/imagen-institucional/):

- Vino tinto `#8F141B`
- Gris `#4D626C`
- Ocre `#DFD4A6`

## Requisitos

- Node.js 20+
- Backend SIGAC en `http://localhost:8080` (`sigac-backend/sigac-v1`)

## Arranque

```bash
cd sigac-frontend
npm install
npm start
```

La app queda en `http://localhost:4200` y reenvía `/api` al backend mediante el proxy.

### Usuarios de prueba (backend)

| Correo | Clave | Rol |
|---|---|---|
| admin@sigac.local | Admin12345* | Administrador |
| dev@sigac.local | Dev12345* | Perfil técnico |

Con `SIGAC_SEED_DEMO=true` también: `sec1@`, `sec2@`, `presidente@`, `consejero1@demo.edu` / `Demo12345*`.

## Módulos

- Autenticación y recuperación de clave
- Panel según rol
- Solicitudes (radicar, evaluar, anexos)
- Sesiones y orden del día
- Sala en vivo (asistencia, quórum, decisiones)
- Actas (edición, vista previa PDF, firma)
- Repositorio con verificación SHA-256
- Plantillas (perfil DEV)
- Usuarios, jerarquía, parámetros y auditoría
