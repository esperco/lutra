/*
  A module for doing summations across different permutations of some
  identifier
*/

/// <reference path="./Esper.ts" />

module Esper.Partition {
  export interface KeyList<T> {
    some: {
      key: string,
      items: T[]
    }[];
    none: T[];
  };

  /*
    Groups a value under various keys. Takes a list of things to group and
    a function that returns a list of keys under which to group them.

    Returns a mapping for both items with keys and those that returned the
    empty list.
  */
  export function groupByMany<T>(
      values: T[],
      idFn: (t: T) => string[]
    ) : KeyList<T>
  {
    var noneList: T[] = [];
    var someMap: { [index: string]: T[] } = {};

    _.each(values, (v) => {
      var attrs = idFn(v);
      if (attrs.length) {
        _.each(attrs, (attr) => {
          someMap[attr] = someMap[attr] || [];
          someMap[attr].push(v);
        });
      } else {
        noneList.push(v);
      }
    });

    return {
      none: noneList,
      some: _.map(someMap, (v, k) => ({
        key: k,
        items: v
      }))
    };
  }
}
