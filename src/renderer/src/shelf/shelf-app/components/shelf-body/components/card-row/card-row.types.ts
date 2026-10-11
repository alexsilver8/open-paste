import type { DragEvent, MouseEvent, RefObject } from 'react'
import type { ClipView, Pinboard } from '@shared/types'

export interface CardRowProps {
	items: ClipView[]
	/** The selected card's index. */
	index: number
	scrollRef: RefObject<HTMLDivElement | null>
	label: string
	showHints: boolean
	/** Touch screens: tapping the already-selected card pastes it. */
	tapToPaste: boolean
	boards: Pinboard[]
	terms: string[]
	now: number
	onSelect(index: number): void
	onActivate(index: number): void
	onMenu(index: number, event: MouseEvent): void
	onDragStart(index: number, event: DragEvent): void
}
