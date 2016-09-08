/*
  New Group page
*/

module Esper.Views {
  export class Sandbox extends ReactHelpers.Component<{}, {}> {
    render() {
      return <div className="esper-simple-content text-center">
        <div className="esper-center">
          <h2>Not Available In Demo Mode</h2>
          <p>
            This feature is not available when using Esper
            in demo mode.
          </p>
          <p>
            <a className="btn btn-primary" href="/login">
              Please sign up to get started!
            </a>
          </p>
        </div>
      </div>;
    }
  }
}
