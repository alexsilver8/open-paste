import { memo, useState, type SubmitEvent } from 'react'
import { DEFAULT_IGNORED_APPS, DEFAULT_SETTINGS } from '@shared/settings'
import { Button } from '@renderer/components/button'
import { Input } from '@renderer/components/input'
import { IgnoredApp } from './components/ignored-app'
import type { IgnoredAppsProps } from './ignored-apps.types'

/** The apps whose copies are never recorded, and a form to add one. */
const IgnoredApps = (props: IgnoredAppsProps) => {
	const { ignoredApps, onChange } = props

	const [newApp, setNewApp] = useState('')

	const handleAddAppSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		const name = newApp.trim()
		if (!name) return
		onChange([...ignoredApps, name])
		setNewApp('')
	}

	return (
		<div className="row-setting row-setting--stack">
			<div className="row-setting-text">
				<span className="row-setting-label">Never record copies from</span>
				<p className="row-setting-note">
					Match by app name. Copies made in these apps never reach your history.
				</p>
			</div>
			<ul className="chips" aria-label="Ignored apps">
				{ignoredApps.map((app) => (
					<IgnoredApp
						key={app}
						app={app}
						onRemove={(app) => onChange(ignoredApps.filter((a) => a !== app))}
					/>
				))}
			</ul>
			<form className="add-app" onSubmit={handleAddAppSubmit}>
				<Input
					placeholder="App name, e.g. Keychain Access"
					value={newApp}
					onChange={(e) => setNewApp(e.currentTarget.value)}
				/>
				<Button type="submit" disabled={!newApp.trim()}>
					Add app
				</Button>
				{ignoredApps.join() !== DEFAULT_IGNORED_APPS.join() && (
					<Button variant="quiet" onClick={() => onChange(DEFAULT_SETTINGS.ignoredApps)}>
						Restore defaults
					</Button>
				)}
			</form>
		</div>
	)
}

export default memo(IgnoredApps)
