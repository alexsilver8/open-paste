import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { ClipKind, ClipView, Pinboard, Settings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/settings'
import { api } from '@renderer/api'
import { BoardEditor } from './components/board-editor'
import { ShelfBody } from './components/shelf-body'
import { Toast, type ToastState } from './components/toast'
import { TopBar } from './components/top-bar'
import { prefersReducedMotion } from './shelf-app.utils'
import type { EditorState, ShelfAppProps } from './shelf-app.types'

const ShelfApp = (props: ShelfAppProps) => {
	const { active = true } = props

	const [items, setItems] = useState<ClipView[]>([])
	const [loaded, setLoaded] = useState(false)
	const [boards, setBoards] = useState<Pinboard[]>([])
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
	const [query, setQuery] = useState('')
	const [search, setSearch] = useState('')
	const [board, setBoard] = useState<string | null>(null)
	const [kind, setKind] = useState<ClipKind | 'all'>('all')
	const [editor, setEditor] = useState<EditorState | null>(null)
	const [toast, setToast] = useState<ToastState | null>(null)
	const [now, setNow] = useState(() => Date.now())

	const inputRef = useRef<HTMLInputElement>(null)
	const shelfRef = useRef<HTMLDivElement>(null)
	const filters = useRef({ search, board, kind })

	// ── Data ─────────────────────────────────────────────────────────────────

	const load = useCallback(async () => {
		const { search, board, kind } = filters.current
		const result = await api.query({ search, pinboard: board, kind })
		setItems(result)
		setLoaded(true)
	}, [])

	useEffect(() => {
		filters.current = { search, board, kind }
		load()
	}, [search, board, kind, load])

	useEffect(() => {
		const timer = setTimeout(() => setSearch(query), 60)

		return () => clearTimeout(timer)
	}, [query])

	useEffect(() => {
		const loadBoards = (): void => {
			api.listBoards().then(setBoards)
		}
		const loadSettings = (): void => {
			api.getSettings().then(setSettings)
		}
		loadBoards()
		loadSettings()
		const offs = [
			api.on('history-changed', () => {
				load()
			}),
			api.on('boards-changed', loadBoards),
			api.on('settings-changed', loadSettings)
		]
		const tick = setInterval(() => setNow(Date.now()), 30_000)

		return () => {
			offs.forEach((off) => off())
			clearInterval(tick)
		}
	}, [load])

	// If the open board is deleted, fall back to history.
	useEffect(() => {
		if (board && boards.length && !boards.some((b) => b.id === board)) setBoard(null)
	}, [boards, board])

	useEffect(() => {
		document.documentElement.dataset.theme = settings.theme
	}, [settings.theme])

	// Every time the shelf opens: fresh search, no board editor, and a short slide-up.
	useEffect(
		() =>
			api.on('shown', () => {
				setQuery('')
				setSearch('')
				setEditor(null)
				setNow(Date.now())
				requestAnimationFrame(() => inputRef.current?.focus())
				if (!prefersReducedMotion()) {
					shelfRef.current?.animate(
						[
							{ opacity: 0, transform: 'translateY(14px)' },
							{ opacity: 1, transform: 'none' }
						],
						{ duration: 190, easing: 'cubic-bezier(.2,.8,.2,1)' }
					)
				}
			}),
		[]
	)

	useEffect(() => {
		if (active) inputRef.current?.focus()
	}, [active])

	// ── Actions ──────────────────────────────────────────────────────────────

	const showToast = useCallback((message: string, action?: ToastState['action']) => {
		setToast({ id: Date.now(), message, action })
	}, [])
	const dismissToast = useCallback(() => setToast(null), [])

	const handleDropOnBoard = (boardId: string, itemId: string) => {
		api.setPinned(itemId, boardId, true)
		showToast(`Pinned to ${boards.find((b) => b.id === boardId)?.name ?? 'pinboard'}`)
	}

	const handleBoardEditorSave = async (input: { name: string; color: string }) => {
		if (!editor) return
		if (editor.board) {
			await api.updateBoard(editor.board.id, input)
		} else {
			const created = await api.createBoard(input)
			if (editor.pinItem) await api.setPinned(editor.pinItem, created.id, true)
			else setBoard(created.id)
		}
		setEditor(null)
		inputRef.current?.focus()
	}

	const handleBoardEditorDelete = async () => {
		if (!editor?.board) return
		await api.deleteBoard(editor.board.id)
		setEditor(null)
	}

	return (
		<div className="shelf" ref={shelfRef}>
			<TopBar
				inputRef={inputRef}
				query={query}
				onQuery={setQuery}
				boards={boards}
				board={board}
				onBoard={setBoard}
				kind={kind}
				onKind={setKind}
				paused={settings.paused}
				onResume={() => api.setSettings({ paused: false })}
				onNewBoard={(anchor) => setEditor({ anchor })}
				onEditBoard={(b, anchor) => setEditor({ anchor, board: b })}
				onDropOnBoard={handleDropOnBoard}
				onSettings={() => api.openSettings()}
			/>

			<ShelfBody
				active={active}
				items={items}
				loaded={loaded}
				boards={boards}
				settings={settings}
				query={query}
				search={search}
				board={board}
				kind={kind}
				now={now}
				inputRef={inputRef}
				editorOpen={editor !== null}
				onQuery={setQuery}
				onBoard={setBoard}
				onNewBoard={(anchor, pinItem) => setEditor({ anchor, pinItem })}
				onToast={showToast}
			>
				{toast && <Toast toast={toast} onDismiss={dismissToast} />}
			</ShelfBody>

			{editor && (
				<BoardEditor
					anchor={editor.anchor}
					board={editor.board}
					onClose={() => setEditor(null)}
					onSave={handleBoardEditorSave}
					onDelete={editor.board ? handleBoardEditorDelete : undefined}
				/>
			)}
		</div>
	)
}

export default memo(ShelfApp)
