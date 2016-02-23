/*
  Module for managing event labels
*/

/// <reference path="./Events.ts" />

module Esper.Labels {

  export interface Label {
    id: string;        // Noralized form
    displayAs: string; // Display form
  }

  export interface LabelCount extends Label {
    count: number;
  }

  // Takes a list of events and returns a list of unique normalized / display
  // label combos. Optionally includes team labels too.
  export function fromEvents(events: Events.TeamEvent[], incTeam=false) {
    // Map of normalized to displayAs
    var map: {[index: string]: string} = {};

    // Counts for each normalized item
    var counts: {[index: string]: number} = {};

    // Order of labels as we encounter them (team labels come first)
    var labels: string[] = [];

    _.each(events, (e) => {
      if (incTeam) {
        Option.cast(Teams.get(e.teamId)).match({
          none: () => null,
          some: (t) => _.each(t.team_labels, (teamLabel) => {
            var id = normalize(teamLabel);
            map[id] = map[id] || teamLabel;
            labels.push(id);
          })
        });
      }

      _.each(e.labels_norm, (id, index) => {
        map[id] = e.labels[index];
        counts[id] = counts[id] || 0;
        counts[id] += 1;
        labels.push(id);
      });
    });

    labels = _.uniq(labels);
    return _.map(labels, (id): LabelCount => ({
      id: id,
      displayAs: map[id],
      count: counts[id] || 0
    }));
  }

  export function countUnlabeled(events: ApiT.GenericCalendarEvent[]) {
    return _.filter(events, (e) => e.labels_norm.length === 0).length;
  }

  export function hasCount(l: Label|LabelCount): l is LabelCount {
    return l.hasOwnProperty('count');
  }

  // Temp helper to normalize labels on teams
  export function normalize(l: string) {
    return l.toLowerCase().trim();
  }
}
