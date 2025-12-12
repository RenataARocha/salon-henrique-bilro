// app/api/upload/route.ts

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

        // Criar pasta se não existir
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'services')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const uploadedUrls: string[] = []

        for (const file of files) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Gerar nome único com timestamp
            const timestamp = Date.now()
            const ext = file.name.split('.').pop()
            const filename = `service-${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
            const filepath = join(uploadDir, filename)

            // Salvar arquivo
            await writeFile(filepath, buffer)

            // URL pública
            uploadedUrls.push(`/uploads/services/${filename}`)
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