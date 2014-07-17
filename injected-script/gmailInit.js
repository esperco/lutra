var gmail = Gmail();

gmail.on = {};
gmail.off = {};

/*
  Produce separate functions for each event, making them typable since
  their callbacks have different types.

  specialize("unread") -> gmail.observe.unread.on(callback)
                          gmail.observe.unread.off()
*/
function specialize(name) {
  gmail.on[name] = function(callback) { gmail.observe.on(name, callback); };
  gmail.off[name] = function() { gmail.observe.off(name); };
}

specialize("unread");
specialize("read");
specialize("delete");
specialize("mark_as_spam");
specialize("mark_as_not_spam");
specialize("label");
specialize("archive");
specialize("move_to_inbox");
specialize("delete_forever");
specialize("delete_message_in_thread");
specialize("restore_message_in_thread");
specialize("star");
specialize("unstar");
specialize("mark_as_important");
specialize("mark_as_not_important");
specialize("filter_messages_like_these");
specialize("mute");
specialize("unmute");
specialize("add_to_tasks");
specialize("move_label");
specialize("save_draft");
specialize("discard_draft");
specialize("send_message");
specialize("expand_categories");
specialize("delete_label");
specialize("show_newly_arrived_message");
specialize("poll");
specialize("new_email");
specialize("refresh");
specialize("open_email");
