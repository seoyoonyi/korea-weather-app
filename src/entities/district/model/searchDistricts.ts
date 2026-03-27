import type { DistrictNode } from '@/entities/district/model/types'

const SEARCH_RESULT_LIMIT = 12
const DISTRICT_KEYWORD_ALIASES: Record<string, string[]> = {
  서울시: ['서울특별시'],
  부산시: ['부산광역시'],
  대구시: ['대구광역시'],
  인천시: ['인천광역시'],
  대전시: ['대전광역시'],
  울산시: ['울산광역시'],
  세종시: ['세종특별자치시'],
  충남: ['충청남도'],
  충북: ['충청북도'],
  전남: ['전라남도'],
  전북: ['전북특별자치도'],
  경남: ['경상남도'],
  경북: ['경상북도'],
  강원도: ['강원특별자치도'],
  제주도: ['제주특별자치도'],
}

export function searchDistricts(nodes: DistrictNode[], keyword: string) {
  const normalizedKeyword = normalizeKeyword(keyword)
  const keywordParts = getKeywordParts(keyword)

  if (normalizedKeyword.length < 1) {
    return []
  }

  return nodes
    .map((node) => ({
      node,
      score: getSearchScore(node, normalizedKeyword, keywordParts),
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

function getSearchScore(
  node: DistrictNode,
  normalizedKeyword: string,
  keywordParts: string[],
) {
  const normalizedName = normalizeKeyword(node.name)
  const normalizedFullName = normalizeKeyword(node.fullName)
  const nameParts = getKeywordParts(node.name)
  const fullNameParts = getKeywordParts(node.fullName)
  const keywordVariants = getKeywordVariants(normalizedKeyword)
  const keywordPartVariants = keywordParts.map((keywordPart) => getKeywordVariants(keywordPart))
  let score = 0

  if (matchesExact(normalizedFullName, keywordVariants)) {
    score = Math.max(score, 700)
  }

  if (matchesExact(normalizedName, keywordVariants)) {
    score = Math.max(score, 650)
  }

  if (matchesStartsWith(normalizedFullName, keywordVariants)) {
    score = Math.max(score, 500)
  }

  if (matchesStartsWith(normalizedName, keywordVariants)) {
    score = Math.max(score, 450)
  }

  if (matchesIncludes(normalizedFullName, keywordVariants)) {
    score = Math.max(score, 400)
  }

  if (matchesIncludes(normalizedName, keywordVariants)) {
    score = Math.max(score, 350)
  }

  if (keywordParts.length > 1) {
    if (hasAllKeywordParts(keywordPartVariants, fullNameParts)) {
      score = Math.max(score, 320 + keywordParts.length * 10)
    }

    if (hasAllKeywordParts(keywordPartVariants, nameParts)) {
      score = Math.max(score, 280 + keywordParts.length * 10)
    }

    if (includesAllKeywordParts(normalizedFullName, keywordPartVariants)) {
      score = Math.max(score, 260 + keywordParts.length * 10)
    }

    if (includesAllKeywordParts(normalizedName, keywordPartVariants)) {
      score = Math.max(score, 220 + keywordParts.length * 10)
    }
  }

  return score
}

function normalizeKeyword(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}

function getKeywordParts(value: string) {
  return value
    .split(/[\s-]+/)
    .map((part) => normalizeKeyword(part))
    .filter((part) => part.length > 0)
}

function getKeywordVariants(keyword: string) {
  const aliasKeywords = DISTRICT_KEYWORD_ALIASES[keyword] ?? []
  return Array.from(new Set([keyword, ...aliasKeywords.map((aliasKeyword) => normalizeKeyword(aliasKeyword))]))
}

function matchesExact(target: string, keywordVariants: string[]) {
  return keywordVariants.some((keywordVariant) => target === keywordVariant)
}

function matchesStartsWith(target: string, keywordVariants: string[]) {
  return keywordVariants.some((keywordVariant) => target.startsWith(keywordVariant))
}

function matchesIncludes(target: string, keywordVariants: string[]) {
  return keywordVariants.some((keywordVariant) => target.includes(keywordVariant))
}

function hasAllKeywordParts(keywordPartVariants: string[][], targetParts: string[]) {
  return keywordPartVariants.every((keywordVariants) =>
    targetParts.some((targetPart) =>
      keywordVariants.some((keywordVariant) => targetPart.includes(keywordVariant)),
    ),
  )
}

function includesAllKeywordParts(target: string, keywordPartVariants: string[][]) {
  return keywordPartVariants.every((keywordVariants) =>
    keywordVariants.some((keywordVariant) => target.includes(keywordVariant)),
  )
}
