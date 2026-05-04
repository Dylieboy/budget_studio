let authMode = "login";
let currentUser = null;
const API_BASE_URL = (window.BUDGET_API_BASE_URL || "").replace(/\/$/, "");

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyData() {
  return {
    currency: "USD",
    transactions: [],
    debts: [],
    savings: []
  };
}

const pageTitles = {
  overview: "Plan spending. Track debt. Grow savings.",
  transactions: "Add income and expenses.",
  debts: "Remember what to pay.",
  savings: "Build savings goals."
};

const elements = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authError: document.querySelector("#authError"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  authModeButton: document.querySelector("#authModeButton"),
  sidebar: document.querySelector("#sidebar"),
  mobileOverlay: document.querySelector("#mobileOverlay"),
  menuButton: document.querySelector("#menuButton"),
  pageTitle: document.querySelector("#pageTitle"),
  navLinks: document.querySelectorAll("[data-page-link]"),
  pages: document.querySelectorAll("[data-page]"),
  monthLabel: document.querySelector("#monthLabel"),
  healthText: document.querySelector("#healthText"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  debtTotal: document.querySelector("#debtTotal"),
  savingsTotal: document.querySelector("#savingsTotal"),
  overviewDebtList: document.querySelector("#overviewDebtList"),
  overviewSavingsList: document.querySelector("#overviewSavingsList"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionName: document.querySelector("#transactionName"),
  transactionAmount: document.querySelector("#transactionAmount"),
  transactionType: document.querySelector("#transactionType"),
  transactionList: document.querySelector("#transactionList"),
  debtForm: document.querySelector("#debtForm"),
  debtName: document.querySelector("#debtName"),
  debtAmount: document.querySelector("#debtAmount"),
  debtDueDate: document.querySelector("#debtDueDate"),
  debtNote: document.querySelector("#debtNote"),
  debtList: document.querySelector("#debtList"),
  savingsForm: document.querySelector("#savingsForm"),
  savingsName: document.querySelector("#savingsName"),
  savingsTarget: document.querySelector("#savingsTarget"),
  savingsCurrent: document.querySelector("#savingsCurrent"),
  savingsDueDate: document.querySelector("#savingsDueDate"),
  savingsList: document.querySelector("#savingsList"),
  currencySelect: document.querySelector("#currencySelect"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
  logoutButton: document.querySelector("#logoutButton"),
  clearTransactionsButton: document.querySelector("#clearTransactionsButton"),
  clearPaidButton: document.querySelector("#clearPaidButton"),
  clearCompletedGoalsButton: document.querySelector("#clearCompletedGoalsButton")
};

let state = createEmptyData();

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong.");
  }

  return payload;
}

function normalizeState(data) {
  return {
    currency: data?.currency || "USD",
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    debts: Array.isArray(data?.debts) ? data.debts : [],
    savings: Array.isArray(data?.savings) ? data.savings : []
  };
}

async function loadState() {
  const payload = await apiRequest("/api/data");
  if (payload.data) {
    state = normalizeState(payload.data);
    return;
  }

  state = createEmptyData();
}

async function saveState() {
  await apiRequest("/api/data", {
    method: "PUT",
    body: JSON.stringify({ data: state })
  });
}

function setAuthVisible(isVisible) {
  elements.authScreen.classList.toggle("hidden", !isVisible);
  document.body.classList.toggle("locked", isVisible);
}

function updateAuthMode() {
  const isSignup = authMode === "signup";
  elements.authTitle.textContent = isSignup ? "Create account" : "Log in";
  elements.authSubmitButton.textContent = isSignup ? "Sign up" : "Log in";
  elements.authModeButton.textContent = isSignup ? "Already have an account? Log in" : "Create an account";
  elements.authPassword.autocomplete = isSignup ? "new-password" : "current-password";
  elements.authError.textContent = "";
}

async function refreshSession() {
  try {
    const payload = await apiRequest("/api/me");
    currentUser = payload.user;
    setAuthVisible(false);
    await loadState();
    render();
  } catch {
    currentUser = null;
    setAuthVisible(true);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: state.currency
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) {
    return "No target date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function getDebtStatus(debt) {
  if (debt.paid) {
    return { label: "Paid", className: "badge-ok" };
  }

  const today = new Date();
  const due = new Date(`${debt.dueDate}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - today) / 86400000);

  if (daysLeft < 0) {
    return { label: `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue`, className: "badge-overdue" };
  }

  if (daysLeft <= 7) {
    return { label: daysLeft === 0 ? "Due today" : `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, className: "badge-soon" };
  }

  return { label: "Scheduled", className: "badge-ok" };
}

function getTotals() {
  const income = state.transactions
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const expenses = state.transactions
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const debt = state.debts
    .filter((entry) => !entry.paid)
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const savings = state.savings.reduce((total, goal) => total + Number(goal.current || 0), 0);

  return { income, expenses, debt, savings, balance: income - expenses };
}

function setActivePage(pageName) {
  const target = pageTitles[pageName] ? pageName : "overview";

  elements.pages.forEach((page) => {
    page.classList.toggle("active", page.dataset.page === target);
  });

  elements.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.pageLink === target);
  });

  elements.pageTitle.textContent = pageTitles[target];
  closeMenu();
}

