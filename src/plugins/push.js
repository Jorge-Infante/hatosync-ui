import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import apiClient from '@/api/client'

/**
 * Push web (FCM). El backend envía con firebase-admin a los tokens registrados
 * en POST /auth/me/push-token/ (platform WEB). El SDK registra por sí solo
 * public/firebase-messaging-sw.js bajo su propio scope (no pisa el SW del PWA).
 *
 * Requisitos de producción: HTTPS (los service workers no corren sobre http
 * salvo en localhost) y la clave VAPID de abajo.
 */

// Config pública del proyecto Firebase "hatosync" (no es un secreto).
const firebaseConfig = {
  apiKey: 'AIzaSyA8j9AF478XvQRi2VUpLbevj_xYRx8MAgA',
  authDomain: 'hatosync.firebaseapp.com',
  projectId: 'hatosync',
  storageBucket: 'hatosync.firebasestorage.app',
  messagingSenderId: '983879422462',
  appId: '1:983879422462:web:d939b85e30771701cf70af',
}

// Clave PÚBLICA del par "Certificados push web": Firebase Console →
// Configuración del proyecto → Cloud Messaging → Certificados push web →
// Generar par de claves. Mientras sea el placeholder, la UI oculta el botón
// de activar notificaciones (isPushConfigured()).
const VAPID_PUBLIC_KEY = process.env.VUE_APP_FIREBASE_VAPID_KEY || 'PEGA_AQUI_LA_CLAVE_VAPID'

let messaging = null

function getFirebaseMessaging() {
  if (!messaging) {
    messaging = getMessaging(initializeApp(firebaseConfig))
  }
  return messaging
}

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY) && !VAPID_PUBLIC_KEY.startsWith('PEGA_AQUI')
}

export async function isPushSupported() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
  try {
    return await isSupported()
  } catch {
    return false
  }
}

export function pushPermission() {
  return 'Notification' in window ? Notification.permission : 'denied'
}

// Pide permiso, obtiene el token FCM y lo upsertea en el backend (el token
// identifica al NAVEGADOR: si otra cuenta inicia sesión, se le reasigna).
export async function enableWebPush() {
  if (!isPushConfigured()) throw new Error('Las notificaciones aún no están configuradas (clave VAPID)')
  if (!(await isPushSupported())) throw new Error('Este navegador no soporta notificaciones push')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permiso de notificaciones denegado')
  const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_PUBLIC_KEY })
  if (!token) throw new Error('No se pudo obtener el token de notificaciones')
  await apiClient.post('/auth/me/push-token/', { token, platform: 'WEB' })
  return token
}

// En cada arranque con sesión, si el permiso YA está dado, re-registra el token
// en silencio (los tokens FCM rotan y el upsert los reasigna a la cuenta con
// sesión). Best-effort: nunca lanza.
export async function refreshWebPushIfGranted() {
  try {
    if (pushPermission() !== 'granted') return
    await enableWebPush()
  } catch {
    // best-effort
  }
}

// Push recibida con la pestaña en primer plano (el SW no la muestra ahí).
// Devuelve el unsubscribe.
export function onForegroundPush(callback) {
  try {
    return onMessage(getFirebaseMessaging(), callback)
  } catch {
    return () => {}
  }
}

// Click en una notificación con una pestaña ya abierta: el SW la enfoca y manda
// un postMessage con el data para navegar y marcar leída. Devuelve el unsubscribe.
export function onNotificationClickMessage(callback) {
  if (!('serviceWorker' in navigator)) return () => {}
  const handler = (event) => {
    if (event.data && event.data.type === 'HATOSYNC_NOTIFICATION_CLICK') {
      callback(event.data.data || {})
    }
  }
  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}
