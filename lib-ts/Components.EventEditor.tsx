/*
  Component for editing event details, labels, etc.
*/

/// <reference path="./Components.LabelEditor.tsx" />
/// <reference path="./Components.LabelList.tsx" />
/// <reference path="./Components.Modal.tsx" />
/// <reference path="./Components.Textarea.tsx" />
/// <reference path="./Components.Tooltip.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface EventEditorProps {
    eventData: Model2.StoreData<Types.FullEventId, Types.TeamEvent>[];
    teams: ApiT.Team[];

    forceBatch?: boolean;
    focusOnLabels?: boolean;
    className?: string;
  }

  export function EventEditor(props: EventEditorProps) {
    if (! props.eventData.length) {
      return <div />;
    }

    let events = Option.flatten(_.map(props.eventData, (e) => e.data));
    let inputId = Util.randomString();
    return props.eventData[0].data.mapOr(
      null,
      (firstEvent) => <div className={props.className}>
        { props.eventData.length === 1 && !props.forceBatch ?
          <EventDetails event={firstEvent} /> :
          null
        }
        { props.eventData.length > 1 || props.forceBatch ||
          Stores.Events.isActive(firstEvent) ?
          <div className="esper-panel-section">
            { props.eventData.length === 1 && !props.forceBatch ?

              /*
                Only one event => use label list (same list as used with
                event list
              */
              <LabelList
                event={events[0]}
                team={
                  _.find(props.teams, (t) => t.teamid === events[0].teamId)
                }
              /> :

              /*
                Use label editor for multi-event scenarios because label
                list doesn't work well with scenarios where a label is selected
                for one event but not another.
              */
              <LabelEditor
                inputId={inputId}
                events={events}
                teams={props.teams}
                onSelect={(label, active) => {
                  if (active) {
                    Actions.EventLabels.add(events, label);
                    _.each(props.teams,
                      (team) => Actions.Teams.addLabel(team.teamid, label)
                    );
                  } else {
                    Actions.EventLabels.remove(events, label);
                  }
                }}
                autoFocus={props.focusOnLabels}
              />
            }

          </div> : null }
      </div>
    );
  }

  ////

  interface EventEditorModalProps extends EventEditorProps {
    onHidden?: () => void;
  }

  export class EventEditorModal
      extends Component<EventEditorModalProps, {}> {
    render() {
      var heading: JSX.Element|string = (this.props.eventData.length === 1 ?
        this.props.eventData[0].data.mapOr(
          null,
          (e) => e.title ?
            <span className={classNames("title", {
              "no-attend": !Stores.Events.isActive(e)
            })}>
              {e.title}
            </span> :
            <span className="no-title">
              { Text.NoEventTitle }
            </span>
        ) || "1 Event Selected" :
        this.props.eventData.length + " Events Selected"
      );

      return <Modal icon="fa-calendar-o" title={heading}
                    onHidden={this.props.onHidden}>
        <EventEditor className="esper-section"
                     eventData={this.props.eventData}
                     teams={this.props.teams}
                     focusOnLabels={this.props.focusOnLabels} />
      </Modal>;
    }
  }

  ////

  export function EventDetails({event}: {event: Stores.Events.TeamEvent}) {
    var guestEmails = Stores.Events.getGuestEmails(event);

    return <div className="event-details esper-panel-section">
      <div className="time">
        <i className="fa fa-fw fa-clock-o" />{" "}
        <span className="start">
          { moment(event.start).format("ddd, MMM D, h:mm a") }
        </span>{" to "}<span className="end">
          { moment(event.end).format("h:mm a") }
        </span>{" "}
        { event.recurringEventId ?
          <span className="recurring" title="Recurring">
            <i className="fa fa-fw fa-clone" />
          </span> :
          null
        }
      </div>
      { event.location ?
        <div className="location">
          <i className="fa fa-fw fa-map-marker" />{" "}
          {event.location}
        </div>
        : null
      }
      {
        (guestEmails && guestEmails.length) ?
        <div className="guests">
          <i className="fa fa-fw fa-users" />{" "}
          { guestEmails.join(", ") }
        </div>
        : null
      }
      { event.description ?
        <div className="description">
          {event.description}
        </div>
        : null
      }
    </div>;
  }
}
