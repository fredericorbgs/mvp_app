/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ⚠️ faz o build não falhar por erros de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
