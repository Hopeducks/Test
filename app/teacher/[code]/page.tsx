import React, { Suspense } from 'react';
import TeacherSessionClientPage from '../../../components/ui/TeacherSessionClientPage';
import { Loader2 } from 'lucide-react';

// Static params generation required by next export
export async function generateStaticParams() {
  return [
    { code: 'demo' }
  ];
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function TeacherSessionPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span>교사 대시보드 로딩 중...</span>
      </div>
    }>
      <TeacherSessionClientPage 
        code={resolvedParams.code} 
      />
    </Suspense>
  );
}
