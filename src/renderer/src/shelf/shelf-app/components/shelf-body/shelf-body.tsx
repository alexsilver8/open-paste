import {
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type DragEvent,
	type MouseEvent
} from 'react'
import { parseQuery } from '@shared/search'
import type { ClipPayload, ClipView } from '@shared/types'
import { api } from '@renderer/api'
import { CardRow } from './components/card-row'
import { EmptyState } from './components/empty-state'
import { Inspector } from './components/inspector'
import { ItemMenu } from './components/item-menu'
import { useItemActions, useShelfKeys } from './shelf-body.hooks'
import { cardRect, startItemDrag } from './shelf-body.utils'
import type { InspectState, MenuState, ShelfBodyProps } from './shelf-body.types'

/** The row of cards, and what opens over it: the inspector, the item menu and the toast. */
const ShelfBody = (props: ShelfBodyProps) => {
	const {
		active,
		items,
		loaded,
		boards,
		settings,
		query,
		search,
		board,
		kind,
		now,
		inputRef,
		editorOpen,
		children,
		onQuery,
		onBoard,
		onNewBoard,
		onToast
	} = props

	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [inspect, setInspect] = useState<InspectState | null>(null)
	const [menu, setMenu] = useState<MenuState | null>(null)

	const scrollRef = useRef<HTMLDivElement>(null)
	const payloadCache = useRef(new Map<string, ClipPayload | null>())

	const { paste, copy, remove } = useItemActions({
		items,
		settings,
		onToast,
		setSelectedId,
		setInspect
	})

	// ── Selection ────────────────────────────────────────────────────────────

	const index = Math.max(
		0,
		items.findIndex((i) => i.id === selectedId)
	)
	const selected: ClipView | undefined = items[index]

	const select = useCallback(
		(i: number) => {
			const target = items[Math.max(0, Math.min(i, items.length - 1))]
			if (target) setSelectedId(target.id)
		},
		[items]
	)

	// A new search, board or kind starts from the first card.
	useEffect(() => setSelectedId(null), [search, board, kind])

	// Keep the selected item's full content handy so drags carry all of it.
	useEffect(() => {
		if (!selected || payloadCache.current.has(selected.id)) return
		if (selected.kind === 'image' || selected.kind === 'file') return
		api.getPayload(selected.id).then((p) => payloadCache.current.set(selected.id, p))
	}, [selected])

	// Every time the shelf opens: nothing open over the cards, and the first card.
	useEffect(
		() =>
			api.on('shown', () => {
				setInspect(null)
				setMenu(null)
				setSelectedId(null)
				scrollRef.current?.scrollTo({ left: 0 })
			}),
		[]
	)

	// The inspector takes over the keyboard; park focus away from the search field.
	useEffect(() => {
		if (inspect) inputRef.current?.blur()
	}, [inspect, inputRef])

	// ── Keyboard & mouse ─────────────────────────────────────────────────────

	const openPinMenu = (i: number): void => {
		const rect = cardRect(items[i])
		if (rect) setMenu({ x: rect.left + 12, y: rect.top + 60, index: i, pinOnly: true })
	}

	const showHints = useShelfKeys({
		active,
		blocked: Boolean(inspect || menu || editorOpen),
		query,
		items,
		index,
		selected,
		boards,
		board,
		inputRef,
		onQuery,
		onBoard,
		select,
		paste,
		copy,
		remove,
		inspect: setInspect,
		openPinMenu
	})

	const onCardMenu = useCallback(
		(i: number, e: MouseEvent) => {
			e.preventDefault()
			select(i)
			setMenu({ x: e.clientX, y: e.clientY, index: i })
		},
		[select]
	)

	const onActivate = useCallback(
		(i: number) => {
			paste(i, false)
		},
		[paste]
	)

	const onDragStart = useCallback(
		(i: number, e: DragEvent) => {
			const item = items[i]
			if (!item) return
			setSelectedId(item.id)
			startItemDrag(e, item, payloadCache.current.get(item.id))
		},
		[items]
	)

	const terms = useMemo(() => parseQuery(search).terms, [search])
	const coarsePointer = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])
	const inspected = inspect ? items.find((i) => i.id === inspect.id) : undefined
	const boardName = boards.find((b) => b.id === board)?.name
	const emptyReason = search ? 'search' : board ? 'board' : kind !== 'all' ? 'kind' : 'history'

	const handleInspectorClose = () => {
		setInspect(null)
		inputRef.current?.focus()
	}

	const handleNewBoard = (i: number, itemId: string) => {
		const rect = cardRect(items[i])
		if (rect) onNewBoard(rect, itemId)
	}

	return (
		<>
			<div className={`shelf-body${inspected ? ' is-inspecting' : ''}`}>
				{loaded && items.length === 0 ? (
					<EmptyState
						reason={emptyReason}
						query={search}
						shortcut={settings.shortcut}
						boardName={boardName}
					/>
				) : (
					<CardRow
						items={items}
						index={index}
						scrollRef={scrollRef}
						label={boardName ?? 'Clipboard history'}
						showHints={showHints}
						tapToPaste={coarsePointer}
						boards={boards}
						terms={terms}
						now={now}
						onSelect={select}
						onActivate={onActivate}
						onMenu={onCardMenu}
						onDragStart={onDragStart}
					/>
				)}

				{inspected && (
					<Inspector
						key={
							inspected.id +
							(inspect?.edit ? ':edit' : '') +
							(inspect?.title ? ':title' : '')
						}
						item={inspected}
						boards={boards}
						startEditing={inspect?.edit}
						focusTitle={inspect?.title}
						onClose={handleInspectorClose}
						onPaste={(invert) => paste(index, invert)}
						onCopy={() => copy(index)}
						onDelete={() => remove(index)}
					/>
				)}

				{children}
			</div>

			{menu && items[menu.index] && (
				<ItemMenu
					menu={menu}
					item={items[menu.index]}
					boards={boards}
					settings={settings}
					onClose={() => setMenu(null)}
					onPaste={paste}
					onCopy={copy}
					onRemove={remove}
					onInspect={setInspect}
					onNewBoard={handleNewBoard}
				/>
			)}
		</>
	)
}

export default memo(ShelfBody)
