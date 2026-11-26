/** Village positions on the schematic lake map (viewBox 0 0 1000 400). */
export const VILLAGE_XY: Record<string, [number, number]> = {
  balykchy: [70, 215],
  tamchy: [215, 112],
  "chok-tal": [262, 104],
  "chon-sary-oy": [292, 99],
  "sary-oy": [316, 96],
  "kara-oy": [342, 93],
  "boz-beshik": [368, 90],
  ornok: [382, 89],
  "cholpon-ata": [410, 86],
  bosteri: [465, 87],
  "bulan-sogottu": [497, 90],
  "baktuu-dolonotu": [522, 93],
  korumdu: [548, 96],
  "kosh-kol": [572, 99],
  chyrpykty: [592, 103],
  ananyevo: [620, 110],
  karakol: [935, 205],
  "kyzyl-suu": [800, 300],
  tamga: [560, 330],
  "kadzhi-say": [470, 333],
  bokonbaevo: [345, 326],
  baet: [400, 332],
};

/** Villages shown with labels (others get a dot only, to avoid clutter). */
export const LABELLED = new Set(["balykchy", "tamchy", "cholpon-ata", "bosteri", "ananyevo", "karakol", "tamga", "bokonbaevo", "kara-oy"]);
