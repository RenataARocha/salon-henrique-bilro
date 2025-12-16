// app/api/upload/route.ts - COM RATE LIMIT HANDLING

import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Helper para delay entre uploads
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]

        if (files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Nenhum arquivo enviado' },
                { status: 400 }
            )
        }

        // Limitar a 3 imagens por vez (Cloudinary free tier)
        if (files.length > 3) {
            return NextResponse.json(
                { success: false, error: 'Máximo de 3 imagens por upload. Por favor, faça uploads menores.' },
                { status: 400 }
            )
        }

        const uploadedUrls: string[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            try {
                // Converter File para base64
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)
                const base64 = buffer.toString('base64')
                const dataURI = `data:${file.type};base64,${base64}`

                // Upload para Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'salon-services',
                    resource_type: 'auto',
                    timeout: 60000 // 60 segundos de timeout
                })

                uploadedUrls.push(result.secure_url)

                // Delay de 500ms entre uploads para evitar rate limit
                if (i < files.length - 1) {
                    await delay(500)
                }
            } catch (uploadError: any) {
                console.error(`Erro ao fazer upload da imagem ${i + 1}:`, uploadError)

                // Se for rate limit, retornar erro específico
                if (uploadError.http_code === 429) {
                    return NextResponse.json(
                        { success: false, error: 'Muitos uploads em sequência. Aguarde alguns segundos e tente novamente.' },
                        { status: 429 }
                    )
                }

                // Continuar com próximas imagens mesmo se uma falhar
                continue
            }
        }

        if (uploadedUrls.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Nenhuma imagem foi enviada com sucesso. Tente novamente.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            urls: uploadedUrls,
            message: uploadedUrls.length < files.length
                ? `${uploadedUrls.length} de ${files.length} imagens enviadas com sucesso`
                : undefined
        })

    } catch (error: any) {
        console.error('Erro no upload:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao fazer upload: ' + error.message },
            { status: 500 }
        )
    }
}