/**
 * Modul aturan kurikulum dan deteksi ketergantungan lingkaran (circular dependency) pada prasyarat mata kuliah.
 * Bab 5.4: "Prasyarat tidak boleh merujuk ke mata kuliah itu sendiri maupun membentuk lingkaran."
 */

export interface PrerequisitePair {
  courseId: string;
  prerequisiteId: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Memeriksa apakah penambahan prasyarat baru (courseId butuh prerequisiteId) membentuk siklus.
 *
 * @param existingPairs Daftar relasi prasyarat yang sudah ada: courseId butuh prerequisiteId
 * @param newCourseId ID mata kuliah target
 * @param newPrerequisiteId ID mata kuliah yang hendak dijadikan prasyarat
 * @returns ValidationResult { valid: boolean, message?: string }
 */
export function validatePrerequisiteCycle(
  existingPairs: PrerequisitePair[],
  newCourseId: string,
  newPrerequisiteId: string
): ValidationResult {
  // 1. Cek referensi diri sendiri
  if (newCourseId === newPrerequisiteId) {
    return {
      valid: false,
      message: "Mata kuliah tidak boleh menjadi prasyarat untuk dirinya sendiri.",
    };
  }

  // 2. Bangun graf dependensi: courseId -> array of prerequisiteIds
  const graph: Map<string, Set<string>> = new Map();

  for (const pair of existingPairs) {
    if (!graph.has(pair.courseId)) {
      graph.set(pair.courseId, new Set());
    }
    graph.get(pair.courseId)!.add(pair.prerequisiteId);
  }

  // Tambahkan relasi baru ke graf sementara
  if (!graph.has(newCourseId)) {
    graph.set(newCourseId, new Set());
  }
  graph.get(newCourseId)!.add(newPrerequisiteId);

  // 3. Cari siklus menggunakan DFS
  // Jika dari newPrerequisiteId bisa mencapai newCourseId, berarti ada siklus
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(current: string): boolean {
    visited.add(current);
    recursionStack.add(current);

    const neighbors = graph.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
    }

    recursionStack.delete(current);
    return false;
  }

  // Cek apakah ada siklus yang melibatkan newCourseId
  if (hasCycle(newCourseId)) {
    return {
      valid: false,
      message:
        "Prasyarat ditolak karena membentuk ketergantungan berputar (siklus dependensi).",
    };
  }

  return {
    valid: true,
  };
}
