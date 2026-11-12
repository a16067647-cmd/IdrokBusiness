import type { MotionConfig } from "../types";

// Idrok Business — "Autonomous Commerce": directional streams on curved
// routes and orbital paths. Calm behind dashboards, livelier on hero areas.
export const businessMotion: MotionConfig = {
  productId: "idrok-business",
  visualSystemName: "Autonomous Commerce",
  seed: 20261112,
  density: { pxPerPoint: 6500, min: 70, max: 240 },
  layers: {
    speed: [0.55, 0.8, 1.1],
    size: [0.7, 1.0, 1.35],
    alpha: [0.35, 0.6, 0.9],
    parallax: [0.02, 0.05, 0.09],
  },
  sizeRange: [0.7, 1.9],
  flowSpeed: 0.016,
  pointer: { radius: 170, strength: 44, stiffness: 42, damping: 10, touchScale: 0.6 },
  scroll: { velocityRef: 1600, boost: 1.2, maxParallaxScreens: 2 },
  trail: { length: 0.03 },
  accentShare: 0.32,
  warmShare: 0.04,
  presets: {
    hero: { opacity: 1.0, density: 1.0, speed: 1.0 },
    dashboard: { opacity: 0.55, density: 0.6, speed: 0.7 },
  },
  dprCap: 1.75,
};
