// app/page.tsx - Server Component

import { prisma } from '@/lib/prisma'
import HomeClient from '@/components/home/HomeClient'

// IMPORTANTE: Revalidar a cada 60 segundos (cache)
export const revalidate = 60

async function getServices() {
  try {
    const services = await prisma.service.findMany({
      where: {
        active: true,
        featured: true, // ← APENAS SERVIÇOS EM DESTAQUE
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        images: true, // ← INCLUIR IMAGES
        featured: true,
      },
    })
    return services
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    return []
  }
}

export default async function Home() {
  const services = await getServices()
  return <HomeClient services={services} />
}