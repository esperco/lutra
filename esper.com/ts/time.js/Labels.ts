/*
  Module for managing event labels
*/

/// <reference path="./Events2.ts" />

module Esper.Labels {
  // For new teams
  export var DEFAULTS = [
    "Product", "Business Development", "Sales",
    "Email", "Internal Team", "Networking",
    "Health & Wellness", "Personal", "Travel"
  ];

  export interface Label {
    id: string;        // Noralized form
    displayAs: string; // Display form
  }

  export interface LabelCount extends Label {
    count: number;
  }

  // Takes a list of events and returns a list of unique normalized / display
  // label combos. Optionally includes team labels too.
  export function fromEvents(events: Events2.TeamEvent[],
                             teams: ApiT.Team[] = [])
  {
    // Map of normalized to displayAs
    var map: {[index: string]: string} = {};

    // Counts for each normalized item
    var counts: {[index: string]: number} = {};

    // Order of labels as we encounter them (team labels come first)
    var labels: string[] = [];

    _.each(teams, (t) => {
      _.each(t.team_labels_norm, (id, i) => {
        var teamLabel = t.team_labels[i];
        map[id] = map[id] || teamLabel;
        labels.push(id);
      })
    });

    _.each(events, (e) => {
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

  /*
    Helper to normalize display versions of labels for sorting. Note that
    this is distinct from server normalization, which is used for equality
    comparison as opposed to normalizing for sorting purposes.

    Currently the two are identical, but this is not guaranteed.
  */
  export function normalizeForSort(l: string) {
    return l.toLowerCase().trim();
  }

  /*
    Sort a list of labels by normalized version of display text -- note
    that this is distinct from
  */
  export function sortLabels<T extends Label>(labels: T[]): T[] {
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
