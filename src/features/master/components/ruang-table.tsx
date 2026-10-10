"use client";

import React from "react";
import { RuangItem } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RuangTableProps {
  ruangList: RuangItem[];
}

export function RuangTable({ ruangList }: RuangTableProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode Ruang</TableHead>
            <TableHead>Nama Ruang Perkuliahan</TableHead>
            <TableHead>Kapasitas Kursi</TableHead>
            <TableHead>Lokasi Gedung</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ruangList.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-semibold">{r.kode}</TableCell>
              <TableCell className="font-medium text-foreground">{r.nama}</TableCell>
              <TableCell>{r.kapasitas} Mahasiswa</TableCell>
              <TableCell className="text-muted-foreground">{r.gedung}</TableCell>
              <TableCell>
                <Badge variant={r.statusAktif ? "success" : "danger"}>
                  {r.statusAktif ? "Tersedia" : "Pemeliharaan"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
