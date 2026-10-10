import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { NilaiTranskripItem } from "@/lib/akademik/nilai";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#101828",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#2A4DB7",
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: "#2A4DB7",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTextContainer: {
    flex: 1,
  },
  instansiTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2A4DB7",
    letterSpacing: 0.5,
  },
  instansiSub: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#101828",
    marginTop: 2,
  },
  instansiAddress: {
    fontSize: 8,
    color: "#667085",
    marginTop: 2,
  },
  documentTitleContainer: {
    textAlign: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#101828",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  documentNo: {
    fontSize: 8,
    color: "#667085",
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#F6F7F9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  metaCol: {
    width: "48%",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 85,
    fontSize: 8,
    color: "#667085",
  },
  metaValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 4,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EEF2FC",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EC",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EC",
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: "#FAFAFA",
  },
  colNo: { width: "6%", textAlign: "center" },
  colSem: { width: "8%", textAlign: "center" },
  colKode: { width: "16%" },
  colNama: { width: "38%" },
  colSks: { width: "8%", textAlign: "center" },
  colHuruf: { width: "10%", textAlign: "center" },
  colBobot: { width: "14%", textAlign: "right" },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#EEF2FC",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2A4DB7",
  },
  statCol: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7.5,
    color: "#667085",
  },
  statVal: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2A4DB7",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  signatureBox: {
    width: 200,
    textAlign: "center",
  },
  dateText: {
    fontSize: 8,
    color: "#667085",
    marginBottom: 3,
  },
  signTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
    marginBottom: 42,
  },
  signName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
    textDecoration: "underline",
  },
  signNip: {
    fontSize: 7,
    color: "#667085",
    marginTop: 2,
  },
});

export interface TranskripDocProps {
  nomorDokumen: string;
  tanggalCetak: string;
  mahasiswa: {
    nim: string;
    nama: string;
    prodi: string;
    jenjang: string;
    angkatan: number;
  };
  daftarMataKuliah: (NilaiTranskripItem & { diulang: boolean })[];
  totalSksDitempuh: number;
  totalSksLulus: number;
  ipk: number;
}

export function DokumenTranskripPdf({
  nomorDokumen,
  tanggalCetak,
  mahasiswa,
  daftarMataKuliah,
  totalSksDitempuh,
  totalSksLulus,
  ipk,
}: TranskripDocProps) {
  return (
    <Document title={`Transkrip_${mahasiswa.nim}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>UIR</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.instansiTitle}>UNIVERSITAS ISLAM RIAU</Text>
            <Text style={styles.instansiSub}>TRANSKRIP AKADEMIK SEMENTARA</Text>
            <Text style={styles.instansiAddress}>
              Jl. Kaharuddin Nasution No. 113, Pekanbaru, Riau | Telp: (0761) 674674 | Web: www.uir.ac.id
            </Text>
          </View>
        </View>

        {/* Judul & Nomor Dokumen */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>TRANSKRIP HASIL STUDI KUMULATIF</Text>
          <Text style={styles.documentNo}>Nomor Dokumen: {nomorDokumen} | Tanggal Cetak: {tanggalCetak}</Text>
        </View>

        {/* Biodata Mahasiswa */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>NIM</Text>
              <Text style={styles.metaValue}>: {mahasiswa.nim}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nama Lengkap</Text>
              <Text style={styles.metaValue}>: {mahasiswa.nama}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Angkatan</Text>
              <Text style={styles.metaValue}>: {mahasiswa.angkatan}</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Program Studi</Text>
              <Text style={styles.metaValue}>: {mahasiswa.prodi}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Jenjang Studi</Text>
              <Text style={styles.metaValue}>: {mahasiswa.jenjang}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status Mahasiswa</Text>
              <Text style={styles.metaValue}>: AKTIF</Text>
            </View>
          </View>
        </View>

        {/* Tabel Transkrip */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colSem}>Sem</Text>
            <Text style={styles.colKode}>Kode MK</Text>
            <Text style={styles.colNama}>Nama Mata Kuliah</Text>
            <Text style={styles.colSks}>SKS</Text>
            <Text style={styles.colHuruf}>Nilai</Text>
            <Text style={styles.colBobot}>Bobot Mutu</Text>
          </View>

          {daftarMataKuliah.map((item, idx) => (
            <View
              key={item.kodeMataKuliah}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colSem}>{item.semesterPaket ?? "-"}</Text>
              <Text style={styles.colKode}>{item.kodeMataKuliah}</Text>
              <Text style={styles.colNama}>
                {item.namaMataKuliah} {item.diulang ? "(*)" : ""}
              </Text>
              <Text style={styles.colSks}>{item.sks}</Text>
              <Text style={styles.colHuruf}>{item.huruf}</Text>
              <Text style={styles.colBobot}>{(item.bobot * item.sks).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Ringkasan IPK */}
        <View style={styles.summaryBox}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total SKS Ditempuh</Text>
            <Text style={styles.statVal}>{totalSksDitempuh} SKS</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total SKS Lulus</Text>
            <Text style={styles.statVal}>{totalSksLulus} SKS</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Indeks Prestasi Kumulatif (IPK)</Text>
            <Text style={styles.statVal}>{ipk.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 7, color: "#667085", marginBottom: 10 }}>
          (*) Mata kuliah diulang: nilai dan bobot yang tercantum adalah nilai terbaik yang diperoleh mahasiswa.
        </Text>

        {/* Tanda Tangan */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Pekanbaru, {tanggalCetak}</Text>
            <Text style={styles.signTitle}>Ketua Program Studi</Text>
            <Text style={styles.signName}>Dr. Ardiansyah, S.T., M.Kom.</Text>
            <Text style={styles.signNip}>NIP. 198008242005011002</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Mengesahkan,</Text>
            <Text style={styles.signTitle}>Dekan Fakultas Teknik</Text>
            <Text style={styles.signName}>Prof. Dr. Ir. H. Zamzami, M.T.</Text>
            <Text style={styles.signNip}>NIP. 197204121998031001</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
