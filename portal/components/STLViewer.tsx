// components/STLViewer.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
// @ts-ignore – loader is ESM in three/examples
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export default function STLViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const width = ref.current.clientWidth;
    const height = ref.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a0a);
    ref.current.innerHTML = "";
    ref.current.appendChild(renderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0x888888);
    scene.add(light2);

    const loader = new STLLoader();
    let mesh: THREE.Mesh | null = null;

    loader.load(
      url,
      (geometry: any) => {
        geometry.center();
        const material = new THREE.MeshPhongMaterial({ flatShading: true });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.z = maxDim * 2.2;
      },
      undefined,
      (err: any) => {
        console.error("STL load failed", err);
      }
    );

    const controls = new (require("three/examples/jsm/controls/OrbitControls").OrbitControls)(
      camera,
      renderer.domElement
    );
    controls.enableDamping = true;

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!ref.current) return;
      const w = ref.current.clientWidth;
      const h = ref.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.clear();
    };
  }, [url]);

  return <div ref={ref} className="w-full h-full" />;
}
