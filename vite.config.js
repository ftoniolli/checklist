import { readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const worker = (files) => `const CACHE = 'checklist-${files.length}-${files.join('|').length}'
const PRECACHE = ${JSON.stringify(files)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(request, copy))
      return response
    }).catch(() => cached)
    return cached || network
  }).then((response) => {
    if (response) return response
    if (request.mode === 'navigate') return caches.match('./index.html')
    return Response.error()
  }))
})
`

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  plugins: [
    {
      name: 'checklist-service-worker',
      apply: 'build',
      closeBundle() {
        const assets = readdirSync('dist/assets').filter((name) => !name.endsWith('.map'))
        const files = [
          './',
          './index.html',
          './manifest.webmanifest',
          './icons/icon-192.png',
          './icons/icon-512.png',
          ...assets.map((name) => `./assets/${name}`)
        ]
        writeFileSync(path.resolve('dist/sw.js'), worker(files))
      }
    }
  ]
})
