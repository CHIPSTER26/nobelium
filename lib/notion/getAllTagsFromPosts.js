/**
 * Extract all tags from posts and count their frequency
 * Works reliably with both old and new Notion multi-source structure
 */
export function getAllTagsFromPosts(posts) {
  if (!posts || !posts.length) {
    return {}
  }

  const tagObj = {}

  posts.forEach(post => {
    // Handle different possible formats of the 'tags' property:
    // - Array of strings (most common after getPageProperties)
    // - Array of arrays (raw Notion format)
    // - Single string (edge case)
    let tags = post?.tags

    if (!tags) return

    // Normalize tags to a flat array of strings
    if (Array.isArray(tags)) {
      if (tags.length > 0 && Array.isArray(tags[0])) {
        // Rare case: raw Notion multi_select format [[tag1], [tag2]]
        tags = tags.flat()
      }
    } else if (typeof tags === 'string') {
      // If somehow it's a comma-separated string
      tags = tags.split(',').map(t => t.trim())
    } else {
      return // invalid format
    }

    // Count each tag
    tags.forEach(tag => {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        const cleanTag = tag.trim()
        tagObj