/*
  Label helpers
*/

module Esper.Labels {
  interface LabelBase {
    id: string;        // Normalized form
    displayAs: string; // Display form
  }

  export interface Label extends LabelBase {
    score: number;     // 0 - 1 (1 = user-selected label)
  }

  export interface LabelCount extends LabelBase {
    count: number;
  }

  /*
    Helper to normalize display versions of labels for sorting. Note that
    this is distinct from server normalization, which is used for equality
    comparison as opposed to normalizing for sorting purposes.

    Currently the two are identical, but this is not guaranteed.
  */
  export function normalizeForSort(l: string) {
    return l.toLowerCase().trim();
  }

  // Global map of normalized labels to display forms
  var displayAsMap: {[index: string]: string} = {};

  export function getDisplayAs(norm: string) {
    if (! norm.trim()) {
      return "";
    }
    return displayAsMap[norm] || norm;
  }

  // Takes a list of events and returns a list of unique normalized / display
  // label combos. Optionally includes team labels too (if team matches
  // one of the teams on events)
  export function fromEvents(events: Stores.Events.TeamEvent[],
                             teams: ApiT.Team[] = [])
  {
    // Counts for each normalized item
    var counts: {[index: string]: number} = {};

    // Order of labels as we encounter them (team labels come first)
    var labels: string[] = [];

    var teamIds = _(events)
      .map((e) => e.teamId)
      .uniq()
      .value();

    _.each(teams, (t) => {
      if (_.includes(teamIds, t.teamid)) {
        _.each(t.team_labels_norm, (id, i) => {
          var teamLabel = t.team_labels[i];
          displayAsMap[id] = displayAsMap[id] || teamLabel;
          labels.push(id);
        });
      }
    });

    _.each(events, (e) => e.labelScores.match({
      none: () => null,
      some: (scores) => _.each(scores, (s) => {
        displayAsMap[s.id] = displayAsMap[s.id] || s.displayAs;
        counts[s.id] = counts[s.id] || 0;
        counts[s.id] += 1;
        labels.push(s.id);
      })
    }));

    labels = _.uniq(labels);
    return _.map(labels, (id): LabelCount => ({
      id: id,
      displayAs: displayAsMap[id],
      count: counts[id] || 0
    }));
  }

  export function countUnlabeled(events: ApiT.GenericCalendarEvent[]) {
    return _.filter(events, (e) => e.labels_norm.length === 0).length;
  }

  /*
    Sort a list of labels by normalized version of display text -- note
    that this is distinct from
  */
  export function sortLabels<T extends LabelBase>(labels: T[]): T[] {
    return _.sortBy(labels, (l) => normalizeForSort(l.displayAs));
  }

  /*
    Sort of list of strings (note that we don't use the normalize function
    because the normalization here)
  */
  export function sortLabelStrs(labels: string[]) {
    return _.sortBy(labels, normalizeForSort);
  }
}
