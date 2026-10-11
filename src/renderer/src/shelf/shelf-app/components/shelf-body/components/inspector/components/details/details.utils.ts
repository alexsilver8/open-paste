import type { ClipView } from '@shared/types'
import { absoluteTime, formatBytes, formatCount } from '@renderer/lib/format'

/** What the inspector lists about an item, as label and value pairs. */
export function itemDetails(item: ClipView): [string, string][] {
	const details: [string, string][] = [
		['From', item.source?.name ?? 'Unknown app'],
		['Copied', absoluteTime(item.createdAt)]
	]
	if (item.usedAt - item.createdAt > 60_000)
		details.push(['Last used', absoluteTime(item.usedAt)])
	if (item.image) {
		details.push(
			['Size', `${item.image.width} × ${item.image.height}`],
			['File size', formatBytes(item.image.bytes)]
		)
	} else if (item.kind === 'file') {
		details.push(['Items', formatCount(item.size, 'file')])
	} else {
		details.push(['Length', formatCount(item.size, 'character')])
		if ((item.lines ?? 1) > 1) details.push(['Lines', String(item.lines)])
		if (item.rich) details.push(['Format', 'Rich text (formatting kept)'])
	}

	return details
}
