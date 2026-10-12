import { NextRequest, NextResponse } from 'next/server';
import { ambilSimulatedBerkas } from '@/lib/supabase/storage';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Path tidak valid', { status: 400 });
  }

  const simulated = ambilSimulatedBerkas(path);
  if (simulated) {
    const filename = path.split('/').pop() || 'berkas';
    return new NextResponse(new Uint8Array(simulated.buffer), {
      headers: {
        'Content-Type': simulated.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // Jika tidak ditemukan di simulated buffer
  return new NextResponse('Berkas berada di cloud storage atau sesi unduh telah kedaluwarsa.', {
    status: 404,
  });
}
