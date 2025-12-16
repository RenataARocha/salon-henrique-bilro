// app/api/upload/route.ts - COM CLOUDINARY

import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

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

        const uploadedUrls: string[] = []

        for (const file of files) {
            // Converter File para base64
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const base64 = buffer.toString('base64')
            const dataURI = `data:${file.type};base64,${base64}`

            // Upload para Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'salon-services', // Pasta no Cloudinary
                resource_type: 'auto'
            })

            uploadedUrls.push(result.secure_url)
        }

        return NextResponse.json({
            success: true,
            urls: uploadedUrls
        })

    } catch (error) {
        console.error('Erro no upload:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao fazer upload: ' + (error as Error).message },
            { status: 500 }
        )
    }
}