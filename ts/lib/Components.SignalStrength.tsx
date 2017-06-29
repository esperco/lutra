/*
  Hack for the FontAwesome signal strength icon to show less bars
*/

module Esper.Components {
  export function SignalStrength({strength}: {
    strength: number // 0 - 1
  }) {
    // Adjust percent for whole bars, ensure at least one bar always
    var numBars = Math.min(Math.floor((strength + 0.1) / 0.2), 5);
    var pct = ((bar: number) => {
      switch (bar) {
        case 1:
          return 24;
        case 2:
          return 41;
        case 3:
          return 58;
        case 4:
          return 75;
        default:
          return 100;
      }
    })(numBars) + "%";

    return <span className="fa fa-fw" style={{position: "relative"}}>
      <i className="fa fa-fw fa-signal text-muted" style={{
        opacity: 0.25
      }} />
      <span style={{
        width: pct,
        overflow: "hidden",
        position: "absolute",
        left: "0px"
      }}>
        <i className="fa fa-fw fa-signal" />
      </span>
    </span>
  }
}
