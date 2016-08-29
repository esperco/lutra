/*
  Generate textual conclusions based on data
*/
module Esper.Insights {
  type Pair = [string, number];

  /*
    Looks at opt grouping data and makes callback based on whether data falls
    within one of our predefined insight scenarios
  */
  export function matchScenario<T>(data: Types.EventOptGrouping, cbs: {
    // The "none" field accounts for all of our data
    allNone?: () => T;

    // One key accounts for 100% of data
    allOne?: (key: string) => T;

    /*
      The key percentages are roughly equal among all keys. See the tier
      function below.
    */
    allEqual?: (t: Pair[]) => T;

    /*
      A group of roughly equal keys accounts for a majority. Also returns
      the next tier of keys.
    */
    tiersMajority?: (t1: Pair[], t2: Pair[]) => T;

    /*
      The largest group of roughly equal keys accounts is not a majority. Also
      returns the next tier of keys.
    */
    tiersPlurality?: (t1: Pair[], t2: Pair[]) => T;

    /* No match above */
    fallback: (top: Pair[]) => T;
  }) {

    // Everything is none.
    if (data.none.totalUnique === data.totalUnique) {
      return cbs.allNone ? cbs.allNone() : cbs.fallback([]);
    }

    // Sorted key, pct rankings
    let total = data.totalValue - data.none.totalValue;
    let pairs = _.map(data.some,
      (v, k): Pair => [k, v.totalValue / total]
    );
    pairs = _.sortBy(pairs, (t) => -t[1]);

    // Only one key
    if (cbs.allOne && pairs[0][1] == 1) {
      return cbs.allOne(pairs[0][0]);
    }

    // Check for top two "tiers" of events based on percentage.
    let tier1 = tier(pairs);
    let tier2 = tier(pairs.slice(tier1.length));
    if (cbs.allEqual && _.isEmpty(tier2) && !_.isEmpty(tier1)) {
      return cbs.allEqual(tier1);
    }

    // Does tier 1 constitute a majority?
    var tier1Sum = _.sumBy(tier1, (t) => t[1]);
    if (cbs.tiersMajority && tier1Sum > 0.5) {
      return cbs.tiersMajority(tier1, tier2);
    }

    // Return plurality funciton
    if (cbs.tiersPlurality) {
      return cbs.tiersPlurality(tier1, tier2);
    }

    // No plurality function => fallback
    return cbs.fallback(pairs);
  }


  /*
    Given a list of sorted [string, number] pairs, where the number is a
    a float betwen 0 and 1, returns the first "tier" of pairs (i.e. pairs where
    the number is reasonably close to the largest number).
  */
  function tier(pairs: Pair[]) {
    let ret: Pair[] = [];
    let index = 0;

    if (pairs.length) {
      ret.push(pairs[0]);
      let base = pairs[0][1];
      let threshold = Math.max(0.8 * base, 0.02);
      index += 1;

      while (pairs[index]) {
        if (pairs[index][1] >= threshold) {
          ret.push(pairs[index]);
          index += 1;
        } else {
          break;
        }
      }
    }

    return ret;
  }
}
