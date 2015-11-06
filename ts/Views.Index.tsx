/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Index extends Component<{}, {}> {
    render() {

      return <div className="container">
        <div className="well">
          Hello World.
        </div>
      </div>;
    }
  }
}

