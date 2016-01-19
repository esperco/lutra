/*
  Component for updating labels for a given set of events
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Api.ts" />
/// <reference path="./Queue.ts" />

module Esper.EventLabels {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListProps {
    // Used to determine which labels to show. NB: This will change if/when we
    // use a different object to store our label list.
    team: ApiT.Team;

    // Actual event objects
    events: ApiT.GenericCalendarEvent[];

    // Optional function to generate keys for queue from event
    queueIdFn?: (teamId: string, ev: ApiT.GenericCalendarEvent) => string;

    // Optional callback triggered when labels are toggled -- called once
    // for each event
    callback?: (event: ApiT.GenericCalendarEvent, labels: string[],
                promise: JQueryPromise<void>) => void;

    // Optional callback called once for each edit (even if edit is for
    // multiple events)
    callbackAll?: (events: ApiT.GenericCalendarEvent[]) => void;

    // Classes
    listClasses?: string;
    itemClasses?: string;

    // Change behavior of configure labels link
    editLabelsFn?: (e: React.SyntheticEvent) => void;
  }

  interface LabelListState {
    busy: boolean,
    hasError: boolean
  }

  export class LabelList extends Component<LabelListProps, LabelListState> {
    queueIdFn: (teamId: string, ev: ApiT.GenericCalendarEvent) => string;

    constructor(props: LabelListProps) {
      super(props);
      this.queueIdFn = props.queueIdFn || defaultIdFn;
      this.state = {
        busy: false,
        hasError: false
      };
    }

    render() {
      var labelElms = _.map(
        this.getAllLabels(),
        this.renderLabel.bind(this));

      return (<div className="esper-bs esper">
        {
          this.state.hasError ?
          <div className="alert alert-danger">
            <i className="fa fa-fw fa-warning" />{" "}
            Whoops. Something went wrong. Please try again later.
          </div> : ""
        }
        <div className={this.props.listClasses}>
          { labelElms && labelElms.length ? labelElms :
            <div className="esper-no-content">No Labels Found</div> }
        </div>
        <div className="esper-subsection-footer">
          {
            this.state.busy ?
            <span>
              <span className="esper-spinner esper-inline" />
              {" "}Saving &hellip;
            </span> :
            ( this.props.editLabelsFn ?
              <a className="esper-link" target="_blank"
                 onClick={this.props.editLabelsFn}>
                <i className="fa fa-fw fa-cog"></i>
                {" "}Configure Labels
              </a> : null )
          }
        </div>
      </div>);
    }

    /*
      Returns a list of labels including those stored on the team and each
      of the events themselves
    */
    getAllLabels() {
      var labels = this.props.team.team_labels || [];
      labels = _.reduce(this.props.events, (allLabels, event) => {
        return labels.concat(event.labels || []);
      }, labels);
      return _.uniq(labels);
    }

    /*
      This input may be used to control labels for more than one event (e.g.
      from the Gmail side -- or for batch labeling. In that case, we need to
      distinguish between labels that apply to all events and labels that
      apply only to a subset.
    */
    getAllChecked() {
      var firstEvent = this.props.events[0];
      if (! firstEvent) {
        return [];
      }

      var labels: string[] = firstEvent.labels;
      return _.reduce(this.props.events.slice(1),
        (accumulator, event) => _.intersection(accumulator, event.labels || []),
        labels
      );
    }

    /* Includes all checked */
    getSomeChecked() {
      var labels: string[] = [];
      return _.reduce(this.props.events,
        (accumulator, event) => _.union(accumulator, event.labels || []),
        labels
      );
    }

    renderLabel(name: string, index: number) {
      var checkedByAll = _.contains(this.getAllChecked(), name);
      var checkedBySome = !checkedByAll &&
        _.contains(this.getSomeChecked(), name);
      var icon: string;
      if (checkedByAll) {
        icon = "fa-check-square";
      } else if (checkedBySome) {
        icon = "fa-minus-square-o";
      } else {
        icon = "fa-square-o"
      }
      return (<a className={this.props.itemClasses}
                 key={index.toString() + "-" + name}
                 onClick={() => this.toggle(name) }>
        <i className={"fa fa-fw " + icon} />
        {" "}{name}
      </a>);
    }

    protected toggle(label: string) {
      // Toggling logic - apply label to events unless ALL events already have
      // it applied, in which case remove.
      var add = !_.contains(this.getAllChecked(), label);

      // Update state
      this.setState({
        busy: true,
        hasError: false
      });

      // A list of events with newLabels (for callback)
      var newEvents: ApiT.GenericCalendarEvent[] = [];

      var promises: JQueryPromise<void>[] = [];
      _.each(this.props.events, (ev) => {
        var newLabels: string[];
        if (add) {
          // Concat rather than push so we don't mutate task prop
          newLabels = (ev.labels || []).concat([label]);
        } else {
          newLabels = _.without(ev.labels, label);
        }
        promises.push(this.scheduleUpdate(ev, newLabels));

        var newEv = _.cloneDeep(ev);
        newEv.labels = newLabels;
        newEvents.push(newEv);
      });

      var allPromises: JQueryPromise<void> = $.when.apply($, promises);
      allPromises.done(() => {
        this.setState({
          busy: false,
          hasError: false
        });
      }).fail(() => {
        this.setState({
          busy: false,
          hasError: true
        });
      });

      if (this.props.callbackAll) {
        this.onChangeAll(newEvents);
      }
    }

    protected scheduleUpdate(event: ApiT.GenericCalendarEvent,
                             labels: string[]) {
      var _id = this.queueIdFn(this.props.team.teamid, event);
      nextUpdates[_id] = labels;

      // Enqueue update that only fires API call if the nextUpdates object
      // has a saved update.
      var p = Queue.enqueue(_id, () => {
        var edit = nextUpdates[_id];
        if (edit) {
          delete nextUpdates[_id];
          var eventId = event.recurring_event_id || event.id;
          return Api.updateEventLabels(this.props.team.teamid, eventId, edit);
        }
      });

      // Fire callback to parent
      if (this.props.callback) {
        this.props.callback(event, labels, p);
      }

      return p;
    }

    /*
      Purpose of callbackAll is to fire a single (or at least not very many
      callbacks) for event editing. So we set a variable tracking copies
      of our events and wait to post unti lafter things stop changing.
    */
    private _lastEventIds: string[];
    private _lastEvents: ApiT.GenericCalendarEvent[];

    protected onChangeAll(events: ApiT.GenericCalendarEvent[]) {
      var eventIds = _.map(events, (ev) => ev.id) || [];
      eventIds.push(this.props.team.teamid);

      if (this._lastEventIds && !_.eq(eventIds, this._lastEventIds)) {
        this.props.callbackAll(this._lastEvents);
      }

      this._lastEventIds = eventIds;
      this._lastEvents = events;

      setTimeout(() => {
        if (_.eq(eventIds, this._lastEventIds)) {
          this.props.callbackAll(this._lastEvents);
          delete this._lastEventIds;
        }
      }, 2000);
    }
  }

  ///////

  // Default function for converting CalendarEvents to string ids
  var defaultIdFn = function(teamId: string, event: ApiT.GenericCalendarEvent) {
    return "EventLabelCalendarEvent|" + teamId + "|" + event.id;
  };

  // Used to track the next pending label update for an id in a queue
  var nextUpdates: {
    [index: string]: string[]
  } = {};
}
