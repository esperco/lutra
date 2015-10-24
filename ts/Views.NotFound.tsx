/// <reference path="../marten/ts/ReactHelpers.ts" />

/*
  Our "404" page
*/
module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class NotFound extends Component<{}, {}> {
    render() {
      return <div id="not-found-page" className="esper-full-screen">
        <div className="esper-center">
          <h2>Whoops.</h2>
          <p>
            We can't find what you're looking for. Please
            {" "}<a href="http://esper.com/contact">contact us</a>{" "}
            if you need help.
          </p><p>
            <a href="http://esper.com">Click here to go back to Esper.com.</a>
          </p>
        </div>
      </div>;
    }
  }
}

