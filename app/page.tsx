'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const params = window.location.search;
    router.push(`/login${params}`);
  }, []);
  return null;
}
