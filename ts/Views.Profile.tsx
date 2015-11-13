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
    error: Error;
    hasError: boolean;
    busy: boolean;
  };

  export class Profile extends Component<{}, ProfileState> {
    render() {
      if (this.state.busy) {
        return <div className="esper-spinner" />;
      }

      if (this.state.hasError) {
        return <div className="container">
          <div className="well">
            An error has occurred while fetching your user profile.
            <br/>
            {this.state.error}
          </div>
        </div>;
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
      var dirProfile = tuple[0];
      var metadata = tuple[1];
      return {
        dirProfile: dirProfile,
        error: metadata.lastError,
        hasError: metadata && metadata.dataStatus === Model.DataStatus.FETCH_ERROR,
        busy: metadata && metadata.dataStatus === Model.DataStatus.FETCHING
      }
    }
  }
}
