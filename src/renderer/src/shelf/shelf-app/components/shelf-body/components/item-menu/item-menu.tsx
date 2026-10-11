import { memo } from 'react'
import { Menu } from './components/menu'
import { itemEntries, pinEntries } from './item-menu.utils'
import type { ItemMenuActions, ItemMenuProps } from './item-menu.types'

/** The menu for one item: everything that can be done to it, or just its pinboards. */
const ItemMenu = (props: ItemMenuProps) => {
	const {
		menu,
		item,
		boards,
		settings,
		onClose,
		onPaste,
		onCopy,
		onRemove,
		onInspect,
		onNewBoard
	} = props

	const pins = pinEntries(item, boards, () => onNewBoard(menu.index, item.id))
	const actions: ItemMenuActions = {
		paste: (invert) => onPaste(menu.index, invert),
		copy: () => onCopy(menu.index),
		remove: () => onRemove(menu.index),
		inspect: (options) => onInspect({ id: item.id, ...options })
	}
	const entries = menu.pinOnly ? pins : itemEntries(item, settings, pins, actions)

	return <Menu x={menu.x} y={menu.y} entries={entries} onClose={onClose} />
}

export default memo(ItemMenu)
