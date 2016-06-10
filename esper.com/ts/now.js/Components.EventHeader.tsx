/*
  Component for header with arrows used on now page
*/

module Esper.Components {

  export function EventHeader({title, onBack, onNext}: {
    title: string|JSX.Element;
    onBack: () => void;
    onNext: () => void;
  }) {
    return <div className="panel-heading clearfix text-center title">
      <a className="action pull-left"
         onClick={onBack}>
        <i className="fa fa-fw fa-chevron-left" />
      </a>
      <a className="action pull-right"
         onClick={onNext}>
        <i className="fa fa-fw fa-chevron-right" />
      </a>
      { title }
    </div>
  }

}
