import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://salon-henrique-bilro.vercel.app',
            lastModified: new Date(),
        },
        {
            url: 'https://salon-henrique-bilro.vercel.app/servicos',
            lastModified: new Date(),
        },
        {
            url: 'https://salon-henrique-bilro.vercel.app/agendamento',
            lastModified: new Date(),
        },
    ]
}
