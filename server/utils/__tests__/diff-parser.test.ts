import { describe, it, expect } from 'vitest'
import { parseDiff } from '../diff-parser.js'

// ─── Basic cases ────────────────────────────────────────────

describe('parseDiff — basic', () => {
  it('parses a simple addition', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
 line1
 line2
+added
 line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('file.ts')
    expect(files[0].additions).toBe(1)
    expect(files[0].deletions).toBe(0)
    expect(files[0].lines).toHaveLength(4)
  })

  it('parses a simple deletion', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,4 +1,3 @@
 line1
-removed
 line2
 line3
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(0)
    expect(files[0].deletions).toBe(1)
  })

  it('parses additions and deletions together', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
 line1
-old
+new
 line3
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    expect(files[0].deletions).toBe(1)
  })

  it('parses multiple files', () => {
    const raw = `diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
diff --git a/b.ts b/b.ts
--- a/b.ts
+++ b/b.ts
@@ -1,2 +1,2 @@
 line1
-old
+new
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(2)
    expect(files[0].path).toBe('a.ts')
    expect(files[1].path).toBe('b.ts')
  })

  it('returns empty array for empty input', () => {
    expect(parseDiff('')).toEqual([])
  })

  it('returns empty array for non-diff input', () => {
    expect(parseDiff('random text\nwithout diff headers')).toEqual([])
  })
})

// ─── Multi-hunk ─────────────────────────────────────────────

describe('parseDiff — multi-hunk', () => {
  it('parses multiple hunks in a single file', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
 line1
+inserted
 line2
 line3
@@ -10,3 +11,4 @@
 line10
+another
 line11
 line12
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(2)

    // Verify line numbers reset correctly at second hunk
    const secondHunkLines = files[0].lines.filter(
      l => l.newLineNumber && l.newLineNumber >= 11
    )
    expect(secondHunkLines.length).toBeGreaterThan(0)
  })
})

// ─── Line numbers ───────────────────────────────────────────

describe('parseDiff — line numbers', () => {
  it('tracks old and new line numbers for context lines', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -5,3 +5,4 @@
 context
+added
 more
 end
`
    const files = parseDiff(raw)
    const contextLine = files[0].lines[0]
    expect(contextLine.type).toBe('context')
    expect(contextLine.oldLineNumber).toBe(5)
    expect(contextLine.newLineNumber).toBe(5)
  })

  it('sets only newLineNumber for additions', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
`
    const files = parseDiff(raw)
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.newLineNumber).toBe(2)
    expect(addLine.oldLineNumber).toBeUndefined()
  })

  it('sets only oldLineNumber for deletions', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,2 @@
 line1
-removed
 line2
`
    const files = parseDiff(raw)
    const delLine = files[0].lines.find(l => l.type === 'deletion')!
    expect(delLine.oldLineNumber).toBe(2)
    expect(delLine.newLineNumber).toBeUndefined()
  })
})

// ─── Renamed files ──────────────────────────────────────────

describe('parseDiff — renamed files', () => {
  it('detects a renamed file with content changes', () => {
    const raw = `diff --git a/old/path.ts b/new/path.ts
similarity index 80%
rename from old/path.ts
rename to new/path.ts
--- a/old/path.ts
+++ b/new/path.ts
@@ -1,3 +1,3 @@
 line1
-old
+new
 line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('new/path.ts')
    expect(files[0].oldPath).toBe('old/path.ts')
    expect(files[0].status).toBe('renamed')
  })

  it('detects a pure rename (100% similarity, no hunks)', () => {
    const raw = `diff --git a/old.ts b/new.ts
similarity index 100%
rename from old.ts
rename to new.ts
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('new.ts')
    expect(files[0].oldPath).toBe('old.ts')
    expect(files[0].status).toBe('renamed')
    expect(files[0].lines).toHaveLength(0)
  })
})

// ─── Binary files ───────────────────────────────────────────

describe('parseDiff — binary files', () => {
  it('detects a binary file change', () => {
    const raw = `diff --git a/image.png b/image.png
index abc1234..def5678 100644
Binary files a/image.png and b/image.png differ
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('image.png')
    expect(files[0].isBinary).toBe(true)
    expect(files[0].lines).toHaveLength(0)
    expect(files[0].additions).toBe(0)
    expect(files[0].deletions).toBe(0)
  })

  it('detects a new binary file', () => {
    const raw = `diff --git a/logo.svg b/logo.svg
new file mode 100644
index 0000000..abc1234
Binary files /dev/null and b/logo.svg differ
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('logo.svg')
    expect(files[0].isBinary).toBe(true)
    expect(files[0].status).toBe('added')
  })
})

// ─── New and deleted files ──────────────────────────────────

