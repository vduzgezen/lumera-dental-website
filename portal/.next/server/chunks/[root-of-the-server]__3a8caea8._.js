module.exports = [
"[project]/.next-internal/server/app/api/cases/[id]/files/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// portal/lib/prisma.ts
__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: [
        "query",
        "error",
        "warn"
    ]
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForPrisma.prisma = prisma;
}
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSession",
    ()=>getSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
;
const COOKIE = "lumera_session";
const SECRET = process.env.JWT_SECRET;
async function getSession() {
    const jar = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])(); // async in Next 15
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, SECRET);
    } catch  {
        return null;
    }
}
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[project]/app/api/cases/[id]/files/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/cases/[id]/files/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
;
;
;
;
/**
 * Normalizes the slot label coming from the client ("scan",
 * "design_with_model", "design_only") into what we store in
 * CaseFile.label.
 */ function normalizeSlotLabel(raw) {
    const lower = (raw ?? "").toString().trim().toLowerCase();
    if (!lower) return "other";
    if (lower === "scan") return "scan";
    if (lower === "design_with_model" || lower === "model_plus_design") {
        return "design_with_model";
    }
    if (lower === "design_only") return "design_only";
    return lower;
}
/**
 * Choose a file extension & FileKind enum based on the incoming
 * filename and slot.
 */ function chooseExtAndKind(originalName, slot) {
    const lower = originalName.toLowerCase();
    // Treat Exocad HTML exports as HTML, not STL
    if (lower.endsWith(".html")) {
        return {
            ext: ".html",
            kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].OTHER
        };
    }
    if (lower.endsWith(".htm")) {
        return {
            ext: ".htm",
            kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].OTHER
        };
    }
    // 3D formats
    if (lower.endsWith(".stl")) return {
        ext: ".stl",
        kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].STL
    };
    if (lower.endsWith(".ply")) return {
        ext: ".ply",
        kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].PLY
    };
    if (lower.endsWith(".obj")) return {
        ext: ".obj",
        kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].OBJ
    };
    // No extension: assume STL for 3D slots
    if (slot === "scan" || slot === "design_with_model" || slot === "design_only") {
        return {
            ext: ".stl",
            kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].STL
        };
    }
    // Everything else
    return {
        ext: ".bin",
        kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].OTHER
    };
}
/**
 * Inject a tiny DOM-level translator for Exocad HTML viewers.
 */ function injectExocadTranslationScript(html) {
    if (html.includes("window.__LUMERA_EXOCAD_TRANSLATE__")) {
        return html;
    }
    const script = `
<script>
(function() {
  if (window.__LUMERA_EXOCAD_TRANSLATE__) return;
  window.__LUMERA_EXOCAD_TRANSLATE__ = true;

  var MAP = {
    "Antagonistler": "Antagonists",
    "Çene taramaları": "Jaw scans",
    "C\u0327ene taramaları": "Jaw scans",
    "Cene taramalari": "Jaw scans",
    "Tam anatomik": "Full contour",
    "Alt tasarım": "Reduced design",
    "Alt tasarim": "Reduced design",
    "Minimum kalınlık": "Minimum thickness",
    "Minimum kalinlik": "Minimum thickness",
    "Bütün çene": "Full arch",
    "Butun cene": "Full arch",
    "Dolgu boslugu": "Cement gap",
    "Dolgu boşluğu": "Cement gap"
  };

  function translateNode(node) {
    if (!node || !node.childNodes) return;
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (!child) continue;

      if (child.nodeType === 3) { // text node
        var text = child.nodeValue || "";
        if (!text) continue;
        var replaced = text;
        for (var key in MAP) {
          if (!Object.prototype.hasOwnProperty.call(MAP, key)) continue;
          if (replaced.indexOf(key) !== -1) {
            replaced = replaced.split(key).join(MAP[key]);
          }
        }
        if (replaced !== text) {
          child.nodeValue = replaced;
        }
      } else {
        translateNode(child);
      }
    }
  }

  function run() {
    try {
      translateNode(document.body);
    } catch (e) {
      console.error("Exocad translation failed", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  window.addEventListener("load", function() {
    setTimeout(run, 1000);
  });
})();
</script>
`;
    if (html.includes("</body>")) {
        return html.replace("</body>", script + "</body>");
    }
    return html + script;
}
async function POST(req, { params }) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    if (!session) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    // Only lab/admin can upload files
    if (session.role === "customer") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Only lab/admin may upload files."
        }, {
            status: 403
        });
    }
    const { id } = await params;
    const form = await req.formData();
    const slotLabel = normalizeSlotLabel(form.get("label"));
    // Support both "file" and "files" keys
    const incomingFiles = [
        ...form.getAll("file"),
        ...form.getAll("files")
    ].filter((f)=>f instanceof File);
    if (!incomingFiles.length) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "No files uploaded."
        }, {
            status: 400
        });
    }
    const dentalCase = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].dentalCase.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            stage: true
        }
    });
    if (!dentalCase) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Case not found."
        }, {
            status: 404
        });
    }
    // Business rule: scan HTML can only be replaced while in DESIGN stage
    if (slotLabel === "scan" && dentalCase.stage !== __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["ProductionStage"].DESIGN) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Scan files can only be uploaded while the case is in the DESIGN stage."
        }, {
            status: 400
        });
    }
    const uploadsRoot = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", id);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(uploadsRoot, {
        recursive: true
    });
    const created = [];
    // One file per slot: remove existing records for this slot on this case
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].caseFile.deleteMany({
        where: {
            caseId: id,
            label: slotLabel
        }
    });
    for (const file of incomingFiles){
        const arrayBuffer = await file.arrayBuffer();
        let buf = Buffer.from(arrayBuffer);
        const originalName = (file.name || "file").replace(/\s+/g, "_");
        // This respects .html / .htm and keeps them as HTML
        const { ext, kind } = chooseExtAndKind(originalName, slotLabel);
        const hasExt = originalName.toLowerCase().endsWith(ext);
        const base = hasExt ? originalName.slice(0, originalName.length - ext.length) : originalName;
        const safeName = `${base}${ext}`;
        const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(uploadsRoot, safeName);
        // If this is an HTML viewer, inject the translation helper
        if (ext === ".html" || ext === ".htm") {
            const text = buf.toString("utf8");
            const normalized = injectExocadTranslationScript(text);
            buf = Buffer.from(normalized, "utf8");
        }
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(fullPath, buf);
        const publicUrl = `/uploads/${id}/${safeName}`;
        const rec = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].caseFile.create({
            data: {
                caseId: id,
                label: slotLabel,
                kind: kind,
                url: publicUrl,
                sizeBytes: buf.length
            },
            select: {
                id: true,
                url: true,
                label: true,
                kind: true
            }
        });
        created.push(rec);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        files: created
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3a8caea8._.js.map