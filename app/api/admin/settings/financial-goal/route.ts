import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { goal } = await req.json()

        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        const savedGoal = await prisma.financialGoal.upsert({
            where: {
                month_year: {
                    month,
                    year
                }
            },
            update: {
                goal
            },
            create: {
                goal,
                month,
                year
            }
        })

        return NextResponse.json({
            success: true,
            goal: savedGoal.goal
        })

    } catch (error) {
        return NextResponse.json({
            success: false
        })
    }
}


export async function GET() {

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const goal = await prisma.financialGoal.findUnique({
        where: {
            month_year: {
                month,
                year
            }
        }
    })

    return NextResponse.json({
        success: true,
        goal: goal?.goal || 0
    })
}