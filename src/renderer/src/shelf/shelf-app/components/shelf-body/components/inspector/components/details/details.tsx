import { memo } from 'react'
import { itemDetails } from './details.utils'
import type { DetailsProps } from './details.types'

/** Where an item came from, when it was copied and used, and how big it is. */
const Details = (props: DetailsProps) => {
	const { item } = props

	return (
		<dl className="inspector-details">
			{itemDetails(item).map(([k, v]) => (
				<div key={k}>
					<dt>{k}</dt>
					<dd>{v}</dd>
				</div>
			))}
		</dl>
	)
}

export default memo(Details)
