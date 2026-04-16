import { useEffect, useRef, useCallback } from 'react'
import { CodeJar } from 'codejar'
import { withLineNumbers } from 'codejar-linenumbers'
import 'codejar-linenumbers/es/codejar-linenumbers.css'
import { highlightHosts, toggleCommentBySelection, toggleCommentByLine } from './hosts_highlight'
import clsx from 'clsx'

interface HostsEditorProps {
  content: string
  onChange: (content: string) => void
  readOnly: boolean
}

interface Position {
  start: number
  end: number
  dir: '->' | '<-'
}

const HostsEditor: React.FC<HostsEditorProps> = ({ content, onChange, readOnly }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const jarRef = useRef<ReturnType<typeof CodeJar> | null>(null)
  const contentRef = useRef(content)

  // Keep content ref updated
  useEffect(() => {
    contentRef.current = content
  }, [content])

  const getCurrentSelection = useCallback((): Position => {
    const jar = jarRef.current
    if (!jar) {
      return { start: 0, end: 0, dir: '->' }
    }
    try {
      return jar.save() as Position
    } catch {
      return { start: 0, end: 0, dir: '->' }
    }
  }, [])

  const applyEditorChange = useCallback((nextContent: string, nextSelection: Position) => {
    const jar = jarRef.current
    const editor = editorRef.current
    if (!jar || !editor) return

    editor.focus()
    jar.recordHistory()
    jar.updateCode(nextContent, false)
    jar.restore(nextSelection)
    editor.focus()
    jar.recordHistory()
    onChange(nextContent)
  }, [onChange])

  const toggleComment = useCallback(() => {
    if (readOnly) return

    const jar = jarRef.current
    if (!jar) return

    const selection = getCurrentSelection()
    const next = toggleCommentBySelection(jar.toString(), selection.start, selection.end, true)
    if (!next.changed) return

    applyEditorChange(next.content, {
      start: next.selectionStart,
      end: next.selectionEnd,
      dir: '->',
    })
  }, [readOnly, getCurrentSelection, applyEditorChange])

  const onGutterClick = useCallback((lineIndex: number) => {
    if (readOnly) return

    const jar = jarRef.current
    if (!jar) return

    const selection = getCurrentSelection()
    const next = toggleCommentByLine(jar.toString(), lineIndex, selection.start, selection.end)
    if (!next.changed) return

    applyEditorChange(next.content, {
      start: next.selectionStart,
      end: next.selectionEnd,
      dir: '->',
    })
  }, [readOnly, getCurrentSelection, applyEditorChange])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    mount.replaceChildren()

    const editor = document.createElement('div')
    editor.className = 'editor-surface'
    editor.tabIndex = 0
    mount.appendChild(editor)

    const jar = CodeJar(
      editor,
      withLineNumbers(highlightHosts, {
        width: '25px',
        backgroundColor: 'var(--swh-editor-read-only-bg, #f5f5f5)',
        color: 'var(--swh-editor-line-number-color, #999)',
      }),
    )
    editorRef.current = editor
    jarRef.current = jar

    // Set readonly
    editor.setAttribute('contenteditable', readOnly ? 'false' : 'plaintext-only')
    editor.setAttribute('aria-readonly', readOnly ? 'true' : 'false')

    const onEditorUpdate = (nextContent: string) => {
      onChange(nextContent)
    }

    const onMountClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const gutter = target?.closest('.codejar-linenumbers')
      if (!gutter) return

      const lineHeight = parseFloat(window.getComputedStyle(editor).lineHeight) || 24
      const scrollContainer = gutter.closest('.codejar-wrap') ?? editor
      const relativeY =
        event.clientY - gutter.getBoundingClientRect().top + scrollContainer.scrollTop
      const lineCount = Math.max(1, jar.toString().split('\n').length)
      const lineIndex = Math.max(0, Math.min(lineCount - 1, Math.floor(relativeY / lineHeight)))

      event.preventDefault()
      onGutterClick(lineIndex)
    }

    jar.onUpdate(onEditorUpdate)
    jar.updateCode(content, false)
    mount.addEventListener('click', onMountClick)

    return () => {
      mount.removeEventListener('click', onMountClick)
      jar.destroy()
      mount.replaceChildren()
      jarRef.current = null
      editorRef.current = null
    }
  }, [readOnly, onChange, onGutterClick])

  // Update content when it changes externally
  useEffect(() => {
    const jar = jarRef.current
    if (jar && content !== jar.toString()) {
      jar.updateCode(content, false)
    }
  }, [content])

  // Update readonly state
  useEffect(() => {
    const editor = editorRef.current
    if (editor) {
      editor.setAttribute('contenteditable', readOnly ? 'false' : 'plaintext-only')
      editor.setAttribute('aria-readonly', readOnly ? 'true' : 'false')
    }
  }, [readOnly])

  return (
    <div className={clsx('hosts-editor-wrapper', readOnly && 'read-only')}>
      <div ref={mountRef} className="hosts-editor-mount" />
    </div>
  )
}

export default HostsEditor
