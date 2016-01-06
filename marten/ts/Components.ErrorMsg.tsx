/*
  Generic error message -- add customization later
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class ErrorMsg extends Component<{}, {}> {
    render() {
      return <div className="alert compact alert-danger" role="alert">
        <i className="fa fa-fw fa-warning"></i>{" "}
        Whoops. Something broke.{" "}
        <a href="http://esper.com/contact">
          Please try contacting us at esper.com/contact.
        </a>
      </div>;
    }
  }
}