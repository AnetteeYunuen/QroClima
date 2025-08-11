import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config';

// Parámetros
const RADIUS_METERS = 1000;
const RECENT_HOURS = 12;
const REPEAT_MS = 2 * 60 * 1000;   // 2 minutos
const STATIONARY_EPS_METERS = 60;

// Haversine
const distMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const metersToStr = m => (m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`);
const riskLabel = t => (t || 'riesgo').replace(/_/g, ' ').toLowerCase();

export default function useLocationAlert() {
  const lastSpokenAtRef = useRef(0);
  const lastSpokenLocRef = useRef(null);
  const lastNearestIdRef = useRef(null);

  // Función reutilizable: trae reports, filtra y decide si hablar
  const checkNearbyAndSpeak = async (latitude, longitude, { force = false } = {}) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.reports}`);
      const list = await res.json();
      if (!Array.isArray(list)) {
        console.log('Respuesta inesperada de /api/reports:', list);
        return;
      }

      const since = Date.now() - RECENT_HOURS * 60 * 60 * 1000;

      const candidates = list
        .filter(r => r?.active !== false && r?.createdAt && new Date(r.createdAt).getTime() >= since)
        .map(r => {
          // acepta "lat,lng" con espacios
          let lat2, lng2;
          if (typeof r.location === 'string' && r.location.includes(',')) {
            const [latS, lngS] = r.location.split(',').map(s => s.trim());
            lat2 = Number(latS);
            lng2 = Number(lngS);
          } else if (r.location?.coordinates?.length === 2) {
            const [lngG, latG] = r.location.coordinates;
            lat2 = Number(latG);
            lng2 = Number(lngG);
          }
          if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
          const d = distMeters(latitude, longitude, lat2, lng2);
          return { r, d };
        })
        .filter(Boolean)
        .filter(x => x.d <= RADIUS_METERS)
        .sort((a, b) => a.d - b.d);

      console.log(`Candidatos cerca (${candidates.length}):`, candidates.map(c => ({
        id: c.r?._id, d: Math.round(c.d), risk: c.r?.riskType, loc: c.r?.location
      })));

      if (!candidates.length) return;

      const nearest = candidates[0];
      const msg = `Atención: ${riskLabel(nearest.r.riskType)} reportado a ${metersToStr(nearest.d)} de tu ubicación.`;

      const now = Date.now();
      const lastAt = lastSpokenAtRef.current;
      const lastLoc = lastSpokenLocRef.current;
      const sameSpot = lastLoc
        ? distMeters(latitude, longitude, lastLoc.lat, lastLoc.lng) <= STATIONARY_EPS_METERS
        : false;
      const overRepeatWindow = now - lastAt >= REPEAT_MS;
      const newNearest = nearest.r?._id && nearest.r._id !== lastNearestIdRef.current;

      // Regla:
      // - Si es "force" (primer chequeo) => habla si hay candidato.
      // - Si cambió el más cercano => habla.
      // - Si no cambió y sigues en el mismo lugar => repite cada 2 min.
      if (force || newNearest || (sameSpot && overRepeatWindow) || (!sameSpot && overRepeatWindow)) {
        // Notificación (opcional)
        await Notifications.scheduleNotificationAsync({
          content: { title: '🚨 Reporte cercano', body: msg, sound: true },
          trigger: null,
        });

        // Voz
        Speech.speak(msg, { language: 'es-MX', rate: 0.95, pitch: 1.0 });

        lastSpokenAtRef.current = now;
        lastSpokenLocRef.current = { lat: latitude, lng: longitude };
        lastNearestIdRef.current = nearest.r?._id || null;
      }
    } catch (err) {
      console.log('Error checkNearbyAndSpeak:', err?.message || err);
    }
  };

  useEffect(() => {
    let locationSubscription;

    const start = async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (locStatus !== 'granted' || notifStatus !== 'granted') {
        console.log('Permisos denegados (ubicación o notificaciones)');
        return;
      }

      // Chequeo inmediato con la posición actual
      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await checkNearbyAndSpeak(current.coords.latitude, current.coords.longitude, { force: true });
      } catch (e) {
        console.log('Posición inicial no disponible aún:', e?.message || e);
      }

      // Suscripción continua
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        async ({ coords: { latitude, longitude } }) => {
          await checkNearbyAndSpeak(latitude, longitude);
        }
      );
    };

    start();
    return () => locationSubscription?.remove();
  }, []);

  return null;
}
