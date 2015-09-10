/*
  Wrapper around jQuery objects that delete references to the jQuery object
  when their corresponding DOM elements are removed. This helps prevent
  memory leaks.

  REQUIRES JQUERY-UI TO WORK PROPERLY. If removing jQuery-UI as a dependency,
  look into http://stackoverflow.com/a/10172676 for a possible way to do this
  with just pure jQuery.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/jqueryui/jqueryui.d.ts" />

module Esper {
  export class JQStore {
    protected elm: JQuery;

    get() {
      return this.elm;
    }

    set(val: JQuery) {
      this.elm = val;
      this.elm.on("remove", this.unset.bind(this));
    }

    unset() {
      delete this.elm;
    }
  }
}