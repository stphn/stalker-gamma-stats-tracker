import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './reset.css';
import './index.css';
import App from './App.tsx';

// biome-ignore lint/style/noNonNullAssertion: #root always exists in index.html
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
