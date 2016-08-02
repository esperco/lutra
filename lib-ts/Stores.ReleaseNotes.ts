/*
  Module for storing the last time when the release notes are dismissed.
*/

module Esper.Stores.ReleaseNotes {
  export var DismissStore = new Model2.Store<'lastDismiss', number>();

  const storeKey: 'lastDismiss' = "lastDismiss";

  export function get(): number {
    return DismissStore.get(storeKey).flatMap((p) => p.data).match({
      some: (n) => n,
      none: () => LocalStore.get(storeKey) || 0
    });
  }

  export function set(value: number) {
    LocalStore.set(storeKey, value);
    DismissStore.set(storeKey, Option.some(value));
  }
}
