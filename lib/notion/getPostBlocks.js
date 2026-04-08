import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'

/**
 * Get full block data for a single post/page
 * Updated for 2025-09-03+ multi-source database compatibility
 */
export async function getPostBlocks(id) {
  if (!id) {
    console.error('getPostBlocks: No ID provided')
    return null
  }

  const authToken = BLOG.notionAccessToken || null
  const api = new NotionAPI({ authToken })

  try {
    const pageBlock = await api.getPage(id)

    // Optional: Add dataSourceId discovery for future use (e.g. relations inside the post)
    const uuid = idToUuid(id)
    const block = pageBlock.block || {}
    const collectionQuery = pageBlock.collection_query || {}

    let dataSourceId = null

    // Try to find data_source_id (useful if this post contains relations to the database)
    for (const queryKey in collectionQuery) {
      const queryData = collectionQuery[queryKey]?.value || collectionQuery[queryKey]
      if (queryData?.data_source_id) {
        dataSourceId = queryData.data_source_id
        break
      }
    }

    if (!dataSourceId) {
      for (const blockId in block) {
        const b = block[blockId]?.value
        if (b?.data_source_id) {
          dataSourceId = b.data_source_id
          break
        }
      }
    }

    // Attach dataSourceId to the response for easier access in components if needed
    if (dataSourceId) {
      pageBlock.dataSourceId = dataSourceId
    }

    return pageBlock
  } catch (error) {
    console.error(`Failed to fetch blocks for post ${id}:`, error)
    return null
  }
}
