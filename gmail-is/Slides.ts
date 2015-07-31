/** A module for working with sliding screens like the followup flow. 
 *
 *  The slides are specified as a list of functions that, given a
 *  uniform state object, initialize each slide. When the user goes
 *  back, the current slide is completely removed and recreated when
 *  it's needed, but modifications to the state object are persisted.
 */
module Esper.Slides {
  export function create<T>(startState : T, slides) {
    var previous = [];
    var position = 0;

    var animation = {
      time : 500,
      width : Gmail.threadContainer().width() + 100
    }

    function slideForward(previous, next) {
      previous.parent().css({
        "overflow" : "hidden"
      });
      previous.animate({left : -animation.width}, animation.time);

      next.css({
        "left"       : animation.width,
        "margin-top" : (-previous.height()) + "px"
      });

      previous.after(next);
      next.animate({left : 0}, animation.time);
    }

    return {
      
    };
  }
}