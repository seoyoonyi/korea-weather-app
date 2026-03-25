import type {
  DistrictLevel,
  DistrictNode,
  DistrictStats,
  DistrictTree,
} from '@/entities/district/model/types'

export function buildDistrictTree(districtPaths: string[]): DistrictTree {
  const roots: DistrictNode[] = []
  const allNodes: DistrictNode[] = []
  const nodesByFullName = new Map<string, DistrictNode>()
  const stats: DistrictStats = {
    totalCount: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    level4Count: 0,
  }

  for (const districtPath of districtPaths) {
    const segments = districtPath.split('-').filter(Boolean)

    segments.forEach((segment, index) => {
      const depth = toDistrictLevel(index + 1)
      const fullName = segments.slice(0, index + 1).join('-')

      if (nodesByFullName.has(fullName)) {
        return
      }

      const node: DistrictNode = {
        name: segment,
        fullName,
        depth,
        children: [],
      }

      nodesByFullName.set(fullName, node)
      allNodes.push(node)
      incrementStats(stats, depth)

      if (index === 0) {
        roots.push(node)
        return
      }

      const parentFullName = segments.slice(0, index).join('-')
      const parentNode = nodesByFullName.get(parentFullName)

      if (parentNode) {
        parentNode.children.push(node)
      }
    })
  }

  return {
    roots,
    allNodes,
    stats,
  }
}

function incrementStats(stats: DistrictStats, depth: DistrictLevel) {
  stats.totalCount += 1

  if (depth === 1) {
    stats.level1Count += 1
    return
  }

  if (depth === 2) {
    stats.level2Count += 1
    return
  }

  if (depth === 3) {
    stats.level3Count += 1
    return
  }

  stats.level4Count += 1
}

function toDistrictLevel(value: number): DistrictLevel {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value
  }

  throw new Error(`지원하지 않는 행정구역 깊이입니다: ${value}`)
}
