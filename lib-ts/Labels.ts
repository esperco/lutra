/*
  Label helpers
*/

module Esper.Labels {
  /*
    Helper to normalize display versions of labels for sorting. Note that
    this is distinct from server normalization, which is used for equality
    comparison as opposed to normalizing for sorting purposes.

    Currently the two are identical, but this is not guaranteed.
  */
  export function normalizeForSort(l: string) {
    return l.toLowerCase().trim();
  }
}
