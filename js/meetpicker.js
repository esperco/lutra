/*
  SAMPLE CODE FOR ILLUSTRATION PURPOSES

  Very incomplete rewrite of sched2's meeting parameters editor
  (type calendar_slot), just to demonstrate what a cleaner implementation
  could look like using the ref.js module.
*/

var meetpicker = (function() {
  var mod = {};

  mod.create = function(slot) {
    /*** Source of truth for all data in a calendar_slot ***/

    /* Data for the whole calendar_slot */
    var slotRef = ref.create(isSlotValid, slot);

    /* Dates managed by the calendar modal */
    var datesRef = ref.create(areDatesValid, datesOfSlot(slot));

    /* Location managed by the locpicker module */
    var locRef = ref.create(isLocationValid, slotRef.get().location);

    /* Timezone managed by the tzpicker module */
    var tzRef = ref.create(isTimezoneValid, locRef.get());

    slotRef.watch(function(slot) {
      datesRef.set(datesOfSlot(slot));
      locRef.set(slot.location);
    });

    locRef.watch(function(loc) {
      var oldSlot = slotRef.get();
      var slot = util.mergeObjects(oldSlot, { location: loc });
      slotRef.set(slot);
    });

    tzRef.watch(function(tzObj) {
      var oldLoc = locRef.get();
      var loc = tzObj;
      locRef.set(loc);
    });

    datesRef.watch(function(dates) {
      var oldSlot = slotRef.get();
      var slot = util.mergeObjects(oldSlot, dates);
      slotRef.set(slot);
    });

    return {
      slotRef: slotRef,
      locRef: locRef,
      tzRef: tzRef,
      datesRef: datesRef
    };
  };

  mod.initSaveButton = function(refs, button) {
    refs.slotRef.watchTurnValid(function(data) {
      button.removeClass("hide");
    });
    refs.slotRef.watchTurnInvalid(function(data) {
      button.addClass("hide");
    });
  };

  return mod;
})();
