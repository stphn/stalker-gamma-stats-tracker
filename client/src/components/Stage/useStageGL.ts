import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import fragmentShader from './shaders/fragment.glsl';
import gpgpuShader from './shaders/gpgpu/gpgpu.glsl';
import vertexShader from './shaders/vertex.glsl';

/**
 * Attaches a Three.js WebGL canvas overlay onto `containerRef`.
 * The canvas is positioned absolute, fills the container, and renders
 * the location image with a GPGPU mouse-displacement + RGB-split effect.
 */
export function useStageGL(
	containerRef: React.RefObject<HTMLDivElement | null>,
	src: string | null,
) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// ── Canvas ──────────────────────────────────────────────────────────
		const canvas = document.createElement('canvas');
		canvas.style.cssText =
			'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
		container.appendChild(canvas);
		canvasRef.current = canvas;

		// ── Renderer ─────────────────────────────────────────────────────────
		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: false,
			alpha: false,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// ── Scene / Camera ────────────────────────────────────────────────────
		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
		camera.position.z = 1;

		// ── Geometry ──────────────────────────────────────────────────────────
		// 128x128 segments so the vertex shader has enough geometry to deform
		const geometry = new THREE.PlaneGeometry(1, 1, 128, 128);

		// ── Texture ───────────────────────────────────────────────────────────
		const loader = new THREE.TextureLoader();
		let texture: THREE.Texture | null = null;
		if (src) {
			texture = loader.load(src);
			texture.colorSpace = THREE.SRGBColorSpace;
		}

		// ── GPGPU ─────────────────────────────────────────────────────────────
		const GPGPU_SIZE = 128; // resolution of the displacement texture
		const gpgpu = new GPUComputationRenderer(GPGPU_SIZE, GPGPU_SIZE, renderer);

		const positionTexture = gpgpu.createTexture();
		const positionVar = gpgpu.addVariable(
			'uCurrentPosition',
			gpgpuShader,
			positionTexture,
		);
		positionVar.material.uniforms.uMouse = {
			value: new THREE.Vector2(0.5, 0.5),
		};
		positionVar.material.uniforms.uMouseMoved = { value: 0 };
		positionVar.material.uniforms.uDeltaTime = { value: 0 };
		gpgpu.setVariableDependencies(positionVar, [positionVar]);

		const gpgpuError = gpgpu.init();
		if (gpgpuError) console.error('GPGPU init error:', gpgpuError);

		// ── Material ──────────────────────────────────────────────────────────
		const material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				uTexture: { value: texture },
				uGpgpu: { value: null },
				uResolution: { value: new THREE.Vector2() },
				uImageSize: { value: new THREE.Vector2(1, 1) },
				uTime: { value: 0 },
			},
		});

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		// Update image natural size via TextureLoader callback
		if (src) {
			loader.load(src, (tex) => {
				const img = tex.image as HTMLImageElement | ImageBitmap | null;
				if (img) {
					const w =
						'naturalWidth' in img
							? img.naturalWidth
							: (img as ImageBitmap).width;
					const h =
						'naturalHeight' in img
							? img.naturalHeight
							: (img as ImageBitmap).height;
					material.uniforms.uImageSize.value.set(w, h);
				}
			});
		}

		// ── Resize ────────────────────────────────────────────────────────────
		function resize() {
			const w = container?.clientWidth ?? 0;
			const h = container?.clientHeight ?? 0;
			if (w === 0 || h === 0) return;
			renderer.setSize(w, h, false);
			material.uniforms.uResolution.value.set(w, h);
		}
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(container);

		// ── Mouse ─────────────────────────────────────────────────────────────
		let mouseMoveTimeout = 0;
		function onMouseMove(e: MouseEvent) {
			const rect = container?.getBoundingClientRect();
			if (!rect) return;
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1 - (e.clientY - rect.top) / rect.height; // flip Y for GL
			positionVar.material.uniforms.uMouse.value.set(x, y);
			positionVar.material.uniforms.uMouseMoved.value = 1;
			clearTimeout(mouseMoveTimeout);
			mouseMoveTimeout = window.setTimeout(() => {
				positionVar.material.uniforms.uMouseMoved.value = 0;
			}, 100);
		}
		container.addEventListener('mousemove', onMouseMove);

		// ── Render loop ───────────────────────────────────────────────────────
		let animId = 0;
		let last = performance.now();

		function tick() {
			animId = requestAnimationFrame(tick);
			const now = performance.now();
			const delta = Math.min((now - last) / 1000, 0.05); // cap at 50ms
			last = now;

			positionVar.material.uniforms.uDeltaTime.value = delta;
			gpgpu.compute();

			material.uniforms.uGpgpu.value =
				gpgpu.getCurrentRenderTarget(positionVar).texture;
			material.uniforms.uTime.value += delta;

			renderer.render(scene, camera);
		}
		tick();

		// ── Cleanup ───────────────────────────────────────────────────────────
		return () => {
			cancelAnimationFrame(animId);
			ro.disconnect();
			container.removeEventListener('mousemove', onMouseMove);
			clearTimeout(mouseMoveTimeout);
			mesh.geometry.dispose();
			material.dispose();
			texture?.dispose();
			gpgpu.dispose();
			renderer.dispose();
			canvas.remove();
			canvasRef.current = null;
		};
	}, [containerRef, src]);
}
