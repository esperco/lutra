/*
  Generic error message -- add customization later
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class ErrorMsg extends Component<{
    msg?: string|JSX.Element|JSX.Element[];
  }, {}> {
    render() {
      return <div className="alert compact danger alert-danger" role="alert">
        <i className="fa fa-fw fa-left fa-warning"></i>
        { this.props.msg || <span>
            Whoops. Something broke.{" "}
            <a href="http://esper.com/contact">
              Please try contacting us at esper.com/contact.
            </a>
          </span> }
      </div>;
    }
  }
}
