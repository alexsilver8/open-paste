import { memo, useState } from 'react'
import { api } from '@renderer/api'
import { Button } from '@renderer/components/button'
import { Row } from '@renderer/settings/settings-app/components/row'

/** The Clear history row, which asks first and offers to keep pinboards. */
const ClearHistory = () => {
	const [confirmClear, setConfirmClear] = useState(false)
	const [keepPinned, setKeepPinned] = useState(true)
	const [cleared, setCleared] = useState(false)

	const handleClearConfirmClick = async () => {
		await api.clearHistory({ keepPinned })
		setConfirmClear(false)
		setCleared(true)
	}

	const handleClearClick = () => {
		setCleared(false)
		setConfirmClear(true)
	}

	return (
		<Row
			label="Clear history"
			note={cleared ? 'History cleared.' : 'Deletes recorded items from this computer.'}
		>
			{confirmClear ? (
				<div className="confirm">
					<label className="check">
						<input
							type="checkbox"
							checked={keepPinned}
							onChange={(e) => setKeepPinned(e.currentTarget.checked)}
						/>
						Keep pinboards
					</label>
					<Button onClick={() => setConfirmClear(false)}>Cancel</Button>
					<Button variant="danger" onClick={handleClearConfirmClick}>
						Clear history
					</Button>
				</div>
			) : (
				<Button onClick={handleClearClick}>Clear history…</Button>
			)}
		</Row>
	)
}

export default memo(ClearHistory)
