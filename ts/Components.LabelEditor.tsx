/*
  Component for updating labels for a given task
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/EventLabels.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Components.Section.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />

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

  export class LabelEditor extends Component<LabelEditorProps, {}>
  {
    renderWithData() {
      if (!this.props.events || !this.props.events.length) {
        return <span />;
      }

      var heading = (this.props.events.length === 1 ?
        this.props.events[0].title || "1 Event Selected":
        this.props.events.length + " Events Selected"
      );

      var events = _.map(this.props.events,
        (e) => Events.EventStore.val(e.id)
      );

      if (_.find(events, (e) => !!e.recurring_event_id)) {
        heading += " + Recurring"
      }

      return <BorderlessSection icon="fa-tags" title="Select Labels"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
         <h5 className="esper-subheader">{heading}</h5>
         { this.renderContent(events) }
      </BorderlessSection>;
    }

    renderContent(events: ApiT.GenericCalendarEvent[]) {
      return <EventLabels.LabelList
        listClasses="list-group"
        itemClasses="list-group-item"
        team={Teams.get(this.props.teamId)}
        events={events}
        callback={this.toggleLabelCallback.bind(this)}
        callbackAll={this.analyticsCallback.bind(this)}
        editLabelsFn={this.editLabelsCallback.bind(this)}
      />;
    }

    // Callback on toggle to update store
    toggleLabelCallback(event: ApiT.GenericCalendarEvent, labels: string[],
      promise: JQueryPromise<any>)
    {
      var teamEvent = Events.asTeamEvent(this.props.teamId, event);

      var events = [teamEvent];
      if (event.recurring_event_id) {
        events = Events.EventStore.valAll();
        events = events.filter(
          (e) => e.recurring_event_id === event.recurring_event_id
        );
      }

      Events.EventStore.transact(() => {
        Events.EventStore.transactP(promise, (transactPromise) => {
          _.each(events, (e) => {
            var _id = Events.storeId(e);
            var newData = _.clone(e);
            newData.labels = labels;
            Events.EventStore.push(_id, transactPromise, newData);
          });
        });
      });
    }

    analyticsCallback(events: ApiT.GenericCalendarEvent[]) {
      Analytics.track(Analytics.Trackable.EditTimeEsperEventLabels, {
        eventsSelected: events.length
      });
    }

    editLabelsCallback() {
      Layout.renderModal(<LabelAddModal />)
    }
  }
}
