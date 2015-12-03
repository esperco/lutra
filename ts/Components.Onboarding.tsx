/*
  Onboarding steps
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Onboarding.ts" />
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
          {" "}{ (info as any).is_nylas || info.platform === "Nylas" ?
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

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddCalendarsModal);
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

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddLabelsModal);
    }

    hideModal() {
      this.jQuery().modal('hide');
      this.jQuery().on('hidden.bs.modal', function() {
        Layout.renderModal(<GifModal />);
      });
      Route.nav.path("calendar-labeling");
    }
  }

  export class GifModal extends Component<{}, {}> {
    render() {
      return (<Modal title="Getting Started" icon="fa-question-circle"
                     showFooter={true}>
        <div className="well">
          Click on events in the calendar and then add labels via the sidebar.
          You can label multiple events at the same time by holding down
          Shift when selecting events. See stats on what's been labeled by
          clicking 'Charts' in the upper left. Data for newly labeled events
          may take some time to show up.
        </div>
        <a href="img/TimeStats.gif" target="_blank">
          <img src="img/TimeStats.gif"
               style={{width: "100%", height: "auto"}} />
        </a>
      </Modal>);
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsGifModal);
    }

    hideModal() {
      this.jQuery().modal('hide');
    }
  }


  ///////

  interface OnboardingHeaderProps {
    icon?: string;        // FontAwesome icon
    title: string;        // Visible in title row
    subTitle?: string;    // Still in title row, but smaller

    // Below title row -- visible only on mouse over
    children?: JSX.Element[];
  }

  class OnboardingHeader extends Component<OnboardingHeaderProps, {}> {
    renderWithData() {
      var step = Onboarding.current();
      var disabledNext = !Onboarding.canGoToNext();

      return <div className="onboarding-header-wrapper">
        <div className="onboarding-header">
          <div className="nav">
            <h2 className="onboarding-title">
              { this.props.icon ?
                <i className={"fa fa-fw " + this.props.icon} /> :
                null
              }{" "}
              {this.props.title}
            </h2>{" "}
            { this.props.subTitle ?
              <span className="onboarding-subtitle">
                {this.props.subTitle}
              </span>: ""
            }
            <div className="pull-right">
              <div className="btn-group">
                { step > 0 ?
                  <button type="button" className="btn navbar-btn btn-default"
                          onClick={Onboarding.prev}>
                    <i className="fa fa-fw fa-angle-left" />
                  </button> : null
                }
                <button type="button" className="btn navbar-btn btn-default"
                        onClick={Onboarding.next} disabled={disabledNext}>
                  <i className="fa fa-fw fa-angle-right" />
                </button>
              </div>
            </div>
          </div>
          { (this.props.children && this.props.children.length) ?
            <div className="onboarding-header-content">
              {this.props.children}
            </div> : ""
          }
        </div>
        { this.renderProgress() }
      </div>
    }

    renderProgress() {
      var total = Onboarding.paths.length;
      var current = Onboarding.current() + 1;
      var progress = Math.floor((current / total) * 100);
      return <div className="progress skinny">
        <div className="progress-bar" style={{width: progress + "%"}} />
      </div>;
    }
  }

  /*
    Use functions rather component classes to spit out new headers because
    we want to reuse our OnboardingHeader component instance (which helps
    animate the progress bar)
  */

  export function onboardingStartHeader() {
    return <OnboardingHeader title="Let's Get Started!" icon="fa-rocket" />;
  }

  export function onboardingAddCalsHeader() {
    return <OnboardingHeader title="Add a Calendar to Continue"
      icon="fa-calendar-check-o" />;
  }

  export function onboardingAddLabelsHeader() {
    return <OnboardingHeader title="Add at Least 2 Labels to Continue"
      icon="fa-tags" />;
  }

  export function onboardingLabelEventsHeader() {
    return <OnboardingHeader title="Label an Event to Continue"
      icon="fa-th-list" />;
  }

  export function onboardingChartsHeader() {
    return <OnboardingHeader title="Congrats!" icon="fa-bar-chart" />;
  }
}
