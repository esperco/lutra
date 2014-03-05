var login = function () {
  var mod = {};

  var uid;
  var chatid;

  mod.load = function(task) {
    uid = task.guest_uid;
    list.iter(task.guest_task.task_chats, function(chat) {
      if (uid === chat.chat_with) {
        chatid = chat.chatid;
      }
    });
  }

  mod.me = function() {
    return uid;
  }

  mod.myChatid = function() {
    return chatid;
  }

  return mod;
}();
