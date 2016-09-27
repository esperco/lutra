/*
  Label helpers
*/

/// <reference path="./Stores.Events.ts" />
/// <reference path="./Types.ts" />

module Esper.Labels {
  export type LabelBase = Types.LabelBase;
  export type Label = Types.Label;
  export type LabelCount = Types.LabelCount;

  /*
    Helper to normalize display versions of labels for sorting. Note that
    this is distinct from server normalization, which is used for equality
    comparison as opposed to normalizing for sorting purposes.

    Currently the two are identical, but this is not guaranteed.
  */
  export function normalizeForSort(l: string) {
    return l ? l.toLowerCase().trim() : "";
  }

  // Global map of normalized labels to display forms
  var displayAsMap: {[index: string]: string} = {};

  // Global map of known display labels to normalized form
  var normMap: {[index: string]: string} = {};

  export function storeMapping({norm, display, force}: {
    norm: string;
    display: string;
    force?: boolean;
  }) {
    if (force || !normMap[display]) {
      normMap[display] = norm;
    }
  }

  export function getNorm(display: string) {
    if (! display.trim()) {
      return "";
    }
    return normMap[display] || display.toLowerCase().trim();
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
    var labels: LabelCount[] = [];

    _.each(teams, (t) => {
      _.each(t.team_api.team_labels, (lbl) => labels.push({
        id: lbl.normalized,
        displayAs: lbl.original,
        color: lbl.color,
        count: 0
      }));
    });

    _.each(events, (e) => e.labelScores.match({
      none: () => null,
      some: (scores) => _.each(scores, (s) => {
        displayAsMap[s.id] = displayAsMap[s.id] || s.displayAs;
        counts[s.id] = counts[s.id] || 0;
        counts[s.id] += 1;
        labels.push({
          id: s.id,
          displayAs: s.displayAs,
          color: s.color,
          count: 0
        });
      })
    }));

    labels = _.uniqBy(labels, (l) => l.id);
    _.each(labels, (l) => l.count = counts[l.id] || 0);
    return labels;
  }

  export function fromTeam(team: ApiT.Team) {
    return _.map(team.team_api.team_labels, (lbl) => ({
      id: lbl.normalized,
      displayAs: lbl.original,
      color: lbl.color,
      score: 0
    }));
  }

  export function countUnlabeled(events: Stores.Events.TeamEvent[]) {
    return _.filter(events,
      (e) => Stores.Events.getLabels(e).length === 0).length;
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

  export function sortLabelInfos(labels: ApiT.LabelInfo[]) {
    return _.sortBy(labels, (l) => normalizeForSort(l.original));
  }

  export function init() {
    // Set initial norm/display label mappings based on teams
    Login.promise.done(() => {
      _.each(Stores.Teams.all(), (team) => {
        _.each(team.team_api.team_labels, (lbl) => {
          storeMapping({
            norm: lbl.normalized,
            display: lbl.original
          });
        });
      });
    });
  }
}
