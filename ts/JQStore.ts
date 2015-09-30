/*
  Wrapper around jQuery objects that delete references to the jQuery object
  when their corresponding DOM elements are removed. This helps prevent
  memory leaks.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />

module Esper {

  // http://stackoverflow.com/a/10172676
  (function($: any) { /* Should of type JQueryStatic but that doesn't support
                         special events */
    $.event.special.destroyed = {
      remove: function(o: any) {
        if (o.handler) {
          o.handler()
        }
      }
    };
  })(jQuery);

  export class JQStore {
    protected elm: JQuery;

    get() {
      return this.elm;
    }

    set(val: JQuery) {
      this.elm = val;
      this.elm.bind('destroyed', this.unset.bind(this));
    }

    unset() {
      delete this.elm;
    }
  }
}