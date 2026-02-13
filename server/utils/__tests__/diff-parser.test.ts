import { describe, it, expect } from 'vitest'
import { parseDiff } from '../diff-parser'

const SAMPLE_DIFF = `diff --git a/src/auth/AuthProvider.tsx b/src/auth/AuthProvider.tsx
index 1234567..abcdefg 100644
--- a/src/auth/AuthProvider.tsx
+++ b/src/auth/AuthProvider.tsx
@@ -14,9 +14,18 @@
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

-  useEffect(() => {
-    fetchUser();
-  }, []);
+  const initAuth = useCallback(async () => {
+    try {
+      const session = await getSession();
+      if (session?.user) {
+        setUser(session.user);
+      }
+    } catch (error) {
+      console.error('Auth failed:', error);
+    } finally {
+      setLoading(false);
+    }
+  }, []);

+  useEffect(() => {
+    initAuth();
+  }, [initAuth]);`

describe('parseDiff', () => {
  it('parses file path from diff header', () => {
    const result = parseDiff(SAMPLE_DIFF)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('src/auth/AuthProvider.tsx')
  })

  it('counts additions and deletions', () => {
    const result = parseDiff(SAMPLE_DIFF)
    expect(result[0].additions).toBe(15)
    expect(result[0].deletions).toBe(3)
  })

  it('classifies line types correctly', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const lines = result[0].lines
    const contextLines = lines.filter(l => l.type === 'context')
    const addLines = lines.filter(l => l.type === 'addition')
    const delLines = lines.filter(l => l.type === 'deletion')

    expect(contextLines.length).toBe(4)
    expect(addLines.length).toBe(15)
    expect(delLines.length).toBe(3)
  })

  it('preserves line content without +/- prefix', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const firstDeletion = result[0].lines.find(l => l.type === 'deletion')
    expect(firstDeletion?.content).toBe('  useEffect(() => {')
  })

  it('assigns correct line numbers', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const firstLine = result[0].lines[0]
    expect(firstLine.lineNumber).toBe(14)
    expect(firstLine.type).toBe('context')
  })

  it('handles multiple files in one diff', () => {
    const multiDiff = SAMPLE_DIFF + `\ndiff --git a/src/utils/helpers.ts b/src/utils/helpers.ts
index 1111111..2222222 100644
--- a/src/utils/helpers.ts
+++ b/src/utils/helpers.ts
@@ -1,3 +1,4 @@
 export function helper() {
+  console.log('added');
   return true;
 }`
    const result = parseDiff(multiDiff)
    expect(result).toHaveLength(2)
    expect(result[1].path).toBe('src/utils/helpers.ts')
    expect(result[1].additions).toBe(1)
    expect(result[1].deletions).toBe(0)
  })
})
