const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0',
          },
        ],
      },
    ];
  },
};
export default nextConfig;