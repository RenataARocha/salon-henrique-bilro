'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Clock, DollarSign } from 'lucide-react'

interface ServiceCardProps {
    name: string
    description: string
    price: number
    duration: number
    images: string[]
    onBook?: () => void
}

export default function ServiceCard({
    name,
    description,
    price,
    duration,
    images,
    onBook
}: ServiceCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Trocar imagem automaticamente a cada 3 segundos
    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % images.length)
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [images.length])

    return (
        <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            {/* Imagem com Animação */}
            <div className="relative h-64 overflow-hidden bg-gray-200">
                {images && images.length > 0 ? (
                    images.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${name} - ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                unoptimized={image.startsWith('http')} // Para URLs externas
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-300 text-gray-500">
                        Sem imagem
                    </div>
                )}

                {/* Indicadores de imagem */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                    ? 'bg-yellow-500 w-8'
                                    : 'bg-white/50 hover:bg-white/80'
                                    }`}
                                aria-label={`Ver imagem ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Overlay com gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Conteúdo */}
            <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">{name}</h3>
                <p className="text-gray-600 mb-4 min-h-[48px]">{description}</p>

                {/* Informações */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={20} className="text-yellow-600" />
                        <span className="font-medium">{duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign size={20} className="text-yellow-600" />
                        <span className="text-3xl font-bold text-yellow-600">
                            {price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            })}
                        </span>
                    </div>
                </div>

                {/* Botão */}
                {onBook && (
                    <button
                        onClick={onBook}
                        className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors duration-200"
                    >
                        Agendar Agora
                    </button>
                )}
            </div>
        </article>
    )
} 