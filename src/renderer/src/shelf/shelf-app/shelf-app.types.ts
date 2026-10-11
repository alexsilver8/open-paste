import type { Pinboard } from '@shared/types'

export interface ShelfAppProps {
	active?: boolean
}

export interface EditorState {
	anchor: DOMRect
	board?: Pinboard
	/** Pin this item to the new board once it's created. */
	pinItem?: string
}
