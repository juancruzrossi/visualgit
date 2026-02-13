import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft, ScanSearch } from 'lucide-react'
import { FileHeader } from './FileHeader'
import { DiffLine } from './DiffLine'

interface DiffLineData {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

interface DiffFileData {
  path: string
  additions: number
  deletions: number
  lines: DiffLineData[]
}

interface DiffViewerProps {
  files: DiffFileData[]
  selectedFile: number
  onSelectFile: (index: number) => void
  onSelectionChange: (text: string | null) => void
  onAnalyzeSelection: () => void
}

interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  fileIndex?: number
  additions?: number
  deletions?: number
}

function buildTree(files: DiffFileData[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map() }
  files.forEach((f, i) => {
    const parts = f.path.split('/')
    let current = root
    parts.forEach((part, pi) => {
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map() })
      }
      current = current.children.get(part)!
      if (pi === parts.length - 1) {
        current.fileIndex = i
        current.additions = f.additions
        current.deletions = f.deletions
      }
    })
  })
  return root
}

function TreeItem({ node, depth, selectedFile, onSelectFile, expandedFolders, toggleFolder }: {
  node: TreeNode
  depth: number
  selectedFile: number
  onSelectFile: (i: number) => void
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
}) {
  const isFile = node.fileIndex !== undefined
  const isSelected = isFile && node.fileIndex === selectedFile
  const children = Array.from(node.children.values())
  const folders = children.filter(c => c.fileIndex === undefined || c.children.size > 0)
  const fileNodes = children.filter(c => c.fileIndex !== undefined && c.children.size === 0)
  const sorted = [...folders, ...fileNodes]

  if (isFile && node.children.size === 0) {
    return (
      <button
        className="flex items-center gap-1.5 py-1 text-left cursor-pointer w-full"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: isSelected ? '#1C2128' : 'transparent',
          border: 'none',
          borderLeft: isSelected ? '2px solid #58A6FF' : '2px solid transparent',
        }}
        onClick={() => onSelectFile(node.fileIndex!)}
      >
        <FileCode size={12} color={isSelected ? '#58A6FF' : '#8B949E'} className="shrink-0" />
        <span className="truncate" style={{ color: isSelected ? '#E6EDF3' : '#C9D1D9', fontSize: '12px' }}>
          {node.name}
        </span>
        <span className="ml-auto shrink-0 flex gap-1 pr-2" style={{ fontSize: '11px' }}>
          <span style={{ color: '#3FB950' }}>+{node.additions}</span>
          <span style={{ color: '#F47067' }}>-{node.deletions}</span>
        </span>
      </button>
    )
  }

  const folderPath = `${depth}-${node.name}`
  const isOpen = expandedFolders.has(folderPath)
  const FolderIcon = isOpen ? FolderOpen : Folder
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <>
      <button
        className="flex items-center gap-1.5 py-1 text-left cursor-pointer w-full"
        style={{ paddingLeft: `${depth * 12 + 8}px`, background: 'transparent', border: 'none' }}
        onClick={() => toggleFolder(folderPath)}
      >
        <ChevronIcon size={10} color="#484F58" className="shrink-0" />
        <FolderIcon size={12} color="#8B949E" className="shrink-0" />
        <span style={{ color: '#8B949E', fontSize: '12px' }}>{node.name}</span>
      </button>
      {isOpen && sorted.map(child => (
        <TreeItem
          key={child.name}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />
      ))}
    </>
  )
}

export function DiffViewer({ files, selectedFile, onSelectFile, onSelectionChange, onAnalyzeSelection }: DiffViewerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number } | null>(null)
  const tree = useMemo(() => buildTree(files), [files])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRefs = useRef<(HTMLDivElement | null)[]>([])
  const isScrollingTo = useRef(false)

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
    const set = new Set<string>()
    function walk(node: TreeNode, depth: number) {
      if (node.children.size > 0 && node.name) {
        set.add(`${depth}-${node.name}`)
      }
      node.children.forEach(child => walk(child, depth + 1))
    }
    walk(tree, 0)
    return set
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

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ color: '#8B949E', fontSize: '13px' }}>
        No diff available. Are you on a feature branch?
      </div>
    )
  }

  const rootChildren = Array.from(tree.children.values())

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <div
          className="w-60 shrink-0 flex flex-col overflow-y-auto"
          style={{ background: '#161B22', borderRight: '1px solid #30363D' }}
        >
          <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid #30363D' }}>
            <span style={{ color: '#8B949E', fontSize: '12px' }}>Files ({files.length})</span>
            <button className="cursor-pointer" style={{ background: 'transparent', border: 'none' }} onClick={() => setSidebarOpen(false)}>
              <PanelLeftClose size={14} color="#8B949E" />
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
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          {!sidebarOpen && (
            <button
              className="h-10 px-3 shrink-0 cursor-pointer flex items-center"
              style={{ background: '#161B22', border: 'none', borderBottom: '1px solid #30363D', borderRight: '1px solid #30363D' }}
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft size={14} color="#8B949E" />
            </button>
          )}
          <div className="flex-1 h-10 flex items-center px-4 shrink-0" style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}>
            <span style={{ color: '#8B949E', fontSize: '12px' }}>
              {selectedFile + 1} / {files.length} files
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
                background: '#161B22',
                border: '1px solid #58A6FF',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                onAnalyzeSelection()
                setSelectionPopup(null)
              }}
            >
              <ScanSearch size={12} color="#58A6FF" />
              <span style={{ color: '#58A6FF', fontSize: '11px', whiteSpace: 'nowrap' }}>Analyze Selection</span>
            </button>
          )}
          <div style={{ minWidth: 'fit-content' }}>
            {files.map((f, i) => (
              <div key={f.path} ref={el => { fileRefs.current[i] = el }}>
                <div className="sticky top-0 z-10">
                  <FileHeader path={f.path} additions={f.additions} deletions={f.deletions} />
                </div>
                <div className="py-2">
                  {f.lines.map((line, li) => (
                    <DiffLine key={li} type={line.type} lineNumber={line.lineNumber} content={line.content} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
