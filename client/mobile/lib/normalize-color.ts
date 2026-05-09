export const normalizeColor = (input: string, alpha?: number): string => {
  let r = 0, g = 0, b = 0, a = 1;

  if (input.startsWith('#')) {
    let hex = input.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) hex += 'ff';
    if (hex.length !== 8) throw new Error(`Invalid hex color: ${input}`);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    const m = input.match(/rgba?\(([^)]+)\)/i);
    if (!m) throw new Error(`Unsupported color: ${input}`);
    const parts = m[1].split(',').map((s) => s.trim());
    r = +parts[0];
    g = +parts[1];
    b = +parts[2];
    a = parts[3] !== undefined ? +parts[3] : 1;
  }

  if (alpha !== undefined) a = alpha;
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
};
