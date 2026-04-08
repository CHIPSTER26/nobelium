/**
 * Extract metadata from a Notion page/database raw metadata
 * Compatible with 2025-09-03+ multi-source changes
 */
export default function getMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    console.warn('getMetadata: Invalid rawMetadata provided')
    return {
      locked: false,
      page_full_width: false,
      page_font: 'default',
      page_small_text: false,
      created_time: null,
      last_edited_time: null
    }
  }

  const format = rawMetadata.format || {}

  const metadata = {
    locked: format.block_locked ?? false,
    page_full_width: format.page_full_width ?? false,
    page_font: format.page_font || 'default',
    page_small_text: format.page_small_text ?? false,
    created_time: rawMetadata.created_time || null,
    last_edited_time: rawMetadata.last_edited_time || null,
    
    // Extra useful fields (optional but recommended)
    icon: rawMetadata.format?.page_icon || rawMetadata.icon || null,
    cover: rawMetadata.format?.page_cover || null,
    type: rawMetadata.type || null
  }

  return metadata
}