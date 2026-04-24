'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getFirebaseAnalytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // Inicializa Firebase Analytics una sola vez al montar
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  // Registra page_view en cada cambio de ruta
  useEffect(() => {
    getFirebaseAnalytics().then((analytics) => {
      if (!analytics) return;
      logEvent(analytics, 'page_view', { page_path: pathname });
    });
  }, [pathname]);

  // Este componente no renderiza nada visible
  return null;
}
