/*
  Component for updating labels for a given task
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/EventLabels.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Components.Section.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelEditorProps {
    // Selected team, calendar, and event(s)
    teamId: string;
    calId: string;
    events: {
      id: string;
      title?: string;
    }[],

    minimized?: boolean;
    toggleMinimized?: () => void;
  }

  interface LabelEditorState {
    events: ApiT.CalendarEvent[];
  }

  export class LabelEditor
    extends Component<LabelEditorProps, LabelEditorState>
  {
    render() {
      if (!this.props.events || !this.props.events.length) {
        return <span />;
      }

      var heading = (this.props.events.length === 1 ?
        this.props.events[0].title || "1 Event Selected":
        this.props.events.length + " Events Selected"
      );

      return <BorderlessSection icon="fa-tags" title="Select Labels"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
         <h5 className="esper-subheader">{heading}</h5>
         { this.renderContent() }
      </BorderlessSection>;
    }

    renderContent() {
      return <EventLabels.LabelList
        listClasses="list-group"
        itemClasses="list-group-item"
        team={Teams.get(this.props.teamId)}
        events={this.state.events}
        callback={this.toggleLabelCallback.bind(this)}
        callbackAll={this.analyticsCallback.bind(this)}
      />;
    }

    componentDidMount() {
      this.setSources([
        Events.EventStore
      ]);
    }

    // Callback on toggle to update store
    toggleLabelCallback(event: ApiT.CalendarEvent, labels: string[],
      promise: JQueryPromise<any>)
    {
      var _id = Calendars.getEventId(event);
      var newData = _.clone(event);
      newData.labels = labels;
      Events.EventStore.push(_id, promise, newData);
    }

    analyticsCallback(events: ApiT.CalendarEvent[]) {
      Analytics.track(Analytics.Trackable.EditTimeEsperEventLabels, {
        eventsSelected: events.length
      });
    }

    getState(props: LabelEditorProps): LabelEditorState {
      // Translate ids to actual event objects
      return {
        events: _.map(props.events,
          (e) => Events.EventStore.val(e.id)
        )
      };
    }
  }
}
