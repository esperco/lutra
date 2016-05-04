/*
  Declare vars set by Optimizely for A/B testing variants. These variables
  should be set by Optimizely BEFORE any of our code runs. Be sure to use
  the _optimizely_evaluate=force tag.
*/

module Esper.AB {

  // List strings rather declaring ambient booleans because we want to handle
  // scenario where AB vars are undefined gracefully
  //
  // export const TOP_GUESTS_SPLASH = "ESPER_TOP_GUESTS_SPLASH";
  // export const GUEST_DOMAINS_SPLASH = "ESPER_GUEST_DOMAINS_SPLASH";

  // Short cut to cast to boolean
  export function get(name: string) {
    return !!((<any> window)[name]);
  }
}

