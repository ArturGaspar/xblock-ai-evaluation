function ChatBox(runtime, element, data, handleInit, handleResponse,
                 handleReset) {
  "use strict";

  loadMarkedInIframe(data.marked_html);

  const handlerUrl = runtime.handlerUrl(element, "get_response");
  const resetHandlerUrl = runtime.handlerUrl(element, "reset");

  const $chatContainer = $("#chat-history", element);
  const $spinner = $("#message-spinner", element);
  const $spinnerContainer = $("#chat-spinner-container", element);
  const $resetButton = $("#reset-button", element);
  const $finishButton = $("#finish-button", element);
  const $submitButton = $("#submit-button", element);
  const $userInput = $("#user-input", element);

  const enableControl = function($control, enable) {
    $control.prop("disabled", !enable);
    $control[enable ? "removeClass" : "addClass"]("disabled");
  };

  $userInput.on("input", function(event) {
    const $input = $(this);
    $input.height(0);
    $input.height($input.prop('scrollHeight'));
  });

  const scrollToBottom = function() {
    $chatContainer.scrollTop($chatContainer.prop("scrollHeight"));
  };

  const insertMessage = function(class_, content) {
    const $message = $('<div class="chat-message">');
    $message.addClass(class_);
    $message.append(content);
    const $messageContainer = $('<div class="chat-message-container">');
    $messageContainer.append($message);
    $messageContainer.insertBefore($spinnerContainer);
  };

  const deleteLastMessage = function() {
    $spinnerContainer.prev().remove();
  };

  const fns = {
    enableReset: function(enable) {
      enableControl($resetButton, enable);
    },

    enableInput: function(enable) {
      enableControl($userInput, enable);
      enableControl($submitButton, enable);
      enableControl($finishButton, enable);
    },

    insertUserMessage: function(content) {
      if (content?.length) {
        insertMessage("user-answer", $(MarkdownToHTML(content)));
      }
    },

    insertAIMessage: function(content) {
      insertMessage("ai-eval", content);
    },
  };

  const getResponse = function(inputData) {
    fns.enableInput(false);
    fns.enableReset(false);
    if (inputData.user_input?.length) {
      fns.insertUserMessage(inputData.user_input);
      $userInput.val("");
      $userInput.trigger("input");
    }
    $spinner.show();
    scrollToBottom();
    $.ajax({
      url: handlerUrl,
      method: "POST",
      data: JSON.stringify(inputData),
      success: function(response) {
        $spinner.hide();
        handleResponse.call(fns, response);
        scrollToBottom();
        fns.enableReset(true);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        $spinner.hide();
        alert(gettext("An error has occurred."));
        if (inputData.user_input?.length) {
          deleteLastMessage();
          $userInput.val(inputData.user_input);
          $userInput.trigger("input");
        }
        fns.enableReset(true);
        fns.enableInput(true);
      },
    });
  };

  const handleUserInput = function($input) {
    if ($input.prop("disabled")) {
      return;
    }
    if (!$input.val().length) {
      return;
    }
    getResponse({ user_input: $input.val() });
  };

  $userInput.keypress(function(event) {
    if (event.keyCode == 13 && !event.shiftKey) {
      event.preventDefault();
      handleUserInput($(this));
      return false;
    }
  });

  $submitButton.click(function() {
    if ($(this).prop("disabled")) {
      return;
    }
    handleUserInput($userInput);
  });

  $finishButton.click(function() {
    if ($(this).prop("disabled")) {
      return;
    }
    getResponse({ force_finish: true });
  });

  $resetButton.click(function() {
    if ($(this).prop("disabled")) {
      return;
    }
    fns.enableReset(false);
    $.ajax({
      url: resetHandlerUrl,
      method: "POST",
      data: JSON.stringify({}),
      success: function() {
        $spinnerContainer.prevAll('.chat-message-container').remove();
        handleReset.call(fns);
        scrollToBottom();
        fns.enableInput(true);
      },
      error: function() {
        alert("A problem occurred during reset.");
        fns.enableReset(true);
      },
    });
  });

  var initDone = false;

  const init = function() {
    if (initDone) {
      return;
    }
    initDone = true;
    handleInit.call(fns);
    scrollToBottom();
  };

  runFuncAfterLoading(init);
}
