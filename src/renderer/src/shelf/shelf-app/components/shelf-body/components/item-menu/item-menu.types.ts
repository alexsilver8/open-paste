import type { ClipView, Pinboard, Settings } from '@shared/types'
import type {
	InspectState,
	MenuState
} from '@renderer/shelf/shelf-app/components/shelf-body/shelf-body.types'

export interface ItemMenuProps {
	menu: MenuState
	item: ClipView
	boards: Pinboard[]
	settings: Settings
	onClose(): void
	onPaste(index: number, invert: boolean): void
	onCopy(index: number): void
	onRemove(index: number): void
	onInspect(state: InspectState): void
	onNewBoard(index: number, itemId: string): void
}

/** What the menu's entries do to the item it's open on. */
export interface ItemMenuActions {
	paste(invert: boolean): void
	copy(): void
	remove(): void
	inspect(options?: Omit<InspectState, 'id'>): void
}
