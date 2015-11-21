/*
  Onboarding steps
*/

/// <reference path="./Components.CalAdd.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class OnboardingCalModal extends Component<{}, {}> {
    render() {
      var info = Login.InfoStore.val();
      return <Modal title="Connect Calendars to Esper">
        <div className="well">
          Welcome! Esper Time lets you label your calendar
          events and analyze how you spend your time. To get started, please
          select which calendar(s) you'd like to use with Esper Time.

          If the calendar you’re looking for doesn’t appear in this list,
          {" "}{ info.is_nylas ?
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
        <CalAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
    }
  }
}
