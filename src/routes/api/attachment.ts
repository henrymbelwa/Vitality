import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'
import { createFileRoute } from '@tanstack/react-router'

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
const store = getStore({ name: 'future-health-attachments', consistency: 'strong' })

export const Route = createFileRoute('/api/attachment')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser()
        if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })
        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) return Response.json({ error: 'Choose a file to upload' }, { status: 400 })
        if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: 'Use a PDF, PNG, JPG, or text file under 10 MB' }, { status: 400 })
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)
        const key = `${user.id}/${crypto.randomUUID()}-${safeName}`
        await store.set(key, await file.arrayBuffer(), { metadata: { owner: user.id, filename: safeName, contentType: file.type } })
        return Response.json({ key, filename: safeName })
      },
      GET: async ({ request }) => {
        const user = await getUser()
        if (!user) return new Response('Authentication required', { status: 401 })
        const key = new URL(request.url).searchParams.get('key') ?? ''
        if (!key.startsWith(`${user.id}/`)) return new Response('Not found', { status: 404 })
        const metadata = await store.getMetadata(key)
        const value = await store.get(key, { type: 'arrayBuffer' })
        const details = metadata?.metadata as Record<string, string> | undefined
        if (!value || details?.owner !== user.id) return new Response('Not found', { status: 404 })
        return new Response(value, { headers: { 'Content-Type': details.contentType || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${details.filename || 'attachment'}"`, 'Cache-Control': 'private, no-store' } })
      },
    },
  },
})
