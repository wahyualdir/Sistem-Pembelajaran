"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  History,
  Filter,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { NilaiStore } from "@/features/nilai/nilai-store";

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAksi, setFilterAksi] = useState("SEMUA");

  const auditLogs = NilaiStore.getLogAudit(50);

  const filteredLogs = auditLogs.filter((log) => {
    const matchAksi = filterAksi === "SEMUA" || log.aksi === filterAksi;
    const matchSearch =
      log.penggunaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entitas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchAksi && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Log Audit & Keamanan Sistem
          </h1>
          <p className="text-sm text-muted-foreground">
            Catatan jejak audit permanen untuk setiap perubahan kritis data akademik (koreksi nilai, penguncian, persetujuan).
          </p>
        </div>

        <a href="/api/export/laporan-akademik" download>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="h-4 w-4" />
            Unduh Salinan Audit
          </Button>
        </a>
      </div>

      {/* Filter & Search */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Aksi:</span>
            <div className="inline-flex rounded-[8px] border border-border p-1 bg-muted gap-1">
              {["SEMUA", "KOREKSI_NILAI", "FINALISASI_NILAI"].map((ak) => (
                <button
                  key={ak}
                  onClick={() => setFilterAksi(ak)}
                  className={`px-3 py-1 text-xs rounded-[6px] font-semibold transition-colors ${
                    filterAksi === ak
                      ? "bg-surface text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ak === "SEMUA" ? "Semua Aksi" : ak.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari pelaku atau alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-36 text-xs">Waktu</TableHead>
                  <TableHead className="w-40 text-xs">Pelaku</TableHead>
                  <TableHead className="w-32 text-xs">Aksi</TableHead>
                  <TableHead className="w-28 text-xs">Entitas</TableHead>
                  <TableHead className="text-xs">Keterangan & Alasan Audit</TableHead>
                  <TableHead className="w-36 text-xs">Nilai Lama</TableHead>
                  <TableHead className="w-36 text-xs">Nilai Baru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="text-xs hover:bg-muted/50">
                      <TableCell className="font-sans text-muted-foreground whitespace-nowrap">
                        {log.waktu}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground block">
                          {log.penggunaNama}
                        </span>
                        <span className="text-xs text-muted-foreground">{log.peran}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.aksi.includes("KOREKSI")
                              ? "danger"
                              : log.aksi.includes("FINAL")
                              ? "success"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {log.aksi}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-sans text-muted-foreground">
                        {log.entitas}
                      </TableCell>
                      <TableCell className="text-foreground leading-relaxed">
                        {log.keterangan}
                      </TableCell>
                      <TableCell className="font-sans text-muted-foreground">
                        {log.nilaiLama || "-"}
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-primary">
                        {log.nilaiBaru || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada catatan log audit yang cocok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
