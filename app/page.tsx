'use client';

import dynamic from 'next/dynamic';

// The app reads localStorage and the device clock on first render, so it renders on the client only. The gate asks for
// the access code first; nothing of the app is shown until the server has accepted one.
const Gate = dynamic(() => import('@/components/Gate'), { ssr: false });

export default function Page() {
  return <Gate />;
}
