import { type NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // ดึง pathname เช่น /api/files/public/1234/somefile.txt
    const pathname = request.nextUrl.pathname

    // ตัด /api/files/public/ ออก เพื่อเหลือแค่ userId/filename
    // ให้ปรับตรงนี้ตาม folder api path ของคุณ
    const prefix = '/api/files/public/'
    if (!pathname.startsWith(prefix)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const paramPath = pathname.slice(prefix.length) // "userId/filename-or-path"

    // แยก userId กับ filename (filename อาจเป็น subpath ก็ได้)
    const firstSlashIndex = paramPath.indexOf('/')
    if (firstSlashIndex === -1) {
      return NextResponse.json({ error: 'Missing filename parameter' }, { status: 400 })
    }
    const userId = paramPath.slice(0, firstSlashIndex)
    const filename = paramPath.slice(firstSlashIndex + 1)

    if (!userId || !filename) {
      return NextResponse.json({ error: 'userId and filename are required' }, { status: 400 })
    }

    const decodedFilePath = decodeURIComponent(filename)
    const userBaseDir = path.join(process.cwd(), 'src', 'uploads', userId)
    const absoluteFilePath = path.join(userBaseDir, decodedFilePath)

    const relativeFilePath = path.relative(userBaseDir, absoluteFilePath)
    if (relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const fileStat = await stat(absoluteFilePath)
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Path is not a file' }, { status: 404 })
    }

    const fileBuffer = await readFile(absoluteFilePath)

    const ext = path.extname(decodedFilePath).toLowerCase()
    const baseFilename = path.basename(decodedFilePath)

    let contentType = 'application/octet-stream'
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      contentType = `image/${ext.replace('.', '')}`
    } else if (ext === '.mp4') {
      contentType = 'video/mp4'
    } else if (ext === '.mp3') {
      contentType = 'audio/mpeg'
    } else if (ext === '.pdf') {
      contentType = 'application/pdf'
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${baseFilename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: unknown) {
    console.error('Error serving public file:', error)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