describe('parseDiff — new/deleted files', () => {
  it('detects a new file', () => {
    const raw = `diff --git a/new-file.ts b/new-file.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/new-file.ts
@@ -0,0 +1,3 @@
+line1
+line2
+line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('new-file.ts')
    expect(files[0].status).toBe('added')
    expect(files[0].additions).toBe(3)
  })

  it('detects a deleted file', () => {
    const raw = `diff --git a/old-file.ts b/old-file.ts
deleted file mode 100644
index abc1234..0000000
--- a/old-file.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-line1
-line2
-line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('old-file.ts')
    expect(files[0].status).toBe('deleted')
    expect(files[0].deletions).toBe(3)
  })
})

// ─── Permission changes ─────────────────────────────────────

describe('parseDiff — permission changes', () => {
  it('detects file mode change', () => {
    const raw = `diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('script.sh')
    expect(files[0].status).toBe('modified')
    expect(files[0].lines).toHaveLength(0)
  })

  it('detects mode change with content changes', () => {
    const raw = `diff --git a/script.sh b/script.sh
old mode 100644
new mode 100755
--- a/script.sh
+++ b/script.sh
@@ -1,2 +1,3 @@
 #!/bin/bash
+echo "hello"
 exit 0
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
  })
})

// ─── Paths with spaces ─────────────────────────────────────

describe('parseDiff — paths with spaces', () => {
  it('handles file paths with spaces', () => {
    const raw = `diff --git a/my folder/my file.ts b/my folder/my file.ts
--- a/my folder/my file.ts
+++ b/my folder/my file.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('my folder/my file.ts')
  })
})

// ─── No newline at EOF ─────────────────────────────────────

describe('parseDiff — no newline at EOF', () => {
  it('handles "No newline at end of file" marker', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,2 @@
 line1
-old
\\ No newline at end of file
+new
\\ No newline at end of file
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    expect(files[0].deletions).toBe(1)
    // The backslash lines should be skipped
    const backslashLines = files[0].lines.filter(l => l.content.includes('No newline'))
    expect(backslashLines).toHaveLength(0)
  })
})

// ─── Windows line endings ───────────────────────────────────

describe('parseDiff — Windows line endings', () => {
  it('handles CRLF line endings', () => {
    const raw = "diff --git a/file.ts b/file.ts\r\n--- a/file.ts\r\n+++ b/file.ts\r\n@@ -1,2 +1,3 @@\r\n line1\r\n+added\r\n line2\r\n"
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
    // Content should not have trailing \r
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.content).not.toContain('\r')
  })
})

// ─── Empty diff sections ───────────────────────────────────

describe('parseDiff — edge cases', () => {
  it('handles a file with only context (no changes in hunk)', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
 line1
 line2
 line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(0)
    expect(files[0].deletions).toBe(0)
    expect(files[0].lines).toHaveLength(3)
  })

  it('handles content that looks like a diff header inside a hunk', () => {
    const raw = `diff --git a/test.md b/test.md
--- a/test.md
+++ b/test.md
@@ -1,3 +1,4 @@
 # My document
+diff --git is a command
 line2
 line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.content).toBe('diff --git is a command')
  })

  it('handles deeply nested file paths', () => {
    const raw = `diff --git a/src/components/ui/forms/inputs/TextInput.tsx b/src/components/ui/forms/inputs/TextInput.tsx
--- a/src/components/ui/forms/inputs/TextInput.tsx
+++ b/src/components/ui/forms/inputs/TextInput.tsx
@@ -1,2 +1,3 @@
 line1
+added
 line2
`
    const files = parseDiff(raw)
    expect(files[0].path).toBe('src/components/ui/forms/inputs/TextInput.tsx')
  })

  it('handles empty lines within hunks correctly', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,5 +1,6 @@
 line1

+added

 line4
 line5
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    // Empty lines should be context lines
    const emptyContextLines = files[0].lines.filter(
      l => l.type === 'context' && l.content === ''
    )
    expect(emptyContextLines.length).toBe(2)
  })
})

// ─── Submodule changes ──────────────────────────────────────

describe('parseDiff — submodule changes', () => {
  it('handles submodule pointer change', () => {
    const raw = `diff --git a/libs/submod b/libs/submod
index abc1234..def5678 160000
--- a/libs/submod
+++ b/libs/submod
@@ -1 +1 @@
-Subproject commit abc1234567890
+Subproject commit def5678901234
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('libs/submod')
  })
})

// ─── Copy detection ─────────────────────────────────────────

describe('parseDiff — copy detection', () => {
  it('handles copied file', () => {
    const raw = `diff --git a/original.ts b/copy.ts
similarity index 100%
copy from original.ts
copy to copy.ts
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('copy.ts')
    expect(files[0].status).toBe('copied')
    expect(files[0].oldPath).toBe('original.ts')
  })
})

// ─── Large hunks ────────────────────────────────────────────

describe('parseDiff — large hunks', () => {
  it('handles hunk with large line numbers', () => {
    const raw = `diff --git a/big.ts b/big.ts
--- a/big.ts
+++ b/big.ts
@@ -9999,3 +10001,4 @@
 line9999
+inserted
 line10000
 line10001
`
    const files = parseDiff(raw)
    expect(files[0].lines[0].oldLineNumber).toBe(9999)
    expect(files[0].lines[0].newLineNumber).toBe(10001)
  })
})

