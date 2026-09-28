'use client';

import dynamic from 'next/dynamic';

// The app reads localStorage and the device clock on first render, so it renders on the client only.
const App = dynamic(() => import('@/components/App'), { ssr: false });

export default function Page() {
  return <App />;
}
