import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    slug: string[];
  };
}

export default function AnalyticsSubpage({ params }: PageProps) {
  const sub = params.slug?.[0] || 'classes';
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
