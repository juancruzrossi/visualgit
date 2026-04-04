import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { PanelLeftClose, PanelLeft, ScanSearch } from 'lucide-react'
import { FileHeader } from './FileHeader'
import { DiffLine } from './DiffLine'
import { TreeItem, buildTree, collectAllFolderPaths } from './FileTree'
import { useResizable } from '../hooks/useResizable'
import type { DiffFile } from '../../shared/types'

interface DiffViewerProps {
  files: DiffFile[]
  selectedFile: number
  onSelectFile: (index: number) => void
  onSelectionChange: (text: string | null) => void
  onAnalyzeSelection: () => void
}

export function DiffViewer({ files, selectedFile, onSelectFile, onSelectionChange, onAnalyzeSelection }: DiffViewerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number } | null>(null)
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set())
  const [viewedFiles, setViewedFiles] = useState<Set<number>>(new Set())
  const tree = useMemo(() => buildTree(files), [files])
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const fileRefs = useRef<(HTMLDivElement | null)[]>([])
  const isScrollingTo = useRef(false)

  const { value: sidebarWidth, onDragStart: handleSidebarDragStart } = useResizable({
    containerRef: viewerRef,
    initial: 240,
    min: 150,
    max: 400,
    unit: 'pixel',
  })

  // Text selection detection
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (text && text.length > 3 && scrollRef.current?.contains(sel?.anchorNode ?? null)) {
        onSelectionChange(text)
        const range = sel!.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const containerRect = scrollRef.current!.getBoundingClientRect()
        setSelectionPopup({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
        })
      } else {
        onSelectionChange(null)
        setSelectionPopup(null)
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [onSelectionChange])

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    return collectAllFolderPaths(tree, 0)
  })

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleSelectFile = useCallback((index: number) => {
    onSelectFile(index)
    const el = fileRefs.current[index]
    if (el && scrollRef.current) {
      isScrollingTo.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { isScrollingTo.current = false }, 500)
    }
  }, [onSelectFile])

  // Track which file is visible while scrolling
  const handleScroll = useCallback(() => {
    if (isScrollingTo.current || !scrollRef.current) return
    const container = scrollRef.current
    const scrollTop = container.scrollTop
    for (let i = fileRefs.current.length - 1; i >= 0; i--) {
      const el = fileRefs.current[i]
      if (el && el.offsetTop <= scrollTop + 60) {
        if (i !== selectedFile) onSelectFile(i)
        break
      }
    }
  }, [selectedFile, onSelectFile])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Recalculate visible file when collapse state changes
  useEffect(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollTop = container.scrollTop
    for (let i = fileRefs.current.length - 1; i >= 0; i--) {
      const el = fileRefs.current[i]
      if (el && el.offsetTop <= scrollTop + 60) {
        if (i !== selectedFile) onSelectFile(i)
        break
      }
    }
  }, [collapsedFiles]) // eslint-disable-line react-hooks/exhaustive-deps

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ color: 'var(--vg-text-muted)', fontSize: '13px' }}>
        No diff available. Are you on a feature branch?
      </div>
    )
  }

  const rootChildren = Array.from(tree.children.values())

  return (
    <div className="flex h-full" ref={viewerRef}>
      {sidebarOpen && (
        <>
        <div
          className="shrink-0 flex flex-col overflow-y-auto"
          style={{ width: `${sidebarWidth}px`, background: 'var(--vg-bg-secondary)' }}
        >
          <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--vg-border)' }}>
            <span style={{ color: 'var(--vg-text-muted)', fontSize: '12px' }}>Files ({files.length})</span>
            <button className="cursor-pointer" style={{ background: 'transparent', border: 'none' }} onClick={() => setSidebarOpen(false)}>
              <PanelLeftClose size={14} color="var(--vg-text-muted)" />
            </button>
          </div>
          <div className="py-1">
            {rootChildren.map(child => (
              <TreeItem
                key={child.name}
                node={child}
                depth={0}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                viewedFiles={viewedFiles}
              />
            ))}
          </div>
        </div>
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-[#58A6FF]/40 transition-colors"
          style={{ background: 'var(--vg-border)' }}
          onMouseDown={handleSidebarDragStart}
        />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          {!sidebarOpen && (
            <button
              className="h-10 px-3 shrink-0 cursor-pointer flex items-center"
              style={{ background: 'var(--vg-bg-secondary)', border: 'none', borderBottom: '1px solid var(--vg-border)', borderRight: '1px solid var(--vg-border)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft size={14} color="var(--vg-text-muted)" />
            </button>
          )}
          <div className="flex-1 h-10 flex items-center px-4 shrink-0" style={{ background: 'var(--vg-bg-secondary)', borderBottom: '1px solid var(--vg-border)' }}>
            <span style={{ color: 'var(--vg-text-muted)', fontSize: '12px' }}>
              {viewedFiles.size > 0 ? (
                <>{viewedFiles.size} / {files.length} files viewed</>
              ) : (
                <>{files.length} files</>
              )}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto relative" ref={scrollRef}>
          {selectionPopup && (
            <button
              className="absolute z-20 flex items-center gap-1 px-2.5 py-1.5 cursor-pointer -translate-x-1/2 -translate-y-full"
              style={{
                left: selectionPopup.x,
                top: selectionPopup.y,
                background: 'var(--vg-bg-secondary)',
                border: '1px solid var(--vg-accent)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                onAnalyzeSelection()
                setSelectionPopup(null)
              }}
            >
              <ScanSearch size={12} color="var(--vg-accent)" />
              <span style={{ color: 'var(--vg-accent)', fontSize: '11px', whiteSpace: 'nowrap' }}>Analyze Selection</span>
            </button>
          )}
          <div>
            {files.map((f, i) => (
              <div key={f.path} ref={el => { fileRefs.current[i] = el }}>
                <div className="sticky top-0 z-10">
                  <FileHeader
                    path={f.path}
                    additions={f.additions}
                    deletions={f.deletions}
                    collapsed={collapsedFiles.has(i)}
                    onToggle={() => {
                      setCollapsedFiles(prev => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })
                    }}
                    viewed={viewedFiles.has(i)}
                    onToggleViewed={() => {
                      const willBeViewed = !viewedFiles.has(i)
                      setViewedFiles(prev => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })
                      setCollapsedFiles(prev => {
                        const next = new Set(prev)
                        if (willBeViewed) next.add(i)
                        else next.delete(i)
                        return next
                      })
                    }}
                  />
                </div>
                {!collapsedFiles.has(i) && (
                  <div className="py-2" style={{ minWidth: 'fit-content' }}>
                    {f.lines.map((line, li) => (
                      <DiffLine key={li} type={line.type} lineNumber={line.lineNumber} content={line.content} />
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
