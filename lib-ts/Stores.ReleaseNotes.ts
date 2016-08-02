/*
  Module for storing the last time when the release notes are dismissed.
*/

module Esper.Stores.ReleaseNotes {
  export var DismissStore = new Model2.Store<string, number>();

  const storeKey = "lastDismiss";

  export function get(): number {
    return DismissStore.get(storeKey).flatMap((p) => p.data).match({
      some: (n) => n,
      none: () => {
        var local = LocalStore.get(storeKey) || 0;
        DismissStore.set(storeKey, Option.some(local));

        return local;
      }
    });
  }

  export function set(value: number) {
    LocalStore.set(storeKey, value);
    DismissStore.set(storeKey, Option.some(value));
  }
}
