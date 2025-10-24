"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
// The "examples" loaders/controls are not typed by default; ignore TS for these imports.
// @ts-ignore
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = {
  /** Public URL to the STL file (e.g., /uploads/<caseId>/<file>.stl) */
  url: string;
  /** Canvas height in pixels (responsive width) */
  height?: number;
  /** Optional: start with auto-rotate */
  autoRotate?: boolean;
};

export default function STLViewer({ url, height = 420, autoRotate = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Cleanup any previous renderer if hot reloading
    if (rendererRef.current) {
      rendererRef.current.dispose();
      el.innerHTML = "";
    }

    // Scene / Camera / Renderer
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / height, 0.1, 2000);
    camera.position.set(0, 0, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, height);

    el.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    scene.add(hemi);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(1, 1, 1);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-1, 0.5, -0.5);
    scene.add(dir2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;

    // Load STL
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry: THREE.BufferGeometry) => {
        geometry.computeVertexNormals(); // helps rendering if STL lacks normals
        const material = new THREE.MeshStandardMaterial({ metalness: 0.15, roughness: 0.45 });
        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;

        // Center & scale to fit
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox!;
        const size = new THREE.Vector3().subVectors(bb.max, bb.min);
        const center = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5);
        mesh.position.sub(center); // center mesh at (0,0,0)
        scene.add(mesh);

        // Frame camera to object
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        distance *= 1.6; // padding
        camera.position.set(0, 0, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.update();
      },
      undefined,
      (err: any) => {
        console.warn("STL load error:", err);
      }
    );

    // Animate
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    // Save refs for cleanup
    rendererRef.current = renderer;
    controlsRef.current = controls;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (controlsRef.current) controlsRef.current.dispose?.();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss?.();
        rendererRef.current.domElement?.remove();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.geometry?.dispose?.();
            obj.material?.dispose?.();
          }
        });
      }
      rendererRef.current = null;
      controlsRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, height, autoRotate]);

  return (
    <div className="w-full" ref={containerRef} style={{ height }} />
  );
}
