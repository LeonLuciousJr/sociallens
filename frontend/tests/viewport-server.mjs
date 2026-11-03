// Isolated visual-check server; fixture requests never reach Django.
import { createServer } from 'vite'
const token = `fixture.${Buffer.from(JSON.stringify({ user_id: 'viewer' })).toString('base64url')}.fixture`
const posts = [{ id: 'fixture-text', authorId: 'creator', title: 'A new perspective', body: 'Synthetic content for responsive frontend checks only.', mediaType: 'TEXT', likes: [1], created_at: '2026-11-02T12:00:00Z', caption: '' }, { id: 'fixture-image', authorId: 'creator', title: 'An image perspective', body: 'A sample image post.', mediaType: 'IMAGE', media_url: '/fixture.svg', likes: [], created_at: '2026-11-02T12:00:00Z', caption: 'Synthetic image fixture' }]
const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy: {} }, plugins: [{ name: 'viewport-fixtures', configureServer(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url === '/fixture.svg') { res.setHeader('Content-Type', 'image/svg+xml'); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240"><rect width="600" height="240" fill="#cad6bc"/><circle cx="300" cy="120" r="75" fill="#68856d"/></svg>'); return }
    if (!req.url.startsWith('/api/')) return next()
    res.setHeader('Content-Type', 'application/json')
    if (req.url.startsWith('/api/auth/') && req.method === 'POST') { req.resume(); res.end(JSON.stringify({ access: token, refresh: 'fixture-refresh' })); return }
    if (req.headers.authorization !== `Bearer ${token}`) { res.statusCode = 401; res.end('{}'); return }
    if (req.url.startsWith('/api/posts') && req.method === 'GET') { res.end(JSON.stringify({ count: posts.length, next: null, previous: null, results: posts })); return }
    res.statusCode = 501; res.end(JSON.stringify({ detail: 'Not implemented in visual fixture' }))
  })
} }] })
await server.listen()
console.log('Synthetic frontend viewport preview: http://127.0.0.1:5174')
