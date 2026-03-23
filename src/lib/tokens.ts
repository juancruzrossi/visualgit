export const tokens = {
  background: {
    primary: '#0D1117',
    secondary: '#161B22',
    tertiary: '#1C2128',
  },
  border: {
    default: '#30363D',
    muted: '#484F58',
  },
  text: {
    primary: '#E6EDF3',
    secondary: '#C9D1D9',
    muted: '#9DA5AE',
    dim: '#484F58',
    strong: '#F0F6FC',
    accent: '#79C0FF',
    emphasis: '#D2A8FF',
  },
  accent: {
    primary: '#58A6FF',
    overlay: 'rgba(88,166,255,0.1)',
    hover: 'rgba(88,166,255,0.4)',
  },
  success: {
    primary: '#3FB950',
    strong: '#2EA043',
    soft: '#7EE787',
  },
  danger: {
    primary: '#F47067',
    strong: '#F85149',
    soft: '#FFA198',
  },
  diff: {
    context: {
      bg: 'transparent',
      text: '#9DA5AE',
      line: '#484F58',
    },
    addition: {
      bg: '#122117',
      text: '#7EE787',
      line: '#3FB950',
    },
    deletion: {
      bg: '#2A1516',
      text: '#FFA198',
      line: '#F47067',
    },
  },
  shadow: {
    popup: '0 4px 12px rgba(0,0,0,0.4)',
  },
} as const

export const fontSizes = {
  repoName: '14px',
  branchName: '13px',
  code: '12px',
  statusSmall: '11px',
  body: '14px',
} as const
