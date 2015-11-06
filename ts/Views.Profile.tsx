/*
  Displays the current logged in user's profile
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./DirProfile.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface ProfileState {
    dirProfile: ApiT.DirProfile;
    busy: boolean;
  };

  export class Profile extends Component<{}, ProfileState> {
    render() {
      if (this.state.busy) {
        return <div className="esper-spinner" />;
      }

      var profile = this.state.dirProfile;

      return <div className="container">
        <div className="well">
          <h2>{profile.display_name}</h2>
          <h3>{profile.company_title}</h3>
        </div>
      </div>;
    }

    componentDidMount() {
      this.setSources([DirProfile.Store]);
    }

    getState() {
      var tuple = DirProfile.Store.get();
      if (tuple === undefined) {
        return {
          dirProfile: null,
          busy: true
        };
      }
      var dirProfile = tuple[0];
      var metadata = tuple[1];
      return {
        dirProfile: dirProfile,
        busy: metadata && metadata.dataStatus !== Model.DataStatus.READY
      }
    }
  }
}
