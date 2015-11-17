/*
  Calendar-specific implentation of EventLabels widget
*/

/// <reference path="../marten/ts/EventLabels.tsx" />
/// <reference path="./CurrentEvent.ts" />

module Esper.EventLabels {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListControlProps {
    team: ApiT.Team;
    event: ApiT.CalendarEvent;
    eventMetadata: Model.StoreMetadata;
  }

  export class LabelListControl extends Component<LabelListControlProps, {}> {
    render() {
      var updating = this.props.eventMetadata &&
        this.props.eventMetadata.dataStatus === Model.DataStatus.FETCHING;

      return (<div>
        <div className="esper-subheading">
          <i className="fa fa-fw fa-tag" />
          {" "} Labels
          <i onClick={ this.refresh.bind(this) }
             className="fa fa-fw fa-refresh" />
        </div>
        { updating ?
          <div className="esper-sidebar-loading">
            <div className="esper-spinner esper-list-spinner"></div>
          </div> :
          <EventLabels.LabelList
            listClasses="list-group"
            itemClasses="list-group-item"
            team={this.props.team}
            events={[this.props.event]}
            callback={this.toggleLabelCallback.bind(this)} />
        }
      </div>);
    }

    // Update current task (and by extension, the labels)
    refresh() {
      var calId = this.props.event.google_cal_id;
      var eventId = this.props.event.google_event_id;
      CurrentEvent.refreshEvent(this.props.team, calId, eventId);
    }

    // Callback on toggle to update store
    toggleLabelCallback(event: ApiT.CalendarEvent, labels: string[],
      promise: JQueryPromise<any>)
    {
      var _id = CurrentEvent.getEventKey(event);
      var newData = _.clone(event);
      newData.labels = labels;
      CurrentEvent.eventStore.push(_id, promise, newData);
    }
  }
}