"use client";

import React from "react";
import { TahunAjaranItem } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TahunAjaranTableProps {
  tahunAjaranList: TahunAjaranItem[];
}

export function TahunAjaranTable({ tahunAjaranList }: TahunAjaranTableProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode Tahun Ajaran</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Tanggal Mulai Perkuliahan</TableHead>
            <TableHead>Tanggal Selesai Semester</TableHead>
            <TableHead>Status Operasional</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tahunAjaranList.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-semibold">{t.kode}</TableCell>
              <TableCell>
                <Badge variant={t.semester === "GANJIL" ? "default" : "secondary"}>
                  {t.semester}
                </Badge>
              </TableCell>
              <TableCell>{t.tanggalMulai}</TableCell>
              <TableCell>{t.tanggalSelesai}</TableCell>
              <TableCell>
                <Badge variant={t.aktif ? "success" : "outline"}>
                  {t.aktif ? "SEMESTER BERJALAN (AKTIF)" : "ARSIP"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
