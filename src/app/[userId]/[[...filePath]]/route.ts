import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string; filePath?: string[] }> }
) {
  const { userId, filePath = [] } = await context.params

  // ตรวจสอบ path traversal
  if (!userId || userId.includes('..') || filePath.some(p => p.includes('..'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const uploadsRoot = path.join(process.cwd(), 'src', 'uploads')
  const fileFsPath = path.join(uploadsRoot, userId, ...filePath)

  try {
    const stat = await fs.stat(fileFsPath)
    if (!stat.isFile()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fileBuffer = await fs.readFile(fileFsPath)

    const ext = path.extname(fileFsPath).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.png') contentType = 'image/png'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.mp4') contentType = 'video/mp4'
    else if (ext === '.mp3') contentType = 'audio/mpeg'
    else if (ext === '.pdf') contentType = 'application/pdf'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
