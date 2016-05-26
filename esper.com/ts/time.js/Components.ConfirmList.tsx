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
  }

  interface State {
    // Which events in events list in props to show?
    pageIndices: [number, number];
  }

  export class ConfirmList extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        pageIndices: [0, this.perPage()]
      };
    }

    render() {
      if (this.props.busy) {
        return <div>
          <LoadingMsg msg={Text.PredictionsLoading} hellip={true} />
        </div>;
      }

      if (this.props.error) {
        return <div><ErrorMsg /></div>;
      }

      var events = this.getEvents();
      var needsConfirmation = !!_.find(events,
        (e) => Stores.Events.needsConfirmation(e)
      );

      return <ModalPanel onCancel={() => this.onFinish()} cancelText="Done">
        <EventList events={events}
          teams={this.props.teams}
          onEventClick={this.props.onEventClick}
          onAddLabelClick={this.props.onAddLabelClick}
        />

        {
          events.length ?
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
              That's all folks.
            </div>
          }
          </div> : null
        }
      </ModalPanel>;
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

    // When done, re-predict any remaining events
    onFinish() {
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
                    onHidden={() => this.onFinish()}>
        { super.render() }
      </Modal>
    }

    onFinish() {
      super.onFinish();
      Layout.closeModal();
    }
  }
}
