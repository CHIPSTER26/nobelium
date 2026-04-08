/**
 * Filter posts/pages based on publication rules
 * Works with both old and new Notion database structures (2025-09-03+)
 */
export default function filterPublishedPosts({ posts, includePages = false }) {
  if (!posts || !posts.length) return []

  const current = new Date()
  const tomorrow = new Date(current)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const publishedPosts = posts.filter(post => {
    // Basic safety checks
    if (!post || typeof post !== 'object') return false

    // 1. Type filter (Post vs Page)
    const type = post.type?.[0] || post.type  // handle both array and string formats
    const isValidType = includePages
      ? type === 'Post' || type === 'Page'
      : type === 'Post'

    if (!isValidType) return false

    // 2. Required fields
    if (!post.title || !post.slug) return false

    // 3. Status must be "Published"
    const status = post.status?.[0] || post.status
    if (status !== 'Published') return false

    // 4. Date check (published before tomorrow)
    const postDateStr = post.date?.start_date || post.createdTime
    if (!postDateStr) return false

    const postDate = new Date(postDateStr)
    return postDate < tomorrow
  })

  return publishedPosts
}