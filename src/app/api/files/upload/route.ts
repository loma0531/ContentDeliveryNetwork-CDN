// This route uses the Node.js runtime for file uploads. Ensure you have 'formidable' installed.
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { getCurrentUser } from '@/utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: 'nodejs',
};

async function parseForm(req: NextRequest): Promise<{ fields: Record<string, unknown>; files: Record<string, unknown> }> {
  // Convert the web stream to a Node.js readable stream
  // @ts-expect-error [reason: Node.js stream interop]
  const nodeReq = Readable.fromWeb(req.body);
  // Copy headers from NextRequest to a mock IncomingMessage
  // @ts-expect-error [reason: Node.js stream interop]
  nodeReq.headers = Object.fromEntries(req.headers.entries());
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    // @ts-expect-error [reason: formidable callback types]
    form.parse(nodeReq, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Read max upload size from env (in MB)
const MAX_UPLOAD_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || '10240', 10); // 10GB default
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

async function getUserTotalStorage(userId: string): Promise<number> {
  // Function kept for compatibility but no longer used
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = user._id.toString();

    // Check user quota before upload
    const userUsed = await getUserTotalStorage(userId);
    const { fields, files } = await parseForm(request);
    const parentId = Array.isArray(fields.parentId) ? fields.parentId[0] : fields.parentId;
    const currentFolderPath = typeof parentId === 'string' ? parentId : '';
    const rawFile = files.file || files['file'];
    const uploadedFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;
    if (!uploadedFile || (!uploadedFile.originalFilename && !uploadedFile.newFilename)) {
      console.error('Formidable file object missing originalFilename and newFilename:', uploadedFile);
      return NextResponse.json({ error: 'Uploaded file is missing a name' }, { status: 400 });
    }
    const fileSize = uploadedFile.size || 0;
    if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: `File size exceeds per-upload limit (${MAX_UPLOAD_SIZE_MB} MB)` }, { status: 413 });
    }

    const originalFilename = uploadedFile.originalFilename;
    const newFilename = uploadedFile.newFilename; // This is the temp name

    // Always use the original file name as the base
    let finalFilename: string;
    if (typeof originalFilename === 'string' && originalFilename.length > 0) {
      finalFilename = originalFilename;
    } else if (typeof newFilename === 'string' && newFilename.length > 0) {
      finalFilename = newFilename;
    } else {
      console.error('Formidable file object missing originalFilename and newFilename:', uploadedFile);
      return NextResponse.json({ error: 'Uploaded file is missing a name' }, { status: 400 });
    }

    // Construct the upload directory path including the current folder path
    const userBaseDir = path.join(process.cwd(), 'src', 'uploads', userId);
    const uploadDir = path.join(userBaseDir, currentFolderPath);

    // Security check: Ensure the resolved upload directory is within the user's base directory
    const relativeUploadDir = path.relative(userBaseDir, uploadDir);
     if (relativeUploadDir.startsWith('..') || path.isAbsolute(relativeUploadDir)) {
         console.error('Directory traversal attempt detected:', { userId, currentFolderPath, resolvedUploadDir: uploadDir });
         return NextResponse.json(
            { error: 'Invalid parent folder path' },
            { status: 400 }
         );
    }


    await fs.mkdir(uploadDir, { recursive: true });

    // Check for duplicate and auto-rename if needed
    let destPath = path.join(uploadDir, finalFilename);
    const ext = path.extname(finalFilename);
    const base = path.basename(finalFilename, ext);
    let counter = 1;
    while (true) {
      try {
        await fs.access(destPath);
        // File exists, try a new name
        finalFilename = `${base} (${counter})${ext}`;
        destPath = path.join(uploadDir, finalFilename);
        counter++;
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
          // File does not exist, safe to use
          break;
        } else {
          throw err;
        }
      }
    }

    await fs.copyFile(uploadedFile.filepath, destPath);
    await fs.unlink(uploadedFile.filepath); // Remove temp file

    // Calculate the final path relative to the user's base directory
    const finalPathRelativeToUser = path.relative(userBaseDir, destPath);


    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: finalFilename,
      path: finalPathRelativeToUser, // Return the relative path
      parentId: currentFolderPath || null, // Return the parent path used
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Include error message in response for easier debugging
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}