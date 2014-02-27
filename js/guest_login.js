var login = function () {
  var mod = {};

  var uid;
  var chatid;

  mod.load = function(task) {
    list.iter(task.task_chats, function(chat) {
      if (chat.chat_with) {
        uid = chat.chat_with;
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
