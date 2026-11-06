export type Point = { x: number; y: number };
export type ShapeType = 'pen' | 'marker' | 'line' | 'circle' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'eraser';
export type DrawingItem = { type: ShapeType; points?: Point[]; start?: Point; end?: Point; color: string; width: number; fill?: boolean };
export type DrawingState = { version: 1; paths: DrawingItem[]; template: string | null; baseImage: string | null };
export const CANVAS = { width: 360, height: 520 };
export function canvasPoint(x: number, y: number, width: number, height: number): Point {
  return { x: Math.max(0, Math.min(360, x * 360 / width)), y: Math.max(0, Math.min(520, y * 520 / height)) };
}
export function strokePath(points: Point[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}l0.01 0`;
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], n = points[i + 1];
    d += `Q${p.x} ${p.y} ${(p.x + n.x) / 2} ${(p.y + n.y) / 2}`;
  }
  const end = points[points.length - 1];
  return `${d}L${end.x} ${end.y}`;
}
export function canEditLetter(status?: string | null): boolean {
  return ['DRAFT', 'ASSIGNED', 'RETURNED'].includes(status ?? '');
}
