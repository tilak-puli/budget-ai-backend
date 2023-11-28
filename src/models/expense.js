class Expense {
    constructor({description, amount, category, date, createdAt, prompt = null}) {
        this.description = description || "Random";
        this.amount = amount || 0;
        this.category = capitalizeFirstLetter(category || "Other");
        this.date = new Date(date);
        this.createdAt = new Date(createdAt)
        this.prompt = prompt
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = Expense