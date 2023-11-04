class Expense {
    constructor({description, amount, category, date, createdAt}) {
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.date = new Date(date);
        this.createdAt = new Date(createdAt)
    }
}

module.exports = Expense