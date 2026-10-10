"use client";

import React from "react";
import { ProgramStudiItem, DosenItem } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProdiTableProps {
  prodiList: ProgramStudiItem[];
  dosenList: DosenItem[];
}

export function ProdiTable({ prodiList, dosenList }: ProdiTableProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama Program Studi</TableHead>
            <TableHead>Jenjang</TableHead>
            <TableHead>Kepala Program Studi (Kaprodi)</TableHead>
            <TableHead>Status Akreditasi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prodiList.map((p) => {
            const kaprodi = dosenList.find((d) => d.id === p.kaprodiId);
            return (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.kode}</TableCell>
                <TableCell className="font-medium text-foreground">{p.nama}</TableCell>
                <TableCell>{p.jenjang}</TableCell>
                <TableCell>
                  {kaprodi ? (
                    <span className="font-medium text-foreground">{kaprodi.nama}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Belum ditentukan</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="success">Unggul (A)</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
