import { compareOutput, CompareMode } from '@/lib/akademik/exam-utils';
import { getPolicy } from '@/lib/policies';

export interface CodeRunnerTestCase {
  id: string;
  stdin: string;
  expectedStdout: string;
  isHidden: boolean;
  weight: number;
}

export interface CodeExecutionRequest {
  language: 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php';
  sourceCode: string;
  testCases: CodeRunnerTestCase[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
  compareMode?: CompareMode;
}

export interface TestCaseResult {
  testId: string;
  ok: boolean;
  isHidden: boolean;
  timeMs: number;
  memoryKb: number;
  stdoutExcerpt: string;
  compileOutput?: string;
  error?: string;
}

export interface CodeExecutionResponse {
  ok: boolean;
  status: 'selesai' | 'galat' | 'antre';
  scorePercent: number; // 0..100
  compileOutput?: string;
  results: TestCaseResult[];
  message: string;
}

export interface CodeRunner {
  run(request: CodeExecutionRequest): Promise<CodeExecutionResponse>;
}

// Judge0 Language IDs mapping
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  java: 62, // OpenJDK 13.0.1
  c: 50, // GCC 9.2.0 C
  cpp: 54, // GCC 9.2.0 C++
  php: 68, // PHP 7.4.1
};

export class Judge0Adapter implements CodeRunner {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.JUDGE_API_URL || '';
    this.apiKey = process.env.JUDGE_API_KEY || '';
  }

  async run(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    // 1. Jika API URL konektor tidak diatur, langsung kembali tanpa tunggu network
    if (!this.apiUrl) {
      return {
        ok: false,
        status: 'galat',
        scorePercent: 0,
        compileOutput: 'Penilaian otomatis belum aktif. Soal koding akan diperiksa manual.',
        results: request.testCases.map((tc) => ({
          testId: tc.id,
          ok: false,
          isHidden: tc.isHidden,
          timeMs: 0,
          memoryKb: 0,
          stdoutExcerpt: '',
        })),
        message: 'Penilaian otomatis belum aktif. Soal koding akan diperiksa manual.',
      };
    }

    // 2. Jika konektor ada, periksa kebijakan institusi
    const isAutograderEnabled = await getPolicy<boolean>('coding_autograder_enabled', false);
    if (!isAutograderEnabled) {
      return {
        ok: false,
        status: 'galat',
        scorePercent: 0,
        compileOutput: 'Penilaian otomatis belum aktif. Soal koding akan diperiksa manual.',
        results: request.testCases.map((tc) => ({
          testId: tc.id,
          ok: false,
          isHidden: tc.isHidden,
          timeMs: 0,
          memoryKb: 0,
          stdoutExcerpt: '',
        })),
        message: 'Penilaian otomatis belum aktif. Soal koding akan diperiksa manual.',
      };
    }

    const languageId = JUDGE0_LANGUAGE_IDS[request.language] || 71;
    const compareMode = request.compareMode || 'trim';

    const results: TestCaseResult[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const tc of request.testCases) {
      totalWeight += tc.weight;
      try {
        const payload = {
          source_code: Buffer.from(request.sourceCode).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(tc.stdin).toString('base64'),
          expected_output: Buffer.from(tc.expectedStdout).toString('base64'),
          cpu_time_limit: Math.max(1, (request.timeLimitMs || 2000) / 1000),
          memory_limit: (request.memoryLimitMb || 128) * 1024,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.apiKey) {
          headers['X-Auth-Token'] = this.apiKey;
        }

        const res = await fetch(`${this.apiUrl}/submissions?wait=true&base64_encoded=true`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Judge HTTP ${res.status}`);
        }

        const data = await res.json();
        const rawStdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf8') : '';
        const rawStderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf8') : '';
        const rawCompile = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : '';

        const isMatch = compareOutput(rawStdout, tc.expectedStdout, compareMode);
        const passed = isMatch && (!data.status || data.status.id === 3);

        if (passed) {
          earnedWeight += tc.weight;
        }

        results.push({
          testId: tc.id,
          ok: passed,
          isHidden: tc.isHidden,
          timeMs: Math.round((parseFloat(data.time) || 0) * 1000),
          memoryKb: data.memory || 0,
          stdoutExcerpt: tc.isHidden ? (passed ? 'Lulus' : 'Gagal') : rawStdout.slice(0, 300),
          compileOutput: rawCompile || rawStderr,
          error: data.status?.description,
        });
      } catch (err: any) {
        results.push({
          testId: tc.id,
          ok: false,
          isHidden: tc.isHidden,
          timeMs: 0,
          memoryKb: 0,
          stdoutExcerpt: '',
          error: err?.message || 'Galat eksekusi sandbox',
        });
      }
    }

    const scorePercent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 10000) / 100 : 0;

    return {
      ok: true,
      status: 'selesai',
      scorePercent,
      results,
      message: `Berhasil dinilai: ${scorePercent}% kasus uji lulus.`,
    };
  }
}

let defaultRunner: CodeRunner | null = null;
export function getCodeRunner(): CodeRunner {
  if (!defaultRunner) {
    defaultRunner = new Judge0Adapter();
  }
  return defaultRunner;
}
