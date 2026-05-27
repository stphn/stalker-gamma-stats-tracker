interface Props {
	trigger: number;
}

export function BloodSplatter({ trigger }: Props) {
	if (!trigger) return null;

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				pointerEvents: 'none',
				zIndex: 20,
				animation: 'blood-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
			}}
			aria-hidden="true"
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'radial-gradient(ellipse at center, transparent 20%, rgba(180,0,0,0.08) 55%, rgba(180,0,0,0.82) 100%)',
					animation: 'vignette-flash 2.2s ease-out forwards',
				}}
			/>
		</div>
	);
}
