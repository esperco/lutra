/*
  Time-stats specific color handling
*/

module Esper.Colors {
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
