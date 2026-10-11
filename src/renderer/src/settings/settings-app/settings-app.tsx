import { memo, useCallback, useEffect, useState } from 'react'
import { HISTORY_DAY_OPTIONS, HISTORY_LIMIT_OPTIONS } from '@shared/settings'
import type { AppEnv, Permissions, Settings } from '@shared/types'
import { api } from '@renderer/api'
import { Icon } from '@renderer/components/icon'
import { isMac } from '@renderer/env'
import { Button } from '@renderer/components/button'
import logoUrl from '@resources/icon.png'
import { AccessibilityCallout } from './components/accessibility-callout'
import { ClearHistory } from './components/clear-history'
import { IgnoredApps } from './components/ignored-apps'
import { Row } from './components/row'
import { ShortcutRecorder } from './components/shortcut-recorder'
import { Section } from './components/section'
import { SettingSelect } from './components/setting-select'
import { SettingToggle } from './components/setting-toggle'
import { ThemeOption } from './components/theme-option'
import { THEMES } from './settings-app.constants'
import type { SettingsAppProps } from './settings-app.types'

const SettingsApp = (props: SettingsAppProps) => {
	const { embedded = false } = props

	const [settings, setSettings] = useState<Settings | null>(null)
	const [env, setEnv] = useState<AppEnv | null>(null)
	const [permissions, setPermissions] = useState<Permissions>({ accessibility: null })

	useEffect(() => {
		const load = (): void => {
			api.getSettings().then(setSettings)
		}
		load()
		api.getEnv().then(setEnv)
		const refreshPermissions = (): void => {
			api.getPermissions().then(setPermissions)
		}
		refreshPermissions()
		window.addEventListener('focus', refreshPermissions)
		const off = api.on('settings-changed', load)

		return () => {
			off()
			window.removeEventListener('focus', refreshPermissions)
		}
	}, [])

	useEffect(() => {
		if (settings && !embedded) document.documentElement.dataset.theme = settings.theme
	}, [settings, embedded])

	const update = useCallback(async (patch: Partial<Settings>): Promise<string | undefined> => {
		const result = await api.setSettings(patch)
		setSettings(result.settings)

		return result.ok ? undefined : result.error
	}, [])

	const setShortcut = useCallback((shortcut: string) => update({ shortcut }), [update])

	if (!settings) return <div className="settings" />

	return (
		<div className={`settings${embedded ? ' is-embedded' : ''}`}>
			{!embedded && <div className="titlebar" aria-hidden="true" />}
			<header className="settings-header">
				<img className="settings-logo" src={logoUrl} alt="" />
				<div>
					<h1>OpenPaste</h1>
					<p>Everything you copy, one shortcut away. Stored only on this computer.</p>
				</div>
			</header>

			<Section title="General">
				<Row label="Open OpenPaste with" note="Works from any app.">
					<ShortcutRecorder value={settings.shortcut} onChange={setShortcut} />
				</Row>
				<Row label="Open at login" htmlFor="s-login">
					<SettingToggle
						id="s-login"
						setting="launchAtLogin"
						settings={settings}
						onChange={update}
					/>
				</Row>
				<Row label="Appearance">
					<div className="segmented" role="radiogroup" aria-label="Appearance">
						{THEMES.map((t) => (
							<ThemeOption
								key={t.value}
								value={t.value}
								label={t.label}
								checked={settings.theme === t.value}
								onSelect={(theme) => update({ theme })}
							/>
						))}
					</div>
				</Row>
			</Section>

			<Section title="Pasting">
				<Row
					label="Paste into the app you were using"
					note="When off, choosing an item copies it and you paste it yourself."
					htmlFor="s-direct"
				>
					<SettingToggle
						id="s-direct"
						setting="pasteDirectly"
						settings={settings}
						onChange={update}
					/>
				</Row>
				{isMac && settings.pasteDirectly && permissions.accessibility === false && (
					<AccessibilityCallout />
				)}
				<Row
					label="Always paste as plain text"
					note="Strips fonts, colors and links. Hold Shift while pasting to do the opposite."
					htmlFor="s-plain"
				>
					<SettingToggle
						id="s-plain"
						setting="plainTextByDefault"
						settings={settings}
						onChange={update}
					/>
				</Row>
			</Section>

			<Section title="History">
				<Row
					label="Keep items for"
					note="Items saved to a pinboard are kept until you delete them."
					htmlFor="s-days"
				>
					<SettingSelect
						id="s-days"
						setting="historyDays"
						options={HISTORY_DAY_OPTIONS}
						settings={settings}
						onChange={update}
					/>
				</Row>
				<Row label="Keep at most" htmlFor="s-limit">
					<SettingSelect
						id="s-limit"
						setting="historyLimit"
						options={HISTORY_LIMIT_OPTIONS}
						settings={settings}
						onChange={update}
					/>
				</Row>
				<Row label="Save images" htmlFor="s-images">
					<SettingToggle
						id="s-images"
						setting="captureImages"
						settings={settings}
						onChange={update}
					/>
				</Row>
				<Row
					label="Save copied files"
					note="Stores the file locations, not copies of the files."
					htmlFor="s-files"
				>
					<SettingToggle
						id="s-files"
						setting="captureFiles"
						settings={settings}
						onChange={update}
					/>
				</Row>
				<ClearHistory />
			</Section>

			<Section title="Privacy">
				<Row
					label="Pause capturing"
					note="Nothing new is recorded until you turn this off."
					htmlFor="s-paused"
				>
					<SettingToggle
						id="s-paused"
						setting="paused"
						settings={settings}
						onChange={update}
					/>
				</Row>
				<Row
					label="Skip passwords"
					note="Ignores anything password managers mark as private when they copy it."
					htmlFor="s-concealed"
				>
					<SettingToggle
						id="s-concealed"
						setting="ignoreConcealed"
						settings={settings}
						onChange={update}
					/>
				</Row>
				<IgnoredApps
					ignoredApps={settings.ignoredApps}
					onChange={(ignoredApps) => update({ ignoredApps })}
				/>
			</Section>

			<Section title="About">
				<Row
					label={`OpenPaste ${env?.version ?? ''}`}
					note="Free and open source under the MIT license. Your history never leaves this computer."
				>
					{env?.platform !== 'web' && (
						<Button onClick={() => api.revealDataFolder()}>
							<Icon name="folder" size={15} /> Show data folder
						</Button>
					)}
				</Row>
			</Section>
		</div>
	)
}

export default memo(SettingsApp)
