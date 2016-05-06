/// <reference path="../lib/Colors.ts" />
/// <reference path="../lib/Stores.Teams.ts" />
/// <refernece path="./Labels.ts" />

module Esper.Colors {
  var labelColorMap: ColorMap = {};
  var domainColorMap: ColorMap = {};
  var calColorMap: ColorMap = {};

  export function getColorForLabel(labelNorm: string): string {
    return getColorForMap(labelNorm, labelColorMap);
  }

  export function getColorForDomain(domain: string): string {
    return getColorForMap(domain, domainColorMap);
  }

  export function getColorForCal(calId: string): string {
    return getColorForMap(calId, calColorMap);
  }

  // Reset remembered colors
  export function resetColorMaps(): void {
    labelColorMap = {};
    domainColorMap = {};
  }

  export function init() {
    // Set initial colors based on team labels to ensure reasonable consistency
    // We assume this is called after Teams.init
    Login.promise.done(() => {
      var labels = _(Stores.Teams.all())
        .map((t) => t.team_labels_norm)
        .flatten<string>()
        .uniq()
        .value();
      labels = Labels.sortLabelStrs(labels);
      _.each(labels, Colors.getColorForLabel);
    });
  }
}
