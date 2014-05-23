/*
  Building agenda to send to exec.
*/

var agenda = (function() {
  var mod = [];

  // Global variable to record which calendar is chosen
  mod.calendar = null;

  // Compares two events by starting time
  function cmpEvents(event1,event2) {
    if ((util.isNotNull(event1.start.dateTime) &&
         util.isNotNull(event2.start.dateTime) &&
         event1.start.dateTime > event2.start.dateTime) ||
        (util.isNotNull(event1.start.date) &&
         util.isNotNull(event2.start.date) &&
         event1.start.date > event2.start.date)
       )
      return 1;
    if ((util.isNotNull(event1.start.dateTime) &&
         util.isNotNull(event2.start.dateTime) &&
         event1.start.dateTime < event2.start.dateTime) ||
        (util.isNotNull(event1.start.date) &&
         util.isNotNull(event2.start.date) &&
         event1.start.date < event2.start.date))
      return -1;
    return 0;
  }

  // Converts an event to an agenda item
  function eventToAgenda(event){
    var summary = " - " + event.summary;
    var time = "All-day";
    if (util.isNotNull(event.start.dateTime)) {
      var d1 = date.ofString(event.start.dateTime);
      var d2 = date.ofString(event.end.dateTime);
      time = date.utcToLocalTimeOnly(d1);
    }
    var location = "";
    if(util.isNotNull(event.location)){
      location = "\n- " + event.location
    }
    var description = "";
    // Remove description for now as it makes the agenda too long
    //if(util.isNotNull(event.description)){
    //  description = "\n → " + event.description
    //}
    return (time + summary + location + description + "\n\n");
  }

  // builds an agenda (as a string) from a list of events
  function buildAgenda(day, events) {
    var dayEvents = [];
    var shortEvents = [];
    // Separate day events from scheduled events
    list.iter(events,function(event){
      if(util.isNotNull(event.start.dateTime)){
        shortEvents.push(event);
      } else {
        dayEvents.push(event);
      }
    });
    // sort both by starting time
    dayEvents = list.sort(dayEvents, cmpEvents);
    shortEvents = list.sort(shortEvents, cmpEvents);
    var agenda = "";
    //if(dayEvents.length > 0) { agenda = "Day events\n\n"; }
    list.iter(dayEvents,function(event){
      agenda = agenda + eventToAgenda(event);
    });
    if(shortEvents.length > 0) {
      //agenda = agenda + "Detailed Schedule\n\n";
      list.iter(shortEvents,function(event){
        agenda = agenda + eventToAgenda(event);
      });
    } else {
      //agenda = agenda + "No scheduled events";
    }
    return agenda;
  }


  // create the calendarList div
  function createCalendarList () {
'''
<div #calendarList class="chat-actions clearfix">
  <div>Calendars found:</div>
</div>
'''
    return calendarList;
  }

  // Creates a date picker and a link to send the agenda
  function createForm () {
'''
<div #sendAgenda>
  <div> Date: </div> <input #agendaDatePicker type="text"/>
  <div #agendaDrafter><a href="#">Send Agenda to the Exec</a></div>
</div>
'''
    agendaDatePicker.datepicker({ gotoCurrent: true });

    agendaDrafter.click(function() {
      var chosendate = agendaDatePicker.datepicker("getDate");
      if (chosendate && util.isNotNull(mod.calendar)){
        api.getCalendarAgenda(login.leader(),
                              mod.calendar.id,
                              chosendate.toISOString())
          .done(function (eventlist) {
            var agenda = buildAgenda(date,eventlist.items);
            var url = "https://mail.google.com/mail?view=cm&cs=wh&tf=0";
            api.getEmails(login.leader(), login.getTeam().teamid)
              .done(function (x) {
                if (encodeURIComponent(agenda).length > 1850) {
                  while(encodeURIComponent(agenda).length > 1850) {
                    agenda = agenda.substring(0,agenda.length-10);
                  };
                  agenda = agenda + " [...]";
                }
                open(url + "&to="
                     + encodeURIComponent(x.account_emails[0].email)
                     + "&su="
                     + encodeURIComponent("Agenda for "
                                          + date.dateOnly(chosendate))
                     + "&body="
                     + encodeURIComponent(agenda));
              });
          });
      };
    });
    return sendAgenda;
  }

  // Create a radio button for the list of calendars
  function diplayCalendarChoice(data) {
'''
<div #calendarList class="chat-actions clearfix">
  <div>Calendars found:</div>
</div>
'''
    var execcalendarlist = data.items;
    list.iter(execcalendarlist, function(x) {
'''
<input #calendarRadio type="radio" name="calendar">
<label #calendarLabel></label>
'''
      calendarRadio.attr("id", "calendar-" + x.id);
      calendarLabel.attr("value", x.summary);
      calendarLabel.attr("for", "calendar-" + x.id);
      calendarRadio.attr("value", x.summary);
      calendarLabel.append(x.summary);
      calendarList.append(calendarRadio);
      calendarList.append(calendarLabel);
      calendarRadio.change(function(event) {
        mod.calendar = x;
      });
    });
    return calendarList;
  }

  // appends to view a list of calendars, a date picker
  // and a link to send agenda
  mod.create = function (view) {
'''
<div #sendAgenda class="agenda-send" />
'''
    api.getCalendarList(login.leader(), null)
      .done(function (data) {
        var calListView = diplayCalendarChoice(data);
        sendAgenda.append(calListView);
        var agendaForm = createForm();
        sendAgenda.append(agendaForm);
        view.append(sendAgenda);
      });
  };

  return mod;
}());
