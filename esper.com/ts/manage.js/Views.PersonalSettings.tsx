/*
  Base class for a team settings view

  Override renderMain function
*/

module Esper.Views {
  export function PersonalSettings(props: Types.SettingsPageProps) {
    return <Views.Settings {...props}>
      <Deactivate />
    </Views.Settings>;
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
