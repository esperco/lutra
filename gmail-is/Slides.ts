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

  export function create<T>(startState : T, slides : (T) => Slide<T>[], 
                            controls : Controls<T>) {
'''
<div #topContainer class="esper-ev-inline-container">
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

    /** Go to the next slide unless there are no more slides. */
    function nextSlide() {
      if (position + 1 < slides.length) {
        position = position + 1;
        var next : SlideElement<T> = 
          slideElement<T>(position, slides[position](current.slide.getState()));
        topContainer.append(next.container);

        slideForward(current.container, next.container);

        pastSlides.push(current);
        state   = current.slide.getState();
        current = next;
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

    function slideBack(previous, next) {
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
        back.click(controls.onCancel());

        next.click(nextSlide);
      } else if (index === slides.length - 1) {
        next.text(controls.finishButtonTitle);
        next.click(controls.onFinish(current.slide.getState()));

        back.click(previousSlide);
      } else {
        back.click(previousSlide);
        next.click(nextSlide);
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
