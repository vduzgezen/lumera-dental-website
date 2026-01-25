// app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

function zipFiles(files: { path: string, name: string }[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.on("error", reject);
        archive.on("data", (chunk) => chunks.push(chunk));
        archive.on("end", () => resolve(Buffer.concat(chunks)));

        files.forEach(f => {
            if (fs.existsSync(f.path)) {
                archive.file(f.path, { name: f.name });
            }
        });

        archive.finalize();
    });
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "milling" && session.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        // FETCH: Get details needed for naming (Shade, Material, Product)
        const caseFiles = await prisma.caseFile.findMany({
            where: { caseId: { in: ids } },
            include: { 
                case: { 
                    select: { 
                        patientAlias: true, 
                        shade: true, 
                        material: true, 
                        product: true 
                    } 
                } 
            }
        });

        const fileList: { path: string, name: string }[] = [];
        
        for (const file of caseFiles) {
            const relativePath = file.url.replace(/^\//, "");
            const diskPath = path.join(process.cwd(), "public", relativePath);
            
            // --- NEW NAMING LOGIC ---
            // Format: AliasColorMaterialType (No Spaces)
            const c = file.case;
            const alias = c.patientAlias || "Unknown";
            const color = c.shade || "";
            const material = c.material || "";
            const type = c.product || "";

            // Construct Base Name
            const rawBase = `${alias}${color}${material}${type}`;
            // Remove ALL spaces
            const cleanBase = rawBase.replace(/\s+/g, ""); 
            
            // Clean Label (e.g. "model_top" -> "ModelTop")
            const cleanLabel = (file.label || "File").replace(/_/g, "").replace(/\s+/g, "");
            
            // Final Filename: [Base]_[Label].[ext]
            // Example: QW44A2ZirconiaCrown_ModelTop.stl
            const ext = path.extname(diskPath);
            const fileName = `${cleanBase}_${cleanLabel}${ext}`;

            fileList.push({ path: diskPath, name: fileName });
        }

        if (fileList.length === 0) {
            return NextResponse.json({ error: "No files found for selected cases" }, { status: 404 });
        }

        const buffer = await zipFiles(fileList);

        // LOGIC: Automatically move APPROVED cases to IN_MILLING
        await prisma.dentalCase.updateMany({
            where: { 
                id: { in: ids },
                status: "APPROVED" 
            },
            data: {
                status: "IN_MILLING",
                stage: "MILLING_GLAZING",
                milledAt: new Date()
            }
        });

        return new NextResponse(buffer as any, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="production_batch.zip"`
            }
        });
    } catch (e) {
        console.error("Batch zip error:", e);
        return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
    }
}