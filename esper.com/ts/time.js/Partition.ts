/*
  A module for doing summations across different permutations of some
  identifier
*/

/// <reference path="./Esper.ts" />

module Esper.Partition {

  // A mapping of strings to numbers that we want to aggregate
  export interface StatSet {
    [index: string]: number;
  }

  // A grouping of a permutation of identifiers for a StatSet
  export interface Permutation<T extends StatSet> {
    ids: string[];
    stats: T;
  }

  // Map from individual id to stats
  export interface StatMap<T extends StatSet> {
    [index: string]: T;
  }

  // A mapping of strings to lists of numbers (should correspond to an
  // associated type of StatSet)
  export interface ValueSet {
    [index: string]: number[];
  }

  // Map from individual id to valuesb
  export interface ValueMap<V extends ValueSet> {
    [index: string]: V;
  }


  //////

  // Given a list of Permutations, add up all the stats by value
  export function partitionById<T extends StatSet>(perms: Permutation<T>[])
    : StatMap<T>
  {
    var statMap: StatMap<T> = {};
    _.each(perms, (p) => {
      _.each(p.ids, (id) => {
        var set = statMap[id] = statMap[id] || {} as T;
        _.each(p.stats, (v, k) => {
          set[k] = (set[k] || 0) + v;
        });
      });
    });

    return statMap;
  }

  // Given a list of StatMaps, generate a series for each stat and unique
  // identifier
  export function valuesById<T extends StatSet, V extends ValueSet>
    (statMaps: StatMap<T>[]): ValueMap<V>
  {
    var valueMap: ValueMap<V> = {};
    var i = 0;

    _.each(statMaps, (statMap, index) => {
      _.each(statMap, (statSet, id) => {
        if (! valueMap[id]) {
          // Cast to anynecessary because we don't know keys to use in
          // generic function
          valueMap[id] = <any> {};
        }

        _.each(statSet, (v, k) => {
          valueMap[id][k] = valueMap[id][k] || [];
          valueMap[id][k][index] = v;
        });
      });
    });

    // Normalize undefined to 0
    _.each(valueMap, (valueSet, id) => {
      for (var j = 0; j < statMaps.length; j++) {
        _.each(valueSet, (numList) => {
          numList[j] = numList[j] || 0;
        });
      }
    });

    return valueMap;
  }
}
