const RE = 6371.00877
const GRID = 5
const SLAT1 = 30
const SLAT2 = 60
const OLON = 126
const OLAT = 38
const XO = 43
const YO = 136

const DEGRAD = Math.PI / 180

type KmaGridCoordinates = {
  nx: number
  ny: number
}

export function toKmaGrid(latitude: number, longitude: number): KmaGridCoordinates {
  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const olat = OLAT * DEGRAD

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5)
  ro = (re * sf) / Math.pow(ro, sn)

  let ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5)
  ra = (re * sf) / Math.pow(ra, sn)

  let theta = longitude * DEGRAD - olon

  if (theta > Math.PI) {
    theta -= 2 * Math.PI
  }

  if (theta < -Math.PI) {
    theta += 2 * Math.PI
  }

  theta *= sn

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  }
}
