import type { Handler } from '@netlify/functions'

// JSONBlob API - free JSON storage
const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob'

// In-memory cache as fallback
const memoryCache = new Map<string, { data: unknown, timestamp: number }>()

// Registry of all sync sessions (stored in a known blob)
const REGISTRY_KEY = process.env.SYNC_REGISTRY_KEY || 'sync-registry'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

// Get or create the registry
async function getRegistry(): Promise<{ keys: string[], settings: Record<string, unknown> }> {
  try {
    // Try to fetch existing registry
    if (process.env.SYNC_REGISTRY_BLOB_ID) {
      const response = await fetch(`${JSONBLOB_API}/${process.env.SYNC_REGISTRY_BLOB_ID}`)
      if (response.ok) {
        return await response.json()
      }
    }
  } catch (e) {
    console.log('Registry not found, will create new one')
  }
  
  return { keys: [], settings: {} }
}

// Update registry with new key
async function updateRegistry(key: string, settings?: Record<string, unknown>): Promise<void> {
  try {
    const registry = await getRegistry()
    
    if (!registry.keys.includes(key)) {
      registry.keys.push(key)
    }
    
    if (settings) {
      registry.settings[key] = settings
    }
    
    // Save registry
    if (process.env.SYNC_REGISTRY_BLOB_ID) {
      await fetch(`${JSONBLOB_API}/${process.env.SYNC_REGISTRY_BLOB_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registry)
      })
    }
  } catch (e) {
    console.error('Failed to update registry:', e)
  }
}

export const handler: Handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const id = event.queryStringParameters?.id
  const action = event.queryStringParameters?.action

  try {
    // List all sync keys (for scheduled function)
    if (event.httpMethod === 'GET' && action === 'list') {
      const registry = await getRegistry()
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, keys: registry.keys })
      }
    }

    // Create new sync session
    if (event.httpMethod === 'POST') {
      const body = event.body || '{}'
      let parsedBody
      try {
        parsedBody = JSON.parse(body)
      } catch {
        parsedBody = { tasks: [], updatedAt: Date.now() }
      }
      
      // Try JSONBlob first
      try {
        const response = await fetch(JSONBLOB_API, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(parsedBody)
        })
        
        if (response.ok) {
          const location = response.headers.get('Location') || ''
          const key = location.split('/').pop() || ''
          
          if (key) {
            // Register this sync session for scheduled notifications
            if (parsedBody.settings?.webhookUrl || parsedBody.settings?.telegramWebhookUrl) {
              await updateRegistry(key, parsedBody.settings)
            }
            
            console.log('Created JSONBlob with key:', key)
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                success: true, 
                key,
                storage: 'jsonblob'
              })
            }
          }
        }
      } catch (err) {
        console.log('JSONBlob failed, using memory cache:', err)
      }
      
      // Fallback to memory cache
      const fallbackKey = generateKey()
      memoryCache.set(fallbackKey, { 
        data: parsedBody, 
        timestamp: Date.now() 
      })
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          key: fallbackKey,
          storage: 'memory',
          warning: 'Using temporary storage - data may not persist'
        })
      }
    }

    // Get sync data
    if (event.httpMethod === 'GET' && id) {
      // Try JSONBlob first
      try {
        const response = await fetch(`${JSONBLOB_API}/${id}`, {
          headers: { 'Accept': 'application/json' }
        })
        
        if (response.ok) {
          const data = await response.json()
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              data,
              storage: 'jsonblob'
            })
          }
        }
      } catch (err) {
        console.log('JSONBlob get failed, checking memory cache')
      }
      
      // Check memory cache
      const cached = memoryCache.get(id)
      if (cached) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            data: cached.data,
            storage: 'memory'
          })
        }
      }
      
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Not found' })
      }
    }

    // Update sync data
    if (event.httpMethod === 'PUT' && id) {
      const body = event.body || '{}'
      let parsedBody
      try {
        parsedBody = JSON.parse(body)
      } catch {
        parsedBody = { tasks: [], updatedAt: Date.now() }
      }
      
      // Try JSONBlob first
      try {
        const response = await fetch(`${JSONBLOB_API}/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(parsedBody)
        })
        
        if (response.ok) {
          // Update registry if settings changed
          if (parsedBody.settings?.webhookUrl || parsedBody.settings?.telegramWebhookUrl) {
            await updateRegistry(id, parsedBody.settings)
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              key: id,
              storage: 'jsonblob'
            })
          }
        }
      } catch (err) {
        console.log('JSONBlob put failed, updating memory cache')
      }
      
      // Update memory cache
      memoryCache.set(id, { 
        data: parsedBody, 
        timestamp: Date.now() 
      })
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          key: id,
          storage: 'memory'
        })
      }
    }

    // Delete/unregister sync session
    if (event.httpMethod === 'DELETE' && id) {
      try {
        // Remove from registry
        const registry = await getRegistry()
        registry.keys = registry.keys.filter(k => k !== id)
        delete registry.settings[id]
        
        if (process.env.SYNC_REGISTRY_BLOB_ID) {
          await fetch(`${JSONBLOB_API}/${process.env.SYNC_REGISTRY_BLOB_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registry)
          })
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      } catch (e) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: 'Failed to unregister' })
        }
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid request' })
    }
  } catch (error) {
    console.error('Sync function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Server error' 
      })
    }
  }
}

function generateKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
