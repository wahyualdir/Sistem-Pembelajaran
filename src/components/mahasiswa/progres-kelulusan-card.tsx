"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Layers, CheckCircle2, Clock } from "lucide-react";
import { HasilProgresKelulusan } from "@/lib/akademik/progres-kelulusan";

interface ProgresKelulusanCardProps {
  progres: HasilProgresKelulusan;
}

export function ProgresKelulusanCard({ progres }: ProgresKelulusanCardProps) {
  return (
    <Card className="border border-border shadow-sm overflow-hidden hover:border-primary/40 transition-all">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground font-heading">
            <GraduationCap className="h-4 w-4 text-primary" />
            Progres Kelulusan Program Sarjana (S1)
          </CardTitle>
          <Badge
            variant="outline"
            className="text-xs bg-primary-soft text-primary font-medium border-primary/20"
          >
            Target {progres.totalTargetSks} SKS
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Progress Utama Total SKS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Total Akumulasi SKS Lulus
            </span>
            <span className="font-bold text-primary font-heading tabular-nums text-sm">
              {progres.totalSksLulus} / {progres.totalTargetSks} SKS ({progres.persenTotal}%)
            </span>
          </div>
          {/* Progress Bar Utama */}
          <div className="w-full bg-border rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progres.persenTotal}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-0.5">
            <span>Sisa SKS menuju kelulusan:</span>
            <strong className="text-foreground">{progres.sisaSksTotal} SKS</strong>
          </div>
        </div>

        {/* Pemisahan Wajib vs Pilihan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          {/* SKS Wajib */}
          <div className="p-3 rounded-[8px] bg-muted/30 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Mata Kuliah Wajib
              </span>
              <span className="font-bold text-foreground font-heading tabular-nums">
                {progres.sksWajibLulus}/{progres.targetWajibSks} SKS
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progres.persenWajib}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground block">
              Tersisa: {progres.sisaSksWajib} SKS ({progres.persenWajib}% tercapai)
            </span>
          </div>

          {/* SKS Pilihan */}
          <div className="p-3 rounded-[8px] bg-muted/30 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-info" />
                Mata Kuliah Pilihan
              </span>
              <span className="font-bold text-foreground font-heading tabular-nums">
                {progres.sksPilihanLulus}/{progres.targetPilihanSks} SKS
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-info h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progres.persenPilihan}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground block">
              Tersisa: {progres.sisaSksPilihan} SKS ({progres.persenPilihan}% tercapai)
            </span>
          </div>
        </div>

        {/* Status Perkiraan Semester Tersisa & Kelayakan Skripsi */}
        <div className="p-3.5 rounded-[10px] bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">
                Estimasi Waktu Kelulusan
              </span>
              <span className="text-xs text-muted-foreground">
                Berdasarkan 21 SKS semester berjalan:{" "}
                <strong className="text-foreground">
                  ~{progres.perkiraanSemesterTersisa} semester lagi
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`h-4 w-4 ${
                progres.statusKelayakanSkripsi ? "text-success" : "text-muted-foreground"
              }`}
            />
            <span className="text-xs font-medium text-foreground">
              {progres.statusKelayakanSkripsi
                ? "Syarat SKS Tugas Akhir Terpenuhi"
                : "Belum Memenuhi Syarat Tugas Akhir (Min. 100 SKS)"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
