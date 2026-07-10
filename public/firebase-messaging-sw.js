/* eslint-disable no-undef */
/**
 * Service worker de Firebase Cloud Messaging (push web).
 *
 * NO se registra a mano: el SDK de Firebase lo registra automáticamente bajo su
 * propio scope (/firebase-cloud-messaging-push-scope) al pedir el token, así que
 * no pisa el service worker del PWA (Workbox, service-worker.js).
 *
 * Los mensajes del backend traen `notification` (título/cuerpo): con la pestaña
 * en background el SDK los muestra solo — aquí solo se maneja el CLICK
 * (deep link a la ficha del animal + marcar leída vía event_id).
 */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyA8j9AF478XvQRi2VUpLbevj_xYRx8MAgA',
  authDomain: 'hatosync.firebaseapp.com',
  projectId: 'hatosync',
  storageBucket: 'hatosync.firebasestorage.app',
  messagingSenderId: '983879422462',
  appId: '1:983879422462:web:d939b85e30771701cf70af',
})

const messaging = firebase.messaging()

// Solo cubre mensajes de DATOS puros (los de notificación ya los muestra el SDK;
// volver a mostrarlos aquí duplicaría la notificación).
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return
  const data = payload.data || {}
  self.registration.showNotification(data.title || 'HatoSync', { body: data.body || '', data })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // En las notificaciones auto-mostradas por el SDK, el payload viaja en FCM_MSG.
  const raw = event.notification.data || {}
  const data = (raw.FCM_MSG && raw.FCM_MSG.data) || raw

  let url = '/livestock/animals'
  if (data.screen === 'AnimalDetail' && data.animal_id) {
    url = `/livestock/animals/${data.animal_id}`
  }
  // El app marca la notificación como leída al abrirse (query consumida en la campanita).
  if (data.event_id) url += `?notif_event=${data.event_id}`

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Pestaña ya abierta: enfocarla y delegarle la navegación + marcar leída.
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({ type: 'HATOSYNC_NOTIFICATION_CLICK', data })
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
