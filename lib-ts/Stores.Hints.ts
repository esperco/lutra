/*
  Module for storing which hints are dismissed by the user.
*/

module Esper.Stores.Hints {
  export var HintsStore = new Model2.Store<Types.Hints, boolean>();

  export function get(hint: Types.Hints): boolean {
    return HintsStore.get(hint).flatMap((p) => p.data).match({
      some: (n) => n,
      none: () => !!LocalStore.get(hint)
    });
  }

  export function set(hint: Types.Hints, value: boolean) {
    LocalStore.set(hint, value);
    HintsStore.set(hint, Option.some(value));
  }
}
