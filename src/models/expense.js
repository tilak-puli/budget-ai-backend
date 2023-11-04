class Expense {
    constructor({description, amount, category, date}) {
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.date = new Date(date);
    }
}

module.exports = Expense