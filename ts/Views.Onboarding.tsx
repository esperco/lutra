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
      <div className="col-sm-offset-2 col-sm-8 col-md-offset-3 col-md-6">
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
        <div className="well">
          Welcome to TimeStats!
          Esper TimeStats helps you label your calendar events and analyze how
          you spend your time. We'll need to set up a few things to get
          started. When you're ready, click 'Next' to continue.
        </div>
        <a href="img/TimeStats.gif" target="_blank">
          <img src="img/TimeStats.gif"
               style={{width: "100%", height: "auto"}} />
        </a>
        <div><div className="modal-footer">
          <button className="btn btn-default" onClick={Onboarding.next}>
            Next
          </button>
        </div></div>
      </div>)
    }
  }

  export class OnboardingAddCals extends Component<{}, {}> {
    renderWithData() {
      var info = Login.InfoStore.val();
      return renderContainer(<div>
        <div className="well">
          Please select which calendar(s) you'd like to use with TimeStats.

          If the calendar you’re looking for doesn’t appear in this list,
          {" "}{ info.platform === "Nylas" ?
            <span>
              ask the calendar owner to share it with the Exchange or Office
              365 account you logged in with.
            </span> :
            <span>
              ask the calendar owner to {" "}
              <a href="https://support.google.com/calendar/answer/37082?hl=en">
              share it with the Google account you logged in with</a>.
            </span>
          }
        </div>
        <Components.CalAdd onDone={Onboarding.next} doneText="Next"
          disableDone={!Onboarding.canGoToNext()} />
      </div>);
    }
  }

  export class OnboardingAddLabels extends Component<{}, {}> {
    renderWithData() {
      var info = Login.InfoStore.val();
      return renderContainer(<div>
        <div className="well">
          Create some labels to categorize your events. You
          can always add more later.
        </div>
        <Components.LabelAdd onDone={Onboarding.next} doneText="Next"
          disableDone={!Onboarding.canGoToNext()} />
      </div>);
    }
  }
}