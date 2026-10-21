// ============================================================================
// Penyemaian Data Akademik Lengkap UIR Ganjil 2026/2027 (Fase S4)
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 7, S4, 9)
// ============================================================================

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { AllSeedDataset, JadwalData } from './load';

export interface AcademicSeedSummary {
  programs: number;
  semesters: number;
  rooms: number;
  courses: number;
  courseAliases: number;
  classes: number;
  classesDuaDosen: number;
  scheduleSlots: number;
  enrollments: number;
  classAssistantsRows: number;
  taRoleAssignments: number;
  attendanceSessions: number;
  errors: string[];
}

export function generateJoinCode(courseCode: string, section: string): string {
  const hash = crypto.createHash('sha256').update(`SIAJAR-${courseCode}-${section}`).digest('hex');
  return hash.slice(0, 8).toUpperCase();
}

export async function seedAcademicData(
  supabaseAdmin: SupabaseClient,
  data: AllSeedDataset,
  userMap: Map<string, string>, // NIM/NIDN/NIP -> userId
  options: {
    withPertemuan?: boolean;
    tanggalMulaiKuliah?: string; // default 2026-08-31
  } = {}
): Promise<AcademicSeedSummary> {
  const { withPertemuan = false, tanggalMulaiKuliah = '2026-08-31' } = options;
  const errors: string[] = [];

  const dayMap: Record<string, number> = {
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
  };

  // Ambil ID peran LECTURER dan TEACHING_ASSISTANT
  const { data: rolesRows } = await supabaseAdmin.from('roles').select('id, code');
  const roleMap = new Map<string, string>();
  for (const r of rolesRows || []) {
    roleMap.set(r.code, r.id);
  }
  const rTa = roleMap.get('TEACHING_ASSISTANT');
  const rLecturer = roleMap.get('LECTURER');

  // Cari ID Kaprodi (D004, NIDN 2008000307)
  const kaprodiDosen = data.dosen.find((d) => d.id_dosen === 'D004');
  const kaprodiUserId = kaprodiDosen ? userMap.get(kaprodiDosen.nidn_10_digit) : null;
  if (!kaprodiUserId) {
    throw new Error('User ID Kaprodi (D004) tidak ditemukan di userMap.');
  }

  // --------------------------------------------------------------------------
  // 1. Program Studi: Teknik Informatika (Kode: 351)
  // --------------------------------------------------------------------------
  let programId: string;
  const { data: progExist } = await supabaseAdmin
    .from('programs')
    .select('id')
    .eq('code', '351')
    .maybeSingle();

  if (progExist) {
    programId = progExist.id;
  } else {
    const { data: progInsert, error: progErr } = await supabaseAdmin
      .from('programs')
      .insert({
        code: '351',
        name: 'Teknik Informatika',
        is_active: true,
      })
      .select('id')
      .single();
    if (progErr || !progInsert) {
      throw new Error(`Gagal membuat program studi 351: ${progErr?.message}`);
    }
    programId = progInsert.id;
  }

  // --------------------------------------------------------------------------
  // 2. Semester: Ganjil 2026/2027
  // --------------------------------------------------------------------------
  let semesterId: string;
  const semLabel = 'Ganjil 2026/2027';
  const { data: semExist } = await supabaseAdmin
    .from('semesters')
    .select('id')
    .eq('label', semLabel)
    .maybeSingle();

  if (semExist) {
    semesterId = semExist.id;
  } else {
    const { data: semInsert, error: semErr } = await supabaseAdmin
      .from('semesters')
      .insert({
        label: semLabel,
        is_active: true,
      })
      .select('id')
      .single();
    if (semErr || !semInsert) {
      throw new Error(`Gagal membuat semester ${semLabel}: ${semErr?.message}`);
    }
    semesterId = semInsert.id;
  }

  // --------------------------------------------------------------------------
  // 3. Ruang Perkuliahan (14 Ruang)
  // --------------------------------------------------------------------------
  const roomIdMap = new Map<string, string>(); // id_ruang (R01..R14) -> UUID
  for (const r of data.ruang) {
    const { data: roomUpsert, error: roomErr } = await supabaseAdmin
      .from('rooms')
      .upsert(
        {
          code: r.kode_ruang,
          name: r.nama_ruang,
          building: r.gedung,
          capacity: r.kapasitas_perkiraan,
        },
        { onConflict: 'code' }
      )
      .select('id')
      .single();

    if (roomErr || !roomUpsert) {
      errors.push(`Ruang ${r.kode_ruang}: ${roomErr?.message}`);
    } else {
      roomIdMap.set(r.id_ruang, roomUpsert.id);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Mata Kuliah (63 Kurikulum 2025) & Alias Kode Jadwal (38 Alias)
  // --------------------------------------------------------------------------
  const courseIdMap = new Map<string, string>(); // kode_kurikulum -> UUID
  for (const c of data.kurikulum) {
    const { data: courseUpsert, error: courseErr } = await supabaseAdmin
      .from('courses')
      .upsert(
        {
          program_id: programId,
          code: c.kode_kurikulum,
          name: c.nama_id,
          credits: c.sks_total,
          is_active: true,
        },
        { onConflict: 'code' }
      )
      .select('id')
      .single();

    if (courseErr || !courseUpsert) {
      errors.push(`Course ${c.kode_kurikulum}: ${courseErr?.message}`);
    } else {
      courseIdMap.set(c.kode_kurikulum, courseUpsert.id);
    }
  }

  // Alias kode jadwal
  let totalAliases = 0;
  for (const p of data.pemetaan) {
    const cId = courseIdMap.get(p.kode_kurikulum);
    if (!cId) {
      errors.push(`Alias ${p.kode_jadwal}: Course ${p.kode_kurikulum} tidak ditemukan.`);
      continue;
    }
    const { error: aliasErr } = await supabaseAdmin.from('course_code_aliases').upsert(
      {
        course_id: cId,
        alias_code: p.kode_jadwal,
        source: 'jadwal_sumber',
      },
      { onConflict: 'alias_code' }
    );
    if (aliasErr) {
      errors.push(`Alias ${p.kode_jadwal}: ${aliasErr.message}`);
    } else {
      totalAliases++;
    }
  }

  // --------------------------------------------------------------------------
  // 5. Kelas Perkuliahan (164 Kelas Unik)
  // --------------------------------------------------------------------------
  // Kelompokkan sesi jadwal berdasarkan kombinasi unik (kode_kurikulum + '-' + kelas)
  const classSessionGroups = new Map<string, JadwalData[]>();
  for (const j of data.jadwal) {
    const key = `${j.kode_kurikulum}-${j.kelas}`;
    const group = classSessionGroups.get(key) || [];
    group.push(j);
    classSessionGroups.set(key, group);
  }

  const classIdMap = new Map<string, string>(); // key -> class UUID
  const dosenByIdMap = new Map(data.dosen.map((d) => [d.id_dosen, d]));
  let totalClassesDuaDosen = 0;

  for (const [key, sessions] of classSessionGroups.entries()) {
    const firstSession = sessions[0];
    const courseId = courseIdMap.get(firstSession.kode_kurikulum);
    if (!courseId) {
      errors.push(`Kelas ${key}: Course ${firstSession.kode_kurikulum} tidak ditemukan.`);
      continue;
    }

    // Dosen utama kelas diambil dari slot Teori (jika ada), atau sesi pertama
    const theorySession = sessions.find((s) => s.komponen === 'Teori') || firstSession;
    const dosenIds = theorySession.id_dosen.split(';').map((s) => s.trim());
    const primaryDosenObj = dosenByIdMap.get(dosenIds[0]);
    const primaryLecturerUserId = primaryDosenObj ? userMap.get(primaryDosenObj.nidn_10_digit) : null;

    if (!primaryLecturerUserId) {
      errors.push(`Kelas ${key}: Dosen primer ${dosenIds[0]} tidak ditemukan di userMap.`);
      continue;
    }

    const joinCode = generateJoinCode(firstSession.kode_kurikulum, firstSession.kelas);
    const title = `${firstSession.matakuliah} - Kelas ${firstSession.kelas}`;

    // Cek apakah kelas sudah ada
    let classId: string;
    const { data: existingClass } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('course_id', courseId)
      .eq('semester_id', semesterId)
      .eq('section', firstSession.kelas)
      .maybeSingle();

    if (existingClass) {
      classId = existingClass.id;
    } else {
      const { data: newClass, error: classErr } = await supabaseAdmin
        .from('classes')
        .insert({
          course_id: courseId,
          semester_id: semesterId,
          title,
          section: firstSession.kelas,
          join_code: joinCode,
          capacity: 40,
          status: 'ACTIVE',
          created_by: kaprodiUserId,
          lecturer_id: primaryLecturerUserId,
        })
        .select('id')
        .single();

      if (classErr || !newClass) {
        errors.push(`Insert Kelas ${key}: ${classErr?.message}`);
        continue;
      }
      classId = newClass.id;
    }

    classIdMap.set(key, classId);

    // Penanganan Kelas dengan Dua Dosen Pengampu (contoh: Islam dan Keilmuan 3A..3E)
    if (dosenIds.length > 1 && rLecturer) {
      totalClassesDuaDosen++;
      const secondDosenObj = dosenByIdMap.get(dosenIds[1]);
      const secondLecturerUserId = secondDosenObj ? userMap.get(secondDosenObj.nidn_10_digit) : null;
      if (secondLecturerUserId) {
        await supabaseAdmin.from('user_roles').upsert(
          {
            user_id: secondLecturerUserId,
            role_id: rLecturer,
            scope_type: 'CLASS',
            scope_id: classId,
            status: 'ACTIVE',
          },
          { onConflict: 'user_id,role_id,scope_type,scope_id' }
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Slot Jadwal Mingguan (256 Slot)
  // --------------------------------------------------------------------------
  let totalSlots = 0;
  for (const j of data.jadwal) {
    const classKey = `${j.kode_kurikulum}-${j.kelas}`;
    const classId = classIdMap.get(classKey);
    if (!classId) {
      errors.push(`Slot ${j.id_sesi}: Kelas ${classKey} tidak ditemukan.`);
      continue;
    }

    const roomId = roomIdMap.get(j.id_ruang) || null;
    const dosenIds = j.id_dosen.split(';').map((s) => s.trim());
    const dosenObj = dosenByIdMap.get(dosenIds[0]);
    const lecturerUserId = dosenObj ? userMap.get(dosenObj.nidn_10_digit) || null : null;
    const dayOfWeek = dayMap[j.hari] || 1;
    const component = j.komponen === 'Teori' ? 'TEORI' : 'PRAKTIKUM';

    const { error: slotErr } = await supabaseAdmin.from('class_schedule_slots').upsert(
      {
        class_id: classId,
        component,
        day_of_week: dayOfWeek,
        start_time: j.jam_mulai,
        end_time: j.jam_selesai,
        room_id: roomId,
        lecturer_id: lecturerUserId,
        sks: j.sks,
        source_ref: j.id_sesi,
      },
      { onConflict: 'class_id,component,day_of_week,start_time' }
    );

    if (slotErr) {
      errors.push(`Slot ${j.id_sesi} (${classKey}): ${slotErr.message}`);
    } else {
      totalSlots++;
    }
  }

  // --------------------------------------------------------------------------
  // 7. Pendaftaran KRS Mahasiswa (870 Baris)
  // --------------------------------------------------------------------------
  let totalEnrollments = 0;
  for (const k of data.krs) {
    const classKey = `${k.kode_kurikulum}-${k.kelas}`;
    const classId = classIdMap.get(classKey);
    const studentUserId = userMap.get(k.nim);

    if (!classId || !studentUserId) {
      errors.push(`KRS [${k.nim}] ${classKey}: Class atau Mahasiswa tidak ditemukan.`);
      continue;
    }

    const { error: enrollErr } = await supabaseAdmin.from('enrollments').upsert(
      {
        class_id: classId,
        student_id: studentUserId,
        status: 'ACTIVE',
      },
      { onConflict: 'class_id,student_id' }
    );

    if (enrollErr) {
      errors.push(`KRS [${k.nim}] ${classKey}: ${enrollErr.message}`);
    } else {
      totalEnrollments++;
    }
  }

  // --------------------------------------------------------------------------
  // 8. Penugasan Asisten Dosen (56 Penugasan x 2 Izin = 112 Baris)
  // --------------------------------------------------------------------------
  let totalClassAssistants = 0;
  let totalTaRoles = 0;

  for (const a of data.asdos) {
    const classKey = `${a.kode_kurikulum}-${a.kelas}`;
    const classId = classIdMap.get(classKey);
    const taUserId = userMap.get(a.nim);

    if (!classId || !taUserId) {
      errors.push(`Asdos [${a.nim}] ${classKey}: Class atau Asdos tidak ditemukan.`);
      continue;
    }

    // Ambil lecturer_id kelas untuk granted_by
    const { data: clsData } = await supabaseAdmin
      .from('classes')
      .select('lecturer_id')
      .eq('id', classId)
      .single();

    const grantedBy = clsData?.lecturer_id || kaprodiUserId;
    const permissions = ['submission.review', 'assignment.grade'];

    for (const perm of permissions) {
      const { error: asstErr } = await supabaseAdmin.from('class_assistants').upsert(
        {
          class_id: classId,
          user_id: taUserId,
          permission: perm,
          granted_by: grantedBy,
          can_open_attendance: true,
        },
        { onConflict: 'class_id,user_id,permission' }
      );

      if (asstErr) {
        errors.push(`Class Assistant [${a.nim}] ${classKey} (${perm}): ${asstErr.message}`);
      } else {
        totalClassAssistants++;
      }
    }

    // Assign role TEACHING_ASSISTANT dengan scope CLASS pada kelas terkait
    if (rTa) {
      const { error: taRoleErr } = await supabaseAdmin.from('user_roles').upsert(
        {
          user_id: taUserId,
          role_id: rTa,
          scope_type: 'CLASS',
          scope_id: classId,
          status: 'ACTIVE',
        },
        { onConflict: 'user_id,role_id,scope_type,scope_id' }
      );

      if (!taRoleErr) {
        totalTaRoles++;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 9. Pertemuan Perkuliahan 1..16 (Opsional: SEED_WITH_PERTEMUAN=true)
  // --------------------------------------------------------------------------
  let totalPertemuan = 0;
  if (withPertemuan) {
    const baseStartDate = new Date(tanggalMulaiKuliah);
    for (const [classKey, classId] of classIdMap.entries()) {
      const sessions = classSessionGroups.get(classKey) || [];
      const theorySession = sessions.find((s) => s.komponen === 'Teori') || sessions[0];
      const dayOffset = (dayMap[theorySession.hari] || 1) - 1;

      for (let s = 1; s <= 16; s++) {
        const sessionDate = new Date(baseStartDate);
        sessionDate.setDate(baseStartDate.getDate() + (s - 1) * 7 + dayOffset);
        const dateStr = sessionDate.toISOString().split('T')[0];

        const { error: sessErr } = await supabaseAdmin.from('attendance_sessions').upsert(
          {
            class_id: classId,
            session_number: s,
            title: `Pertemuan ke-${s}: ${theorySession.matakuliah}`,
            session_date: dateStr,
            start_time: theorySession.jam_mulai,
            end_time: theorySession.jam_selesai,
            code: `S${s}${theorySession.kelas}`,
            is_open: s <= 8,
            created_by: kaprodiUserId,
          },
          { onConflict: 'class_id,session_number' }
        );

        if (!sessErr) {
          totalPertemuan++;
        }
      }
    }
  }

  return {
    programs: 1,
    semesters: 1,
    rooms: roomIdMap.size,
    courses: courseIdMap.size,
    courseAliases: totalAliases,
    classes: classIdMap.size,
    classesDuaDosen: totalClassesDuaDosen,
    scheduleSlots: totalSlots,
    enrollments: totalEnrollments,
    classAssistantsRows: totalClassAssistants,
    taRoleAssignments: totalTaRoles,
    attendanceSessions: totalPertemuan,
    errors,
  };
}
