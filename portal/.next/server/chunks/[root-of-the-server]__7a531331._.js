module.exports = [
"[project]/.next-internal/server/app/api/cases/new/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/app/api/cases/new/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/cases/new/route.ts
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
const MAX_SCAN_VIEWER_BYTES = 200 * 1024 * 1024; // 200MB
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    x.setHours(0, 0, 0, 0);
    return x;
}
/**
 * Sanitize an HTML filename
 */ function sanitizeHtmlFileName(original, fallbackBase) {
    const baseName = (original || fallbackBase).replace(/\s+/g, "_");
    const lower = baseName.toLowerCase();
    let ext = ".html";
    if (lower.endsWith(".html")) {
        ext = ".html";
    } else if (lower.endsWith(".htm")) {
        ext = ".htm";
    }
    let nameWithoutExt = baseName;
    if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        const idx = baseName.lastIndexOf(".");
        if (idx >= 0) {
            nameWithoutExt = baseName.slice(0, idx);
        }
    }
    const cleanedBase = nameWithoutExt.replace(/[?#]/g, "");
    return cleanedBase + ext;
}
/**
 * Normalize Exocad HTML text
 */ function normalizeExocadHtml(html) {
    const script = `
<script>
(function() {
  var MAP = {
    "Antagonistler": "Antagonists",
    "Çene taramaları": "Jaw scans",
    "Çene taramaları": "Jaw scans",
    "Cene taramalari": "Jaw scans",
    "Çene taraması": "Jaw scan",
    "Tam anatomik": "Full anatomy",
    "Alt tasarım": "Lower design",
    "Alt tasarim": "Lower design",
    "Minimum kalınlık": "Minimum thickness",
    "Minimum kalinlik": "Minimum thickness",
    "Bütün çene": "Whole jaw",
    "Butun cene": "Whole jaw",
    "Dolgu boslugu": "Filling gap"
  };

  function translateNode(node) {
    if (!node) return;
    if (node.nodeType === 3) { // text
      var text = node.nodeValue || "";
      var changed = false;
      for (var key in MAP) {
        if (!Object.prototype.hasOwnProperty.call(MAP, key)) continue;
        if (text.indexOf(key) !== -1) {
          text = text.split(key).join(MAP[key]);
          changed = true;
        }
      }
      if (changed) {
        node.nodeValue = text;
      }
      return;
    }
    if (node.nodeType === 1 && node.childNodes && node.childNodes.length) {
      for (var i = 0; i < node.childNodes.length; i++) {
        translateNode(node.childNodes[i]);
      }
    }
  }

  function run() {
    try {
      translateNode(document.body);
    } catch (e) {
      console.error("Exocad translation script error:", e);
    }
  }

  window.addEventListener("load", function() {
    setTimeout(run, 500);
  });
})();
</script>
`;
    if (html.includes("</body>")) {
        return html.replace("</body>", script + "\n</body>");
    }
    return html + script;
}
async function POST(req) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
        if (!session) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Please sign in."
            }, {
                status: 401
            });
        }
        if (session.role === "customer") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Only lab/admin can create cases."
            }, {
                status: 403
            });
        }
        const form = await req.formData();
        const alias = form.get("patientAlias");
        const doctorUserId = form.get("doctorUserId");
        const toothCodes = form.get("toothCodes");
        const orderDateRaw = form.get("orderDate");
        const product = form.get("product");
        const material = form.get("material");
        const shade = form.get("shade");
        // Scan viewer HTML: prefer explicit field, fall back to "scan" for compatibility
        const scanViewerRaw = form.get("scanHtml") ?? form.get("scan");
        if (typeof alias !== "string" || !alias.trim()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Patient alias is required."
            }, {
                status: 400
            });
        }
        if (typeof doctorUserId !== "string" || !doctorUserId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Doctor user id is required."
            }, {
                status: 400
            });
        }
        if (typeof toothCodes !== "string" || !toothCodes.trim()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Tooth codes are required."
            }, {
                status: 400
            });
        }
        if (typeof orderDateRaw !== "string") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Order date missing or invalid."
            }, {
                status: 400
            });
        }
        if (typeof product !== "string" || !product) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Product is required."
            }, {
                status: 400
            });
        }
        if (!(scanViewerRaw instanceof File)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Scan viewer HTML is required."
            }, {
                status: 400
            });
        }
        const orderDate = new Date(orderDateRaw);
        if (Number.isNaN(orderDate.getTime())) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Order date invalid."
            }, {
                status: 400
            });
        }
        const dueDate = addDays(orderDate, 8);
        const doctor = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                id: doctorUserId
            },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!doctor || doctor.role !== "customer") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Doctor account not found."
            }, {
                status: 400
            });
        }
        if (!doctor.clinicId || !doctor.clinic) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Doctor has no clinic linked."
            }, {
                status: 400
            });
        }
        // Validate scan viewer type and size
        const scanViewer = scanViewerRaw;
        const originalName = scanViewer.name || "scan_viewer.html";
        const lower = originalName.toLowerCase();
        if (!lower.endsWith(".html") && !lower.endsWith(".htm")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Scan viewer must be an HTML file."
            }, {
                status: 400
            });
        }
        const scanBuf = Buffer.from(await scanViewer.arrayBuffer());
        if (scanBuf.length > MAX_SCAN_VIEWER_BYTES) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Scan viewer file is too large."
            }, {
                status: 400
            });
        }
        // DIRECT FIX: Use prisma.dentalCase.create and proper Enum casting
        const created = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].dentalCase.create({
            data: {
                clinicId: doctor.clinic.id,
                doctorUserId: doctor.id,
                patientAlias: alias.trim(),
                doctorName: doctor.name ?? null,
                toothCodes: toothCodes.trim(),
                orderDate,
                dueDate,
                product: product,
                material: typeof material === "string" && material.trim() ? material.trim() : null,
                shade: typeof shade === "string" && shade.trim() ? shade.trim() : null,
                status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["CaseStatus"].IN_DESIGN,
                stage: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["ProductionStage"].DESIGN
            },
            select: {
                id: true
            }
        });
        // Save scan viewer HTML under /public/uploads/<caseId>/<filename>
        const uploadsRoot = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", created.id);
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(uploadsRoot, {
            recursive: true
        });
        const safeName = sanitizeHtmlFileName(originalName, "scan_viewer.html");
        const htmlText = scanBuf.toString("utf8");
        const normalized = normalizeExocadHtml(htmlText);
        const finalBuf = Buffer.from(normalized, "utf8");
        const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(uploadsRoot, safeName);
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(fullPath, finalBuf);
        const publicUrl = `/uploads/${created.id}/${safeName}`;
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].caseFile.create({
            data: {
                caseId: created.id,
                label: "scan_html",
                kind: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["FileKind"].OTHER,
                url: publicUrl,
                sizeBytes: finalBuf.length
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            id: created.id
        });
    } catch (err) {
        console.error("Create case error:", err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Something went wrong creating the case."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7a531331._.js.map