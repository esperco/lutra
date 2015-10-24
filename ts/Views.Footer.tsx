/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Footer extends Component<{}, {}> {
    render() {
      return <div className="footer">
        <div className="container">
          Footer
        </div>
      </div>;
    }
  }
}

