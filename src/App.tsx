export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0D1117' }}>
      {/* Header */}
      <div
        className="h-12 shrink-0 flex items-center px-6"
        style={{ borderBottom: '1px solid #30363D', color: '#8B949E', fontSize: '13px' }}
      >
        Header
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-[65]" style={{ borderRight: '1px solid #30363D', color: '#8B949E', fontSize: '13px', padding: '16px' }}>
          Diff Viewer
        </div>
        <div className="flex-[35]" style={{ color: '#8B949E', fontSize: '13px', padding: '16px' }}>
          AI Panel
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="h-8 shrink-0 flex items-center px-6"
        style={{ background: '#161B22', borderTop: '1px solid #30363D', color: '#484F58', fontSize: '12px' }}
      >
        Status Bar
      </div>
    </div>
  )
}
