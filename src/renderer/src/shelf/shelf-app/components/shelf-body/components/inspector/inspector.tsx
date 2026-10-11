import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { kindLabel } from '@shared/classify'
import type { ClipPayload } from '@shared/types'
import { api } from '@renderer/api'
import { Icon } from '@renderer/components/icon'
import { ENTER, MOD, SHIFT, isMod } from '@renderer/env'
import { Button } from '@renderer/components/button'
import { BoardChip } from './components/board-chip'
import { Content } from './components/content'
import { Details } from './components/details'
import { TEXT_KINDS } from './inspector.constants'
import type { InspectorProps } from './inspector.types'

/** A larger look at one item, with editing, renaming and pinboard membership. */
const Inspector = (props: InspectorProps) => {
	const { item, boards, startEditing, focusTitle, onClose, onPaste, onCopy, onDelete } = props

	const [payload, setPayload] = useState<ClipPayload | null>(null)
	const [editing, setEditing] = useState(!!startEditing && TEXT_KINDS.has(item.kind))
	const [draft, setDraft] = useState('')
	const [title, setTitle] = useState(item.title ?? '')
	const titleRef = useRef<HTMLInputElement>(null)
	const textRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		let alive = true
		api.getPayload(item.id).then((p) => {
			if (!alive) return
			setPayload(p)
			setDraft(p?.text ?? item.preview)
		})

		return () => {
			alive = false
		}
	}, [item.id, item.preview])

	useEffect(() => setTitle(item.title ?? ''), [item.title])
	useEffect(() => {
		if (focusTitle) titleRef.current?.focus()
	}, [focusTitle])
	useEffect(() => {
		if (editing) textRef.current?.focus()
	}, [editing])

	const saveTitle = (): void => {
		if ((item.title ?? '') !== title.trim())
			api.updateItem(item.id, { title: title.trim() || null })
	}
	const saveText = (): void => {
		api.updateItem(item.id, { text: draft })
		setEditing(false)
	}

	// Inspector keys take priority over the shelf's.
	useEffect(() => {
		const onKey = (e: globalThis.KeyboardEvent): void => {
			const target = e.target as HTMLElement
			const typing = !!target.closest('.inspector') && target.matches('input, textarea')
			if (e.key === 'Escape') {
				e.preventDefault()
				e.stopPropagation()
				if (editing) {
					setEditing(false)
					setDraft(payload?.text ?? item.preview)
				} else if (typing) (e.target as HTMLElement).blur()
				else onClose()
			} else if (editing && isMod(e) && (e.key === 'Enter' || e.key === 's')) {
				e.preventDefault()
				e.stopPropagation()
				saveText()
			} else if (!typing && (e.key === ' ' || e.key === 'Enter')) {
				e.preventDefault()
				e.stopPropagation()
				if (e.key === ' ') onClose()
				else onPaste(e.shiftKey)
			}
		}
		window.addEventListener('keydown', onKey, true)

		return () => window.removeEventListener('keydown', onKey, true)
	})

	const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			saveTitle()
			e.currentTarget.blur()
		}
	}

	return (
		<section className="inspector" aria-label="Item details">
			<div className="inspector-main">
				<Content
					item={item}
					text={payload?.text ?? item.preview}
					editing={editing}
					draft={draft}
					editorRef={textRef}
					onDraftChange={setDraft}
				/>
			</div>
			<aside className="inspector-side">
				<div className="inspector-head">
					<input
						ref={titleRef}
						className="inspector-title"
						placeholder={kindLabel(item)}
						aria-label="Name"
						value={title}
						maxLength={120}
						onChange={(e) => setTitle(e.currentTarget.value)}
						onBlur={saveTitle}
						onKeyDown={handleTitleKeyDown}
					/>
					<Button variant="icon" aria-label="Close" onClick={onClose}>
						<Icon name="close" />
					</Button>
				</div>
				<Details item={item} />
				{boards.length > 0 && (
					<div className="inspector-boards" role="group" aria-label="Pinboards">
						{boards.map((b) => (
							<BoardChip
								key={b.id}
								board={b}
								pinned={item.pinboards.includes(b.id)}
								onToggle={(boardId, pinned) =>
									api.setPinned(item.id, boardId, pinned)
								}
							/>
						))}
					</div>
				)}
				<div className="inspector-actions">
					{editing ? (
						<>
							<Button variant="primary" onClick={saveText}>
								Save changes{' '}
								<kbd>
									{MOD}
									{ENTER}
								</kbd>
							</Button>
							<Button onClick={() => setEditing(false)}>Cancel</Button>
						</>
					) : (
						<>
							<Button variant="primary" onClick={() => onPaste(false)}>
								Paste <kbd>{ENTER}</kbd>
							</Button>
							{TEXT_KINDS.has(item.kind) && item.rich && (
								<Button onClick={() => onPaste(true)}>
									Paste as plain text{' '}
									<kbd>
										{SHIFT}
										{ENTER}
									</kbd>
								</Button>
							)}
							<Button onClick={onCopy}>Copy</Button>
							{TEXT_KINDS.has(item.kind) && (
								<Button onClick={() => setEditing(true)}>Edit</Button>
							)}
							<Button variant="danger-quiet" onClick={onDelete}>
								Delete
							</Button>
						</>
					)}
				</div>
			</aside>
		</section>
	)
}

export default memo(Inspector)
