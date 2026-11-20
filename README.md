# Clan Team FC · Sitio del club

Versión basada directamente en el código original de GF42JMF/clanteamFC. Conserva la portada negra/magenta, los escudos, la historia, las fichas de jugadores, los resultados y la pizarra. Su objetivo es informar y administrar el club.

## Funciones

- Historia, palmarés, escudos y fotografía real del club.
- Plantilla con filtros, fichas, alta y edición de jugadores para administradores.
- Pizarra para fútbol 7 y 8: cambios de formación, arrastrar, intercambiar, suplentes y PDF. Borradores locales y publicación de una alineación compartida por el administrador.
- Historial de partidos, edición, fotos asociadas y votación MVP con cuenta vinculada a un jugador y cierre validado por el servidor.
- Galería con fotos de los partidos, búsqueda, ampliación y carga de JPG/PNG/WebP de hasta 8 MB por el administrador.
- Cuotas por jugador, mes y año; importe configurable, total recaudado registrado y CSV. Un mes sin registro no se considera deuda. Las actualizaciones detectan conflictos entre sesiones.
- Cuentas de jugadores, permisos y vinculación con el plantel. Las contraseñas no se guardan en el navegador ni se incluyen en el código público.
- Resumen estadístico del historial y un apartado breve sobre el regreso en 2027.

## Datos existentes

El servidor lee los jugadores, partidos, goleadores y fotos del proyecto Supabase actual. Los cambios administrativos se guardan en una tabla nueva privada, clan_records. Las ediciones se aplican sobre el historial leído; quitar un jugador o partido lo archiva en esta nueva capa y conserva la fuente original. No hay cambios destructivos ni cargas ficticias sobre las tablas existentes.

Las imágenes nuevas se guardan en el bucket público clan-media para mostrarlas en la galería. Solo el servidor puede escribir en ese bucket. Los datos de cuotas, usuarios y sesiones tienen acceso exclusivo desde las rutas administrativas autenticadas.

## Configurar Supabase

1. En el SQL Editor del proyecto ejecutar supabase/club-admin.sql. Crea la tabla privada y el bucket; no modifica partidos ni jugadores existentes.
2. En Render configurar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY para la lectura.
3. Configurar SUPABASE_SECRET_KEY con una clave de servidor sb_secret_ o la clave legacy service_role. Ingresar este valor directamente en las variables privadas de Render; no pegarlo en el código, el repositorio ni el navegador.

La clave pública compartida anteriormente permite leer el historial. No reemplaza la clave privada necesaria para administrar registros protegidos.

## Publicar un NUEVO servicio en Render

El archivo render.yaml configura un Web Service de Node en el plan Free, separado del servicio anterior. Debe publicar la rama codex/club-original-2027 del repositorio del usuario. La rama está preparada localmente; para subirla hace falta acceso de escritura a GitHub.

- Node: 24.22.1, dentro de la rama 24.
- Build: corepack pnpm install --frozen-lockfile && corepack pnpm run build
- Start: node server/index.mjs
- Health check: /healthz
- Servidor: escucha 0.0.0.0 y el PORT proporcionado por Render.

Variables adicionales:

- NODE_ENV=production
- CLAN_ADMIN_USERNAME=admin
- CLAN_ADMIN_EMAIL=correo del administrador
- CLAN_ADMIN_PASSWORD=contraseña configurada directamente como variable privada

No se requiere un disco de Render: la persistencia administrativa utiliza Supabase. La URL onrender.com debe tomarse del despliegue real; no se presupone que un subdominio esté disponible.

## Desarrollo y comprobaciones

Requisitos: Node 24 y pnpm 11.25.0. Ejecutar pnpm install --frozen-lockfile, pnpm test y pnpm build. El servidor se inicia con pnpm start. Para desarrollo con Vite: pnpm dev:server y pnpm dev; la UI usa el proxy /api al puerto 3001. Los valores locales pueden cargarse con un archivo .env, excluido del repositorio. .env.example documenta únicamente los nombres.

Las diez pruebas usan una base de memoria aislada: permisos, sesión HttpOnly, cuotas entre sesiones, conflictos de edición, validación de origen, usuarios y contraseñas, MVP sin suplantación ni voto duplicado, archivo no destructivo, tácticas F7, galería y cierre de sesión. El modo de memoria se rechaza en producción. Las pruebas no escriben sobre Supabase.

Comprobado en la vista previa: portada HTTP 200 y lectura de 58 partidos y 22 jugadores del proyecto existente. El modo local está identificado con una franja y sus cambios de prueba son temporales. El guardado en producción requiere aplicar la migración y configurar las variables privadas. La publicación en Render está pendiente de acceso a Render/GitHub y de esa configuración.

No se pudo realizar una nueva revisión visual automatizada en este turno porque la herramienta de navegador no estaba disponible. La interfaz parte de los mismos componentes y estilos de la web original; se verificaron TypeScript y la compilación de producción.

Referencias de despliegue: https://render.com/docs/web-services · https://render.com/docs/blueprint-spec · https://render.com/docs/node-version · https://supabase.com/docs/guides/getting-started/api-keys
