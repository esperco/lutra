module Esper.TestPage {
  var React = Esper.React;

  export class IndexPage extends React.Component<{}, {}> {
    render() {
      return (
        <div className="container">
          Hello React! We are in
          {__ESPER_PRODUCTION__ ? " production " : " development "}
          mode.
        </div>
      );
    }
  }
}