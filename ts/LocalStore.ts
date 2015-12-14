/*
  Local storage using JSON serialization on top of the native string-based
  storage. This cache persists from one session to another.

  Values can be inspected and deleted with Firebug.
  Go to the DOM tab and scroll down to "localStorage".

  Falls back to using cookies if localStorage is unavailable.
*/

/// <reference path="./Log.ts" />

module Esper.LocalStore {

  export function set(k: string, v: any) {
    var vStr = JSON.stringify(v);
    try {
      localStorage.setItem(k, vStr);

      // Check that it was actually stored (in case of silent failure)
      if (typeof localStorage.getItem(k) !== "string") {
        throw new Error("localStorage failed to save");
      }
    }

    catch (err) {
      createCookie(k, vStr);
    }
  };

  export function get(k: string): any {
    var s: string;
    try {
      s = localStorage.getItem(k);
    }
    catch (err) {
      s = readCookie(k);
    }

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
    try {
      localStorage.removeItem(k);
    } catch (err) {
      createCookie(k, "");
    }
  };

  export function clear() {
    localStorage.clear();
  };


  /*
    LocalStorage preferable to cookies because cookies get sent automatically
    to servers, but this is a fallback for systems that disable localStorage.

    Cookie is set to expire when browser closes -- this allows LocalStorage
    to be used for things like nonces, but there is no long-term persistence
  */

  // Store value as cookie, expiration in seconds
  function createCookie(key: string, value: string) {
    document.cookie = key + "=" + value + "; path=/";
  }

  // Read value as cookie
  function readCookie(key: string) {
    var nameEQ = key + "=";
    var ca = document.cookie.split(';');
    for (var i = 0, max = ca.length; i < max; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }
}
