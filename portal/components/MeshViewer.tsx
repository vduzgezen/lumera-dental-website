// components/MeshViewer.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
// @ts-ignore
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
// @ts-ignore
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
// @ts-ignore
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = { url: string; height?: number; autoRotate?: boolean };

export default function MeshViewer({ url, height = 360, autoRotate = false }: Props) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    el.innerHTML = "";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / height, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, height);
    el.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1, 1);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;

    function fitAndAdd(geom: THREE.BufferGeometry) {
      geom.computeVertexNormals?.();
      geom.computeBoundingBox();
      const bb = geom.boundingBox!;
      const size = new THREE.Vector3().subVectors(bb.max, bb.min);
      const center = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5);

      const mat = new THREE.MeshStandardMaterial({ metalness: 0.15, roughness: 0.45 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.sub(center);
      scene.add(mesh);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
      distance *= 1.7;
      camera.position.set(0, 0, distance);
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
      controls.update();
    }

    const ext = url.split(".").pop()?.toLowerCase();

    if (ext === "stl") {
      new STLLoader().load(url, (geom: any) => fitAndAdd(geom));
    } else if (ext === "ply") {
      new PLYLoader().load(url, (geom: any) => fitAndAdd(geom));
    } else if (ext === "obj") {
      new OBJLoader().load(url, (obj: any) => {
        // merge all geometry into one for framing (simple)
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        obj.position.sub(center);
        scene.add(obj);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        distance *= 1.7;
        camera.position.set(0, 0, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.update();
      });
    } else {
      const txt = document.createElement("div");
      txt.className = "text-white/60 text-sm";
      txt.innerText = "Unsupported format";
      el.appendChild(txt);
    }

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      if (!host.current) return;
      const w = host.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      renderer.dispose();
      el.innerHTML = "";
    };
  }, [url, height, autoRotate]);

  return <div ref={host} className="w-full" style={{ height }} />;
}
