// Configuration contract for IDROK Motion Lab. Product looks live in
// configs/*.ts; the engine never reads product names, routes or page text.
export type PresetName = "hero" | "dashboard";

export interface MotionPreset {
  opacity: number; // 0..1 multiplier
  density: number; // share of points drawn
  speed: number;   // flow speed multiplier
}

export interface MotionConfig {
  productId: string;
  visualSystemName: string;
  seed: number;
  density: { pxPerPoint: number; min: number; max: number };
  layers: { speed: [number, number, number]; size: [number, number, number]; alpha: [number, number, number]; parallax: [number, number, number] };
  sizeRange: [number, number];
  flowSpeed: number;
  pointer: { radius: number; strength: number; stiffness: number; damping: number; touchScale: number };
  scroll: { velocityRef: number; boost: number; maxParallaxScreens: number };
  trail: { length: number };
  accentShare: number;
  warmShare: number;
  presets: Record<PresetName, MotionPreset>;
  dprCap: number;
}
