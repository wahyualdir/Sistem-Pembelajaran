import React from 'react';
import {
  CertificatesHubView,
  type CertificateItem,
} from '@/modules/academic/certificates-hub-view';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config/features';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  getStudentCertificatesAction,
  getStudentProjectsAction,
} from '@/modules/academic/badge-certificate-actions';

interface CertificatesPageProps {
  searchParams?: Promise<{
    code?: string;
  }>;
}

export default async function CertificatesPage({ searchParams }: CertificatesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (resolvedParams.code) {
    redirect(`/verify/certificate/${encodeURIComponent(resolvedParams.code)}`);
  }

  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const realCerts = await getStudentCertificatesAction().catch(() => []);
  const projects = await getStudentProjectsAction().catch(() => []);
  const certificates: CertificateItem[] = realCerts.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    date: c.issueDate,
    credentialId: c.verificationCode,
    grade: c.grade,
    hours: c.creditHours,
  }));

  return (
    <CertificatesHubView
      certificates={certificates}
      projects={projects.map((p) => ({ ...p, repo: p.repo || "" }))}
    />
  );
}
