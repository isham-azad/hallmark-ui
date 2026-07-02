import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HallMark Enterprises',
    short_name: 'HallMark',
    description: 'A Wholesale Distributor & Food Processing Co.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
