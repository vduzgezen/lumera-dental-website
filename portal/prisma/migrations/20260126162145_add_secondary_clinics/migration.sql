-- CreateTable
CREATE TABLE "_DoctorSecondaryClinics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DoctorSecondaryClinics_A_fkey" FOREIGN KEY ("A") REFERENCES "Clinic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DoctorSecondaryClinics_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_DoctorSecondaryClinics_AB_unique" ON "_DoctorSecondaryClinics"("A", "B");

-- CreateIndex
CREATE INDEX "_DoctorSecondaryClinics_B_index" ON "_DoctorSecondaryClinics"("B");
