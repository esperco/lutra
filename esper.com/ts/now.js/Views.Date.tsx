/*
  A simple page showing there's no event for a given date
*/

module Esper.Views {

  export function Date({date}: {date: Date}) {
    var mDate = moment(date).startOf('day');
    var nextDate = mDate.clone().add(1, 'day').toDate();
    var prevDate = mDate.clone().subtract(1, 'day').toDate();

    return <div className="container date-page">
      <div className="row">
        <div className="col-md-6 col-md-offset-3">
          <Components.EventHeader
            title={mDate.format(Text.EventDateHeadingFormat)}
            onBack={() => Actions.goToDate(prevDate)}
            onNext={() => Actions.goToDate(nextDate)}
          />
          <div className="panel panel-default">
            <div className="panel-body">
              <div className="esper-no-content">
                { Text.NoEventsForDate }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
}
