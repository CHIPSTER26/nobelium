import { idToUuid } from 'notion-utils'

/**
 * Get all page IDs from a Notion database (updated for multi-source databases 2025-09-03+)
 *
 * @param {object} collectionQuery - The collection_query object from api.getPage()
 * @param {string|null} viewId - Optional specific view ID (rarely used in most blogs)
 * @returns {string[]} Array of page IDs
 */
export default function getAllPageIds(collectionQuery, viewId = null) {
  if (!collectionQuery || typeof collectionQuery !== 'object') {
    console.warn('collectionQuery is empty or invalid')
    return []
  }

  const pageSet = new Set()

  // The structure of collection_query can vary slightly after the multi-source update
  // We try multiple common paths to collect blockIds reliably

  Object.values(collectionQuery).forEach(queryItem => {
    // Most common path in older + newer responses
    if (queryItem?.value?.blockIds) {
      queryItem.value.blockIds.forEach(id => pageSet.add(id))
    }

    // Alternative path used in some collection_query structures
    if (queryItem?.blockIds) {
      queryItem.blockIds.forEach(id => pageSet.add(id))
    }

    // Path for grouped results (used when there are filters/groups)
    if (queryItem?.collection_group_results?.blockIds) {
      queryItem.collection_group_results.blockIds.forEach(id => pageSet.add(id))
    }

    // Handle multiple views / data sources (newer behavior)
    if (queryItem?.value?.collection_group_results?.blockIds) {
      queryItem.value.collection_group_results.blockIds.forEach(id => pageSet.add(id))
    }
  })

  // If a specific viewId is provided, try to filter to that view only
  if (viewId) {
    const vId = idToUuid(viewId)
    const viewData = Object.values(collectionQuery).find(item => 
      item?.value?.id === vId || item?.id === vId
    )

    if (viewData?.value?.blockIds) {
      return viewData.value.blockIds
    }
    if (viewData?.blockIds) {
      return viewData.blockIds
    }
  }

  return [...pageSet]
}