function openMenu() {
  elements.sidebar.classList.add("open");
  elements.mobileOverlay.classList.add("open");
  elements.menuButton.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  elements.sidebar.classList.remove("open");
  elements.mobileOverlay.classList.remove("open");
  elements.menuButton.setAttribute("aria-expanded", "false");
}

function renderMetrics() {
  const totals = getTotals();

  elements.incomeTotal.textContent = formatMoney(totals.income);
  elements.expenseTotal.textContent = formatMoney(totals.expenses);
  elements.balanceTotal.textContent = formatMoney(totals.balance);
  elements.debtTotal.textContent = formatMoney(totals.debt);
  elements.savingsTotal.textContent = formatMoney(totals.savings);
  elements.currencySelect.value = state.currency;
  elements.monthLabel.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

  if (state.transactions.length === 0) {
    elements.healthText.textContent = "Add income and expenses to start.";
  } else if (totals.balance < 0) {
    elements.healthText.textContent = "Expenses are above income. Tighten the next few payments.";
  } else if (totals.debt > 0) {
    elements.healthText.textContent = "Budget is positive. Keep debt reminders visible.";
  } else if (state.savings.length > 0) {
    elements.healthText.textContent = "Budget is positive. Savings goals are moving.";
  } else {
    elements.healthText.textContent = "Budget is positive and no unpaid debts are listed.";
  }
}

function renderTransactions() {
  elements.transactionList.innerHTML = "";

  if (state.transactions.length === 0) {
    elements.transactionList.innerHTML = '<li class="empty-state">No entries yet.</li>';
    return;
  }

  [...state.transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${entry.type === "income" ? "Income" : "Expense"}</small>
        </div>
        <div class="item-actions">
          <strong class="${entry.type === "income" ? "amount-income" : "amount-expense"}">
            ${entry.type === "income" ? "+" : "-"}${formatMoney(Number(entry.amount))}
          </strong>
          <button class="mini-button" type="button" data-action="delete-transaction" data-id="${entry.id}">Delete</button>
        </div>
      `;
      elements.transactionList.append(item);
    });
}

function renderDebtItems(listElement, debts) {
  listElement.innerHTML = "";

  if (debts.length === 0) {
    listElement.innerHTML = '<li class="empty-state">No debt notes yet.</li>';
    return;
  }

  debts.forEach((debt) => {
    const status = getDebtStatus(debt);
    const item = document.createElement("li");
    item.className = `list-item ${debt.paid ? "paid" : ""}`;
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(debt.name)}</strong>
        <small>${formatMoney(Number(debt.amount))} due ${formatDate(debt.dueDate)}</small>
        ${debt.note ? `<p class="debt-note">${escapeHtml(debt.note)}</p>` : ""}
        <div class="debt-meta">
          <span class="badge ${status.className}">${status.label}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="mini-button" type="button" data-action="toggle-debt" data-id="${debt.id}">
          ${debt.paid ? "Unpaid" : "Paid"}
        </button>
        <button class="mini-button" type="button" data-action="delete-debt" data-id="${debt.id}">Delete</button>
      </div>
    `;
    listElement.append(item);
  });
}

function renderDebts() {
  const sortedDebts = [...state.debts].sort((a, b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate));
  renderDebtItems(elements.debtList, sortedDebts);
  renderDebtItems(elements.overviewDebtList, sortedDebts.filter((debt) => !debt.paid).slice(0, 3));
}

function getGoalPercent(goal) {
  if (!Number(goal.target)) {
    return 0;
  }

  return Math.min(100, Math.round((Number(goal.current || 0) / Number(goal.target)) * 100));
}

