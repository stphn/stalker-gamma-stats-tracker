import { IconContext } from '@phosphor-icons/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './reset.css';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './i18n/I18nContext';

// Phosphor icons render a bare <svg> with no aria-hidden by default, so screen
// readers (JAWS/VoiceOver) announce them as unlabelled graphics. Every icon in
// this app is decorative — it sits beside text or inside an aria-labelled
// control — so hide them all at the root. Any icon that ever needs to be
// meaningful can override with aria-hidden={false} + alt at the call site.
const iconDefaults = { 'aria-hidden': true, focusable: false } as const;

// biome-ignore lint/style/noNonNullAssertion: #root always exists in index.html
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nProvider>
			<IconContext.Provider value={iconDefaults}>
				<App />
			</IconContext.Provider>
		</I18nProvider>
	</StrictMode>,
);
