/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

module Esper.Gmail {

  /*
    Find a good insertion point.
    We return the element containing the name of the logged-in user,
    e.g. "+Peter". The Esper menu is inserted to the left of that element.
  */
  export function findMenuAnchor() {
    var anchor = $('[style*=min-width\\:\\ 195px]');
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper menu.");
      return $();
    }
    else
      return anchor;
  }

  export function findSidebarAnchor() {
    var anchor = $(".nH.g.id");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper thread controls.");
      return $();
    }
    else
      return anchor;
  }

}
