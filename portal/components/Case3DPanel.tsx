'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const STLViewer = dynamic(() => import('@/components/STLViewer'), { ssr: false });

export default function Case3DPanel({
  url,
  title,
}: {
  url?: string | null;
  title?: string;
}) {
  const hasModel = !!url;
  const source = useMemo(() => url ?? '', [url]);

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">{title ?? '3D View'}</h2>
      </div>

      {!hasModel ? (
        <p className="text-white/60">No STL available.</p>
      ) : (
        <div className="h-80 rounded-lg overflow-hidden bg-black/30">
          {/* STLViewer is client-only; safe here */}
          <STLViewer url={source} />
        </div>
      )}
    </div>
  );
}
