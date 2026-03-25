export type DistrictLevel = 1 | 2 | 3 | 4

export type DistrictNode = {
  name: string
  fullName: string
  depth: DistrictLevel
  children: DistrictNode[]
}

export type DistrictStats = {
  totalCount: number
  level1Count: number
  level2Count: number
  level3Count: number
  level4Count: number
}

export type DistrictTree = {
  roots: DistrictNode[]
  allNodes: DistrictNode[]
  stats: DistrictStats
}
