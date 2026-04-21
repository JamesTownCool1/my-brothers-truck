/**
 * POST /api/upload
 *
 * Very simple image upload to local disk. Works out of the box for dev
 * and self-hosted deploys. For Vercel / serverless: swap this out for
 * S3 / Cloudinary / UploadThing — the endpoint shape stays the same
 * (multipart form with field "file", returns { url }).
 *
 * Constraints:
 *   - max 5MB
 *   - only image/* mime types
 *   - filename randomised to prevent collisions + path-traversal
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`upload:${session.user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Upload rate limit hit' }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type.split('/')[1] ?? 'bin';
  const filename = `${randomBytes(16).toString('hex')}.${ext}`;

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
