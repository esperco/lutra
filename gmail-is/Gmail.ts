/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

module Esper.Gmail {

  export function findSidebarAnchor() {
    return find$(".nH.g.id", "Esper thread controls");
  }
  
  /** Returns the tbody that contains the composition toolbar. This is
   *  the bar with the send button, the attachment tool and so on.
   */
  export function compositionToolbar() {
    return find$("\\:qd tbody", "Esper composition toolbar");
  }

  /** Tries to find the element described by the given selector. If it
   *  isn't found, or there is more than one, logs an error and
   *  returns an empty jQuery selection, otherwise returns one with
   *  the given element.
   *
   *  The component name makes the error message more useful.
   */
  function find$(selector, componentName) {
    var anchor = $(selector);

    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the " + componentName + ".");
      return $();
    } else {
      return anchor;
    }
  }
}
