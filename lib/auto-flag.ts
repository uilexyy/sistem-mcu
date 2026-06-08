export function autoFlagStatus(
  valueNumeric: number | null,
  normalRangeMin: number | null,
  normalRangeMax: number | null
): "NORMAL" | "ABNORMAL" | "BORDERLINE" {
  if (valueNumeric === null || normalRangeMin === null || normalRangeMax === null) return "NORMAL"
  if (valueNumeric < normalRangeMin || valueNumeric > normalRangeMax) return "ABNORMAL"
  if (
    valueNumeric === normalRangeMin ||
    valueNumeric === normalRangeMax ||
    Math.abs(valueNumeric - normalRangeMin) <= (normalRangeMax - normalRangeMin) * 0.05 ||
    Math.abs(valueNumeric - normalRangeMax) <= (normalRangeMax - normalRangeMin) * 0.05
  ) {
    return "BORDERLINE"
  }
  return "NORMAL"
}
