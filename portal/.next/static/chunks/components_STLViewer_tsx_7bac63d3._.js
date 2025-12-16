(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/STLViewer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// components/STLViewer.tsx
__turbopack_context__.s([
    "default",
    ()=>STLViewer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function STLViewer(param) {
    let { url } = param;
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "STLViewer.useEffect": ()=>{
            if (!ref.current || !url) return;
            let cancelled = false;
            setError(null);
            const container = ref.current;
            const width = container.clientWidth || 400;
            const height = container.clientHeight || 320;
            const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
            scene.background = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x000000);
            const camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](45, width / height, 0.1, 1000);
            camera.position.set(0, 0, 200);
            const renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
                antialias: true
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            while(container.firstChild){
                container.removeChild(container.firstChild);
            }
            container.appendChild(renderer.domElement);
            const hemi = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HemisphereLight"](0xffffff, 0x444444, 0.9);
            scene.add(hemi);
            const dir = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0xffffff, 0.7);
            dir.position.set(5, 10, 7.5);
            scene.add(dir);
            const group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
            scene.add(group);
            let controls;
            let raf = 0;
            async function setupControls() {
                const mod = await __turbopack_context__.A("[project]/node_modules/three/examples/jsm/controls/OrbitControls.js [app-client] (ecmascript, async loader)");
                const OrbitControls = mod.OrbitControls;
                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
            }
            const frameObject = {
                "STLViewer.useEffect.frameObject": (obj)=>{
                    const box = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box3"]().setFromObject(obj);
                    const size = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
                    const center = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
                    box.getSize(size);
                    box.getCenter(center);
                    obj.position.sub(center);
                    const maxDim = Math.max(size.x, size.y, size.z) || 1;
                    const fov = camera.fov * Math.PI / 180;
                    let cameraZ = maxDim / (2 * Math.tan(fov / 2));
                    cameraZ *= 1.6;
                    camera.position.set(0, 0, cameraZ);
                    camera.lookAt(0, 0, 0);
                    controls === null || controls === void 0 ? void 0 : controls.target.set(0, 0, 0);
                    controls === null || controls === void 0 ? void 0 : controls.update();
                }
            }["STLViewer.useEffect.frameObject"];
            const addGeometry = {
                "STLViewer.useEffect.addGeometry": (geometry)=>{
                    var _geometry_computeVertexNormals;
                    (_geometry_computeVertexNormals = geometry.computeVertexNormals) === null || _geometry_computeVertexNormals === void 0 ? void 0 : _geometry_computeVertexNormals.call(geometry);
                    const material = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
                        color: 0xffffff,
                        metalness: 0.1,
                        roughness: 0.8
                    });
                    const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](geometry, material);
                    group.add(mesh);
                    frameObject(mesh);
                }
            }["STLViewer.useEffect.addGeometry"];
            const onLoadError = {
                "STLViewer.useEffect.onLoadError": (err)=>{
                    if (cancelled) return;
                    console.error("3D model load failed:", err);
                    setError("Could not load this 3D file.");
                }
            }["STLViewer.useEffect.onLoadError"];
            async function loadModel() {
                // ✅ Only strip query params, NOT '#'
                let cleanUrl = url.toLowerCase();
                const qIndex = cleanUrl.indexOf("?");
                if (qIndex >= 0) {
                    cleanUrl = cleanUrl.slice(0, qIndex);
                }
                try {
                    if (cleanUrl.endsWith(".stl")) {
                        const mod = await __turbopack_context__.A("[project]/node_modules/three/examples/jsm/loaders/STLLoader.js [app-client] (ecmascript, async loader)");
                        const STLLoader = mod.STLLoader;
                        const loader = new STLLoader();
                        loader.load(url, {
                            "STLViewer.useEffect.loadModel": (geometry)=>{
                                if (cancelled) return;
                                addGeometry(geometry);
                            }
                        }["STLViewer.useEffect.loadModel"], undefined, onLoadError);
                    } else if (cleanUrl.endsWith(".ply")) {
                        const mod = await __turbopack_context__.A("[project]/node_modules/three/examples/jsm/loaders/PLYLoader.js [app-client] (ecmascript, async loader)");
                        const PLYLoader = mod.PLYLoader;
                        const loader = new PLYLoader();
                        loader.load(url, {
                            "STLViewer.useEffect.loadModel": (geometry)=>{
                                if (cancelled) return;
                                addGeometry(geometry);
                            }
                        }["STLViewer.useEffect.loadModel"], undefined, onLoadError);
                    } else if (cleanUrl.endsWith(".obj")) {
                        const mod = await __turbopack_context__.A("[project]/node_modules/three/examples/jsm/loaders/OBJLoader.js [app-client] (ecmascript, async loader)");
                        const OBJLoader = mod.OBJLoader;
                        const loader = new OBJLoader();
                        loader.load(url, {
                            "STLViewer.useEffect.loadModel": (object)=>{
                                if (cancelled) return;
                                group.add(object);
                                frameObject(object);
                            }
                        }["STLViewer.useEffect.loadModel"], undefined, onLoadError);
                    } else {
                        console.warn("Unsupported 3D file type:", url);
                        setError("This file type is not supported for 3D preview.");
                    }
                } catch (e) {
                    onLoadError(e);
                }
            }
            setupControls().then(loadModel).catch({
                "STLViewer.useEffect": (err)=>onLoadError(err)
            }["STLViewer.useEffect"]);
            const animate = {
                "STLViewer.useEffect.animate": ()=>{
                    if (cancelled) return;
                    raf = requestAnimationFrame(animate);
                    controls === null || controls === void 0 ? void 0 : controls.update();
                    renderer.render(scene, camera);
                }
            }["STLViewer.useEffect.animate"];
            animate();
            const onResize = {
                "STLViewer.useEffect.onResize": ()=>{
                    const w = container.clientWidth || width;
                    const h = container.clientHeight || height;
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            }["STLViewer.useEffect.onResize"];
            window.addEventListener("resize", onResize);
            return ({
                "STLViewer.useEffect": ()=>{
                    cancelled = true;
                    cancelAnimationFrame(raf);
                    window.removeEventListener("resize", onResize);
                    renderer.dispose();
                    scene.clear();
                    while(container.firstChild){
                        container.removeChild(container.firstChild);
                    }
                }
            })["STLViewer.useEffect"];
        }
    }["STLViewer.useEffect"], [
        url
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: ref,
                className: "w-full h-full"
            }, void 0, false, {
                fileName: "[project]/components/STLViewer.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 flex items-center justify-center bg-black/60",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-red-300 px-3 text-center",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/components/STLViewer.tsx",
                    lineNumber: 198,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/STLViewer.tsx",
                lineNumber: 197,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/STLViewer.tsx",
        lineNumber: 194,
        columnNumber: 5
    }, this);
}
_s(STLViewer, "GEDjrAHWVqSOdOtCbbdusSgGNZ0=");
_c = STLViewer;
var _c;
__turbopack_context__.k.register(_c, "STLViewer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/STLViewer.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/STLViewer.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=components_STLViewer_tsx_7bac63d3._.js.map