import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, Check } from 'lucide-react'
import type { DiffFile } from '../../shared/types'

export interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  fileIndex?: number
  additions?: number
  deletions?: number
}

export function buildTree(files: DiffFile[]): TreeNode {
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

export function collectAllFolderPaths(node: TreeNode, depth: number): Set<string> {
  const set = new Set<string>()
  if (node.children.size > 0 && node.name) {
    set.add(`${depth}-${node.name}`)
  }
  node.children.forEach(child => {
    for (const path of collectAllFolderPaths(child, depth + 1)) {
      set.add(path)
    }
  })
  return set
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  selectedFile: number
  onSelectFile: (i: number) => void
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
  viewedFiles: Set<number>
}

export function TreeItem({ node, depth, selectedFile, onSelectFile, expandedFolders, toggleFolder, viewedFiles }: TreeItemProps) {
  const isFile = node.fileIndex !== undefined
  const isSelected = isFile && node.fileIndex === selectedFile
  const isViewed = isFile && viewedFiles.has(node.fileIndex!)
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
          background: isSelected ? 'var(--vg-bg-tertiary)' : 'transparent',
          border: 'none',
          borderLeft: isSelected ? '2px solid var(--vg-accent)' : '2px solid transparent',
        }}
        onClick={() => onSelectFile(node.fileIndex!)}
      >
        {isViewed ? (
          <Check size={12} color="var(--vg-green)" className="shrink-0" />
        ) : (
          <FileCode size={12} color={isSelected ? 'var(--vg-accent)' : 'var(--vg-text-muted)'} className="shrink-0" />
        )}
        <span className="truncate" style={{ color: isViewed ? 'var(--vg-text-muted)' : isSelected ? 'var(--vg-text)' : '#C9D1D9', fontSize: '12px' }}>
          {node.name}
        </span>
        <span className="ml-auto shrink-0 flex gap-1 pr-2" style={{ fontSize: '11px' }}>
          <span style={{ color: 'var(--vg-green)' }}>+{node.additions}</span>
          <span style={{ color: 'var(--vg-red)' }}>-{node.deletions}</span>
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
        <ChevronIcon size={10} color="var(--vg-text-dim)" className="shrink-0" />
        <FolderIcon size={12} color="var(--vg-text-muted)" className="shrink-0" />
        <span style={{ color: 'var(--vg-text-muted)', fontSize: '12px' }}>{node.name}</span>
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
          viewedFiles={viewedFiles}
        />
      ))}
    </>
  )
}
