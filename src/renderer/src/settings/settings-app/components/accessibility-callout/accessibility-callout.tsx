import { memo } from 'react'
import { api } from '@renderer/api'
import { Button } from '@renderer/components/button'
import { Icon } from '@renderer/components/icon'

/** Asks for the macOS Accessibility permission that pasting into other apps needs. */
const AccessibilityCallout = () => (
	<div className="callout" role="note">
		<Icon name="paste" size={18} />
		<p>
			macOS needs your permission before OpenPaste can press ⌘V for you. Turn on OpenPaste
			under Privacy &amp; Security → Accessibility.
		</p>
		<Button onClick={() => api.openAccessibilitySettings()}>Open Accessibility settings</Button>
	</div>
)

export default memo(AccessibilityCallout)
