/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

module Esper.Gmail {

  export function findSidebarAnchor() {
    var anchor = $(".nH.g.id");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper thread controls.");
      return $();
    }
    else
      return anchor;
  }
  
  /** Returns the tbody that contains the composition toolbar. This is
   *  the bar with the send button, the attachment tool and so on.
   */
  export function compositionToolbar() {
    return $("\\:qd tbody");
  }
}
