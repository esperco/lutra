/*
  Wraps various aspects of our app's "chrome" (headers, etc.) around some
  child eleents
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Stores.ReleaseNotes.ts" />
/// <reference path="./Views.Header.tsx" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  export class App extends Component<{
    children?: JSX.Element|JSX.Element[];
  }, {}> {
    render() {
      return <div>
        <ReleaseNotes lastDismiss={Stores.ReleaseNotes.get()} />
        <Views.Header />
        { this.props.children }
      </div>
    }
  }

  class ReleaseNotes extends Component<{ lastDismiss: number }, {}> {
    render() {
      if (this.props.lastDismiss < Text.LatestRelease) {
        return <div className="esper-release-notes esper-inverse pinned">
          <a className="action rm-action pull-right"
             title={Text.DismissNotes}
             onClick={this.dismissReleaseNotes.bind(this)}>
            <i className="fa fa-fw fa-close list-group-item-text" />
          </a>
          { Text.ReleaseNotes }
        </div>;
      }
      return null;
    }

    dismissReleaseNotes() {
      Stores.ReleaseNotes.set(Date.now());
      Route.nav.refresh();
    }
  }
}
