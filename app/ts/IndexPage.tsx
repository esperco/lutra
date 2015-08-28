// Sample React View and Tests. Used to snaity check TSX and React.
module Esper.IndexPage {

  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  export class IndexPage extends React.Component<{}, {}> {
    render() {
      return (
        <div className="container">
          Hello React!
        </div>
      );
    }
  }
}

