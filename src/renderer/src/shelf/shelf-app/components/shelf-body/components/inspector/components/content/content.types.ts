import type { RefObject } from 'react'
import type { ClipView } from '@shared/types'

export interface ContentProps {
	item: ClipView
	/** The item's full text, or its preview until that loads. */
	text: string
	editing: boolean
	draft: string
	editorRef: RefObject<HTMLTextAreaElement | null>
	onDraftChange(draft: string): void
}
