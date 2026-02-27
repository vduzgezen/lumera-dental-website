// app/portal/cases/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CaseProcessBar from "@/components/CaseProcessBar";
import CaseViewerTabs from "@/features/case-dashboard/components/CaseViewerTabs";
import CopyableId from "@/components/CopyableId";
import CaseDetailSidebar from "@/components/CaseDetailSidebar";
import AutoRefresh from "@/components/ui/AutoRefresh";
import { getSignedFileUrl } from "@/lib/storage";
import { formatProductName } from "@/lib/pricing";


export const dynamic = "force-dynamic";
type ProductionStage = "DESIGN" | "MILLING_GLAZING" | "SHIPPING" | "COMPLETED";
type Params = Promise<{ id: string }>;
function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function baseNameFromUrl(url?: string | null): string {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1] || "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function normalizeSlot(
  label: string | null,
): "scan" | "design_with_model" |
"design_only" | null {
  const lower = String(label ?? "").toLowerCase();
  if (lower === "scan") return "scan";
  if (lower === "design_with_model" || lower === "model_plus_design") {
    return "design_with_model";
  }
  if (lower === "design_only") return "design_only";
  return null;
}



export default async function CaseDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return notFound();

  const item = await prisma.dentalCase.findUnique({
    where: { id },
    include: {
      clinic: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { at: "asc" } },
      comments: { 
        include: { attachments: true },
        orderBy: { createdAt: "desc" } 
      },
   
      assigneeUser: { select: { id: true, name: true, email: true } },
      doctorUser: { select: { requiresStrictDesignApproval: true } } // ✅ Pull Doctor Pref
    },
  });
  if (!item) return notFound();

  if (item.status === "CANCELLED") {
    redirect("/portal/cases");
  }

  const isCustomer = session.role === "customer";

  if (isCustomer) {
    const isOwner = item.doctorUserId === session.userId;
    const isPrimaryClinic = session.clinicId === item.clinicId;
    if (!isOwner && !isPrimaryClinic) return notFound();
  }

  const needsDoctorReset = isCustomer && item.unreadForDoctor;
  const needsLabReset = !isCustomer && item.unreadForLab;

  if (needsDoctorReset || needsLabReset) {
      await prisma.dentalCase.update({
          where: { id },
          data: {
              unreadForDoctor: isCustomer ? false : item.unreadForDoctor,
              unreadForLab: !isCustomer ? false : item.unreadForLab
          }
      });
  }

  const hydratedFiles = await Promise.all(item.files.map(async (f) => {
    if (f.url.startsWith("/") || f.url.startsWith("http")) return f;
    try {
        const signed = await getSignedFileUrl(f.url);
        return { ...f, url: signed };
    } catch (e) {
        console.error(`Failed to sign URL for ${f.url}`, e);
        return f; 
    }
  }));
  item.files = hydratedFiles as any;

  const hydratedComments = await Promise.all(item.comments.map(async (c) => {
      const attachments = await Promise.all(c.attachments.map(async (a) => {
          if (a.url.startsWith("/") || a.url.startsWith("http")) return a;
          try {
              const signed = await getSignedFileUrl(a.url);
              return { ...a, url: signed };
          } 
 
          catch (e) { return a; }
      }));
      return { ...c, attachments };
  }));
  const authorIds = Array.from(new Set(item.comments.map(c => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, role: true, email: true }
  });
  const authorMap = new Map(authors.map(u => [u.id, u]));

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true }
  });
  const currentUserName = currentUser?.name || currentUser?.email || "Unknown";

  const uiComments = hydratedComments.map(c => {
    const author = authorMap.get(c.authorId);
    return {
      id: c.id,
      body: c.body,
      at: c.createdAt,
      author: author?.name || author?.email || "Unknown",
      role: author?.role || "user",
      attachments: c.attachments.map(a => ({
        id: a.id,
        url: a.url,
       
        kind: a.kind
      }))
    };
  });
  const isLabOrAdmin = session.role === "lab" || session.role === "admin";
  let designers: { id: string; name: string | null;
  email: string }[] = [];
  if (session.role === "admin") {
    designers = await prisma.user.findMany({
      where: { role: { in: ["lab", "admin"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    });
  }

  let scanHtmlFile: any = null;
  for (const f of item.files ?? []) {
    const lbl = String(f.label ?? "").toLowerCase();
    if (lbl === "scan_html") { scanHtmlFile = f; continue; }
  }

  const teeth = item.toothCodes.split(",").map(t => t.trim()).filter(Boolean);
  const hasBridgeDesign = item.files.some((f: any) => f.label === "design_only");
  const hasIndividualDesigns = teeth.length > 0 && teeth.every(tooth => item.files.some((f: any) => f.label === `design_stl_${tooth}`));
  const hasAllDesigns = item.isBridge ? hasBridgeDesign : (hasIndividualDesigns || hasBridgeDesign);
  const statusColor = 
    item.status === "CHANGES_REQUESTED" ? "text-red-400" :
    item.status === "COMPLETED" ||
    item.status === "DELIVERED" ? "text-emerald-400" :
    "text-foreground";
    
  return (
    <section className="h-full w-full flex flex-col p-4 overflow-hidden">
      <AutoRefresh intervalMs={60000} />

      <div className="flex-none space-y-3 mb-2">
        <CaseProcessBar
          caseId={item.id}
          stage={item.stage as ProductionStage}
          status={item.status}
          role={session.role as any}
          carrier={item.shippingCarrier}
          tracking={item.trackingNumber}
          files={item.files} 
        />
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{item.patientAlias}</h1>
            <div className="text-muted text-xs mt-1 flex flex-wrap items-center gap-y-1 gap-x-3">
             
              <span>Clinic: <span className="text-foreground">{item.clinic.name}</span></span>
       
              <span>•</span>
              
              {isLabOrAdmin && item.doctorName && (
                <><span>Doctor: <span className="text-foreground">{item.doctorName}</span></span><span>•</span></>
              )}

            
              {isLabOrAdmin && item.assigneeUser && (
           
                <>
                  <span>Designer: <span className="text-foreground">{item.assigneeUser.name ||
                  item.assigneeUser.email}</span></span>
                  <span>•</span>
                </>
              )}

              <span>Restoration: <span className="text-foreground capitalize">{formatProductName(item.product)}</span></span>
              <span>•</span>
              <span>Teeth: <span className="text-foreground">{item.toothCodes}</span></span>
     
              <span>•</span>
              <span>Status: <span className={`${statusColor} font-medium`}>{item.status.replace(/_/g, " ")}</span></span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                 <span>ID:</span><CopyableId id={item.id} />
              </div>
   
            </div>
          </div>
          
          <Link href="/portal/cases" className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-[var(--accent-dim)] transition text-xs font-medium text-muted">
            ← Cases
          </Link>
        </div>
      </div>

  
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
   
       <div className="flex-none w-full lg:w-[350px] xl:w-[400px] h-full min-h-0">
           <CaseDetailSidebar 
            caseId={item.id}
            role={session.role as any}
            files={item.files}
            comments={uiComments}
            events={item.events}
            currentUserName={currentUserName}
            doctorPreferences={item.doctorPreferences}
            caseNotes={item.caseNotes as string} 
            assigneeId={item.assigneeId}
            designers={designers}
            toothCodes={item.toothCodes}
            isBridge={item.isBridge}
            product={item.product}
          />
 
        </div>

        <div className="flex-1 h-full min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <CaseViewerTabs
              caseId={item.id}
              role={session.role as any}
              status={item.status}
              files={item.files}
              toothCodes={item.toothCodes}
              isBridge={item.isBridge}
              requiresStrictApproval={item.doctorUser?.requiresStrictDesignApproval} // ✅ PASSED PROP
            />
          </div>
       </div>
      </div>
    
    </section>
  );
}