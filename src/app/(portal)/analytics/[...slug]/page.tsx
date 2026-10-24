import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

export default async function AnalyticsSubpage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const sub = resolvedParams?.slug?.[0] || 'classes';
  if (sub === 'classes') {
    redirect('/analytics?tab=kelas');
  }
  if (sub === 'questions') {
    redirect('/analytics?tab=butir-soal');
  }
  if (sub === 'export') {
    redirect('/analytics?tab=ekspor');
  }
  redirect('/analytics');
}
