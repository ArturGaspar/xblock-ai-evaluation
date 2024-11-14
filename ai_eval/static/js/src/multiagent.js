/* Javascript for MultiAgentAIEvalXBlock. */
function MultiAgentAIEvalXBlock(runtime, element, data) {
  "use strict";

  const formatAIMessage = function(content, is_evaluator, role,
                                   character_data) {
    var name;
    if (is_evaluator) {
      name = gettext("Evaluator");
    } else {
      var role_text = "";
      if (role !== data.main_character_role) {
        role_text = `<i>${role}</i>`;
      }
      if (character_data) {
        name = character_data.name;
        if (character_data.role) {
          if (role_text.length !== 0) {
            role_text = `${role_text}, `;
          }
          role_text = `${role_text}${character_data.role}`;
        }
        if (role_text.length !== 0) {
          name = name + ` (${role_text})`;
        }
      } else {
        name = role_text;
      }
    }
    if (name) {
      name = `${name}:`;
    }

    return $(`
      <b>${name}</b>
      ${MarkdownToHTML(content)}
    `);
  };

  const formatInitialMessage = function() {
    return formatAIMessage(data.initial_message, false,
                           data.main_character_agent,
                           data.main_character_data);
  };

  const handleInit = function() {
    this.insertAIMessage(formatInitialMessage());
    for (var i = 0; i < data.messages.length; i++) {
      var message = data.messages[i];
      if (message.role === "user") {
        this.insertUserMessage(message.content);
      } else {
        this.insertAIMessage(formatAIMessage(message.content,
                                             message.extra.is_evaluator,
                                             message.extra.role,
                                             message.extra.character_data));
      }
    }
    this.enableReset(data.messages.length > 0 || data.finished);
    this.enableInput(!data.finished);
  };

  const handleResponse = function(response) {
    this.insertAIMessage(formatAIMessage(response.message,
                                         response.is_evaluator,
                                         response.role,
                                         response.character_data));
    this.enableInput(!response.finished);
  };

  const handleReset = function() {
    this.insertAIMessage(formatInitialMessage());
  };

  ChatBox(runtime, element, data, handleInit, handleResponse, handleReset);
}
