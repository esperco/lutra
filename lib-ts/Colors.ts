/*
  A module for assigning colors to labels
*/

module Esper.Colors {

  /*
    Preset list of colors -- picked from
    https://www.google.com/design/spec/style/color.html#color-color-palette
  */
  export var presets: string[] = [
    // 200
    // "#CE93D8", // Too close to Esper purple
    "#90CAF9",
    "#80CBC4",
    "#E6EE9C",
    "#FFCC80",
    "#EF9A9A",
    // "#B39DDB", // Too close to Esper purple
    "#81D4FA",
    "#A5D6A7",
    "#FFF59D",
    "#FFAB91",
    "#F48FB1",
    // "#9FA8DA", // Too close to Esper purple
    "#80DEEA",
    "#C5E1A5",
    "#FFE082",

    // 300
    // "#BA68C8", // Too close to Esper purple
    "#64B5F6",
    "#4DB6AC",
    "#FFB74D",
    "#E57373",
    // "#9575CD", // Too close to Esper purple
    "#4FC3F7",
    "#81C784",
    "#FF8A65",
    "#7986CB",
    "#4DD0E1",
    "#AED581",
    "#FFD54F",

    // 400
    // "#AB47BC", // Too close to Esper purple
    "#42A5F5",
    "#26A69A",
    "#FFA726",
    "#EF5350",
    // "#7E57C2", // Too close to Esper purple
    "#29B6F6",
    "#66BB6A",
    "#FFEE58",
    "#FF7043",
    "#EC407A",
    "#5C6BC0",
    "#26C6DA",
    "#9CCC65",
    "#FFCA28",

    // 500
    // "#9C27B0", // Too close to Esper purple
    "#2196F3",
    "#009688",
    "#FF9800",
    "#F44336",
    // "#673AB7", // Too close to Esper purple
    "#03A9F4",
    "#4CAF50",
    "#FFEB3B",
    "#FF5722",
    "#E91E63",
    "#3F51B5",
    "#00BCD4",
    "#8BC34A",
    "#FFC107",

    // 100
    "#E1BEE7",
    "#BBDEFB",
    "#B2DFDB",
    "#F0F4C3",
    "#FFE0B2",
    "#FFCDD2",
    "#D1C4E9",
    "#B3E5FC",
    "#C8E6C9",
    "#FFF9C4",
    "#FFCCBC",
    "#F8BBD0",
    "#C5CAE9",
    "#B2EBF2",
    "#DCEDC8",
    "#FFECB3",

    // 50
    "#F3E5F5",
    "#E3F2FD",
    "#E0F2F1",
    "#F9FBE7",
    "#FFF3E0",
    "#EDE7F6",
    "#FFEBEE",
    "#E1F5FE",
    "#E8F5E9",
    "#FFFDE7",
    "#FBE9E7",
    "#FCE4EC",
    "#E8EAF6",
    "#E0F7FA",
    "#F1F8E9",
    "#FFF8E1"
  ];

  // If we only need a handful of colors
  export var first = presets[0];
  export var second = presets[1];
  export var black = "#000000";
  export var lighterGray = "#E6E7E8";
  export var lightGray = "#D1D3D4";
  export var gray = "#999";
  export var offWhite = "#FCFCFC";
  export var green = "#5CB85C";
  export var yellow = "#FFF59D";
  export var orange = "#F0AD4E";
  export var red = "#D9534F";
  export var brand = "#A25CC6";  // Purple

  // Rating colors
  export var level0 = "#64B5F6"; // Blue
  export var level1 = "#5CB85C"; // Green
  export var level2 = "#AED581"; // Yellow-Green
  export var level3 = "#FDD835"; // Yellow
  export var level4 = "#F0AD4E"; // Orange
  export var level5 = "#D9534F"; // Red
  export function level(i: number) {
    switch (i) {
      case 0: return level0;
      case 1: return level1;
      case 2: return level2;
      case 3: return level3;
      case 4: return level4;
      case 5: return level5;
      default: return gray;
    }
  }

  // Already assigned colors
  export type ColorMap = { [index: string]: string };

  // Get a color for a particular string and remember that color
  export function getColorForMap(key: string, colorMap: ColorMap): string {
    // Return existing rememgetColorForMapbered color if applicable
    if (! colorMap[key]) {
      var index = _.keys(colorMap).length;
      var color = presets[index % presets.length];
      colorMap[key] = color;
    }
    return colorMap[key];
  }

  // Manipulate colors to lighter or darker
  export function lighten(color: string, p=0.3): string {
    return shadeBlend(p, color);
  }

  export function darken(color: string, p=0.3): string {
    return shadeBlend(-p, color);
  }

  /*
    Based off of http://stackoverflow.com/a/13542669 -- takes two colors and
    blends them by a percent -- if second color is not present, then uses
    percent to lighten or darken
  */
  export function shadeBlend(p: number, c0: string, c1?: string): string {
    var n = p < 0 ? p * -1 : p;
    var f = parseInt(c0.slice(1), 16),
        t = parseInt((c1 ? c1 : (p<0 ? "#000000" : "#FFFFFF")).slice(1), 16),
        R1 = f>>16,
        G1 = f>>8&0x00FF,
        B1 = f&0x0000FF;
    return "#" + (0x1000000 +
      (Math.round(((t>>16) - R1) * n) + R1) * 0x10000 +
      (Math.round(((t>>8&0x00FF) - G1) * n) + G1) * 0x100 +
      (Math.round(((t&0x0000FF) - B1) * n) + B1)
    ).toString(16).slice(1);
  }

  // Get a good text color given a certain background color
  // See https://24ways.org/2010/calculating-color-contrast/
  export function colorForText(hexcolor: string) {
    if (! hexcolor) return black;
    if (hexcolor[0] === "#") {
      hexcolor = hexcolor.slice(1);
    }
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? black : offWhite;
  }


  //////

  var hashtagColorMap: ColorMap = {};
  var domainColorMap: ColorMap = {};
  var calColorMap: ColorMap = {};

  export function getNewColorForLabel(): string {
    return presets[Math.floor(Math.random() * presets.length)];
  }

  export function getColorForHashtag(hashtagNorm: string): string {
    return getColorForMap(hashtagNorm, hashtagColorMap);
  }

  export function getColorForDomain(domain: string): string {
    return getColorForMap(domain, domainColorMap);
  }

  export function getColorForCal(calId: string): string {
    return getColorForMap(calId, calColorMap);
  }

  // Reset remembered colors
  export function resetColorMaps(): void {
    domainColorMap = {};
  }
}
