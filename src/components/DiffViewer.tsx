import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PanelLeft, PanelLeftClose, ScanSearch } from 'lucide-react'
import type { DiffFile } from '@shared/types'
import { FileHeader } from './FileHeader'
import { FileTree, buildTree, collectFolderPaths } from './FileTree'
import { DiffLine } from './DiffLine'
import { useResizablePanel } from '../hooks/useResizablePanel'
import { useScrollTracking } from '../hooks/useScrollTracking'
import { useTextSelection } from '../hooks/useTextSelection'
import { tokens } from '../lib/tokens'

interface DiffViewerProps {
  files: DiffFile[]
  selectedFile: number
  onSelectFile: (index: number) => void
  onSelectionChange: (text: string | null) => void
  onAnalyzeSelection: () => void
}

export function DiffViewer({
  files,
  selectedFile,
  onSelectFile,
  onSelectionChange,
  onAnalyzeSelection,
}: DiffViewerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set())
  const [viewedFiles, setViewedFiles] = useState<Set<number>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const tree = useMemo(() => buildTree(files), [files])
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const fileRefs = useRef<Array<HTMLDivElement | null>>([])
  const { size: sidebarWidth, startResizing, nudgeSize } = useResizablePanel({
    containerRef: viewerRef,
    initialSize: 240,
    minSize: 150,
    maxSize: 400,
    getNextSize: useCallback((event, rect) => event.clientX - rect.left, []),
  })
  const { selectedText, selectionPosition, clearSelection } = useTextSelection(scrollRef)
  const { scrollToFile } = useScrollTracking({
    scrollRef,
    fileRefs,
    selectedFile,
    onSelectFile,
    syncKey: Array.from(collapsedFiles).sort((left, right) => left - right).join(':'),
  })

  useEffect(() => {
    onSelectionChange(selectedText)
  }, [onSelectionChange, selectedText])

  useEffect(() => {
    setExpandedFolders(new Set(collectFolderPaths(tree)))
  }, [tree])

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const toggleCollapsed = useCallback((index: number) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const toggleViewed = useCallback((index: number) => {
    const willBeViewed = !viewedFiles.has(index)

    setViewedFiles(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

    setCollapsedFiles(prev => {
      const next = new Set(prev)
      if (willBeViewed) next.add(index)
      else next.delete(index)
      return next
    })
  }, [viewedFiles])

  if (files.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{ color: tokens.text.muted, fontSize: '13px' }}
        role="status"
        aria-live="polite"
      >
        No diff available. Are you on a feature branch?
      </div>
    )
  }

  return (
    <div className="flex h-full" ref={viewerRef}>
      {sidebarOpen && (
        <>
          <div className="shrink-0 flex flex-col overflow-y-auto" style={{ width: `${sidebarWidth}px`, background: tokens.background.secondary }}>
            <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: `1px solid ${tokens.border.default}` }}>
              <span style={{ color: tokens.text.muted, fontSize: '12px' }}>Files ({files.length})</span>
              <button className="cursor-pointer" style={{ background: 'transparent', border: 'none' }} onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose size={14} color={tokens.text.muted} />
              </button>
            </div>
            <FileTree files={files} selectedFile={selectedFile} onSelectFile={scrollToFile} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} viewedFiles={viewedFiles} />
          </div>
          <div
            className="w-1 shrink-0 cursor-col-resize hover:opacity-80 transition-opacity"
            style={{ background: tokens.border.default }}
            onMouseDown={startResizing}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') nudgeSize(-10)
              if (event.key === 'ArrowRight') nudgeSize(10)
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize file tree"
            tabIndex={0}
          />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          {!sidebarOpen && (
            <button
              className="h-10 px-3 shrink-0 cursor-pointer flex items-center"
              style={{ background: tokens.background.secondary, border: 'none', borderBottom: `1px solid ${tokens.border.default}`, borderRight: `1px solid ${tokens.border.default}` }}
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft size={14} color={tokens.text.muted} />
            </button>
          )}

          <div className="flex-1 h-10 flex items-center px-4 shrink-0" style={{ background: tokens.background.secondary, borderBottom: `1px solid ${tokens.border.default}` }}>
            <span style={{ color: tokens.text.muted, fontSize: '12px' }}>
              {viewedFiles.size > 0 ? `${viewedFiles.size} / ${files.length} files viewed` : `${files.length} files`}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative" ref={scrollRef}>
          {selectionPosition && selectedText && (
            <button
              className="absolute z-20 flex items-center gap-1 px-2.5 py-1.5 cursor-pointer -translate-x-1/2 -translate-y-full"
              style={{
                left: selectionPosition.x,
                top: selectionPosition.y,
                background: tokens.background.secondary,
                border: `1px solid ${tokens.accent.primary}`,
                borderRadius: '6px',
                boxShadow: tokens.shadow.popup,
              }}
              onMouseDown={event => {
                event.preventDefault()
                onAnalyzeSelection()
                clearSelection()
              }}
            >
              <ScanSearch size={12} color={tokens.accent.primary} />
              <span style={{ color: tokens.accent.primary, fontSize: '11px', whiteSpace: 'nowrap' }}>Analyze Selection</span>
            </button>
          )}

          <div>
            {files.map((file, index) => (
              <div key={file.path} ref={element => { fileRefs.current[index] = element }}>
                <div className="sticky top-0 z-10">
                  <FileHeader
                    path={file.path}
                    additions={file.additions}
                    deletions={file.deletions}
                    collapsed={collapsedFiles.has(index)}
                    onToggle={() => toggleCollapsed(index)}
                    viewed={viewedFiles.has(index)}
                    onToggleViewed={() => toggleViewed(index)}
                  />
                </div>
                {!collapsedFiles.has(index) && (
                  <div className="py-2" style={{ minWidth: 'fit-content' }}>
                    {file.lines.map((line, lineIndex) => (
                      <DiffLine key={`${file.path}-${lineIndex}`} {...line} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