function renderSavingsItems(listElement, goals, compact = false) {
  listElement.innerHTML = "";

  if (goals.length === 0) {
    listElement.innerHTML = '<li class="empty-state">No savings goals yet.</li>';
    return;
  }

  goals.forEach((goal) => {
    const percent = getGoalPercent(goal);
    const remaining = Math.max(0, Number(goal.target) - Number(goal.current || 0));
    const item = document.createElement("li");
    item.className = "list-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(goal.name)}</strong>
        <small>${formatMoney(Number(goal.current || 0))} saved of ${formatMoney(Number(goal.target))}</small>
        <div class="progress-track" aria-label="${percent}% saved">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="goal-meta">
          <span class="badge ${percent >= 100 ? "badge-ok" : "badge-soon"}">${percent}%</span>
          <span class="badge badge-ok">${formatMoney(remaining)} left</span>
          ${goal.dueDate ? `<span class="badge badge-soon">${formatDate(goal.dueDate)}</span>` : ""}
        </div>
      </div>
      ${
        compact
          ? ""
          : `<div class="item-actions">
              <button class="mini-button" type="button" data-action="add-saving" data-id="${goal.id}">Add saved</button>
              <button class="mini-button" type="button" data-action="delete-saving" data-id="${goal.id}">Delete</button>
            </div>`
      }
    `;
    listElement.append(item);
  });
}

function renderSavings() {
  const sortedGoals = [...state.savings].sort((a, b) => getGoalPercent(b) - getGoalPercent(a));
  renderSavingsItems(elements.savingsList, sortedGoals);
  renderSavingsItems(elements.overviewSavingsList, sortedGoals.slice(0, 3), true);
}

function render() {
  renderMetrics();
  renderTransactions();
  renderDebts();
  renderSavings();
}

elements.navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const pageName = link.dataset.pageLink;
    history.replaceState(null, "", `#${pageName}`);
    setActivePage(pageName);
  });
});

elements.menuButton.addEventListener("click", () => {
  if (elements.sidebar.classList.contains("open")) {
    closeMenu();
  } else {
    openMenu();
  }
});

elements.mobileOverlay.addEventListener("click", closeMenu);

elements.authModeButton.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  updateAuthMode();
});

elements.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.authSubmitButton.disabled = true;
  elements.authError.textContent = "";

  try {
    const endpoint = authMode === "signup" ? "/api/signup" : "/api/login";
    const payload = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify({
        email: elements.authEmail.value,
        password: elements.authPassword.value
      })
    });
    currentUser = payload.user;
    elements.authForm.reset();
    setAuthVisible(false);
    await loadState();
    render();
  } catch (error) {
    elements.authError.textContent = error.message;
  } finally {
    elements.authSubmitButton.disabled = false;
  }
});

elements.logoutButton.addEventListener("click", async () => {
  await apiRequest("/api/logout", { method: "POST" });
  currentUser = null;
  state = createEmptyData();
  render();
  setAuthVisible(true);
});

elements.transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  state.transactions.push({
    id: makeId(),
    name: elements.transactionName.value.trim(),
    amount: Number(elements.transactionAmount.value),
    type: elements.transactionType.value,
    createdAt: Date.now()
  });

  elements.transactionForm.reset();
  await saveState();
  render();
});

elements.debtForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  state.debts.push({
    id: makeId(),
    name: elements.debtName.value.trim(),
    amount: Number(elements.debtAmount.value),
    dueDate: elements.debtDueDate.value,
    note: elements.debtNote.value.trim(),
    paid: false
  });

  elements.debtForm.reset();
  setDefaultDebtDate();
  await saveState();
  render();
});

elements.savingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  state.savings.push({
    id: makeId(),
    name: elements.savingsName.value.trim(),
    target: Number(elements.savingsTarget.value),
    current: Number(elements.savingsCurrent.value || 0),
    dueDate: elements.savingsDueDate.value,
    createdAt: Date.now()
  });

  elements.savingsForm.reset();
  await saveState();
  render();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "delete-transaction") {
    state.transactions = state.transactions.filter((entry) => entry.id !== id);
  }

  if (action === "toggle-debt") {
    state.debts = state.debts.map((debt) => (debt.id === id ? { ...debt, paid: !debt.paid } : debt));
  }

  if (action === "delete-debt") {
    state.debts = state.debts.filter((debt) => debt.id !== id);
  }

  if (action === "add-saving") {
    const amount = Number(prompt("How much did you save?"));
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    state.savings = state.savings.map((goal) => (goal.id === id ? { ...goal, current: Number(goal.current || 0) + amount } : goal));
  }

  if (action === "delete-saving") {
    state.savings = state.savings.filter((goal) => goal.id !== id);
  }

  await saveState();
  render();
});

elements.clearTransactionsButton.addEventListener("click", async () => {
  state.transactions = [];
  await saveState();
  render();
});

elements.clearPaidButton.addEventListener("click", async () => {
  state.debts = state.debts.filter((debt) => !debt.paid);
  await saveState();
  render();
});

elements.clearCompletedGoalsButton.addEventListener("click", async () => {
  state.savings = state.savings.filter((goal) => getGoalPercent(goal) < 100);
  await saveState();
  render();
});

elements.currencySelect.addEventListener("change", async () => {
  state.currency = elements.currencySelect.value;
  await saveState();
  render();
});

elements.resetDemoButton.addEventListener("click", async () => {
  state = createEmptyData();
  await saveState();
  render();
});

function setDefaultDebtDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  elements.debtDueDate.value = date.toISOString().slice(0, 10);
}

setDefaultDebtDate();
setActivePage(window.location.hash.replace("#", "") || "overview");
updateAuthMode();
setAuthVisible(true);
refreshSession();
