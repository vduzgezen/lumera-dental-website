// portal/components/STLViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

    // 1. Scene Setup
    const scene = new THREE.Scene();
    // Use transparent background to let CSS variable show through
    scene.background = null;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Add alpha to renderer to support transparency
    renderer.setClearColor(0x000000, 0);
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(15, 25, 20); 
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-15, 5, 10);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, -10, -20);
    scene.add(backLight);

    const group = new THREE.Group();
    scene.add(group);

    let controls: OrbitControls | undefined;
    let raf = 0;

    const init = async () => {
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader.js");
      const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
      const { mergeVertices } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");

      if (cancelled) return;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.8;

      const fitCameraToObj = (obj: THREE.Object3D) => {
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        obj.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 10;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        cameraZ *= 2.0;

        camera.position.set(0, 0, cameraZ);
        camera.lookAt(0, 0, 0);
        controls?.target.set(0, 0, 0);
        controls?.update();
      };

      const processGeometry = (geometry: THREE.BufferGeometry) => {
        geometry.deleteAttribute('normal'); 
        geometry.deleteAttribute('uv');
        let smoothGeometry = mergeVertices(geometry, 1e-4);
        smoothGeometry.computeVertexNormals();
        return smoothGeometry;
      };

      const addMesh = (geometry: THREE.BufferGeometry) => {
        const smoothGeo = processGeometry(geometry);
        const material = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0, 
          roughness: 0.65,   
          metalness: 0.0,    
          flatShading: false,
        });

        const mesh = new THREE.Mesh(smoothGeo, material);
        group.add(mesh);
        fitCameraToObj(mesh);
      };

      const cleanUrl = url.split("?")[0].toLowerCase();
      try {
        if (cleanUrl.endsWith(".stl")) {
          new STLLoader().load(url, (geo) => !cancelled && addMesh(geo), undefined, (err) => !cancelled && handleError(err));
        } else if (cleanUrl.endsWith(".ply")) {
          new PLYLoader().load(url, (geo) => !cancelled && addMesh(geo), undefined, (err) => !cancelled && handleError(err));
        } else if (cleanUrl.endsWith(".obj")) {
          new OBJLoader().load(url, (obj) => {
              if (cancelled) return;
              obj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                   const mesh = child as THREE.Mesh;
                   const processed = processGeometry(mesh.geometry.clone());
                   mesh.geometry = processed;
                   mesh.material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.65, metalness: 0.0 });
                }
              });
              group.add(obj);
              fitCameraToObj(obj);
            }, undefined, (err) => !cancelled && handleError(err)
          );
        } else {
           new STLLoader().load(url, (geo) => !cancelled && addMesh(geo), undefined, (err) => !cancelled && handleError(err));
        }
      } catch (err) {
        handleError(err);
      }
    };

    const handleError = (err: any) => {
      console.error("3D Load Error:", err);
      setError("Failed to load 3D model.");
    };

    init();

    const animate = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
      controls?.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [url]);

  return (
    // FIX: Container background also Midnight Blue to match scene
    <div className="relative w-full h-full bg-background">
      <div ref={ref} className="w-full h-full cursor-move" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-red-400 font-medium px-4 py-2 bg-surface rounded-md border border-red-500/30">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}