// components/STLViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function STLViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !url) return;

    let cancelled = false;
    setError(null);

    const container = ref.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    let controls: any;
    let raf = 0;

    async function setupControls() {
      const mod = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      const OrbitControls = mod.OrbitControls;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
    }

    const frameObject = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      obj.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const fov = (camera.fov * Math.PI) / 180;
      let cameraZ = maxDim / (2 * Math.tan(fov / 2));
      cameraZ *= 1.6;

      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, 0);
      controls?.target.set(0, 0, 0);
      controls?.update();
    };

    const addGeometry = (geometry: THREE.BufferGeometry) => {
      geometry.computeVertexNormals?.();
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      frameObject(mesh);
    };

    const onLoadError = (err: any) => {
      if (cancelled) return;
      console.error("3D model load failed:", err);
      setError("Could not load this 3D file.");
    };

    async function loadModel() {
      // ✅ Only strip query params, NOT '#'
      let cleanUrl = url.toLowerCase();
      const qIndex = cleanUrl.indexOf("?");
      if (qIndex >= 0) {
        cleanUrl = cleanUrl.slice(0, qIndex);
      }

      try {
        if (cleanUrl.endsWith(".stl")) {
          const mod = await import(
            "three/examples/jsm/loaders/STLLoader.js"
          );
          const STLLoader = mod.STLLoader;
          const loader = new STLLoader();
          loader.load(
            url,
            (geometry: any) => {
              if (cancelled) return;
              addGeometry(geometry as THREE.BufferGeometry);
            },
            undefined,
            onLoadError,
          );
        } else if (cleanUrl.endsWith(".ply")) {
          const mod = await import(
            "three/examples/jsm/loaders/PLYLoader.js"
          );
          const PLYLoader = mod.PLYLoader;
          const loader = new PLYLoader();
          loader.load(
            url,
            (geometry: any) => {
              if (cancelled) return;
              addGeometry(geometry as THREE.BufferGeometry);
            },
            undefined,
            onLoadError,
          );
        } else if (cleanUrl.endsWith(".obj")) {
          const mod = await import(
            "three/examples/jsm/loaders/OBJLoader.js"
          );
          const OBJLoader = mod.OBJLoader;
          const loader = new OBJLoader();
          loader.load(
            url,
            (object: THREE.Object3D) => {
              if (cancelled) return;
              group.add(object);
              frameObject(object);
            },
            undefined,
            onLoadError,
          );
        } else {
          console.warn("Unsupported 3D file type:", url);
          setError("This file type is not supported for 3D preview.");
        }
      } catch (e) {
        onLoadError(e);
      }
    }

    setupControls()
      .then(loadModel)
      .catch((err) => onLoadError(err));

    const animate = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.clear();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [url]);

  return (
    <div className="relative w-full h-full">
      <div ref={ref} className="w-full h-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-xs text-red-300 px-3 text-center">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
