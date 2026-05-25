import type { ScoreEntry } from "./api";
import { SCORES_2021 } from "./scores_2021"
import { SCORES_2022 } from "./scores_2022"
import { SCORES_2023 } from "./scores_2023"
import { SCORES_2024 } from "./scores_2024"
import { SCORES_2025 } from "./scores_2025"
import { SCORES_2026 } from "./scores_2026"

export const LOCAL_SCORES: Record<string, ScoreEntry[]> = {
  ...SCORES_2021,
  ...SCORES_2022,
  ...SCORES_2023,
  ...SCORES_2024,
  ...SCORES_2025,
  ...SCORES_2026
};
