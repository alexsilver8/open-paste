import type { DragEvent } from 'react'
import type { ClipPayload, ClipView } from '@shared/types'
import { api } from '@renderer/api'
import { isDemo } from '@renderer/env'
import { DRAG_TYPE } from '@renderer/shelf/shelf-app/components/top-bar'

/** Where an item's card is on screen, when it's rendered. */
export function cardRect(item: ClipView | undefined): DOMRect | undefined {
	return document.getElementById(`card-${item?.id}`)?.getBoundingClientRect()
}

/**
 * Starts dragging an item. Images and files use a native drag, so they drop into Finder,
 * Explorer, chat apps…; anything else carries its full text once `payload` has loaded.
 */
export function startItemDrag(
	e: DragEvent,
	item: ClipView,
	payload: ClipPayload | null | undefined
): void {
	if (!isDemo && (item.kind === 'image' || item.kind === 'file')) {
		e.preventDefault()
		api.startDrag(item.id)

		return
	}
	e.dataTransfer.effectAllowed = 'copyLink'
	e.dataTransfer.setData(DRAG_TYPE, item.id)
	e.dataTransfer.setData('text/plain', payload?.text ?? item.url ?? item.color ?? item.preview)
	if (item.url) e.dataTransfer.setData('text/uri-list', item.url)
	if (payload?.html) e.dataTransfer.setData('text/html', payload.html)
}
