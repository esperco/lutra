module Esper.Components {

  export function ProgressBar({width, skinny=true}: {
    width: number; skinny: boolean
  }) {
    return <div className={classNames("progress", { skinny: skinny })}>
      <div className="progress-bar" role="progressbar"
        style={{
          width: Util.roundStr(width * 100) + "%"
        }}>
      </div>
    </div>;
  }

}
