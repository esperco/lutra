/** A module for working with sliding screens like the followup flow.
 *
 *  The slides are specified as a list of functions that, given a
 *  uniform state object, initialize each slide. When the user goes
 *  back, the current slide is completely removed and recreated when
 *  it's needed, but modifications to the state object are persisted.
 */
module Esper.Slides {
  export interface Slide<T> {
    element  : JQuery;
    getState : () => T;
  }

  export interface Controls<T> {
    onCancel          : () => void;
    onFinish          : (state: T) => void;
    finishButtonTitle : string;
  }

  /** A slide with the JQuery element that contains it and the controls. */
  interface SlideElement<T> {
    slide     : Slide<T>;
    container : JQuery;
  }

  // When caught, this exception will keep slides from sliding to the
  // next slide.
  export var invalidState = { error : "Invalid State" };

  export function create<T>(startState : T, slides : ((T) => Slide<T>)[],
                            controls : Controls<T>) {
'''
<div #topContainer>
</div>
'''
    var pastSlides : SlideElement<T>[] = [];
    var position   : number            = 0;
    var current    : SlideElement<T>   =
      slideElement<T>(position, slides[position](startState));
    var state      : T                 = startState;

    topContainer.append(current.container);

    var animation = {
      time  : 500,
      width : Gmail.threadContainer().width() + 100
    }
    var currentHeight: number;

    return topContainer;

    /** Go to the next slide unless there are no more slides. */
    function nextSlide() {
      try {
        if (position + 1 < slides.length) {
          var nextState = current.slide.getState();
          position = position + 1;
          var next : SlideElement<T> =
            slideElement<T>(position, slides[position](nextState));

          // Get current height before we append container (which may
          // change height)
          currentHeight = topContainer.height();
          topContainer.append(next.container);

          slideForward(current.container, next.container);

          pastSlides.push(current);
          state   = nextState;
          current = next;
        }
      } catch (e) {
        if (e === invalidState) {
          return;
        } else {
          throw e;
        }
      }
    }

    function previousSlide() {
      if (position > 0) {
        position = position - 1;
        var previous = pastSlides.pop();

        slideBack(previous.container, current.container);

        current = previous;
      }
    }

    function slideForward(previous, next) {
      /*
        Expand parent to accomodate larger objects but never shrink for UX
        reasons. Also, ensure min-height has a min of something not zero to
        avoid potential issues with weird height responses from jQuery.
      */
      var minHeight = parseInt(previous.parent().css("min-height"));
      minHeight = minHeight || 300;
      previous.parent().css({
        "overflow" : "hidden",
        "min-height": Math.max(minHeight, previous.outerHeight(true)) + "px"
      });
      previous.animate({left : -animation.width}, animation.time);

      next.css({
        "left": animation.width,
        "top" : -previous.outerHeight(true) + "px"
      });

      previous.after(next);
      next.animate({left : 0}, animation.time, function() {
        previous.hide();
        next.css({left: 0, top: 0});
      });
    }

    function slideBack(previous, next) {
      previous.show();
      next.css({
        top: -previous.outerHeight(true) + "px"
      });

      previous.animate({left : 0}, animation.width);
      next.animate({left : animation.width}, animation.time, function () {
        next.remove();
      });
    }

    /** Creates the inline container for displaying a slide. */
    function slideContainer<T>(index : number, element : JQuery) {
'''
<div #container class="esper-ev-inline-container">
  <div #footer class="esper-modal-footer esper-clearfix">
    <button #next class="esper-btn esper-btn-primary modal-primary">
      Next
    </button>
    <button #back class="esper-btn esper-btn-secondary modal-cancel">
      Back
    </button>
  </div>
</div>
'''
      footer.before(element);

      // Special buttons for the first and last slides:
      if (index === 0) {
        back.text("Cancel");
        back.click(function () {
          controls.onCancel();
          topContainer.remove();
        });

        next.click(nextSlide);
      } else if (index === slides.length - 1) {
        next.text(controls.finishButtonTitle);
        next.click(function () {
          next.text("Working...");
          next.prop("disabled", true);

          try {
            controls.onFinish(current.slide.getState());
          } catch (e) {
            if (e === Slides.invalidState) {
              next.text(controls.finishButtonTitle);
              next.prop("disabled", false);
            } else {
              throw e;
            }
          }
        });

        back.click(previousSlide);
      } else {
        back.click(function() {
          previousSlide();
          Analytics.track(Analytics.Trackable.ClickSlidesBackButton);
        });
        next.click(function() {
          nextSlide();
          Analytics.track(Analytics.Trackable.ClickSlidesNextButton);
        });
      }

      return container;
    }

    function slideElement<T>(index : number, slide : Slide<T>) {
      return {
        slide     : slide,
        container : slideContainer(index, slide.element)
      };
    }
  }
}
