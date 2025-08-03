document.addEventListener("DOMContentLoaded", () => {
  class ExpenseTracker {
    constructor() {
      this.expenses = JSON.parse(localStorage.getItem("expenses")) || [];
      this.chart = null;
      this.currentChartType = "category";

      this.initializeElements();
      this.bindEvents();
      this.renderExpenses();
      this.updateStats();
      this.initializeChart();
    }

    initializeElements() {
      this.expenseForm = document.getElementById("expense-form");
      this.expenseNameInput = document.getElementById("expense-name");
      this.expenseAmountInput = document.getElementById("expense-amount");
      this.expenseCategoryInput = document.getElementById("expense-category");
      this.expenseList = document.getElementById("expense-list");
      this.totalAmountDisplay = document.getElementById("total-amount");
      this.transactionCountDisplay =
        document.getElementById("transaction-count");
      this.averageAmountDisplay = document.getElementById("average-amount");
      this.clearAllBtn = document.getElementById("clear-all");
      this.toast = document.getElementById("toast");
      this.chartToggles = document.querySelectorAll(".chart-toggle");
    }

    bindEvents() {
      this.expenseForm.addEventListener("submit", (e) => this.handleSubmit(e));
      this.expenseList.addEventListener("click", (e) =>
        this.handleExpenseAction(e)
      );
      this.clearAllBtn.addEventListener("click", () => this.clearAllExpenses());

      this.chartToggles.forEach((toggle) => {
        toggle.addEventListener("click", (e) =>
          this.switchChart(e.target.dataset.chart)
        );
      });

      // Add smooth scroll to form after adding expense
      this.expenseForm.addEventListener("submit", () => {
        setTimeout(() => {
          const target = document.querySelector(".lg\\:col-span-8");
          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);
      });
    }

    handleSubmit(e) {
      e.preventDefault();

      const name = this.expenseNameInput.value.trim();
      const amount = Number.parseFloat(this.expenseAmountInput.value.trim());
      const category = this.expenseCategoryInput.value;

      if (name && !isNaN(amount) && amount > 0) {
        const newExpense = {
          id: Date.now(),
          name,
          amount,
          category,
          date: new Date().toISOString(),
          timestamp: Date.now(),
        };

        this.expenses.unshift(newExpense);
        this.saveToLocalStorage();
        this.renderExpenses();
        this.updateStats();
        this.updateChart();
        this.showToast("Transaction added successfully");
        this.resetForm();
      }
    }

    handleExpenseAction(e) {
      if (e.target.classList.contains("delete-btn")) {
        const expenseId = Number.parseInt(e.target.dataset.id);
        this.deleteExpense(expenseId);
      }
    }

    deleteExpense(id) {
      const expenseElement = document.querySelector(
        `[data-expense-id="${id}"]`
      );
      if (expenseElement) {
        expenseElement.classList.add("removing");

        setTimeout(() => {
          this.expenses = this.expenses.filter((expense) => expense.id !== id);
          this.saveToLocalStorage();
          this.renderExpenses();
          this.updateStats();
          this.updateChart();
          this.showToast("Transaction deleted");
        }, 300);
      }
    }

    clearAllExpenses() {
      if (this.expenses.length === 0) return;

      if (confirm("Clear all transactions? This action cannot be undone.")) {
        this.expenses = [];
        this.saveToLocalStorage();
        this.renderExpenses();
        this.updateStats();
        this.updateChart();
        this.showToast("All transactions cleared");
      }
    }

    renderExpenses() {
      if (this.expenses.length === 0) {
        this.expenseList.innerHTML = `
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <svg class="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <p class="text-sm text-zinc-400">No transactions yet</p>
            <p class="text-xs text-zinc-500">Add your first expense to get started</p>
          </div>
        `;
        return;
      }

      this.expenseList.innerHTML = this.expenses
        .map(
          (expense) => `
        <div class="expense-item group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/50 p-4 transition-all hover:bg-zinc-900/50" data-expense-id="${
          expense.id
        }">
          <div class="flex items-center space-x-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800 text-sm">
              ${this.getCategoryEmoji(expense.category)}
            </div>
            <div>
              <h3 class="font-medium text-zinc-50">${expense.name}</h3>
              <p class="text-xs text-zinc-400">${this.formatDate(
                expense.date
              )} • ${expense.category}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="font-mono text-lg font-semibold text-zinc-50">$${expense.amount.toLocaleString()}</span>
            <button 
              class="delete-btn flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-transparent text-zinc-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              data-id="${expense.id}"
              title="Delete transaction"
            >
              <svg class="h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      `
        )
        .join("");
    }

    updateStats() {
      const total = this.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const count = this.expenses.length;
      const average = count > 0 ? total / count : 0;

      this.totalAmountDisplay.textContent = `$${total.toLocaleString()}`;
      this.transactionCountDisplay.textContent = count.toString();
      this.averageAmountDisplay.textContent = `$${Math.round(
        average
      ).toLocaleString()}`;

      // Add animation to stats
      this.animateValue(this.totalAmountDisplay);
      this.animateValue(this.transactionCountDisplay);
      this.animateValue(this.averageAmountDisplay);
    }

    animateValue(element) {
      element.style.transform = "scale(1.05)";
      setTimeout(() => {
        element.style.transform = "scale(1)";
      }, 150);
    }

    initializeChart() {
      const ctx = document.getElementById("expense-chart").getContext("2d");

      this.chart = new window.Chart(ctx, {
        type: "doughnut",
        data: this.getCategoryChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 20,
                usePointStyle: true,
                color: "#a1a1aa",
                font: {
                  family: "Inter",
                  size: 12,
                },
              },
            },
          },
          animation: {
            animateScale: true,
            animateRotate: true,
          },
        },
      });
    }

    getCategoryChartData() {
      const categoryTotals = {};

      this.expenses.forEach((expense) => {
        categoryTotals[expense.category] =
          (categoryTotals[expense.category] || 0) + expense.amount;
      });

      const colors = {
        Food: "#fbbf24",
        Transport: "#60a5fa",
        Entertainment: "#a78bfa",
        Shopping: "#34d399",
        Other: "#9ca3af",
      };

      return {
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals),
            backgroundColor: Object.keys(categoryTotals).map(
              (category) => colors[category]
            ),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      };
    }

    getTrendChartData() {
      const last7Days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push({
          date: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          amount: 0,
        });
      }

      this.expenses.forEach((expense) => {
        const expenseDate = new Date(expense.date).toISOString().split("T")[0];
        const dayData = last7Days.find((day) => day.date === expenseDate);
        if (dayData) {
          dayData.amount += expense.amount;
        }
      });

      return {
        labels: last7Days.map((day) => day.label),
        datasets: [
          {
            label: "Amount",
            data: last7Days.map((day) => day.amount),
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#fbbf24",
            pointBorderColor: "#18181b",
            pointBorderWidth: 2,
          },
        ],
      };
    }

    switchChart(chartType) {
      this.currentChartType = chartType;

      // Update toggle buttons
      this.chartToggles.forEach((toggle) => {
        toggle.classList.remove("active");
      });

      const activeToggle = document.querySelector(
        `[data-chart="${chartType}"]`
      );
      if (activeToggle) {
        activeToggle.classList.add("active");
      }

      this.updateChart();
    }

    updateChart() {
      if (!this.chart) return;

      if (this.currentChartType === "category") {
        this.chart.config.type = "doughnut";
        this.chart.data = this.getCategoryChartData();
      } else {
        this.chart.config.type = "line";
        this.chart.data = this.getTrendChartData();
      }

      this.chart.update("active");
    }

    getCategoryEmoji(category) {
      const emojis = {
        Food: "🍜",
        Transport: "🚊",
        Entertainment: "🎮",
        Shopping: "🛍️",
        Other: "📝",
      };
      return emojis[category] || "📝";
    }

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    showToast(message) {
      const toastMessage = this.toast.querySelector("span");
      if (toastMessage) {
        toastMessage.textContent = message;
      }

      this.toast.classList.add("toast-show");

      setTimeout(() => {
        this.toast.classList.remove("toast-show");
      }, 3000);
    }

    resetForm() {
      this.expenseForm.reset();
      this.expenseNameInput.focus();
    }

    saveToLocalStorage() {
      localStorage.setItem("expenses", JSON.stringify(this.expenses));
    }
  }

  // Initialize the app
  new ExpenseTracker();

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const form = document.getElementById("expense-form");
      if (form) {
        form.dispatchEvent(new Event("submit"));
      }
    }

    if (e.key === "Escape") {
      const form = document.getElementById("expense-form");
      if (form) {
        form.reset();
        const nameInput = document.getElementById("expense-name");
        if (nameInput) {
          nameInput.focus();
        }
      }
    }
  });
});
