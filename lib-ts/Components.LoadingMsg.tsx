/*
  A loading spinner with additional text
*/

module Esper.Components {
  export function LoadingMsg({msg, hellip}: {msg: string, hellip?: boolean}) {
    msg = msg || Text.DefaultLoadingMsg;
    return <div className="alert compact alert-info text-center">
      <span className="esper-spinner esper-inline" />{" "}
      { msg }{" "}
      {hellip ? <span>&hellip;</span> : null}
    </div>;
  }
}
