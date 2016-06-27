  /*
  Badge showing number of unconfirmed events -- launchs confirmation modal
  if clicked.
*/
module Esper.Components {

  interface Props {
    calculation: EventStats.LabelCountCalc;
    events: Stores.Events.TeamEvent[];
  }

  export class ConfirmBadge
    extends CalcUI<EventStats.LabelCalcCount, Props>
  {
    render() {
      return this.state.result.match({
        none: () => null,
        some: (r) => <span className="badge">
          { r.unconfirmedCount }
        </span>
      });
    }
  }

}
