"use client";

import React, { useState } from "react";
import {
  MahasiswaItem,
  DosenItem,
  ProgramStudiItem,
  RuangItem,
  TahunAjaranItem,
} from "../types";
import { MahasiswaTable } from "./mahasiswa-table";
import { DosenTable } from "./dosen-table";
import { ProdiTable } from "./prodi-table";
import { RuangTable } from "./ruang-table";
import { TahunAjaranTable } from "./tahun-ajaran-table";
import { Users, GraduationCap, BookOpen, Building, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasterTabsProps {
  initialMahasiswa: MahasiswaItem[];
  initialDosen: DosenItem[];
  initialProdi: ProgramStudiItem[];
  initialRuang: RuangItem[];
  initialTahunAjaran: TahunAjaranItem[];
}

export function MasterTabs({
  initialMahasiswa,
  initialDosen,
  initialProdi,
  initialRuang,
  initialTahunAjaran,
}: MasterTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "mahasiswa" | "dosen" | "prodi" | "ruang" | "tahun"
  >("mahasiswa");

  const [mahasiswaList] = useState<MahasiswaItem[]>(initialMahasiswa);
  const [dosenList] = useState<DosenItem[]>(initialDosen);
  const [prodiList] = useState<ProgramStudiItem[]>(initialProdi);
  const [ruangList] = useState<RuangItem[]>(initialRuang);
  const [tahunAjaranList] = useState<TahunAjaranItem[]>(initialTahunAjaran);

  const tabs = [
    { id: "mahasiswa", label: "Mahasiswa", icon: Users, count: mahasiswaList.length },
    { id: "dosen", label: "Dosen Pengajar", icon: GraduationCap, count: dosenList.length },
    { id: "prodi", label: "Program Studi", icon: BookOpen, count: prodiList.length },
    { id: "ruang", label: "Ruang Perkuliahan", icon: Building, count: ruangList.length },
    { id: "tahun", label: "Tahun Ajaran", icon: Calendar, count: tahunAjaranList.length },
  ] as const;

  const handleRefresh = () => {
    // Refresh triggered
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="rounded-[8px] bg-primary-tint px-2 py-0.5 text-xs text-primary font-bold">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "mahasiswa" && (
        <MahasiswaTable
          mahasiswaList={mahasiswaList}
          dosenList={dosenList}
          prodiList={prodiList}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === "dosen" && (
        <DosenTable dosenList={dosenList} onRefresh={handleRefresh} />
      )}

      {activeTab === "prodi" && (
        <ProdiTable prodiList={prodiList} dosenList={dosenList} />
      )}

      {activeTab === "ruang" && (
        <RuangTable ruangList={ruangList} />
      )}

      {activeTab === "tahun" && (
        <TahunAjaranTable tahunAjaranList={tahunAjaranList} />
      )}
    </div>
  );
}
