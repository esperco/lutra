/*
  A module for assigning colors to labels
*/

/// <reference path="../typings/lodash/lodash.d.ts" />

module Esper.Colors {

  // Preset list of calendars -- these look pretty close to Google Calendar
  // colors
  var presetColors: string[] = [
    "#9FE1E7",
    "#FFAD46",
    "#42D692",
    "#9A9CFF",
    "#FF7537",
    "#92E1C0",
    "#AC725E",
    "#16A765",
    "#D06B64",
    "#B99AFF",
    "#F83A22",
    "#C2C2C2",
    "#9FC6E7",
    "#FBE983",
    "#7BD148",
    "#CD74E6", // NB: This looks really close to the Esper brand "purple", so
               // may need to disable if it conflicts with selection colors,
               // etc.
    "#F691B2",
    "#CABDBF",
    "#4986E7",
    "#FAD165",
    "#B3DC6C",
    "#A47AE2",
    "#FA573C",
    "#CCA6AC"
  ];

  // Already assigned colors
  var colorMap: { [index: string]: string } = {};

  // Get a color for a particular string and remember that color
  export function getColorForLabel(label: string): string {
    // Return existing remembered color if applicable
    if (! colorMap[label]) {
      var index = _.keys(colorMap).length;
      var color = presetColors[index % presetColors.length];
      colorMap[label] = color;
    }
    return colorMap[label];
  }

  // Reset remembered colors
  export function resetColorMap(): void {
    colorMap = {};
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
}
