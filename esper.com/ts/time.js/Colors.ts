/// <reference path="../common/Colors.ts" />
/// <refernece path="./Labels.ts" />
/// <reference path="./Teams.ts" />

module Esper.Colors {
  var labelColorMap: ColorMap = {};
  var domainColorMap: ColorMap = {};

  export function getColorForLabel(label: string): string {
    return getColorForMap(Labels.normalize(label), labelColorMap);
  }

  export function getColorForDomain(domain: string): string {
    return getColorForMap(domain, domainColorMap);
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
        .map((t) => t.team_labels)
        .flatten<string>()
        .uniq()
        .value();
      labels = Labels.sortLabelStrs(labels);
      _.each(labels, Colors.getColorForLabel);
    });
  }
}
