/*
  Module for managing event labels
*/

/// <reference path="./Events2.ts" />

module Esper.Labels {
  // For new teams
  export const DEFAULTS = [
    "Product", "Business Development", "Sales",
    "Email", "Internal Team", "Networking",
    "Health & Wellness", "Personal", "Travel"
  ];

  // Pick a MULTI_LABEL_ID that doesn't match normalized form of any label
  export const MULTI_LABEL_ID = "Esper-multi-label-id";
  export const MULTI_LABEL_STR = "Multiple Labels";

  // Global map of normalized labels to display forms
  var displayAsMap: {[index: string]: string} = {};

  export function getDisplayAs(norm: string) {
    if (! norm.trim()) {
      return "";
    }
    if (norm === MULTI_LABEL_ID) {
      return MULTI_LABEL_STR;
    }
    return displayAsMap[norm] || norm;
  }

  export interface Label {
    id: string;        // Noralized form
    displayAs: string; // Display form
  }

  export interface LabelCount extends Label {
    count: number;
  }

  // Takes a list of events and returns a list of unique normalized / display
  // label combos. Optionally includes team labels too (if team matches
  // one of the teams on events)
  export function fromEvents(events: Events2.TeamEvent[],
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
        })
      }
    });

    _.each(events, (e) => {
      _.each(e.labels_norm, (id, index) => {
        displayAsMap[id] = e.labels[index];
        counts[id] = counts[id] || 0;
        counts[id] += 1;
        labels.push(id);
      });
    });

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
