/*
  Base class for a team settings view

  Override renderMain function
*/

module Esper.Views {
  export class PersonalSettings extends ReactHelpers.Component<{}, {}> {
    renderWithData() {
      return <div className="esper-full-screen minus-nav">
        <Components.TeamsSidebar
          teams={Stores.Teams.all()}
          activePersonal={true}
        />

        <div className="esper-right-content">
          <div className="esper-expanded">
            <Deactivate />
          </div>
        </div>
      </div>;
    }
  }

  /* Deactivate Account = really just remove calendars */

  function Deactivate({} : {}) {
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        <div className="alert alert-info text-center">
          { Text.DeactivateDescription }
        </div>
        <span className="control-label esper-input-align">
          { Text.deactivatePrompt(Login.myEmail()) }
        </span>
        <button className="pull-right btn btn-danger"
                onClick={Actions.Personal.deactivate}>
          { Text.DeactivateBtn }
        </button>
      </div>
    </div>;
  }
}
