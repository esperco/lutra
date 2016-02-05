/// <reference path="../common/Colors.ts" />

module Esper.Colors {
  var labelColorMap: ColorMap = {};
  var domainColorMap: ColorMap = {};

  export function getColorForLabel(label: string): string {
    return getColorForMap(label, labelColorMap);
  }

  export function getColorForDomain(domain: string): string {
    return getColorForMap(domain, domainColorMap);
  }

  // Reset remembered colors
  export function resetColorMaps(): void {
    labelColorMap = {};
    domainColorMap = {};
  }
}
