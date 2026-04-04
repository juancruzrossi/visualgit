// Design tokens — canonical color values matching CSS custom properties in index.css
// Use CSS var(--vg-*) in components; this file is for JS-only contexts.
export const tokens = {
  bg: '#0D1117',
  bgSecondary: '#161B22',
  bgTertiary: '#1C2128',
  border: '#30363D',
  text: '#E6EDF3',
  textBold: '#F0F6FC',
  textMuted: '#9DA5AE',
  textDim: '#484F58',
  accent: '#58A6FF',
  accentLight: '#79C0FF',
  purple: '#D2A8FF',
  green: '#3FB950',
  greenBright: '#7EE787',
  greenBg: '#122117',
  red: '#F47067',
  redBright: '#FFA198',
  redBg: '#2A1516',
} as const

export const fontSizes = {
  repoName: '14px',
  branchName: '13px',
  code: '12px',
  statusSmall: '11px',
} as const
