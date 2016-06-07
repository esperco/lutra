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
    onAddLabelClick?: (event: Stores.Events.TeamEvent) => void;
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
      var needsConfirmation = !!_.find(events,
        (e) => Stores.Events.needsConfirmation(e)
      );

      // Logarithmic progress bar
      var progress = this.state.pageIndices[1] / this.props.events.length;
      progress = Math.min(progress, 1);
      progress = Math.sqrt(progress);

      return <div>
        {/* Description of why we need confirmation */}
        { this.state.pageIndices[0] === 0 ?
          <div className="alert alert-info">
            { Text.ConfirmationDescription }
          </div> :
          null }

        { this.props.error ? <ErrorMsg /> : null }

        <ProgressBar width={progress} skinny={false} />

        { this.props.busy ?
          <LoadingMsg msg={Text.PredictionsLoading} hellip={true} /> :
          <EventList events={events}
            teams={this.props.teams}
            onEventClick={this.props.onEventClick}
            onAddLabelClick={this.props.onAddLabelClick}
          /> }

        {/* Button to load more events and update predictions, as applicable */}
        { events.length ?
          <div className="form-group">
          {
            (needsConfirmation || this.hasMore()) ?
            <button className="btn btn-secondary form-control"
                    onClick={() => this.onNext(events)}>
              { needsConfirmation ?
                Text.ConfirmAllLabels :
                Text.MorePredictions }
            </button> :
            <div className="text-center">
              { Text.ConfirmationDone }
            </div>
          }
          </div> : null }

        {/* Button to close list / modal / whatever */}
        <div className="clearfix modal-footer">
          <button className="btn btn-default"
                  onClick={() => this.onFinish()}>
            Done
          </button>
        </div>
      </div>;
    }

    getEvents() {
      return this.props.events.slice(
        this.state.pageIndices[0],
        this.state.pageIndices[1]
      );
    }

    onNext(events: Stores.Events.TeamEvent[]) {
      var eventsToConfirm = _.filter(events,
        (e) => Stores.Events.needsConfirmation(e)
      );
      var nextIndices = this.nextIndices();
      var nextEvents = this.props.events.slice(nextIndices[0], nextIndices[1]);
      Actions.EventLabels.confirm(eventsToConfirm, nextEvents);

      if (this.hasMore()) {
        this.mutateState((s) => s.pageIndices = nextIndices);
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
      return <Modal icon="fa-question-circle"
                    title={Text.ConfirmLabelsHeading}
                    onHidden={() => this.updateRemainder()}>
        { super.render() }
      </Modal>
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
