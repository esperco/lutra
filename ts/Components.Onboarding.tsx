/*
  Onboarding steps
*/

/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class OnboardingCalModal extends Component<{}, {}> {
    render() {
      var info = Login.InfoStore.val();
      return <Modal title="Connect Calendars to Esper"
                    icon="fa-calendar-check-o">
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
        <CalAdd onDone={this.goToLabelModal.bind(this)}/>
      </Modal>;
    }

    goToLabelModal() {
      this.jQuery().modal('hide');
      this.jQuery().on('hidden.bs.modal', () => {
        Layout.renderModal(<OnboardingLabelModal />);
      });
    }
  }

  export class OnboardingLabelModal extends Component<{}, {}> {
    render() {
      return <Modal title="Set Up Labels" icon="fa-tags">
        <div className="well">
          Create some labels to categorize your events. You
          can always add more later.
        </div>
        <LabelAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
      Route.nav.path("calendar-labeling");
    }
  }
}
