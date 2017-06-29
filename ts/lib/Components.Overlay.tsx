/*
  It's sometimes helpful to have React components that get rendered as part
  of a normal React flow, but that we want to show in the DOM outside of
  how it shows up in React to get around z-indexing issues, etc.

  For instance, dropdown toggles should show up in the DOM flow in one place
  but the actual dropdown menu may need to sit outside of where the toggle is.
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    /*
      A unique identifier for this overlay or type of overlay. Overlays
      with the same id will replace any existing overlay with that id.
    */
    id: string;

    children?: JSX.Element|JSX.Element[];
  }

  export class Overlay extends ReactHelpers.Component<Props, {}> {
    // Don't actually render anything inline here.
    render(): JSX.Element {
      return null;
    }

    componentWillMount() {
      this.update();
    }

    componentWillUpdate() {
      this.update();
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      this.close();
    }

    /*
      requestAnimationFrame to avoid accessing DOM node from inside
      render function. Not ideal, but should be OK so long as we're
      we only update the dropdow menu itself and don't touch the toggle
    */
    update() {
      window.requestAnimationFrame(() =>
        renderOverlay(this.props.id, <div>
          { this.props.children }
        </div>)
      );
    }

    /*
      requestAnimationFrame because any React events that triggered the
      dropdown menu closing may need to fully propogate before we remove
      the menu from the DOM.
    */
    close() {
      window.requestAnimationFrame(() => clearOverlay(this.props.id));
    }
  }

  /*
    Create container for id (if it doesn't exist) and render overlay inside
    it.
  */
  function renderOverlay(id: string, content: JSX.Element) {
    var container = $("#" + id);
    if (!container || !container.length) {
      container = $('<div>').attr("id", id);
      $('body').append(container);
    }
    container.renderReact(content);
  }

  function clearOverlay(id: string) {
    var container = $("#" + id);
    container.remove();
  }
}
