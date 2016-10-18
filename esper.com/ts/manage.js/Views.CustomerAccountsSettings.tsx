/*
  General settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerAccountsSettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.accounts;

    renderMain(cust: ApiT.Customer) {
      let teams = Stores.Teams.all();
      return <div>
        <SeatRequestList cust={cust} teams={teams} />
        <SeatList cust={cust} teams={teams} />
      </div>;
    }
  }

  function SeatList(props: {
    cust: ApiT.Customer,
    teams: ApiT.Team[]
  }) {
    return <div className="panel panel-default"><div className="panel-body">
      <div className="list-group">
        { _.map(props.cust.seats,
          (seat) => <Seat key={seat.teamid} seat={seat} {...props} />
        )}
      </div>
    </div></div>;
  }

  function Seat({cust, teams, seat}: {
    cust: ApiT.Customer,
    teams: ApiT.Team[],
    seat: ApiT.CustomerSeat
  }) {
    return <div className="list-group-item">
      <i className="fa fa-fw fa-left fa-user" />
      { seatDisplay(seat, teams) }
      <span className="pull-right action rm-action">
        <i className="fa fa-fw fa-close" />
      </span>
    </div>;
  }

  function seatDisplay(seat: ApiT.CustomerSeat, teams: ApiT.Team[]) {
    let team = _.find(teams, (t) => t.teamid === seat.teamid);
    return team ? team.team_name : seat.email;
  }


  ///////

  function SeatRequestList(props: {
    cust: ApiT.Customer,
    teams: ApiT.Team[]
  }) {
    if (_.isEmpty(props.cust.seat_requests)) {
      return null;
    }

    return <div className="panel panel-default">
      <div className="panel-heading">
        { Text.CustomerPendingSeatHeading }
      </div>
      <div className="panel-body">
        <div className="list-group">
          { _.map(props.cust.seat_requests,
            (seat) => <SeatRequest key={seat.teamid} seat={seat} {...props} />
          )}
        </div>
      </div>
    </div>;
  }

  function SeatRequest({cust, teams, seat}: {
    cust: ApiT.Customer,
    teams: ApiT.Team[],
    seat: ApiT.CustomerSeat
  }) {
    return <div className="list-group-item">
      <i className="fa fa-fw fa-left fa-user" />
      { seatDisplay(seat, teams) }
      <span className="pull-right">
        <span className="action">
          <i className="fa fa-fw fa-check" />
        </span>
        <span className="action rm-action">
          <i className="fa fa-fw fa-close" />
        </span>
      </span>
    </div>;
  }
}
