// app/api/cases/batch/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

// Helper to wrap archiver in a promise
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
        // Role check should now pass cleanly with updated lib/auth.ts
        if (!session || (session.role !== "milling" && session.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        // Fetch all files for these cases
        const caseFiles = await prisma.caseFile.findMany({
            where: { caseId: { in: ids } },
            include: { case: { select: { patientAlias: true, toothCodes: true } } }
        });

        const fileList: { path: string, name: string }[] = [];

        for (const file of caseFiles) {
            // Clean up the URL to get the file system path
            // URL: /uploads/[id]/[name] -> Path: public/uploads/[id]/[name]
            const relativePath = file.url.replace(/^\//, ""); // remove leading slash
            const diskPath = path.join(process.cwd(), "public", relativePath);
            
            // Organize zip structure: [CaseID]_[Patient]/[Label]_[OriginalName]
            const folderName = `${file.caseId.slice(-4)}_${file.case.patientAlias.replace(/\s+/g, "_")}`;
            const cleanLabel = file.label?.replace(/_/g, " ").toUpperCase() || "FILE";
            const fileName = `${folderName}/${cleanLabel}_${path.basename(diskPath)}`;

            fileList.push({ path: diskPath, name: fileName });
        }

        if (fileList.length === 0) {
            return NextResponse.json({ error: "No files found for selected cases" }, { status: 404 });
        }

        const buffer = await zipFiles(fileList);

        // FIX: Cast buffer to 'any' or 'BodyInit' to satisfy strict TS
        return new NextResponse(buffer as any, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="batch_cases.zip"`
            }
        });

    } catch (e) {
        console.error("Batch zip error:", e);
        return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
    }
}