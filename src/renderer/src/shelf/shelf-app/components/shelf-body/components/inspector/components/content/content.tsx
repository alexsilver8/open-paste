import { memo } from 'react'
import { api } from '@renderer/api'
import { Button } from '@renderer/components/button'
import { Icon } from '@renderer/components/icon'
import { describeColor } from '@renderer/lib/colors'
import { hostOf } from '@renderer/lib/format'
import { highlightCode } from '@renderer/lib/highlight'
import type { ContentProps } from './content.types'

/** The inspector's main pane: the item in full, shown the way its kind needs, or the editor. */
const Content = (props: ContentProps) => {
	const { item, text, editing, draft, editorRef, onDraftChange } = props

	const color = item.kind === 'color' ? describeColor(item.color ?? item.preview) : null

	if (editing) {
		return (
			<textarea
				ref={editorRef}
				className="inspector-editor"
				value={draft}
				spellCheck={item.kind === 'text'}
				onChange={(e) => onDraftChange(e.currentTarget.value)}
			/>
		)
	}
	if (item.kind === 'image') {
		return (
			<div className="inspector-image">
				<img
					src={item.imageUrl ?? item.thumbUrl}
					alt={item.title ?? 'Copied image'}
					draggable={false}
				/>
			</div>
		)
	}
	if (item.kind === 'color' && color) {
		return (
			<div className="inspector-color">
				<div
					className="inspector-swatch"
					style={{ background: item.color, color: color.ink }}
				>
					{color.hex}
				</div>
				<dl className="inspector-values">
					{[
						['Hex', color.hex],
						['RGB', color.rgb],
						['HSL', color.hsl],
						['Copied as', item.color ?? item.preview]
					].map(([k, v]) => (
						<div key={k}>
							<dt>{k}</dt>
							<dd>{v}</dd>
						</div>
					))}
				</dl>
			</div>
		)
	}
	if (item.kind === 'link') {
		const { host } = hostOf(item.url ?? text)

		return (
			<div className="inspector-link">
				<p className="inspector-link-host">{host}</p>
				<p className="inspector-link-url">{item.url ?? text}</p>
				{item.url && /^https?:/.test(item.url) && (
					<Button onClick={() => api.openExternal(item.url!)}>
						<Icon name="external" size={15} /> Open in browser
					</Button>
				)}
			</div>
		)
	}
	if (item.kind === 'file') {
		return (
			<ul className="inspector-files">
				{(item.files ?? []).map((f) => (
					<li key={f}>
						<Icon name="file" size={15} />
						<span>{f}</span>
					</li>
				))}
			</ul>
		)
	}

	return (
		<pre className={`inspector-text${item.kind === 'code' ? ' is-code' : ''}`}>
			{item.kind === 'code' ? highlightCode(text) : text}
		</pre>
	)
}

export default memo(Content)
