/*
  Onboarding process
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Components.Onboarding.tsx" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  function renderContainer(children: JSX.Element|JSX.Element[]) {
    return <div className="container onboarding-main"><div className="row">
      <div className="col-sm-offset-2 col-sm-8">
        <div className="panel panel-default">
          <div className="panel-body">
            {children}
          </div>
        </div>
      </div>
    </div></div>;
  }

  export class OnboardingStart extends Component<{}, {}> {
    renderWithData() {
      return renderContainer(<div>
        <div className="alert alert-info">
          Welcome to Esper TimeStats!
          Use TimeStats to identify time sinks, spot trends, and focus on what
          matters most to you.
        </div>
        <a href="img/TimeStats.gif" target="_blank">
          <img src="img/TimeStats.gif" className="onboarding-img"
               style={{width: "100%", height: "auto"}} />
        </a>
      </div>)
    }
  }

  export class OnboardingAddCals extends Component<{}, {}> {
    renderWithData() {
      return renderContainer(<div>
        <div className="alert alert-info">
          Which calendars do you use to track your time?
        </div>
        <Components.CalAdd />
      </div>);
    }
  }

  export class OnboardingAddLabels extends Component<{}, {}> {
    renderWithData() {
      var info = Login.InfoStore.val();
      return renderContainer(<div>
        <div className="alert alert-info">
          Create some labels to categorize your events.
          {" "}<strong>Add at least 2 labels to get started.</strong>{" "}
          You can add more at any time.
        </div>
        <Components.LabelAdd suggestedLabels={[
          "Product", "Business Development", "Sales",
          "Email", "Internal Team", "Networking",
          "Health & Wellness", "Personal", "Travel"
        ]} />
      </div>);
    }
  }
}