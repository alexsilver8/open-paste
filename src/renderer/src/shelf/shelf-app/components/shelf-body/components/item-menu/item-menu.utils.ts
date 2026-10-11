import type { ClipView, Pinboard, Settings } from '@shared/types'
import { api } from '@renderer/api'
import { DELETE_KEY, ENTER, MOD, SHIFT } from '@renderer/env'
import { TEXT_KINDS } from '@renderer/shelf/shelf-app/components/shelf-body/shelf-body.constants'
import type { MenuEntry } from './components/menu'
import type { ItemMenuActions } from './item-menu.types'

/** A tickable entry for each pinboard the item can be pinned to, then New pinboard…. */
export function pinEntries(
	item: ClipView,
	boards: Pinboard[],
	onNewBoard: () => void
): MenuEntry[] {
	return [
		...boards.map((b): MenuEntry => ({
			label: b.name,
			swatch: b.color,
			checked: item.pinboards.includes(b.id),
			onSelect: () => {
				api.setPinned(item.id, b.id, !item.pinboards.includes(b.id))
			}
		})),
		...(boards.length ? (['separator'] as MenuEntry[]) : []),
		{ label: 'New pinboard…', icon: 'plus', onSelect: onNewBoard }
	]
}

/** Everything that can be done to an item, with its shortcut. `pins` is the Pin to submenu. */
export function itemEntries(
	item: ClipView,
	settings: Settings,
	pins: MenuEntry[],
	actions: ItemMenuActions
): MenuEntry[] {
	const textual = TEXT_KINDS.has(item.kind)
	const entries: MenuEntry[] = [
		{
			label: settings.pasteDirectly ? 'Paste' : 'Copy and close',
			icon: 'paste',
			shortcut: ENTER,
			onSelect: () => {
				actions.paste(false)
			}
		}
	]
	if (textual && (item.rich || settings.plainTextByDefault)) {
		entries.push({
			label: settings.plainTextByDefault ? 'Paste with formatting' : 'Paste as plain text',
			shortcut: `${SHIFT}${ENTER}`,
			onSelect: () => {
				actions.paste(true)
			}
		})
	}
	entries.push(
		{ label: 'Copy', icon: 'copy', shortcut: `${MOD}C`, onSelect: () => actions.copy() },
		'separator',
		{
			label: 'Preview',
			icon: 'eye',
			shortcut: 'Space',
			onSelect: () => actions.inspect()
		}
	)
	if (textual) {
		entries.push({
			label: 'Edit text',
			icon: 'edit',
			shortcut: `${MOD}E`,
			onSelect: () => actions.inspect({ edit: true })
		})
	}
	entries.push({
		label: 'Rename',
		icon: 'tag',
		shortcut: `${MOD}R`,
		onSelect: () => actions.inspect({ title: true })
	})
	if (item.kind === 'link' && item.url && /^https?:/.test(item.url)) {
		const url = item.url
		entries.push({
			label: 'Open in browser',
			icon: 'external',
			shortcut: `${MOD}O`,
			onSelect: () => api.openExternal(url)
		})
	}
	entries.push(
		{ label: 'Pin to', icon: 'pin', shortcut: `${MOD}P`, submenu: pins },
		'separator',
		{
			label: 'Delete',
			icon: 'trash',
			danger: true,
			shortcut: DELETE_KEY,
			onSelect: () => actions.remove()
		}
	)

	return entries
}
