/*
  Local storage using JSON serialization on top of the native string-based
  storage. This cache persists from one session to another.

  Values can be inspected and deleted with Firebug.
  Go to the DOM tab and scroll down to "localStorage".
*/

module Esper.Store {

  export function set(k: string, v: any) {
    localStorage.setItem(k, JSON.stringify(v));
  };

  export function get(k: string): any {
    var s = localStorage.getItem(k);
    var x: any;
    if (s) {
      try {
        x = JSON.parse(s);
      }
      catch (e) {
        Log.d("Cannot parse cached data stored under key '"+ k +"': "+ s);
      }
    }
    return x;
  };

  export function remove(k: string) {
    localStorage.removeItem(k);
  };

  export function clear() {
    localStorage.clear();
  };

}
