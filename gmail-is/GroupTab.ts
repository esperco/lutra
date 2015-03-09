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
</div>
'''
    var sections = container.find(".esper-section");
    sections.each(function (i, section) {
      $(section).find(".esper-hide-section").click(function () {
        $(section).find(".esper-section-container").slideToggle("fast");
      });
    });

    var guests = [{ name : "Peter Esper", availability : GroupScheduling.Availability.none },
                  { name : "Lois Esper",  availability : GroupScheduling.Availability.none },
                  { name : "Foo Bar",     availability : GroupScheduling.Availability.none }];

    guestSection.append(guestsList(guests, addGuest));

    return container;

    function addGuest(guest) {
      guests.push(guest);
    }
  }

  export function guestsList(guests: GroupScheduling.Guest[],
                             onAddGuest: (guest:GroupScheduling.Guest) => any) {
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
      if (e.keyCode == 13 && nameInput.val() !== "") {
        addNewGuest();
      }
    });

    return list;

    function addGuestWidget(guest, animate?) {
      var newWidget = personWidget(guest.name, function () {
        guest.availability = GroupScheduling.Availability.none;
      });

      addGuest.before(newWidget);

      if (animate) {
        newWidget.slideDown("fast");
      } else {
        newWidget.show();
      }
    }

    function addNewGuest() {
      var newGuest = {
        name         : nameInput.val(),
        availability : GroupScheduling.Availability.none
      };

      onAddGuest(newGuest);
      addGuestWidget(newGuest, true);
      nameInput.val("");
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
