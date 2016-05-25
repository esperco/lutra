/*
  A paginated list of events for confirmation
*/
module Esper.Components {
  const DEFAULT_PER_PAGE = 7;

  interface Props {
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
      return <ModalPanel>
        <EventList events={this.getEvents()}
          teams={this.props.teams}
          onEventClick={this.props.onEventClick}
          onAddLabelClick={this.props.onAddLabelClick}
        />
        <div>
          <button className="btn btn-secondary">
            { Text.MorePredictions }
          </button>
        </div>
      </ModalPanel>;
    }

    getEvents() {
      return this.props.events.slice(
        this.state.pageIndices[0],
        this.state.pageIndices[1]
      );
    }

    nextPage() {
      if (this.hasMore()) {
        this.mutateState((s) => s.pageIndices = [
          Math.min(s.pageIndices[1], this.props.events.length),
          Math.min(s.pageIndices[1] + this.perPage(), this.props.events.length)
        ]);
      }
    }

    perPage() {
      return this.props.perPage || DEFAULT_PER_PAGE;
    }

    hasMore() {
      return this.state.pageIndices[1] < this.props.events.length;
    }
  }

  export class ConfirmListModal extends ConfirmList {
    render() {
      return <Modal icon="fa-question-circle"
                    title={Text.ConfirmLabelsHeading}>
        { super.render() }
      </Modal>
    }
  }
}
