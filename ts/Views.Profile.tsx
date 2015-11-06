/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Profile extends Component<{}, {}> {
    render() {

      return <div className="container">
        <div className="well">
          <div>Hello World.</div>
          <div>test</div>
          </div>
        </div>;
    }
  }
}
