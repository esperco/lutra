module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalProperty {
    teamid: string;
    cal: ApiT.GenericCalendar;
  }

  class OneCalendarPrefs extends Component<CalProperty, ApiT.CalendarPrefs> {
    constructor(props: CalProperty) {
      super(props);

      this.state = {
        email_for_meeting_feedback: props.cal.prefs.email_for_meeting_feedback
                                    || false,
        slack_for_meeting_feedback: props.cal.prefs.slack_for_meeting_feedback
                                    || false
      };
    }

    toggleUseEmail() {
      this.setState(
        {email_for_meeting_feedback: ! this.state.email_for_meeting_feedback},
        function() {
          Api.postCalendarPrefs(this.props.teamid, this.props.cal.id,
                                this.state);

          if (this.state.email_for_meeting_feedback) {
            Api.getGoogleAuthInfo(null).then(function(x:ApiT.GoogleAuthInfo) {
              if (x.google_auth_scope.search("//mail.google.com") < 0) {
                Api.getGoogleAuthUrl(location.href, null, null, null, true)
                .then(function(x:ApiT.UrlResult) {
                  location.href = x.url;
                });
              }
            });
          }
        });
    }

    toggleUseSlack() {
      this.setState(
        {slack_for_meeting_feedback: ! this.state.slack_for_meeting_feedback},
        function() {
          Api.postCalendarPrefs(this.props.teamid, this.props.cal.id,
                                this.state);

          if (this.state.slack_for_meeting_feedback) {
            Api.getSlackAuthInfo().then(function(x:ApiT.SlackAuthInfo) {
              if (! x.slack_authorized) {
                location.href = x.slack_auth_url;
              }
            });
          }
        });
    }

    renderWithData() {
      var id1 = Util.randomString(), id2 = Util.randomString();
      return <div>
        <div>
          <h4>{this.props.cal.title}</h4>
          <input
            type="checkbox"
            defaultChecked={this.state.email_for_meeting_feedback}
            onClick={e => this.toggleUseEmail()}
            id={id1}
          />
          <label htmlFor={id1}>
            Receive email for meeting feedback
          </label>
        </div>
        <div>
          <input
            type="checkbox"
            defaultChecked={this.state.slack_for_meeting_feedback}
            onClick={e => this.toggleUseSlack()}
            id={id2}
          />
          <label htmlFor={id2}>
            Receive slack message for meeting feedback
          </label>
        </div>        
      </div>;
    }
  }

  interface Property {
    teamids: string[];
    message: string;
  }

  interface CalsByTeamid {
    [index: string]: ApiT.GenericCalendars;
  }
  interface State {
    cals: CalsByTeamid;
  }

  export class CalendarSettings extends Component<Property, State> {
    constructor(props: Property) {
      super(props);

      this.state = {cals:{}};
      _.each(props.teamids, (teamid:string) => {
        Api.getGenericCalendarList(teamid)
        .then((cals:ApiT.GenericCalendars) => {
          this.state.cals[teamid] = cals;
          this.forceUpdate();
        });
      });
    }

    renderWithData() {
      return <div>
        <p>{this.props.message}</p>
        { _.map(this.state.cals,(cals:ApiT.GenericCalendars,teamid:string) => {
            return <div key={teamid}>
              { _.map(cals.calendars, (cal:ApiT.GenericCalendar) => {
                  return <div key={cal.id}>
                    <OneCalendarPrefs teamid={teamid} cal={cal}/>
                  </div>;
                })
              }
              <hr/>
            </div>;
          })
        }
      </div>;
    }
  }
}
