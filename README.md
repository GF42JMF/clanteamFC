<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clan Team F.C.

Frontend React + Vite para gestionar plantilla, partidos, votos MVP, galería y cuotas.

## Configuración Supabase (frontend)

Para conectar el frontend a Supabase, define estas variables en `.env.local`:

```env
VITE_SUPABASE_URL=https://qpraaostmojllbgfczox.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Si faltan esas variables, la app usa fallback local (`constants` + `localStorage`) sin romper la UI.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` (opcional, recomendado)
3. Run the app:
   `npm run dev`
