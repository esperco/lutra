/*
  Code for making displaying task labels work in Gmail
*/

/// <reference path="../lib/EventLabels.tsx" />
/// <reference path="../common/Analytics.ts" />
/// <reference path="./CurrentThread.ts" />

module Esper.EventLabels {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListControlState {
    team: ApiT.Team;
    events: ApiT.CalendarEvent[];
  }

  export class LabelListControl extends Component<{}, LabelListControlState>
  {
    render() {
      var events = _.map(this.state.events, (ev): ApiT.GenericCalendarEvent => {
        return ev && {
          id: ev.google_event_id,
          calendar_id: ev.google_cal_id,
          title: ev.title,
          start: ev.start.local,
          end: ev.end.local,
          feedback: {},
          description_messageids: ev.description_messageids,
          labels: ev.labels,
          labels_norm: _.map(ev.labels, (l) => l.toLowerCase()),
          all_day: ev.all_day,
          guests: ev.guests,
          transparent: ev.transparent
        };
      });

      var labelSettingsUrl = Conf.Settings.url + "#!/team-settings/" +
        this.state.team.teamid + "/labels";

      if (events && events.length > 0) {
        return <EventLabels.LabelList
          listClasses="list-group compact"
          itemClasses="list-group-item"
          team={this.state.team}
          events={events}
          editLabelsFn={() => window.open(labelSettingsUrl)}
          callback={this.toggleLabelCallback.bind(this)}
          callbackAll={this.analyticsCallback.bind(this)} />
      }

      return <div className="esper-section-content esper-no-content">
        Create linked events to set labels
      </div>;
    }

    getState() {
      return {
        team: CurrentThread.currentTeam.get().unwrap(),
        events: _.map(CurrentThread.linkedEvents.get(),
          (ev) => ev.task_event
        )
      };
    }

    toggleLabelCallback(event: ApiT.GenericCalendarEvent, labels: string[],
      promise: JQueryPromise<any>)
    {
      var linkedEvents = CurrentThread.linkedEvents.get();
      var linkedEv = _.find(linkedEvents, (ev) =>
        ev.task_event.google_cal_id === event.calendar_id &&
        ev.task_event.google_event_id === event.id
      );
      linkedEv.task_event.labels = labels;

      // Update watcher
      CurrentThread.linkedEvents.set(linkedEvents);
    }

    analyticsCallback(events: ApiT.GenericCalendarEvent[]) {
      Analytics.track(Analytics.Trackable.EditGmailEventLabels, {
        eventsSelected: events.length
      });
    }

    /*
      Because state is dependent on current task, set watcher to re-render
      when CurrentThread.task changes. We store reference to watcher to
      de-reference when component is unmounted.
    */
    linkedEventsId: string;

    componentDidMount() {
      this.linkedEventsId = CurrentThread.linkedEvents.watch(
        () => this.updateState()
      );
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this.linkedEventsId) {
        CurrentThread.linkedEvents.unwatch(this.linkedEventsId);
      }
    }
  }
}
