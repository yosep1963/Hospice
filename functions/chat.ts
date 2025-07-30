import { Handler } from '@netlify/functions'
import fs from 'fs'
import path from 'path'

const chunksPath = path.resolve(__dirname, '../../emd_law_chunks.json')
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'))

function findRelevantChunks(query: string): string {
  const lowerQuery = query.toLowerCase()
  const results = chunks.filter((c: any) => c.text.toLowerCase().includes(lowerQuery))
  return results.map((c: any) => c.text).slice(0, 3).join('\n\n---\n\n')
}

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  const query = body.query || ''

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query is required' }),
    }
  }

  const response = findRelevantChunks(query)

  return {
    statusCode: 200,
    body: JSON.stringify({ answer: response }),
  }
}

export { handler }