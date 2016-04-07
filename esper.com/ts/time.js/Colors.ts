/// <reference path="../common/Colors.ts" />
/// <refernece path="./Labels.ts" />
/// <reference path="./Teams.ts" />

module Esper.Colors {
  var labelColorMap: ColorMap = {};
  var domainColorMap: ColorMap = {};
  var calColorMap: ColorMap = {};

  export function getColorForLabel(labelNorm: string): string {
    if (labelNorm === Labels.MULTI_LABEL_ID) {
      return gray;
    }
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
    Teams.defaultTeamPromise.done(() => {
      var labels = _(Teams.all())
        .map((t) => t.team_labels_norm)
        .flatten<string>()
        .uniq()
        .value();
      labels = Labels.sortLabelStrs(labels);
      _.each(labels, Colors.getColorForLabel);
    });
  }
}
