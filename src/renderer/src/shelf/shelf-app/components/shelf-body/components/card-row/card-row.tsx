import { memo, useEffect, type WheelEvent } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CARD_GAP, CARD_WIDTH, Card } from './components/card'
import type { CardRowProps } from './card-row.types'

/** The scrolling row of cards. Only the cards in view, and a few either side, are rendered. */
const CardRow = (props: CardRowProps) => {
	const {
		items,
		index,
		scrollRef,
		label,
		showHints,
		tapToPaste,
		boards,
		terms,
		now,
		onSelect,
		onActivate,
		onMenu,
		onDragStart
	} = props

	const selected = items[index]

	const virtualizer = useVirtualizer({
		horizontal: true,
		count: items.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => CARD_WIDTH + CARD_GAP,
		getItemKey: (i) => items[i]?.id ?? i,
		overscan: 6,
		paddingStart: 16,
		paddingEnd: 16 - CARD_GAP
	})

	useEffect(() => {
		if (items.length) virtualizer.scrollToIndex(index, { align: 'auto' })
	}, [index, items.length, virtualizer])

	const handleRowWheel = (e: WheelEvent<HTMLDivElement>) => {
		if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scrollRef.current) {
			scrollRef.current.scrollLeft += e.deltaY
		}
	}

	return (
		<div
			ref={scrollRef}
			className="row"
			role="listbox"
			aria-label={label}
			aria-activedescendant={selected ? `card-${selected.id}` : undefined}
			onWheel={handleRowWheel}
		>
			<div className="row-inner" style={{ width: virtualizer.getTotalSize() }}>
				{virtualizer.getVirtualItems().map((v) => {
					const item = items[v.index]

					return (
						<div
							key={item.id}
							className="slot"
							style={{ transform: `translateX(${v.start}px)` }}
						>
							<Card
								item={item}
								index={v.index}
								selected={v.index === index}
								showHint={showHints}
								tapToPaste={tapToPaste}
								boards={boards}
								terms={terms}
								now={now}
								onSelect={onSelect}
								onActivate={onActivate}
								onMenu={onMenu}
								onDragStart={onDragStart}
							/>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default memo(CardRow)
