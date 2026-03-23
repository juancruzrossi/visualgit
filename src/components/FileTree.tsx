import { memo } from 'react'
import { Check, ChevronDown, ChevronRight, FileCode, Folder, FolderOpen } from 'lucide-react'
import type { DiffFile } from '@shared/types'
import { tokens } from '../lib/tokens'

export interface TreeNode {
  name: string
  path: string
  children: TreeNode[]
  fileIndex?: number
  additions?: number
  deletions?: number
}

interface InternalTreeNode {
  name: string
  path: string
  children: Map<string, InternalTreeNode>
  fileIndex?: number
  additions?: number
  deletions?: number
}

interface FileTreeProps {
  files: DiffFile[]
  selectedFile: number
  onSelectFile: (index: number) => void
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  viewedFiles: Set<number>
}

interface TreeItemProps extends Omit<FileTreeProps, 'files'> {
  node: TreeNode
  depth: number
}

export function buildTree(files: DiffFile[]): TreeNode {
  const root: InternalTreeNode = { name: '', path: '', children: new Map() }

  files.forEach((file, fileIndex) => {
    const parts = file.path.split('/')
    let current = root

    parts.forEach((part, partIndex) => {
      const nextPath = current.path ? `${current.path}/${part}` : part

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: nextPath,
          children: new Map(),
        })
      }

      current = current.children.get(part)!

      if (partIndex === parts.length - 1) {
        current.fileIndex = fileIndex
        current.additions = file.additions
        current.deletions = file.deletions
      }
    })
  })

  const toTreeNode = (node: InternalTreeNode): TreeNode => ({
    name: node.name,
    path: node.path,
    fileIndex: node.fileIndex,
    additions: node.additions,
    deletions: node.deletions,
    children: Array.from(node.children.values()).map(toTreeNode),
  })

  return toTreeNode(root)
}

export function collectFolderPaths(node: TreeNode): string[] {
  return node.children.flatMap(child => {
    if (child.children.length === 0) {
      return []
    }

    return [child.path, ...collectFolderPaths(child)]
  })
}

function sortChildren(children: TreeNode[]) {
  return [...children].sort((left, right) => {
    const leftIsFolder = left.children.length > 0
    const rightIsFolder = right.children.length > 0

    if (leftIsFolder !== rightIsFolder) {
      return leftIsFolder ? -1 : 1
    }

    return left.name.localeCompare(right.name)
  })
}

function TreeItemComponent({
  node,
  depth,
  selectedFile,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  viewedFiles,
}: TreeItemProps) {
  const isFile = node.fileIndex !== undefined && node.children.length === 0

  if (isFile) {
    const isSelected = node.fileIndex === selectedFile
    const isViewed = viewedFiles.has(node.fileIndex)

    return (
      <button
        className="flex items-center gap-1.5 py-1 text-left cursor-pointer w-full"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: isSelected ? tokens.background.tertiary : 'transparent',
          border: 'none',
          borderLeft: `2px solid ${isSelected ? tokens.accent.primary : 'transparent'}`,
        }}
        onClick={() => onSelectFile(node.fileIndex)}
        role="treeitem"
        aria-selected={isSelected}
      >
        {isViewed ? (
          <Check size={12} color={tokens.success.primary} className="shrink-0" />
        ) : (
          <FileCode size={12} color={isSelected ? tokens.accent.primary : tokens.text.muted} className="shrink-0" />
        )}
        <span
          className="truncate"
          style={{
            color: isViewed
              ? tokens.text.muted
              : isSelected
                ? tokens.text.primary
                : tokens.text.secondary,
            fontSize: '12px',
          }}
        >
          {node.name}
        </span>
        <span className="ml-auto shrink-0 flex gap-1 pr-2" style={{ fontSize: '11px' }}>
          <span style={{ color: tokens.success.primary }}>+{node.additions}</span>
          <span style={{ color: tokens.danger.primary }}>-{node.deletions}</span>
        </span>
      </button>
    )
  }

  const isOpen = expandedFolders.has(node.path)
  const FolderIcon = isOpen ? FolderOpen : Folder
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <>
      <button
        className="flex items-center gap-1.5 py-1 text-left cursor-pointer w-full"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: 'transparent',
          border: 'none',
        }}
        onClick={() => onToggleFolder(node.path)}
        role="treeitem"
        aria-expanded={isOpen}
      >
        <ChevronIcon size={10} color={tokens.border.muted} className="shrink-0" />
        <FolderIcon size={12} color={tokens.text.muted} className="shrink-0" />
        <span style={{ color: tokens.text.muted, fontSize: '12px' }}>{node.name}</span>
      </button>

      {isOpen && sortChildren(node.children).map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          viewedFiles={viewedFiles}
        />
      ))}
    </>
  )
}

const TreeItem = memo(TreeItemComponent)

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  viewedFiles,
}: FileTreeProps) {
  const tree = buildTree(files)
  const rootChildren = sortChildren(tree.children)

  return (
    <div className="py-1" role="tree" aria-label="Changed files">
      {rootChildren.map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          viewedFiles={viewedFiles}
        />
      ))}
    </div>
  )
}
