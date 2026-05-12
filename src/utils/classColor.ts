const CLASS_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#A3E635",
];

export function getClassColor(name: string, fallbackIndex = 0): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash || fallbackIndex) % CLASS_COLORS.length;
  return CLASS_COLORS[index];
}
