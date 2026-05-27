import { useEffect } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import fragmentShader from './shaders/fragment.glsl';
import gpgpuShader from './shaders/gpgpu/gpgpu.glsl';
import vertexShader from './shaders/vertex.glsl';

// Match J0SUKE's defaults
const PARAMS = {
	relaxation: 0.965,
	size: 700, // number of GPGPU cells (sqrt → grid dimension)
	distance: 0.6, // mouse influence radius (multiplied by 10 for shader)
	strength: 0.8, // mouse delta multiplier
};

export function useStageGL(
	containerRef: React.RefObject<HTMLDivElement | null>,
	src: string | null,
) {
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// ── Canvas ────────────────────────────────────────────────────────────
		const canvas = document.createElement('canvas');
		canvas.style.cssText =
			'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
		container.appendChild(canvas);

		// ── Renderer ──────────────────────────────────────────────────────────
		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: false,
			alpha: false,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// ── Scene / Camera (orthographic — fills canvas exactly) ──────────────
		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
		camera.position.z = 1;

		// ── Raycaster for UV picking ───────────────────────────────────────────
		const raycaster = new THREE.Raycaster();
		const mouseNDC = new THREE.Vector2();

		// ── Geometry / Texture ────────────────────────────────────────────────
		const geometry = new THREE.PlaneGeometry(1, 1);
		const loader = new THREE.TextureLoader();

		let texture: THREE.Texture | null = null;
		const imageRes = new THREE.Vector2(1, 1);

		if (src) {
			texture = loader.load(src, (tex) => {
				const img = tex.image as HTMLImageElement | ImageBitmap;
				const w = 'naturalWidth' in img ? img.naturalWidth : img.width;
				const h = 'naturalHeight' in img ? img.naturalHeight : img.height;
				imageRes.set(w, h);
				material.uniforms.uImageResolution.value = imageRes;
			});
			texture.colorSpace = THREE.SRGBColorSpace;
		}

		// ── GPGPU ─────────────────────────────────────────────────────────────
		const gpgpuSize = Math.ceil(Math.sqrt(PARAMS.size)); // ~27
		const gpgpu = new GPUComputationRenderer(gpgpuSize, gpgpuSize, renderer);

		const dataTexture = gpgpu.createTexture();
		const variable = gpgpu.addVariable('uGrid', gpgpuShader, dataTexture);

		variable.material.uniforms.uTime = new THREE.Uniform(0);
		variable.material.uniforms.uRelaxation = new THREE.Uniform(
			PARAMS.relaxation,
		);
		variable.material.uniforms.uGridSize = new THREE.Uniform(gpgpuSize);
		variable.material.uniforms.uMouse = new THREE.Uniform(
			new THREE.Vector2(0, 0),
		);
		variable.material.uniforms.uDeltaMouse = new THREE.Uniform(
			new THREE.Vector2(0, 0),
		);
		variable.material.uniforms.uMouseMove = new THREE.Uniform(0);
		variable.material.uniforms.uDistance = new THREE.Uniform(
			PARAMS.distance * 10,
		);

		gpgpu.setVariableDependencies(variable, [variable]);
		const gpgpuErr = gpgpu.init();
		if (gpgpuErr) console.error('GPGPU init:', gpgpuErr);

		// ── Material ──────────────────────────────────────────────────────────
		const material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				uTexture: { value: texture },
				uGrid: { value: null },
				uContainerResolution: { value: new THREE.Vector2() },
				uImageResolution: { value: imageRes },
			},
		});

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		// ── Resize ────────────────────────────────────────────────────────────
		function resize() {
			const w = container?.clientWidth ?? 0;
			const h = container?.clientHeight ?? 0;
			if (!w || !h) return;
			renderer.setSize(w, h, false);
			material.uniforms.uContainerResolution.value.set(w, h);
		}
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(container);

		// ── Mouse — raycaster picks UV on the mesh ────────────────────────────
		function onMouseMove(e: MouseEvent) {
			const rect = container?.getBoundingClientRect();
			if (!rect) return;

			// NDC [-1, 1] relative to canvas
			mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(mouseNDC, camera);
			const hits = raycaster.intersectObject(mesh);
			if (!hits.length || !hits[0].uv) return;

			const uv = hits[0].uv;
			const current = variable.material.uniforms.uMouse.value as THREE.Vector2;

			// Delta = how far the mouse moved in UV space, scaled by strength
			const delta = new THREE.Vector2().subVectors(uv, current);
			delta.multiplyScalar(PARAMS.strength * 100);

			variable.material.uniforms.uDeltaMouse.value = delta;
			variable.material.uniforms.uMouse.value = uv.clone();
			variable.material.uniforms.uMouseMove.value = 1;
		}
		container.addEventListener('mousemove', onMouseMove);

		// ── Render loop ───────────────────────────────────────────────────────
		let animId = 0;
		let time = 0;
		const clock = new THREE.Clock();

		function tick() {
			animId = requestAnimationFrame(tick);
			time = clock.getElapsedTime();

			// Per-frame decay — exactly as in J0SUKE's GPGPU.render()
			variable.material.uniforms.uTime.value = time;
			variable.material.uniforms.uMouseMove.value *= 0.95;
			(
				variable.material.uniforms.uDeltaMouse.value as THREE.Vector2
			).multiplyScalar(variable.material.uniforms.uRelaxation.value as number);

			gpgpu.compute();
			material.uniforms.uGrid.value =
				gpgpu.getCurrentRenderTarget(variable).texture;

			renderer.render(scene, camera);
		}
		tick();

		// ── Cleanup ───────────────────────────────────────────────────────────
		return () => {
			cancelAnimationFrame(animId);
			ro.disconnect();
			container.removeEventListener('mousemove', onMouseMove);
			mesh.geometry.dispose();
			material.dispose();
			texture?.dispose();
			gpgpu.dispose();
			renderer.dispose();
			canvas.remove();
		};
	}, [containerRef, src]);
}
