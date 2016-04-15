/*
  Basic component for rendering a list of events
*/

/// <reference path="../common/Components.SignalStrength.tsx" />
/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  const LABEL_COUNT_CUTOFF = 4;
  const PREDICTED_LABEL_PERCENT_CUTOFF = 0.2;

  interface Props {
    events: Events2.TeamEvent[];
    selectedEvents?: Events2.TeamEvent[];
    teams: ApiT.Team[];
    onEventToggle?: (event: Events2.TeamEvent) => void;
    onEventClick?: (event: Events2.TeamEvent) => void;
    onFeedbackClick?: (event: Events2.TeamEvent) => void;
    onAddLabelClick?: (event: Events2.TeamEvent) => void;
  }

  export class EventList extends ReactHelpers.Component<Props, {}> {
    constructor(props: Props) {
      super(props);
    }
    render() {
      var events = this.props.events;
      if (events.length === 0) {
        return <div className="esper-no-content">
          No events found
        </div>;
      }

      var groupByDays = _.groupBy(events,
        (e) => moment(e.start).clone().startOf('day').valueOf()
      );
      var sortedKeys = _.sortBy(_.keys(groupByDays), (k) => parseInt(k));

      return <div className="event-list">
        {
          _.map(sortedKeys, (k) =>
            this.renderDay(parseInt(k), groupByDays[k])
          )
        }
      </div>;
    }

    renderDay(timestamp: number, events: Events2.TeamEvent[]) {
      var m = moment(timestamp);
      return <div className={classNames('day', {
        today: Time.sameDay(m, moment()),
        future: Time.diffDay(m, moment()) > 0,
      })} key={timestamp}>
        <div className="day-title">{ m.format("MMM D - dddd") }</div>
        <div className="list-group">
          { _.map(events, (e) => this.renderEvent(e)) }
        </div>
      </div>
    }

    renderEvent(event: Events2.TeamEvent) {
      return <div key={[event.teamId, event.calendar_id, event.id].join(",")}
                  className={classNames("list-group-item event", {
                    "has-labels": event.labels_norm.length > 0,
                    "past": moment(event.end).diff(moment()) < 0
                  })}>
        {
          this.props.onEventToggle ?
          <div className="event-checkbox"
               onClick={() => this.props.onEventToggle(event)}>
            { this.isSelected(event) ?
              <i className="fa fa-fw fa-check-square-o" /> :
              <i className="fa fa-fw fa-square-o" />
            }
          </div> : null
        }
        <div className="event-content">
          <div className={"title" +
                 (this.props.onEventClick ? " esper-link" : "") +
                 (event.feedback.attended === false ? " no-attend" : "")}
               onClick={() => this.props.onEventClick &&
                              this.props.onEventClick(event)}>
            {event.title}
          </div>
          <div className="time">
            <span className="start">
              { moment(event.start).format("h:mm a") }
            </span>{" to "}<span className="end">
              { moment(event.end).format("h:mm a") }
            </span>{" "}
            { event.recurring_event_id ?
              <span className="recurring" title="Recurring">
                <i className="fa fa-fw fa-refresh" />
              </span> :
              null
            }
          </div>
          <div className="action event-feedback"
               onClick={() => this.handleFeedbackClick(event)}>
            <EventFeedback feedback={event.feedback} />
          </div>
          <div className="event-labels">
            <LabelList event={event}
                       team={this.getTeam(event)}
                       onAddLabelClick={this.props.onAddLabelClick} />
          </div>
        </div>
      </div>;
    }

    getTeam(event: Events2.TeamEvent) {
      return _.find(this.props.teams, (t) => t.teamid === event.teamId);
    }

    handleFeedbackClick(event: Events2.TeamEvent) {
      if (this.props.onFeedbackClick) {
        this.props.onFeedbackClick(event);
      }
    }

    ////////

    isSelected(event: Events2.TeamEvent) {
      return this.findIndex(event) >= 0;
    }

    findIndex(event: Events2.TeamEvent) {
      return _.findIndex(this.props.selectedEvents || [], (e) =>
        Events2.matchRecurring(e, event)
      );
    }
  }

  function EventFeedback({feedback}: {feedback: ApiT.EventFeedback}) {
    // Check if no feedback
    if (!feedback || (_.isUndefined(feedback.attended) && !feedback.rating
        && !feedback.notes)) {
      return <span />;
    }

    // Format feedback
    return <span>
      { feedback.attended === false ?
        <i className="fa fa-fw fa-ban" /> :
        _.times(feedback.rating || 0, (i) =>
          <i key={i.toString()} className="fa fa-fw fa-star" />
        )
      }
      {" "}
      { feedback.notes ? <i className="fa fa-fw fa-comment" /> : null }
    </span>;
  }


  /* Helpers for managing predicted labels */

  // Non-predicted label
  interface LabelVal {
    label: string;
    label_norm: string;
  }

  type LabelOrPredicted = LabelVal|ApiT.PredictedLabel;

  function isPredictedLabel(x: LabelOrPredicted): x is ApiT.PredictedLabel {
    var typedX = x as ApiT.PredictedLabel;
    return !!typedX.score;
  }

  function labelsFomEvent(event: Events2.TeamEvent) {
    return _.map(event.labels_norm, (n, i) => ({
      label: event.labels[i],
      label_norm: n
    }));
  }

  function labelsFromTeam(team: ApiT.Team) {
    return _.map(team.team_labels_norm, (n, i) => ({
      label: team.team_labels[i],
      label_norm: n
    }));
  }


  /////

  interface LabelListProps {
    event: Events2.TeamEvent;
    team: ApiT.Team;
    onAddLabelClick?: (event: Events2.TeamEvent) => void;
  }

  /*
    A list of toggle-able labels or predicted labels for an event.
  */
  class LabelList extends ReactHelpers.Component<LabelListProps, {
    initLabelList: LabelOrPredicted[];
    expanded: boolean;
  }> {
    constructor(props: LabelListProps) {
      super(props);

      /*
        Track the initial set of labels (or predicted labels) for rendering
        purposes. We don't want predicted labels or other options to disappear
        just because the user toggled one.
      */
      this.state = {
        initLabelList: this.getInitLabels(props),
        expanded: false
      }
    }

    /*
      If new labels outside of the initial list are assigned, that means
      user has added labels from outside the label toggle interface, so
      reset our initial toggle list.
    */
    componentWillReceiveProps(props: LabelListProps) {
      var eventLabels = labelsFomEvent(props.event);
      if (!this.state.expanded &&
          _.differenceBy(eventLabels, this.state.initLabelList,
            (l) => l.label_norm).length > 0) {
        this.setState({
          initLabelList: eventLabels,
          expanded: this.state.expanded
        });
      }
    }

    // Returns a combination of predicted labels and team labels,
    // up to threshold, for selection purposes.
    getInitLabels(props: LabelListProps): LabelOrPredicted[] {
      if (Util.notEmpty(props.event.labels_norm)) {
        return labelsFomEvent(props.event);
      }

      var ret: LabelOrPredicted[] =
        _.filter(props.event.predicted_labels,
          (l) => l.score > PREDICTED_LABEL_PERCENT_CUTOFF
        );
      if (ret.length < LABEL_COUNT_CUTOFF) {
        ret = _.uniqBy(ret.concat(labelsFromTeam(props.team)),
          (l) => l.label_norm);
      }
      return ret.slice(0, LABEL_COUNT_CUTOFF);
    }

    render() {
      var labelList = this.state.initLabelList;
      if (this.state.expanded) {
        labelList = labelList.concat(labelsFromTeam(this.props.team));
        labelList = _.uniqBy(labelList, (l) => l.label_norm);
      }
      return <div className="event-labels">
        { _.map(labelList, (labelVal) =>
          <LabelToggle key={labelVal.label_norm}
                       label={labelVal} event={this.props.event} />
        ) }
        { this.state.expanded && this.props.onAddLabelClick ?
          <span className="add-event-label action label-list-action"
                onClick={() => this.props.onAddLabelClick(this.props.event)}>
            {labelList.length ?
              <span>
                <i className="fa fa-fw fa-tag" />{" "}
                <i className="fa fa-fw fa-ellipsis-h" />
              </span> :
              <span>
                <i className="fa fa-fw fa-plus" />{" "}{Text.AddLabel}
              </span>
            }
          </span> : null }
        <span className="toggle-label-expansion action label-list-action"
              onClick={() => this.toggleExpand()}>
          <i className={classNames("fa", "fa-fw", {
            "fa-chevron-left": this.state.expanded,
            "fa-chevron-right": !this.state.expanded
          })} />
        </span>
      </div>;
    }

    // When contracting, re-adjust init label list
    toggleExpand() {
      this.setState({
        initLabelList: (this.state.expanded ?
          this.getInitLabels(this.props) :
          this.state.initLabelList
        ),
        expanded: !this.state.expanded
      });
    }
  }


  interface LabelProps {
    label: LabelOrPredicted;
    event: Events2.TeamEvent;
  }

  class LabelToggle extends ReactHelpers.Component<LabelProps, {}> {
    _predictedLabel: HTMLSpanElement;

    render() {
      var labelColor = Colors.getColorForLabel(this.props.label.label_norm);
      var isSelected = this.isSelected();
      var style = (() => ({
        borderStyle: "solid",
        borderColor: labelColor,
        background: isSelected ? labelColor : "transparent",
        color: isSelected ? Colors.colorForText(labelColor) :
                            Colors.darken(labelColor)
      }))();

      var label = this.props.label;
      if (isPredictedLabel(label)) {
        return <span style={style} className="event-label predicted-label"
                     ref={(c) => this._predictedLabel = c}
                     data-toggle="tooltip"
                     title={isSelected ? null :
                            Text.predictionTooltip(label.score)}
                     onClick={() => {
                       isSelected ? this.toggleOff() : this.toggleOn()
                     }}>
          { isSelected ?
            <i className="fa fa-fw fa-tag" /> :
            <i className="fa fa-fw fa-question-circle" />
          }{" "}
          {label.label}{" "}
          <span className="label-score">
            { isSelected ? <i className="fa fa-fw fa-check" /> :
              <SignalStrength strength={label.score} /> }
          </span>
        </span>;
      }

      return <span style={style} className="event-label"
                   onClick={() => {
                     isSelected ? this.toggleOff() : this.toggleOn()
                   }}>
        <i className="fa fa-fw fa-tag" />{" "}
        {this.props.label.label}
      </span>;
    }

    componentDidMount() {
      this.mountTooltip();
    }

    componentDidUpdate() {
      this.mountTooltip();
    }

    mountTooltip() {
      if (this._predictedLabel) {
        $(this._predictedLabel).tooltip();
      }
    }

    isSelected() {
      return !!_.find(this.props.event.labels_norm,
        (n) => n === this.props.label.label_norm
      );
    }

    toggleOn() {
      EventLabelChange.add([this.props.event], this.props.label.label);
    }

    toggleOff() {
      EventLabelChange.remove([this.props.event], this.props.label.label);
    }
  }


  /////

  export class EventListModal extends ReactHelpers.Component<Props, {}> {
    render() {
      var heading = Text.events(this.props.events.length);
      return <Modal icon="fa-calendar-o" title={heading}>
        { React.createElement(EventList, this.getProps()) }
      </Modal>;
    }

    // Extend provided props with defaults for modal
    getProps(): Props {
      var newProps = _.clone(this.props);
      newProps.onAddLabelClick = newProps.onAddLabelClick ||
        function(event: Events2.TeamEvent) {
          Layout.renderModal(Containers.eventEditorModal([event]));
        };
      newProps.onEventClick = newProps.onEventClick ||
                              newProps.onAddLabelClick;
      return newProps;
    }
  }
}
