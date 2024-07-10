document.addEventListener('DOMContentLoaded', () => {
    loadBudget();
    loadExpenses();
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    if (pageId === 'daily-expenses') {
        updateRemainingBalance();
    } else if (pageId === 'comparison') {
        updateComparison();
    } else if (pageId === 'monthly-data') {
        updateMonthlyData();
    }
}

function addCategory() {
    const categoriesDiv = document.getElementById('categories');
    const newCategoryDiv = document.createElement('div');
    newCategoryDiv.classList.add('category');
    newCategoryDiv.innerHTML = `
        <label>Category Name:</label>
        <input type="text" name="category-name">
        <label>Amount:</label>
        <input type="number" name="category-amount">
    `;
    categoriesDiv.appendChild(newCategoryDiv);
}

document.getElementById('ideal-budget-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const totalBudget = document.getElementById('total-budget').value;
    const categories = Array.from(document.querySelectorAll('#categories .category')).map(category => ({
        name: category.querySelector('input[name="category-name"]').value,
        amount: category.querySelector('input[name="category-amount"]').value
    }));

    localStorage.setItem('totalBudget', totalBudget);
    localStorage.setItem('categories', JSON.stringify(categories));
    alert('Budget saved successfully!');
    loadBudget();
});

function loadBudget() {
    const totalBudget = localStorage.getItem('totalBudget');
    const categories = JSON.parse(localStorage.getItem('categories')) || [];

    if (totalBudget) {
        document.getElementById('total-budget').value = totalBudget;
    }

    const categoriesDiv = document.getElementById('categories');
    categoriesDiv.innerHTML = '';
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');
        categoryDiv.innerHTML = `
            <label>Category Name:</label>
            <input type="text" name="category-name" value="${category.name}">
            <label>Amount:</label>
            <input type="number" name="category-amount" value="${category.amount}">
        `;
        categoriesDiv.appendChild(categoryDiv);
    });

    const expenseCategorySelect = document.getElementById('expense-category');
    expenseCategorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        expenseCategorySelect.appendChild(option);
    });
}

document.getElementById('daily-expense-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const description = document.getElementById('expense-description').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.push({ id: Date.now(), description, amount, category, date: new Date().toISOString().split('T')[0] });
    localStorage.setItem('expenses', JSON.stringify(expenses));

    updateRemainingBalance();
    displayExpenses();
    alert('Expense added successfully!');
});

function loadExpenses() {
    displayExpenses();
    updateRemainingBalance();
}

function displayExpenses() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';

    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.classList.add('expense-item');
        expenseItem.innerHTML = `
            <p>Description: ${expense.description}</p>
            <p>Amount: ${expense.amount.toFixed(2)}</p>
            <p>Category: ${expense.category}</p>
            <p>Date: ${expense.date}</p>
            <button onclick="editExpense(${expense.id})">Edit</button>
            <button onclick="deleteExpense(${expense.id})">Delete</button>
        `;
        expenseList.appendChild(expenseItem);
    });
}

function editExpense(id) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expenseToEdit = expenses.find(expense => expense.id === id);

    if (expenseToEdit) {
        document.getElementById('expense-description').value = expenseToEdit.description;
        document.getElementById('expense-amount').value = expenseToEdit.amount;
        document.getElementById('expense-category').value = expenseToEdit.category;

        // Remove the expense from localStorage
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses
        ));

        displayExpenses();
        updateRemainingBalance();
    }
}

function deleteExpense(id) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    displayExpenses();
    updateRemainingBalance();
}

function updateRemainingBalance() {
    const totalBudget = parseFloat(localStorage.getItem('totalBudget')) || 0;
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBalance = totalBudget - totalExpenses;
    document.getElementById('remaining-balance').textContent = remainingBalance.toFixed(2);
}

function updateComparison() {
    const totalBudget = parseFloat(localStorage.getItem('totalBudget')) || 0;
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    let comparisonHtml = `<h3>Total Budget: ${totalBudget.toFixed(2)}</h3>`;

    categories.forEach(category => {
        const categoryExpenses = expenses.filter(expense => expense.category === category.name).reduce((sum, expense) => sum + expense.amount, 0);
        comparisonHtml += `
            <div>
                <h4>${category.name}</h4>
                <p>Ideal: ${category.amount}</p>
                <p>Actual: ${categoryExpenses.toFixed(2)}</p>
            </div>
        `;
    });

    document.getElementById('comparison-data').innerHTML = comparisonHtml;
}

document.getElementById('save-monthly-data-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const month = document.getElementById('month-select').value;

    if (!month) {
        alert('Please select a month to view the data.');
        return;
    }

    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const monthlyExpenses = expenses.filter(expense => expense.date.startsWith(month));

    if (monthlyExpenses.length === 0) {
        alert('No data available for the selected month.');
        return;
    }

    const monthlyData = JSON.parse(localStorage.getItem('monthlyData')) || {};
    monthlyData[month] = monthlyExpenses;
    localStorage.setItem('monthlyData', JSON.stringify(monthlyData));

    displayMonthlyData(month);
});

function updateMonthlyData() {
    const month = document.getElementById('month-select').value;
    if (month) {
        displayMonthlyData(month);
    }
}

function displayMonthlyData(month) {
    const monthlyData = JSON.parse(localStorage.getItem('monthlyData')) || {};
    const expenses = monthlyData[month] || [];
    let monthlyDataHtml = '';

    expenses.forEach(expense => {
        monthlyDataHtml += `
            <div class="expense-item">
                <p>Description: ${expense.description}</p>
                <p>Amount: ${expense.amount.toFixed(2)}</p>
                <p>Category: ${expense.category}</p>
                <p>Date: ${expense.date}</p>
            </div>
        `;
    });

    document.getElementById('monthly-data-content').innerHTML = monthlyDataHtml;
}

// Save data automatically for next month
window.addEventListener('beforeunload', function() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const monthlyExpenses = expenses.filter(expense => expense.date.startsWith(currentMonth));

    const monthlyData = JSON.parse(localStorage.getItem('monthlyData')) || {};
    monthlyData[currentMonth] = monthlyExpenses;
    localStorage.setItem('monthlyData', JSON.stringify(monthlyData));
});
