/*
  Components that vary rendering behavior based on the width of the screen.
  We do this rendering a Bootstrap "xs" element on the screen first, checking
  if it's visible, and then render the appropriate element accordingly.

    ifXS({
      xs: <div>Mobile UI</div>,
      other: <div>Desktop UI</div>
    })
*/

/// <reference path="./Emit.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  /*
    An empty marker used to determine whether we're in 'xs' mode. We
    absolutely position it and give it a little dimension because jQuery's
    visibility selector can be fickle depending on how everything else in the
    DOM is layed out.
  */
  var marker = $('<span class="hidden-xs" />')
    .css({ position: "absolute", bottom: 0, right: 0, height: 1, width: 1 })
    .appendTo('body');

  // Is marker currently visible?
  var markerIsVisible = marker.is(':visible');

  /*
    An emitter that gets fired whenever screen width triggers between XS only
    and XS hidden modes
  */
  var widthEmitter = new Emit.EmitBase();

  $( window ).resize(function() {
    let previous = markerIsVisible;
    markerIsVisible = marker.is(':visible');
    if (previous !== markerIsVisible) {
      widthEmitter.emitChange();
    }
  });


  // Functional around IfXS component
  export function ifXS({xs, other} : {
    xs: JSX.Element;
    other?: JSX.Element
  }) {
    return <IfXS xs={xs} other={other} />;
  }


  // Base class for responsive components
  export class IfXS extends ReactHelpers.Component<{
    xs?: JSX.Element;
    other?: JSX.Element;
  }, {}> {

    // Re-render on window size change
    componentDidMount() {
      this.setSources([widthEmitter]);
    }

    render(): JSX.Element {
      // Marker visible => not XS
      if (markerIsVisible) {
        return this.props.other || null;
      }
      return this.props.xs || null;
    }
  }
}
