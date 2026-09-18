import type { CSSProperties } from "react";

export type BrandColors = { primary: string; secondary: string; accent: string };

export const DEFAULT_BRAND: BrandColors = {
  primary: "#0ea5e9",
  secondary: "#0f172a",
  accent: "#e0f2fe",
};

export function normalizeHex(value: string, fallback: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return "#" + raw.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(raw)) return "#" + raw.split("").map((c) => c + c).join("").toLowerCase();
  return fallback;
}

function foregroundFor(hex: string) {
  const h = normalizeHex(hex, "#000000").slice(1);
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 0.52 ? "#0f172a" : "#ffffff";
}

export function brandCssVariables(colors?: Partial<BrandColors> | null): CSSProperties {
  const primary = normalizeHex(colors?.primary ?? "", DEFAULT_BRAND.primary);
  const secondary = normalizeHex(colors?.secondary ?? "", DEFAULT_BRAND.secondary);
  const accent = normalizeHex(colors?.accent ?? "", DEFAULT_BRAND.accent);
  const primaryForeground = foregroundFor(primary);
  const secondaryForeground = foregroundFor(secondary);
  const accentForeground = foregroundFor(accent);
  return {
    "--primary": primary,
    "--primary-foreground": primaryForeground,
    "--secondary": secondary,
    "--secondary-foreground": secondaryForeground,
    "--accent": accent,
    "--accent-foreground": accentForeground,
    "--ring": primary,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": primaryForeground,
    "--sidebar-ring": primary,
    "--chart-1": primary,
    "--chart-2": secondary,
    "--chart-3": accent,
  } as CSSProperties;
}

export async function extractLogoPalette(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const size = 80;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size).data;
    const buckets = new Map<string, number>();
    for (let i = 0; i < pixels.length; i += 16) {
      const alpha = pixels[i + 3];
      if (alpha < 100) continue;
      const r = Math.round(pixels[i] / 24) * 24;
      const g = Math.round(pixels[i + 1] / 24) * 24;
      const b = Math.round(pixels[i + 2] / 24) * 24;
      const key = [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => "#" + hex);
    const picked: string[] = [];
    for (const color of ranked) {
      const h = color.slice(1);
      const r = parseInt(h.slice(0, 2), 16) / 255;
      const g = parseInt(h.slice(2, 4), 16) / 255;
      const b = parseInt(h.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
      if (saturation < 0.18 || lightness < 0.14 || lightness > 0.9) continue;
      const distinct = picked.every((p) => {
        const ph = p.slice(1);
        const pr = parseInt(ph.slice(0, 2), 16), pg = parseInt(ph.slice(2, 4), 16), pb = parseInt(ph.slice(4, 6), 16);
        const cr = parseInt(h.slice(0, 2), 16), cg = parseInt(h.slice(2, 4), 16), cb = parseInt(h.slice(4, 6), 16);
        return Math.hypot(pr - cr, pg - cg, pb - cb) > 55;
      });
      if (distinct) picked.push(color);
      if (picked.length >= 8) break;
    }
    return picked;
  } finally {
    URL.revokeObjectURL(url);
  }
}
