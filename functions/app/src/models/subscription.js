class Subscription {
  constructor({
    _id,
    userId,
    subscriptionId,
    purchaseToken,
    originalPurchaseDate,
    expiryDate,
    autoRenewing,
    status,
    platform,
    lastVerifiedDate,
  }) {
    this._id = _id;
    this.userId = userId;
    this.subscriptionId = subscriptionId;
    this.purchaseToken = purchaseToken;
    this.originalPurchaseDate = originalPurchaseDate
      ? new Date(originalPurchaseDate)
      : new Date();
    this.expiryDate = expiryDate ? new Date(expiryDate) : null;
    this.autoRenewing = autoRenewing || false;
    this.status = status || "pending"; // possible values: pending, active, cancelled, expired
    this.platform = platform || "android"; // possible values: android, ios
    this.lastVerifiedDate = lastVerifiedDate
      ? new Date(lastVerifiedDate)
      : new Date();
  }
}

module.exports = Subscription;
