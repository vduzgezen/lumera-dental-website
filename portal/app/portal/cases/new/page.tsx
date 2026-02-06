// portal/app/portal/cases/new/page.tsx
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewCaseForm from "@/components/NewCaseForm";
import type { DoctorRow } from "@/components/new-case/types";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const session = await getSession();
  if (!session) return redirect("/login");

  const role = session.role;
  // ✅ FIX: Only Lab and Admin can create cases
  const canCreate = role === "lab" || role === "admin";
  
  if (!canCreate) {
    return (
      <div className="p-8 text-center text-white/60">
        You do not have permission to create cases.
      </div>
    );
  }

  let doctors: DoctorRow[] = [];

  if (role === "admin" || role === "lab") {
    const rawDoctors = await prisma.user.findMany({
      where: { role: "customer" },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        preferenceNote: true,
        defaultDesignPreferences: true,
        clinic: { 
            select: { 
                id: true, 
                name: true, 
                priceTier: true 
            } 
        },
        secondaryClinics: { 
            select: { 
                id: true, 
                name: true,
                priceTier: true 
            } 
        }
      },
      orderBy: { name: "asc" }
    });
    
    doctors = rawDoctors;
  }

  // (Current User Data fetch is redundant now since Customers can't access this)
  let currentUserData = null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a1020]">
      
      <div className="flex-none h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
        <div className="flex items-center gap-4">
          <Link 
            href="/portal/cases" 
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Cases
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-lg font-semibold text-white">Create New Case</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-5xl mx-auto pb-12">
          <NewCaseForm 
            doctors={doctors}
            // @ts-expect-error Server Component serialization
            currentDoctor={currentUserData} 
          />
        </div>
      </div>
    </div>
  );
}