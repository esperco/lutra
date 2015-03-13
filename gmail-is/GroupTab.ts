/** This is the toplevel module for the UI that contains tools to help
 * with group scheduling.
 */
module Esper.GroupTab {

  /** Returns the top-level container for the group scheduling tab. */
  export function container() {
'''
<div #container class="esper-tab-container">
  <div class="esper-section">
    <div class="esper-section-header esper-clearfix esper-open">
      <h1> Guests </h1>
      <span class="esper-hide-section esper-link">Hide</span>
    </div>
    <div #guestSection class="esper-section-container">
    </div>
  </div>
  <div class="esper-section">
    <div class="esper-section-header esper-clearfix esper-open">
      <h1> Linked Events </h1>
      <span class="esper-hide-section esper-link">Hide</span>
    </div>
    <div #linkActions
         class="esper-section-actions esper-clearfix esper-open">
      <div style="display:inline-block">
        <div #createEvent
             class="esper-link-action esper-dropdown-btn esper-click-safe">
          <object #createEventIcon class="esper-svg esper-link-action-icon"/>
          <div class="esper-link-action-text esper-click-safe">
            Create event
          </div>
        </div>
        <div class="esper-vertical-divider"/>
        <div #linkEvent class="esper-link-action">
          <object #linkEventIcon class="esper-svg esper-link-action-icon"/>
          <div class="esper-link-action-text">Link event</div>
        </div>
      </div>
    </div>
    <div #timeSection class="esper-section-container">
    </div>
  </div>
</div>
'''
    createEventIcon.attr("data", Init.esperRootUrl + "img/create.svg");
    linkEventIcon.attr("data", Init.esperRootUrl + "img/link.svg");

    createEvent.click(function() {
      if (CurrentThread.threadId.isValid() &&
          CurrentThread.task.isValid() &&
          CurrentThread.team.isValid()) {
        CurrentThread.withPreferences(function (preferences) {
          CalPicker.createInline(CurrentThread.team.get(),
                                 CurrentThread.task.get(),
                                 CurrentThread.threadId.get(),
                                 preferences);
        });
      }
    });

    linkEvent.click(function() {
      var team        = CurrentThread.team.get();
      var threadId    = CurrentThread.threadId.get();
      var searchModal = CalSearch.viewOfSearchModal(team, threadId, container, Sidebar.profiles);

      $("body").append(searchModal.view);
      searchModal.search.focus();
    });

    var sections = container.find(".esper-section");
    sections.each(function (i, section) {
      $(section).find(".esper-hide-section").click(function () {
        $(section).find(".esper-section-container").slideToggle("fast");
      });
    });

    var mockGuests = [{ display_name : "Peter Esper", email : "peter.tj.esper@gmail.com" },
                      { display_name : "Lois Esper",  email : "lois.tj.esper@gmail.com" },
                      { display_name : "Foo Bar",     email : "foo.esper@gmail.com" }];
    mockGuests.forEach(GroupScheduling.addGuest);

    guestSection.append(guestList(GroupScheduling.guests, GroupScheduling.addGuest));
    timeSection.append(timeList());

    return container;
  }

  /** The list of possible times for the group event which current
   *  corresponds to the linked events of the current task.
   */
  export function timeList() {
'''
<div #container class="esper-group-options">
  <div #spinner class="esper-events-list-loading">
    <div class="esper-spinner esper-list-spinner"/>
  </div>
  <ul #list>
  </ul>
</div>
'''
    populate();
    CurrentThread.onLinkedEventsChanged(function () {
      console.error("Populating!");
      populate();
    });

    return container;

    function populate() {
      list.hide();
      list.empty();
      spinner.show();

      var team     = CurrentThread.team.get();
      var threadId = CurrentThread.threadId.get();
      var profiles = Sidebar.profiles;

      Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
        .done(function (events) {
          spinner.hide();
          list.show();

          events.forEach(function (event: ApiT.EventWithSyncInfo) {
'''
<ul #statusGraph class="esper-availability-graph"></ul>
'''
            GroupScheduling.addEvent(event.event);
            var status = GroupScheduling.getEventStatus(event.event);
            status.guests.forEach(function (guestStatus) {
              var availability = guestStatus.availability;
              var pip = $("<li>").addClass(availabilityClass(availability));

              GroupScheduling.onStatusChanged(function () {
                pip.removeClass(availabilityClass(availability));
                availability = guestStatus.availability;
                pip.addClass(availabilityClass(availability));
              });

              pip.click(function () {
                GroupScheduling.changeAvailability(event.event, guestStatus.guest);
              });

              statusGraph.append(pip);
            });

            var widget = EventWidget.base(events, event, false, false,
                                          team, threadId, profiles, statusGraph);

            list.append($("<li>").append(widget));
          });
      });
    }
  }

  export function guestList(guests: ApiT.Guest[],
                             onAddGuest: (guest:ApiT.Guest) => any) {
'''
<ul #list class="esper-group-people">
  <li #addGuest class="esper-group-add-guests">
    <input #nameInput type="text"> </input>
    <div #addButton class="esper-close">+</div>
  </li>
</ul>
'''
    guests.forEach(function (guest) {
      addGuestWidget(guest);
    });

    addButton.click(function () {
      addNewGuest();
    });

    nameInput.keyup(function (e) {
      // Monitoring for the ENTER key
      if (e.keyCode == 13) {
        addNewGuest();
      }
    });

    return list;

    function addGuestWidget(guest: ApiT.Guest, animate?: boolean) {
      var newWidget = personWidget(GroupScheduling.guestLabel(guest), function () {
        GroupScheduling.removeGuest(guest);
      });

      addGuest.before(newWidget);

      if (animate) {
        newWidget.slideDown("fast");
      } else {
        newWidget.show();
      }
    }

    function addNewGuest() {
      if (nameInput.val() !== "") {
        var newGuest = {
          display_name : nameInput.val(),
          email : ""
        };

        onAddGuest(newGuest);
        addGuestWidget(newGuest, true);
        nameInput.val("");
      }
    }
  }

  /** A list element that contains a person's name and can be delete
   *  from the list with an "x".
   */
  export function personWidget(name: string, onClose) {
'''
<li #widget>
  <span #nameSpan> </span>
  <div #close class="esper-close">x</div>
</li>
'''
    nameSpan.text(name);

    widget.mousedown(function (e) {
      e.preventDefault()
      return false;
    });

    close.click(function () {
      onClose(name);
      widget.slideUp();

      return false;
    });

    widget.hide(); // Hidden so that it can be animated in if necessary.

    return widget;
  }

  function availabilityClass(availability: GroupScheduling.Availability) {
    return "esper-availability-" + GroupScheduling.Availability[availability];
  }
}