// ─── Stress tests ───────────────────────────────────────────

describe('parseDiff — stress & adversarial', () => {
  it('handles hunk header with extra context after @@', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@ function doStuff() {
 line1
+added
 line2
 line3
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
  })

  it('handles file with + in the name', () => {
    const raw = `diff --git a/c++/main.cpp b/c++/main.cpp
--- a/c++/main.cpp
+++ b/c++/main.cpp
@@ -1,2 +1,3 @@
 #include <iostream>
+// comment
 int main() {}
`
    const files = parseDiff(raw)
    expect(files[0].path).toBe('c++/main.cpp')
  })

  it('handles file with --- in the name', () => {
    const raw = `diff --git a/my---file.ts b/my---file.ts
--- a/my---file.ts
+++ b/my---file.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
`
    const files = parseDiff(raw)
    expect(files[0].path).toBe('my---file.ts')
  })

  it('handles an added empty file', () => {
    const raw = `diff --git a/empty.ts b/empty.ts
new file mode 100644
index 0000000..e69de29
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('empty.ts')
    expect(files[0].status).toBe('added')
    expect(files[0].lines).toHaveLength(0)
  })

  it('handles multiple consecutive empty lines in a hunk', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,6 +1,7 @@
 line1
+added


 line4

 line6
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    // Should have context lines for the empty lines
    const contextLines = files[0].lines.filter(l => l.type === 'context')
    expect(contextLines.length).toBeGreaterThanOrEqual(3)
  })

  it('handles file with unicode in path', () => {
    const raw = `diff --git a/docs/café.md b/docs/café.md
--- a/docs/café.md
+++ b/docs/café.md
@@ -1,2 +1,3 @@
 # Café
+New line
 Content
`
    const files = parseDiff(raw)
    expect(files[0].path).toBe('docs/café.md')
  })

  it('handles rename with no content changes and no hunks', () => {
    const raw = `diff --git a/old-name.ts b/new-name.ts
similarity index 100%
rename from old-name.ts
rename to new-name.ts
`
    const files = parseDiff(raw)
    expect(files[0].path).toBe('new-name.ts')
    expect(files[0].oldPath).toBe('old-name.ts')
    expect(files[0].status).toBe('renamed')
    expect(files[0].additions).toBe(0)
    expect(files[0].deletions).toBe(0)
  })

  it('handles deleted binary file', () => {
    const raw = `diff --git a/old.png b/old.png
deleted file mode 100644
index abc1234..0000000
Binary files a/old.png and /dev/null differ
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].status).toBe('deleted')
    expect(files[0].isBinary).toBe(true)
  })

  it('handles added empty line (just + prefix)', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,3 @@
 line1
+
 line2
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.content).toBe('')
  })

  it('handles added line that is a single space', () => {
    // "+ " — plus followed by a space character
    const raw = "diff --git a/file.ts b/file.ts\n--- a/file.ts\n+++ b/file.ts\n@@ -1,2 +1,3 @@\n line1\n+ \n line2\n"
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(1)
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.content).toBe(' ')
  })

  it('handles mixed CRLF and LF in same diff', () => {
    const raw = "diff --git a/file.ts b/file.ts\r\n--- a/file.ts\n+++ b/file.ts\r\n@@ -1,2 +1,3 @@\n line1\r\n+added\n line2\n"
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
    const addLine = files[0].lines.find(l => l.type === 'addition')!
    expect(addLine.content).not.toContain('\r')
  })

  it('handles a file with only additions (new file content)', () => {
    const raw = `diff --git a/brand-new.ts b/brand-new.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/brand-new.ts
@@ -0,0 +1,5 @@
+line1
+line2
+line3
+line4
+line5
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(5)
    expect(files[0].deletions).toBe(0)
    expect(files[0].status).toBe('added')
    expect(files[0].lines).toHaveLength(5)
  })

  it('handles three or more hunks', () => {
    const raw = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,3 @@
 a
+b
 c
@@ -10,2 +11,3 @@
 d
+e
 f
@@ -20,2 +22,3 @@
 g
+h
 i
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(3)
    expect(files[0].lines).toHaveLength(9)
  })

  it('handles hunk starting at line 0 (new file)', () => {
    const raw = `diff --git a/f.ts b/f.ts
new file mode 100644
--- /dev/null
+++ b/f.ts
@@ -0,0 +1,2 @@
+hello
+world
`
    const files = parseDiff(raw)
    expect(files[0].additions).toBe(2)
    expect(files[0].lines[0].newLineNumber).toBe(1)
    expect(files[0].lines[1].newLineNumber).toBe(2)
  })

  it('handles diff with dissimilarity index', () => {
    const raw = `diff --git a/file.ts b/file.ts
dissimilarity index 85%
--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,2 @@
-old content
+completely new content
`
    const files = parseDiff(raw)
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
    expect(files[0].deletions).toBe(1)
  })
})
