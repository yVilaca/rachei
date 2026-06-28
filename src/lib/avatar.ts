export const AVATAR_PALETTE = [
  { bg: '#FFF0ED', fg: '#FF5436' },
  { bg: '#EDF4FF', fg: '#2563EB' },
  { bg: '#E9F9F0', fg: '#0E8F5C' },
  { bg: '#FFF8EE', fg: '#B57400' },
  { bg: '#F0EDFF', fg: '#7C3AED' },
  { bg: '#FFF0F8', fg: '#DB2777' },
]

export function avatarFor(id: string): { bg: string; fg: string } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}
