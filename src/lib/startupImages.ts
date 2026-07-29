/**
 * iOS launch images (`apple-touch-startup-image`).
 *
 * Without these, an installed guide shows a blank screen from tap to first
 * paint, which is the single most "this is a website in a costume" moment the
 * app has. iOS has no manifest-driven splash: WebKit's manifest support is still
 * partial, `background_color` does not produce one, and each image must match
 * the launch window EXACTLY or iOS ignores it and falls back to blank. So the
 * only route is a table of link tags, one per device class per orientation.
 *
 * The images themselves are a field of the course `accent` with the `>_` mark
 * centred, so the launch reads icon → splash → app in one colour.
 *
 * Device metrics are CSS px in PORTRAIT plus a pixel ratio; `device-width` and
 * `device-height` stay portrait-oriented in both queries and `orientation`
 * discriminates, which is the pattern iOS actually matches on. The raster is
 * `w × dpr` by `h × dpr`, swapped for landscape.
 */

interface Device {
  /** Portrait CSS width. */
  w: number;
  /** Portrait CSS height. */
  h: number;
  dpr: number;
  /** Which hardware this row covers — the reason the row exists. */
  label: string;
}

/**
 * The currently-supported iPhone and iPad range. Rows are keyed by CSS metrics,
 * not marketing names, so one row covers every device that shares a window size
 * (which is why the labels list several models each).
 */
const DEVICES: Device[] = [
  { w: 320, h: 568, dpr: 2, label: "iPhone SE (1st gen)" },
  { w: 375, h: 667, dpr: 2, label: "iPhone 8, SE (2nd/3rd gen)" },
  { w: 414, h: 736, dpr: 3, label: "iPhone 8 Plus" },
  { w: 375, h: 812, dpr: 3, label: "iPhone X, XS, 11 Pro, 12/13 mini" },
  { w: 414, h: 896, dpr: 2, label: "iPhone XR, 11" },
  { w: 414, h: 896, dpr: 3, label: "iPhone XS Max, 11 Pro Max" },
  { w: 390, h: 844, dpr: 3, label: "iPhone 12, 13, 13 Pro, 14" },
  { w: 428, h: 926, dpr: 3, label: "iPhone 12/13 Pro Max, 14 Plus" },
  { w: 393, h: 852, dpr: 3, label: "iPhone 14 Pro, 15, 15 Pro, 16" },
  { w: 430, h: 932, dpr: 3, label: "iPhone 15 Plus, 15 Pro Max, 16 Plus" },
  { w: 402, h: 874, dpr: 3, label: "iPhone 16 Pro" },
  { w: 440, h: 956, dpr: 3, label: "iPhone 16 Pro Max" },
  { w: 744, h: 1133, dpr: 2, label: "iPad mini (6th gen)" },
  { w: 768, h: 1024, dpr: 2, label: "iPad, iPad mini (9.7in)" },
  { w: 810, h: 1080, dpr: 2, label: "iPad (10.2in)" },
  { w: 820, h: 1180, dpr: 2, label: "iPad Air (10.9in)" },
  { w: 834, h: 1112, dpr: 2, label: "iPad Pro (10.5in)" },
  { w: 834, h: 1194, dpr: 2, label: "iPad Pro (11in)" },
  { w: 1024, h: 1366, dpr: 2, label: "iPad Pro (12.9in)" },
];

export interface StartupImage {
  /** File name written into the build output. */
  name: string;
  /** Raster width in device pixels. */
  width: number;
  /** Raster height in device pixels. */
  height: number;
  /** The `media` attribute iOS matches to pick this image. */
  media: string;
  /** Hardware this covers, for the generated comment / debugging. */
  label: string;
}

function media(d: Device, orientation: "portrait" | "landscape"): string {
  return [
    `(device-width: ${d.w}px)`,
    `(device-height: ${d.h}px)`,
    `(-webkit-device-pixel-ratio: ${d.dpr})`,
    `(orientation: ${orientation})`,
  ].join(" and ");
}

/**
 * Every launch image the head declares and the build must emit — the two lists
 * are generated from this one table, so a tag can never point at a file that was
 * not rendered (the failure that would reintroduce the blank launch).
 */
export const STARTUP_IMAGES: StartupImage[] = DEVICES.flatMap((d) => {
  const long = d.w * d.dpr;
  const short = d.h * d.dpr;
  return [
    {
      name: `startup-${long}x${short}.png`,
      width: long,
      height: short,
      media: media(d, "portrait"),
      label: `${d.label} portrait`,
    },
    {
      name: `startup-${short}x${long}.png`,
      width: short,
      height: long,
      media: media(d, "landscape"),
      label: `${d.label} landscape`,
    },
  ];
});
