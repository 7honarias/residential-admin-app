import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';

type EventParams = Record<string, string | number | boolean>;

/**
 * Registra un evento personalizado en Firebase Analytics / GA4.
 * Es seguro llamar desde el cliente — no hace nada en SSR.
 */
export async function trackEvent(eventName: string, params?: EventParams) {
  const analytics = await getFirebaseAnalytics();
  if (!analytics) return;
  logEvent(analytics, eventName, params);
}

// ─── Eventos predefinidos de la plataforma ─────────────────────────────────

export const Analytics = {
  /** Autenticación */
  login: () => trackEvent('login', { method: 'email' }),
  logout: () => trackEvent('logout'),

  /** Reservas */
  bookingViewed: (amenityName: string) =>
    trackEvent('booking_viewed', { amenity_name: amenityName }),
  bookingCreated: (amenityName: string) =>
    trackEvent('booking_created', { amenity_name: amenityName }),
  bookingCancelled: (amenityName: string) =>
    trackEvent('booking_cancelled', { amenity_name: amenityName }),

  /** Portería */
  guestAuthorizationCreated: () =>
    trackEvent('guest_authorization_created'),

  /** PQRS */
  pqrsCreated: (type: string) =>
    trackEvent('pqrs_created', { pqrs_type: type }),

  /** Clasificados */
  listingViewed: (listingId: string) =>
    trackEvent('listing_viewed', { listing_id: listingId }),
  listingCreated: () =>
    trackEvent('listing_created'),

  /** Dashboard */
  dashboardViewed: () =>
    trackEvent('dashboard_viewed'),

  /** Genérico */
  custom: (eventName: string, params?: EventParams) => trackEvent(eventName, params),
};
