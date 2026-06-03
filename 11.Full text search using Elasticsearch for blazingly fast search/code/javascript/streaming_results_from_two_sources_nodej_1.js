import { Client } from '@elastic/elasticsearch'
import { neon }     from '@neondatabase/serverless'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const term = searchParams.get('q')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Fire BOTH queries concurrently — don't await sequentially
      const [pgResult, esResult] = await Promise.allSettled([
        pgSearch(term),
        esSearch(term),
      ])

      controller.enqueue(encoder.encode(JSON.stringify({
        source: 'postgres',
        ...pgResult
      })))
      controller.enqueue(encoder.encode(JSON.stringify({
        source: 'elasticsearch',
        ...esResult
      })))
      controller.close()
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
}
