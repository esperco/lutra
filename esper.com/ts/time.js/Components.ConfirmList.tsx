/*
  A paginated list of events for confirmation
*/
module Esper.Components {
  const DEFAULT_PER_PAGE = 7;

  interface Props {
    busy?: boolean;
    error?: boolean;
    events: Stores.Events.TeamEvent[];
    teams: ApiT.Team[];
    onEventClick?: (event: Stores.Events.TeamEvent) => void;
    perPage?: number;
    initPageStart?: number;
  }

  interface State {
    // Which events in events list in props to show?
    pageIndices: [number, number];
  }

  export class ConfirmList extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);

      var initPageStart = Math.min(
        this.props.initPageStart || 0,
        this.props.events.length);
      var initPageEnd = Math.min(
        initPageStart + this.perPage(),
        this.props.events.length);
      this.state = {
        pageIndices: [initPageStart, initPageEnd]
      };
    }

    render() {
      var events = this.getEvents();
      return <div>
        { this.renderMain(events) }
        { this.renderProgress(events) }
        { this.renderFooter(events) }
      </div>;
    }

    renderMain(events: Types.TeamEvent[]) {
      return <div className="esper-section">
        {/* Description of why we need confirmation */}
        { this.state.pageIndices[0] === 0 ?
          <div className="alert alert-info">
            { Text.ConfirmationDescription }
          </div> :
          null }

        { this.props.error ? <ErrorMsg /> : null }

        { this.props.busy ?
          <LoadingMsg msg={Text.PredictionsLoading} hellip={true} /> :
          <div className="esper-section">
            <EventList events={events}
              teams={this.props.teams}
              onEventClick={this.props.onEventClick}
            />
          </div> }
      </div>
    }

    renderProgress(events: Types.TeamEvent[]) {
      // Logarithmic progress bar
      var progress = this.state.pageIndices[1] / this.props.events.length;
      progress = Math.min(progress, 1);
      progress = Math.sqrt(progress);

      return <ProgressBar width={progress} skinny={true} />
    }

    // Button to load more events and update predictions, as applicable
    renderFooter(events: Types.TeamEvent[]) {
      if (_.isEmpty(events)) {
        return null;
      }

      return <div className="clearfix modal-footer">
        <button className="btn btn-primary form-control"
                onClick={() => this.onNext(events)}>
          { Text.ConfirmAllLabels }
        </button>
      </div>;
    }

    getEvents() {
      return this.props.events.slice(
        this.state.pageIndices[0],
        this.state.pageIndices[1]
      );
    }

    onNext(events: Stores.Events.TeamEvent[]) {
      var nextIndices = this.nextIndices();
      var nextEvents = this.props.events.slice(nextIndices[0], nextIndices[1]);
      Actions.EventLabels.confirm(events, nextEvents);

      if (this.hasMore()) {
        this.mutateState((s) => s.pageIndices = nextIndices);
      } else {
        this.onFinish();
      }
    }

    // Keep as separate function from updateRemainder so our ConfirmListModal
    // (or any other subclasses) can handle this differently
    onFinish() {
      this.updateRemainder();
    }

    // When done, re-predict any remaining events
    updateRemainder() {
      var eventsToUpdate = _.filter(this.props.events,
        (e) => Stores.Events.needsConfirmation(e)
      );
      Actions.EventLabels.confirm([], eventsToUpdate);
    }

    perPage() {
      return this.props.perPage || DEFAULT_PER_PAGE;
    }

    hasMore() {
      return this.state.pageIndices[1] < this.props.events.length;
    }

    nextIndices(): [number, number] {
      var indices = this.state.pageIndices;
      return [
        Math.min(indices[1], this.props.events.length),
        Math.min(indices[1] + this.perPage(), this.props.events.length)
      ];
    }
  }

  export class ConfirmListModal extends ConfirmList {
    render() {
      var events = this.getEvents();
      return <ModalBase onHidden={() => this.updateRemainder()}>
        <ModalHeader icon="fa-question-circle"
                     title={Text.ConfirmLabelsHeading} />
        <div className="modal-body">
          { this.renderMain(events) }
        </div>
        { this.renderProgress(events) }
        { this.renderFooter(events) }
      </ModalBase>;
    }

    /*
      Trigger update remainder function via onHidden handler on Modal
      This avoids calling the problem where we call the function twice
      because clicking done triggers the onFinish function AND
      the onHidden handler.
    */
    onFinish() {
      Layout.closeModal();
    }
  }
}
