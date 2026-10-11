import type { ReactNode, RefObject } from 'react'
import type { ClipKind, ClipView, Pinboard, Settings } from '@shared/types'
import type { ToastState } from '@renderer/shelf/shelf-app/components/toast'

export interface ShelfBodyProps {
	/** Whether the shelf is open. The browser demo keeps it mounted while it's closed. */
	active: boolean
	items: ClipView[]
	loaded: boolean
	boards: Pinboard[]
	settings: Settings
	query: string
	search: string
	board: string | null
	kind: ClipKind | 'all'
	now: number
	inputRef: RefObject<HTMLInputElement | null>
	/** The board editor is open, and handles its own keys. */
	editorOpen: boolean
	/** Shown over the cards, like the toast. */
	children?: ReactNode
	onQuery(query: string): void
	onBoard(board: string | null): void
	onNewBoard(anchor: DOMRect, pinItem: string): void
	onToast(message: string, action?: ToastState['action']): void
}

/** The item the inspector shows, and whether it opens editing its text or its name. */
export interface InspectState {
	id: string
	edit?: boolean
	title?: boolean
}

export interface MenuState {
	x: number
	y: number
	index: number
	pinOnly?: boolean
}

/** What pasting, copying and deleting items needs from the shelf body. */
export interface ItemActionsOptions {
	items: ClipView[]
	settings: Settings
	onToast: ShelfBodyProps['onToast']
	setSelectedId(id: string | null): void
	setInspect(state: InspectState | null): void
}

/** What the shelf's keyboard shortcuts read and do. */
export interface ShelfKeysOptions {
	active: boolean
	/** The inspector, a menu or the board editor is open, and handles its own keys. */
	blocked: boolean
	query: string
	items: ClipView[]
	index: number
	selected: ClipView | undefined
	boards: Pinboard[]
	board: string | null
	inputRef: RefObject<HTMLInputElement | null>
	onQuery(query: string): void
	onBoard(board: string | null): void
	select(index: number): void
	paste(index: number, invert: boolean): void
	copy(index: number): void
	remove(index: number): void
	inspect(state: InspectState): void
	openPinMenu(index: number): void
}
