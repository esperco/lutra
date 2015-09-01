/** This is the toplevel module for the UI that contains tools to help
 * with group scheduling.
 */
module Esper.GroupTab {

  /** Returns the top-level container for the group scheduling tab. */
  export function container(tpref: ApiT.TaskPreferences) {
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
          CurrentThread.task.isValid()) {
        CalPicker.createInline(CurrentThread.task.get(),
                               CurrentThread.threadId.get());
      }
    });

    // XXX: This block of code breaks type checking and since GroupTabs aren't
    // in use right now, let's ignore this for now
    // linkEvent.click(function() {
    //   var team        = CurrentThread.currentTeam.get();
    //   var threadId    = CurrentThread.threadId.get();
    //   var searchModal = CalSearch.viewOfSearchModal(team, threadId, container);

    //   $("body").append(searchModal.view);
    //   searchModal.search.focus();
    // });

    var sections = container.find(".esper-section");
    sections.each(function (i, section) {
      $(section).find(".esper-hide-section").click(function () {
        $(section).find(".esper-section-container").slideToggle("fast");
      });
    });

    guestSection.append(guestList(GroupScheduling.guests,
                                  GroupScheduling.addGuest));
    timeSection.append(timeList(tpref));

    return container;
  }

  /** The list of possible times for the group event which current
   *  corresponds to the linked events of the current task.
   */
  function timeList(tpref: ApiT.TaskPreferences) {
'''
<div #container class="esper-group-options">
  <div #spinner class="esper-events-list-loading">
    <div class="esper-spinner esper-list-spinner"/>
  </div>
  <ul #list>
  </ul>
</div>
'''
    populate(CurrentThread.linkedEvents.get());
    CurrentThread.linkedEvents.watch(
      function(events: ApiT.TaskEvent[]) {
        populate(events);
      },
      "GroupTab.populate"
    );

    return container;

    // Will fail silently if there is no team set because it is not
    // critical functionality.
    function populate(events: ApiT.TaskEvent[]) {
      list.hide();
      list.empty();
      spinner.show();

      CurrentThread.currentTeam.get().match({
        some : function (team) {
          if (!CurrentThread.threadId.isValid()) return;
          var threadId = CurrentThread.threadId.get();
          spinner.hide();
          list.show();

          events.forEach(function (event: ApiT.TaskEvent) {
'''
<ul #statusGraph class="esper-availability-graph"></ul>
'''
            GroupScheduling.addEvent(event.task_event);
            var status = GroupScheduling.getEventStatus(event.task_event);
            populateGraph();

            GroupScheduling.onGuestsChanged(function () {
              // XXX: Timeout used as a hack to fix a loading problem:
              setTimeout(function () {
                status = GroupScheduling.getEventStatus(event.task_event);
                populateGraph();
              }, 100);
            });

            var widget = EventWidget.base(events, event, false,
                                          team, threadId, tpref,
                                          statusGraph);

            list.append($("<li>").append(widget));

            function populateGraph() {
              statusGraph.empty();

              status.guests.forEach(function (guestStatus) {
                var availability = guestStatus.availability;
                var pip = $("<li>").addClass(availabilityClass(availability));
                var label = GroupScheduling.guestLabel(guestStatus.guest);

                pip.tooltip({
                  show: { effect: "none" },
                  hide: { effect: "none" },
                  items: "li",
                  "content": label,
                  "position": { my: 'center bottom', at: 'center top-5' },
                  "tooltipClass": "esper-top esper-tooltip"
                });

                pip.attr("title", label);

                GroupScheduling.onTimesChanged(function () {
                  pip.removeClass(availabilityClass(availability));
                  availability = guestStatus.availability;
                  pip.addClass(availabilityClass(availability));
                });

                pip.click(function () {
                  GroupScheduling.changeAvailability(event.task_event,
                                                     guestStatus.guest);
                });

                statusGraph.append(pip);
              });
            }
          });
        },
        none : function () {
          // Don't do anything
        }
      });
    }
  }

  function guestList(guests: ApiT.Guest[],
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

    GroupScheduling.onGuestsChanged(function (added, removed) {
      removed.forEach(function (removedGuest) {
        $("ul.esper-group-people li").each(function (i, e) {
          if ($(e).data("esper-group-guest-name") == removedGuest) {
            $(e).slideUp("fast");
          }
        });
      });

      added.forEach(function (newGuest) {
        addGuestWidget(newGuest, true);
      });
    });

    return list;

    function addGuestWidget(guest: ApiT.Guest, animate?: boolean) {
      var newWidget = personWidget(guest, function () {
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
        var newGuest = GroupScheduling.parseGuest(nameInput.val());

        if (newGuest) {
          onAddGuest(newGuest);
          nameInput.val("");
          nameInput.removeClass("esper-danger");
        } else {
          nameInput.addClass("esper-danger");
        }
      }
    }
  }

  /** A list element that contains a person's name and can be delete
   *  from the list with an "x".
   */
  function personWidget(guest: ApiT.Guest, onClose) {
'''
<li #widget>
  <span #nameSpan> </span>
  <div #close class="esper-close">x</div>
</li>
'''
    var name = GroupScheduling.guestLabel(guest);

    nameSpan.text(name);
    widget.data("esper-group-guest-name", guest);

    widget.mousedown(function (e) {
      e.preventDefault()
      return false;
    });

    close.click(function () {
      onClose();
      return false;
    });

    widget.hide(); // Hidden so that it can be animated in if necessary.

    return widget;
  }

  function availabilityClass(availability: string) {
    return "esper-availability-" + availability;
  }
}
