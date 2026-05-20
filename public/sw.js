const pendingTimers = {}

self.addEventListener('message', (event) => {
  const { type, id, endTime, title, body } = event.data

  if (type === 'SCHEDULE_NOTIFICATION') {
    if (pendingTimers[id]) clearTimeout(pendingTimers[id])
    const delay = Math.max(0, endTime - Date.now())
    pendingTimers[id] = setTimeout(() => {
      delete pendingTimers[id]
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        tag: id,
        requireInteraction: false,
      })
    }, delay)
  }

  if (type === 'CANCEL_NOTIFICATION') {
    if (pendingTimers[id]) {
      clearTimeout(pendingTimers[id])
      delete pendingTimers[id]
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    }),
  )
})
