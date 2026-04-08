import { getTextContent, getDateValue } from 'notion-utils'

/**
 * Get page properties (updated for Notion 2025-09-03+ multi-source databases)
 *
 * @param {string} id - Page ID
 * @param {object} block - Full block recordMap from api.getPage()
 * @param {object|null} schema - Collection schema (may be partial or missing)
 * @param {string|null} dataSourceId - New data_source_id (for future use / relations)
 */
async function getPageProperties(id, block, schema = null, dataSourceId = null) {
  const pageBlock = block?.[id]?.value
  if (!pageBlock || pageBlock.type !== 'page') {
    console.warn(`Block ${id} is not a valid page`)
    return null
  }

  const rawProperties = Object.entries(pageBlock.properties || {})
  const excludeProperties = ['date', 'select', 'multi_select', 'person']
  const properties = {}

  // Set basic ID once
  properties.id = id

  for (const [key, val] of rawProperties) {
    const propSchema = schema?.[key]

    if (!propSchema) {
      // Fallback when schema is missing (common with multi-source)
      properties[key] = getTextContent(val)
      continue
    }

    const propName = propSchema.name
    const propType = propSchema.type

    if (!excludeProperties.includes(propType)) {
      // Default text-based properties
      properties[propName] = getTextContent(val)
    } else {
      switch (propType) {
        case 'date': {
          const dateProperty = getDateValue(val)
          if (dateProperty) {
            delete dateProperty.type // clean up
            properties[propName] = dateProperty
          }
          break
        }

        case 'select':
        case 'multi_select': {
          const text = getTextContent(val)
          if (text && text.length > 0) {
            // Split by comma and trim
            properties[propName] = text.split(',').map(item => item.trim()).filter(Boolean)
          } else {
            properties[propName] = propType === 'select' ? null : []
          }
          break
        }

        case 'person': {
          const rawUsers = val.flat()
          const users = []

          for (const userItem of rawUsers) {
            if (userItem?.[0]?.[1]) {  // has user info
              // Note: getUsers() may become less reliable or change in future
              // For now we keep your logic (you can optimize later)
              const userId = userItem[0]
              try {
                // This part still uses notion-client — it may need review later
                const res = await new NotionAPI({ authToken: undefined }).getUsers(userId) // remove if you don't need authors
                const resValue = res?.recordMapWithRoles?.notion_user?.[userId[1]]?.value

                if (resValue) {
                  users.push({
                    id: resValue.id,
                    first_name: resValue.given_name,
                    last_name: resValue.family_name,
                    profile_photo: resValue.profile_photo
                  })
                }
              } catch (err) {
                console.warn(`Failed to fetch user ${userId}`, err)
              }
            }
          }
          properties[propName] = users
          break
        }

        default:
          // Fallback for any other excluded type
          properties[propName] = getTextContent(val)
          break
      }
    }
  }

  // Add useful metadata
  properties.createdTime = pageBlock.created_time
  properties.lastEditedTime = pageBlock.last_edited_time
  properties.icon = pageBlock.format?.page_icon || null
  properties.cover = pageBlock.format?.page_cover || null

  // dataSourceId is available here if you need it later (e.g. for relations)

  return properties
}

export { getPageProperties as default }