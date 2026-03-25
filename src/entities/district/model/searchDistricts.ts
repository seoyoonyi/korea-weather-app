import type { DistrictNode } from '@/entities/district/model/types'

const SEARCH_RESULT_LIMIT = 12

export function searchDistricts(nodes: DistrictNode[], keyword: string) {
  const normalizedKeyword = normalizeKeyword(keyword)

  if (normalizedKeyword.length < 1) {
    return []
  }

  return nodes
    .map((node) => ({
      node,
      score: getSearchScore(node, normalizedKeyword),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (left.node.depth !== right.node.depth) {
        return left.node.depth - right.node.depth
      }

      return left.node.fullName.localeCompare(right.node.fullName, 'ko')
    })
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((item) => item.node)
}

function getSearchScore(node: DistrictNode, normalizedKeyword: string) {
  const normalizedName = normalizeKeyword(node.name)
  const normalizedFullName = normalizeKeyword(node.fullName)

  if (normalizedFullName === normalizedKeyword) {
    return 500
  }

  if (normalizedName === normalizedKeyword) {
    return 400
  }

  if (normalizedFullName.startsWith(normalizedKeyword)) {
    return 300
  }

  if (normalizedName.startsWith(normalizedKeyword)) {
    return 250
  }

  if (normalizedFullName.includes(normalizedKeyword)) {
    return 200
  }

  if (normalizedName.includes(normalizedKeyword)) {
    return 150
  }

  return 0
}

function normalizeKeyword(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}
