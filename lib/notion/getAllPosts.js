import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'

import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'

/**
 * Get all posts from Notion database (compatible with 2025-09-03+ multi-source changes)
 */
export async function getAllPosts({ includePages = false }) {
  const pageId = BLOG.notionPageId
  const authToken = BLOG.notionAccessToken || null

  const api = new NotionAPI({ authToken })
  const response = await api.getPage(pageId)

  const uuid = idToUuid(pageId)
  const block = response.block || {}
  const collectionQuery = response.collection_query || {}

  const rawMetadata = block[uuid]?.value

  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.error(`pageId "${uuid}" is not a database`)
    return []
  }

  // === Find data_source_id (new required field after 2025-09-03) ===
  let dataSourceId = null
  let schema = null

  // Try to extract schema from collection
  const collectionRecord = Object.values(response.collection || {})[0]?.value
  schema = collectionRecord?.schema || null

  // Discover dataSourceId from collection_query (most reliable path)
  for (const queryKey in collectionQuery) {
    const queryData = collectionQuery[queryKey]?.value || collectionQuery[queryKey]
    if (queryData?.data_source_id) {
      dataSourceId = queryData.data_source_id
      break
    }
  }

  // Fallback: search inside blocks
  if (!dataSourceId) {
    for (const blockId in block) {
      const b = block[blockId]?.value
      if (b?.data_source_id) {
        dataSourceId = b.data_source_id
        break
      }
    }
  }

  if (!dataSourceId) {
    console.warn('data_source_id not found. Using legacy mode (may break if multiple sources exist)')
  }

  // Get all page IDs
  const pageIds = getAllPageIds(collectionQuery)

  // Fetch properties for each page
  const data = []
  for (const id of pageIds) {
    const properties = await getPageProperties(id, block, schema, dataSourceId)
    if (properties) {
      // Add extra fields
      properties.createdTime = new Date(block[id]?.value?.created_time || 0).toISOString()
      properties.fullWidth = block[id]?.value?.format?.page_full_width ?? false

      data.push(properties)
    }
  }

  // Filter and sort
  let posts = filterPublishedPosts({ posts: data, includePages })

  if (BLOG.sortByDate !== false) {
    posts.sort((a, b) => {
      const dateA = new Date(a?.date?.start_date || a.createdTime || 0)
      const dateB = new Date(b?.date?.start_date || b.createdTime || 0)
      return dateB - dateA
    })
  }

  return posts
}