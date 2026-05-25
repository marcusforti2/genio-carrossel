import { useRef, useEffect, useState } from "react";
import { Pipette } from "lucide-react";

/**
 * Convert hex (#rrggbb) -> HSL string "H S% L%" used by our theme tokens.
 */
export function hexToHslString(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Convert "H S% L%" -> #rrggbb hex.
 */
export function hslStringToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#000000";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface CustomColorPickerProps {
  value: string; // HSL string "H S% L%"
  onChange: (hsl: string) => void;
  label?: string;
  size?: "sm" | "md";
}

/**
 * Native color picker that emits HSL strings. Renders a small swatch
 * with a pipette icon — click opens the OS color picker.
 */
const CustomColorPicker = ({ value, onChange, label = "Personalizada", size = "md" }: CustomColorPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hex, setHex] = useState(() => hslStringToHex(value));

  useEffect(() => {
    setHex(hslStringToHex(value));
  }, [value]);

  const swatchSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center gap-1 py-1.5 rounded-md border border-dashed border-muted-foreground/40 hover:border-primary hover:bg-primary/5 transition-all"
      title="Escolher cor personalizada"
    >
      <div
        className={`${swatchSize} rounded-full border border-border/50 relative flex items-center justify-center overflow-hidden`}
        style={{
          background: `conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`,
        }}
      >
        <Pipette className="w-2.5 h-2.5 text-white drop-shadow" />
      </div>
      <span className="text-[8px] text-muted-foreground">{label}</span>
      <input
        ref={inputRef}
        type="color"
        value={hex}
        onChange={(e) => {
          const newHex = e.target.value;
          setHex(newHex);
          onChange(hexToHslString(newHex));
        }}
        className="sr-only"
      />
    </button>
  );
};

export default CustomColorPicker;
