class UserMessage {
  constructor({
    _id,
    userId,
    userMessage,
    messageType, // 'expense', 'question', 'error'
    aiResponse, // askReply or errorMessage
    responseType, // 'askReply', 'errorMessage', 'expense'
    createdAt,
    metadata = {},
  }) {
    this._id = _id;
    this.userId = userId;
    this.userMessage = userMessage;
    this.messageType = messageType;
    this.aiResponse = aiResponse;
    this.responseType = responseType;
    this.createdAt = createdAt || new Date();
    this.metadata = metadata; // For storing additional context like expense details, function calls, etc.
  }

  // Static method to create from expense response
  static fromExpenseResponse(userId, userMessage, expense) {
    return new UserMessage({
      userId,
      userMessage,
      messageType: "expense",
      aiResponse: null, // No AI response for successful expense creation
      responseType: "expense",
      metadata: { expense: JSON.stringify(expense) },
    });
  }

  // Static method to create from ask reply
  static fromAskReply(userId, userMessage, askReply) {
    return new UserMessage({
      userId,
      userMessage,
      messageType: "question",
      aiResponse: askReply,
      responseType: "askReply",
    });
  }

  // Static method to create from error message
  static fromErrorMessage(userId, userMessage, errorMessage) {
    return new UserMessage({
      userId,
      userMessage,
      messageType: "error",
      aiResponse: errorMessage,
      responseType: "errorMessage",
    });
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      userId: this.userId,
      userMessage: this.userMessage,
      messageType: this.messageType,
      aiResponse: this.aiResponse,
      responseType: this.responseType,
      createdAt: this.createdAt,
      metadata: this.metadata,
    };
  }
}

module.exports = UserMessage;
