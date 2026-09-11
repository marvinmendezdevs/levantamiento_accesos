/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Todas las rutas: nunca cachear en el navegador ni en el CDN de
        // Vercel — evita servir una build/data vieja después de un deploy.
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
        ],
      },
    ];
  },
};
export default nextConfig;
