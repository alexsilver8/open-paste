import { useCallback, useEffect, useState } from 'react'
import { api } from '@renderer/api'
import { isMod } from '@renderer/env'
import { TEXT_KINDS } from './shelf-body.constants'
import type { ItemActionsOptions, ShelfKeysOptions } from './shelf-body.types'

/** Pasting, copying and deleting items, by their index on the shelf. */
export function useItemActions(options: ItemActionsOptions) {
	const { items, settings, onToast, setSelectedId, setInspect } = options

	const paste = useCallback(
		async (i: number, invert: boolean) => {
			const item = items[i]
			if (!item) return
			const plain = settings.plainTextByDefault !== invert
			const result = await api.paste(item.id, { plain })
			if (result.outcome === 'failed') onToast('That item is no longer available')
		},
		[items, settings.plainTextByDefault, onToast]
	)

	const copy = useCallback(
		(i: number) => {
			const item = items[i]
			if (item) api.copy(item.id, { plain: settings.plainTextByDefault })
		},
		[items, settings.plainTextByDefault]
	)

	const remove = useCallback(
		(i: number) => {
			const item = items[i]
			if (!item) return
			const next = items[i + 1] ?? items[i - 1]
			setSelectedId(next?.id ?? null)
			setInspect(null)
			api.remove(item.id)
			onToast('Deleted', {
				label: 'Undo',
				run: () => {
					api.undoRemove()
				}
			})
		},
		[items, onToast, setSelectedId, setInspect]
	)

	return { paste, copy, remove }
}

/**
 * The shelf's keyboard shortcuts, while it's open. Returns whether the cards show their shortcut
 * hints, which appear while ⌘ or Ctrl is held down.
 */
export function useShelfKeys(options: ShelfKeysOptions): boolean {
	const [showHints, setShowHints] = useState(false)

	useEffect(() => {
		const {
			active,
			blocked,
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
			inspect,
			openPinMenu
		} = options
		let hintTimer: ReturnType<typeof setTimeout> | undefined
		if (!active) return // the browser demo keeps the shelf mounted while it's closed
		const onKeyDown = (e: KeyboardEvent): void => {
			if (blocked) return // those layers handle their own keys
			const mod = isMod(e)
			const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
			const input = inputRef.current
			const inInput = e.target === input

			if (e.key === 'Meta' || e.key === 'Control') {
				clearTimeout(hintTimer)
				hintTimer = setTimeout(() => setShowHints(true), 250)

				return
			}

			const handled = (): void => e.preventDefault()

			if (key === 'Escape') {
				handled()
				if (query) onQuery('')
				else api.hide()
			} else if (key === 'ArrowRight' || key === 'ArrowLeft') {
				handled()
				const step = key === 'ArrowRight' ? 1 : -1
				select(mod ? (step > 0 ? items.length - 1 : 0) : index + step)
			} else if (key === 'Home' && (!inInput || !query)) {
				handled()
				select(0)
			} else if (key === 'End' && (!inInput || !query)) {
				handled()
				select(items.length - 1)
			} else if (key === 'Enter') {
				handled()
				paste(index, e.shiftKey)
			} else if (mod && /^[1-9]$/.test(key)) {
				handled()
				paste(Number(key) - 1, e.shiftKey)
			} else if (mod && key === 'c') {
				const hasTextSelection =
					inInput && input && input.selectionStart !== input.selectionEnd
				if (!hasTextSelection) {
					handled()
					copy(index)
				}
			} else if (key === ' ' && !query) {
				handled()
				if (selected) inspect({ id: selected.id })
			} else if (
				(mod && (key === 'Backspace' || key === 'Delete')) ||
				(key === 'Delete' && !query)
			) {
				handled()
				remove(index)
			} else if (mod && key === 'e' && selected && TEXT_KINDS.has(selected.kind)) {
				handled()
				inspect({ id: selected.id, edit: true })
			} else if (mod && key === 'r' && selected) {
				handled()
				inspect({ id: selected.id, title: true })
			} else if (mod && key === 'p' && selected) {
				handled()
				openPinMenu(index)
			} else if (mod && key === 'o' && selected?.url && /^https?:/.test(selected.url)) {
				handled()
				api.openExternal(selected.url)
			} else if (key === 'Tab') {
				handled()
				const order = [null, ...boards.map((b) => b.id)]
				const at = order.indexOf(board)
				onBoard(order[(at + (e.shiftKey ? -1 : 1) + order.length) % order.length])
			} else if (mod && key === 'f') {
				handled()
				input?.focus()
				input?.select()
			} else if (mod && key === ',') {
				handled()
				api.openSettings()
			} else if (!inInput && key.length === 1 && !mod && !e.altKey) {
				input?.focus() // the keystroke lands in the search field
			}
		}
		const onKeyUp = (e: KeyboardEvent): void => {
			if (!e.metaKey && !e.ctrlKey) {
				clearTimeout(hintTimer)
				setShowHints(false)
			}
		}
		const reset = (): void => {
			clearTimeout(hintTimer)
			setShowHints(false)
		}
		window.addEventListener('keydown', onKeyDown)
		window.addEventListener('keyup', onKeyUp)
		window.addEventListener('blur', reset)

		return () => {
			clearTimeout(hintTimer)
			window.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('keyup', onKeyUp)
			window.removeEventListener('blur', reset)
		}
	})

	return showHints
}
