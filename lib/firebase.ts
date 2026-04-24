import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCghM_otB1wK8hzX1Iu5dLl82850lyi_x0',
  authDomain: 'turin-7c59e.firebaseapp.com',
  databaseURL: 'https://turin-7c59e-default-rtdb.firebaseio.com',
  projectId: 'turin-7c59e',
  storageBucket: 'turin-7c59e.firebasestorage.app',
  messagingSenderId: '547751895157',
  appId: '1:547751895157:web:c9bbaff4c4ac1c0ce6983c',
  measurementId: 'G-64SHC5XX95',
};

// Evita reinicializar en hot-reload de Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let analyticsInstance: Analytics | null = null;

/**
 * Retorna la instancia de Analytics, o null si el entorno no la soporta (SSR).
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (!supported) return null;
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

export { app };
