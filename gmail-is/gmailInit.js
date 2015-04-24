var esperGmail = Gmail(jQuery);

esperGmail.on = {};
esperGmail.after = {};
esperGmail.off = {};

/*
  Produce separate functions for each event, making them typable since
  their callbacks have different types.

  specialize("unread") -> esperGmail.observe.unread.on(callback)
                          esperGmail.observe.unread.off()
*/
function esperGmailSpecialize(name) {
  esperGmail.on[name] = function(callback) {
    esperGmail.observe.on(name, callback);
  };
  esperGmail.after[name] = function(callback) {
    esperGmail.observe.after(name, callback);
  };
  esperGmail.off[name] = function() {
    esperGmail.observe.off(name);
  };
}

esperGmailSpecialize("unread");
esperGmailSpecialize("read");
esperGmailSpecialize("delete");
esperGmailSpecialize("mark_as_spam");
esperGmailSpecialize("mark_as_not_spam");
esperGmailSpecialize("label");
esperGmailSpecialize("archive");
esperGmailSpecialize("move_to_inbox");
esperGmailSpecialize("delete_forever");
esperGmailSpecialize("delete_message_in_thread");
esperGmailSpecialize("restore_message_in_thread");
esperGmailSpecialize("star");
esperGmailSpecialize("unstar");
esperGmailSpecialize("mark_as_important");
esperGmailSpecialize("mark_as_not_important");
esperGmailSpecialize("filter_messages_like_these");
esperGmailSpecialize("mute");
esperGmailSpecialize("unmute");
esperGmailSpecialize("add_to_tasks");
esperGmailSpecialize("move_label");
esperGmailSpecialize("save_draft");
esperGmailSpecialize("discard_draft");
esperGmailSpecialize("send_message");
esperGmailSpecialize("expand_categories");
esperGmailSpecialize("delete_label");
esperGmailSpecialize("show_newly_arrived_message");
esperGmailSpecialize("poll");
esperGmailSpecialize("new_email");
esperGmailSpecialize("refresh");
esperGmailSpecialize("open_email");
esperGmailSpecialize("reply_forward");
