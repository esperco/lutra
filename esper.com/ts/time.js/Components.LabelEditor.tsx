/*
  Component for updating labels for a given task
*/

/// <reference path="../lib/Analytics.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/EventLabels.tsx" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Events.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./TimeStats.ts" />
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
      var events = _.filter(_.map(this.props.events,
        (e) => Events.EventStore.val(e.id)
      ));

      if (!events.length) {
        return <span />;
      }

      var heading = (events.length === 1 ?
        events[0].title || "1 Event Selected":
        events.length + " Events Selected"
      );

      var hasRecurring = false;
      if (_.find(events, (e) => !!e.recurring_event_id)) {
        hasRecurring = true;
      }

      return <BorderlessSection icon="fa-tags" title="Select Labels"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
         <h5 className="esper-subheader select-labels-heading">
           {heading}
           { hasRecurring ?
             <span className="recurring-note">
               {" "}+ Recurring
             </span>: ""
           }
           { this.props.events.length === 1 ?
             <span className="shift-note">
               {" "}(Hold Shift to Select Multiple Events)
             </span>: ""
           }
         </h5>
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

      /*
        Naive invalidation of entire cache for now -- figure out something
        smarter if/when it matters
      */
      TimeStats.StatStore.reset();
    }

    analyticsCallback(events: ApiT.GenericCalendarEvent[]) {
      Analytics.track(Analytics.Trackable.EditTimeEsperEventLabels, {
        eventsSelected: events.length
      });
    }

    componentDidMount() {
      Option.cast(Teams.get(this.props.teamId)).match({
        none: () => null,
        some: (t) => {
          // No team labels => open modal
          if (!t.team_labels || !t.team_labels.length) {
            this.editLabelsCallback();
          }
        }
      });
    }

    editLabelsCallback() {
      Layout.renderModal(<LabelAddModal
        onHidden={Views.forceCalendarLabelingUpdate}
      />);
    }
  }
}
