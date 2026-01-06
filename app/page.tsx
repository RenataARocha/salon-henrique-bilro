// app/page.tsx - Server Component (sem 'use client')

import { prisma } from '@/lib/prisma'
import HomeClient from '@/components/home/HomeClient'

export default async function Home() {
  // Buscar serviços REAIS do banco de dados (Server Side)
  const services = await prisma.service.findMany({
    where: {
      active: true, // Apenas serviços ativos
    },
    orderBy: {
      createdAt: 'desc', // Mais recentes primeiro
    },
    take: 3, // Pegar apenas 3 para mostrar na home
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      duration: true,
      images: true,
    },
  })

  // Passar dados para componente Client
  return <HomeClient services={services} />
}