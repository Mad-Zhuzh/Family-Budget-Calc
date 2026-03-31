const STORAGE_KEY = "family_budget_calculator_multi_currency_v4";
const CURRENCIES = ["RUB", "USD", "EUR"];
const THEME_KEY = "family_budget_theme_v1";

function generateId() {
  return "id-" + Math.random().toString(36).slice(2, 11);
}

function toNumber(value) {
  const normalized = String(value ?? "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) || num < 0 ? 0 : num;
}

function numberToInputValue(value) {
  return Number(value) === 0 ? "" : String(value);
}

function numberToAmountInputValue(value) {
  return Number(value) === 0 ? "" : Number(value).toFixed(2).replace(".", ",");
}

function normalizeAmountFieldValue(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";
  return toNumber(value).toFixed(2).replace(".", ",");
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  themeToggleBtn.textContent = isDark ? "☀" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  setTheme(savedTheme === "dark" ? "dark" : "light");
}

function getDefaultState() {
  return {
    baseCurrency: "RUB",
    exchangeRatesToRUB: {
      RUB: 1,
      USD: 90,
      EUR: 100
    },
    incomes: [
      { id: generateId(), name: "Зарплата 1", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Зарплата 2", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Подработка", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Пособия / выплаты", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Прочие доходы", amount: 0, currency: "RUB", custom: false }
    ],
    expenses: [
      { id: generateId(), name: "Жильё / аренда / ипотека", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Коммунальные услуги", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Продукты", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Транспорт", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Связь / интернет", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Дети", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Здоровье / лекарства", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Кредиты", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Развлечения", amount: 0, currency: "RUB", custom: false },
      { id: generateId(), name: "Прочие расходы", amount: 0, currency: "RUB", custom: false }
    ]
  };
}

function normalizeLoadedState(parsed) {
  const fallback = getDefaultState();

  return {
    baseCurrency: parsed.baseCurrency || fallback.baseCurrency,
    exchangeRatesToRUB: {
      RUB: toNumber(parsed.exchangeRatesToRUB?.RUB) || 1,
      USD: toNumber(parsed.exchangeRatesToRUB?.USD) || 90,
      EUR: toNumber(parsed.exchangeRatesToRUB?.EUR) || 100
    },
    incomes: Array.isArray(parsed.incomes) ? parsed.incomes.map(item => ({
      id: item.id || generateId(),
      name: item.name || "Без названия",
      amount: toNumber(item.amount),
      currency: CURRENCIES.includes(item.currency) ? item.currency : "RUB",
      custom: Boolean(item.custom)
    })) : fallback.incomes,
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(item => ({
      id: item.id || generateId(),
      name: item.name || "Без названия",
      amount: toNumber(item.amount),
      currency: CURRENCIES.includes(item.currency) ? item.currency : "RUB",
      custom: Boolean(item.custom)
    })) : fallback.expenses
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    return getDefaultState();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(value, currency) {
  const localeMap = {
    RUB: "ru-RU",
    USD: "en-US",
    EUR: "de-DE"
  };

  return new Intl.NumberFormat(localeMap[currency] || "ru-RU", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2
  }).format(value);
}

function convertToRUB(amount, sourceCurrency) {
  const rate = toNumber(state.exchangeRatesToRUB[sourceCurrency]);
  if (!rate) return 0;
  return amount * rate;
}

function convertFromRUB(amountRUB, targetCurrency) {
  const rate = toNumber(state.exchangeRatesToRUB[targetCurrency]);
  if (!rate) return 0;
  return amountRUB / rate;
}

function convertCurrency(amount, sourceCurrency, targetCurrency) {
  if (sourceCurrency === targetCurrency) return amount;
  const amountRUB = convertToRUB(amount, sourceCurrency);
  return convertFromRUB(amountRUB, targetCurrency);
}

function getAmountInBaseCurrency(item) {
  return convertCurrency(toNumber(item.amount), item.currency, state.baseCurrency);
}

function getTotalIncome() {
  return state.incomes.reduce((sum, item) => sum + getAmountInBaseCurrency(item), 0);
}

function getTotalExpense() {
  return state.expenses.reduce((sum, item) => sum + getAmountInBaseCurrency(item), 0);
}

let state = loadData();

const incomeListEl = document.getElementById("incomeList");
const expenseListEl = document.getElementById("expenseList");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");
const savingsRateEl = document.getElementById("savingsRate");
const expenseChartEl = document.getElementById("expenseChart");

const baseCurrencyEl = document.getElementById("baseCurrency");
const rateRUBEl = document.getElementById("rateRUB");
const rateUSDEl = document.getElementById("rateUSD");
const rateEUREl = document.getElementById("rateEUR");

const newIncomeNameEl = document.getElementById("newIncomeName");
const newIncomeValueEl = document.getElementById("newIncomeValue");
const newIncomeCurrencyEl = document.getElementById("newIncomeCurrency");

const newExpenseNameEl = document.getElementById("newExpenseName");
const newExpenseValueEl = document.getElementById("newExpenseValue");
const newExpenseCurrencyEl = document.getElementById("newExpenseCurrency");

const addIncomeBtn = document.getElementById("addIncomeBtn");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const resetBtn = document.getElementById("resetBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");
const goToCalculatorBtn = document.getElementById("goToCalculatorBtn");
const appSectionEl = document.getElementById("appSection");

initTheme();
renderAll();

function renderAll() {
  renderTopControls();
  renderIncomeList();
  renderExpenseList();
  renderSummary();
  renderExpenseChart();
  saveData();
}

function exportStateToFile() {
  const payload = {
    exportedAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateTag = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `family-budget-backup-${dateTag}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importStateFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const nextState = parsed.state ? normalizeLoadedState(parsed.state) : normalizeLoadedState(parsed);
      state = nextState;
      renderAll();
      alert("Данные успешно импортированы.");
    } catch (error) {
      alert("Не удалось импортировать файл. Проверьте формат JSON.");
    }
  };
  reader.readAsText(file, "utf-8");
}

function renderTopControls() {
  baseCurrencyEl.value = state.baseCurrency;
  rateRUBEl.value = numberToInputValue(state.exchangeRatesToRUB.RUB);
  rateUSDEl.value = numberToInputValue(state.exchangeRatesToRUB.USD);
  rateEUREl.value = numberToInputValue(state.exchangeRatesToRUB.EUR);
}

function createCurrencySelect(selectedCurrency, onChange) {
  const select = document.createElement("select");

  CURRENCIES.forEach(currency => {
    const option = document.createElement("option");
    option.value = currency;
    option.textContent = currency;
    if (currency === selectedCurrency) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", onChange);
  return select;
}

function createAmountInput(item, onAfterInput) {
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.placeholder = "Сумма";
  input.value = numberToAmountInputValue(item.amount);

  input.addEventListener("input", (e) => {
    item.amount = toNumber(e.target.value);
    if (typeof onAfterInput === "function") onAfterInput();
    saveData();
  });

  input.addEventListener("blur", (e) => {
    e.target.value = normalizeAmountFieldValue(e.target.value);
  });

  return input;
}

function renderIncomeList() {
  incomeListEl.innerHTML = "";

  state.incomes.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";

    const label = document.createElement("label");
    label.textContent = item.name;

    const amountInput = createAmountInput(item, () => {
      renderSummary();
    });

    const currencySelect = createCurrencySelect(item.currency, (e) => {
      item.currency = e.target.value;
      renderSummary();
      saveData();
    });

    const actionCell = document.createElement("div");

    if (item.custom) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger btn-small remove-btn";
      removeBtn.textContent = "✕";
      removeBtn.title = "Удалить категорию";
      removeBtn.addEventListener("click", () => {
        state.incomes = state.incomes.filter((x) => x.id !== item.id);
        renderAll();
      });
      actionCell.appendChild(removeBtn);
    }

    row.appendChild(label);
    row.appendChild(amountInput);
    row.appendChild(currencySelect);
    row.appendChild(actionCell);

    incomeListEl.appendChild(row);
  });
}

function renderExpenseList() {
  expenseListEl.innerHTML = "";

  state.expenses.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";

    const label = document.createElement("label");
    label.textContent = item.name;

    const amountInput = createAmountInput(item, () => {
      renderSummary();
      renderExpenseChart();
    });

    const currencySelect = createCurrencySelect(item.currency, (e) => {
      item.currency = e.target.value;
      renderSummary();
      renderExpenseChart();
      saveData();
    });

    const actionCell = document.createElement("div");

    if (item.custom) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger btn-small remove-btn";
      removeBtn.textContent = "✕";
      removeBtn.title = "Удалить категорию";
      removeBtn.addEventListener("click", () => {
        state.expenses = state.expenses.filter((x) => x.id !== item.id);
        renderAll();
      });
      actionCell.appendChild(removeBtn);
    }

    row.appendChild(label);
    row.appendChild(amountInput);
    row.appendChild(currencySelect);
    row.appendChild(actionCell);

    expenseListEl.appendChild(row);
  });
}

function renderSummary() {
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  totalIncomeEl.textContent = formatCurrency(totalIncome, state.baseCurrency);
  totalExpenseEl.textContent = formatCurrency(totalExpense, state.baseCurrency);
  balanceEl.textContent = formatCurrency(balance, state.baseCurrency);

  balanceEl.classList.remove("balance-positive", "balance-negative", "balance-zero");

  if (balance > 0) {
    balanceEl.classList.add("balance-positive");
  } else if (balance < 0) {
    balanceEl.classList.add("balance-negative");
  } else {
    balanceEl.classList.add("balance-zero");
  }

  savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;
}

function renderExpenseChart() {
  expenseChartEl.innerHTML = "";

  const totalExpense = getTotalExpense();

  const nonZeroExpenses = state.expenses
    .map(item => ({
      ...item,
      convertedAmount: getAmountInBaseCurrency(item)
    }))
    .filter(item => item.convertedAmount > 0);

  if (nonZeroExpenses.length === 0 || totalExpense === 0) {
    expenseChartEl.innerHTML = '<div class="muted">Пока нет данных по расходам для отображения.</div>';
    return;
  }

  const sorted = [...nonZeroExpenses].sort((a, b) => b.convertedAmount - a.convertedAmount);

  sorted.forEach((item) => {
    const percent = (item.convertedAmount / totalExpense) * 100;

    const wrapper = document.createElement("div");
    wrapper.className = "chart-item";

    const head = document.createElement("div");
    head.className = "chart-head";
    head.innerHTML = `
      <span>${escapeHtml(item.name)} (${item.currency})</span>
      <span>${formatCurrency(item.convertedAmount, state.baseCurrency)} (${percent.toFixed(1)}%)</span>
    `;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${percent}%`;

    track.appendChild(fill);
    wrapper.appendChild(head);
    wrapper.appendChild(track);
    expenseChartEl.appendChild(wrapper);
  });
}

baseCurrencyEl.addEventListener("change", (e) => {
  state.baseCurrency = e.target.value;
  renderAll();
});

rateRUBEl.addEventListener("input", (e) => {
  state.exchangeRatesToRUB.RUB = Math.max(0.0001, toNumber(e.target.value) || 1);
  renderAll();
});

rateRUBEl.addEventListener("blur", (e) => {
  e.target.value = numberToInputValue(state.exchangeRatesToRUB.RUB);
});

rateUSDEl.addEventListener("input", (e) => {
  state.exchangeRatesToRUB.USD = Math.max(0.0001, toNumber(e.target.value));
  renderAll();
});

rateUSDEl.addEventListener("blur", (e) => {
  e.target.value = numberToInputValue(state.exchangeRatesToRUB.USD);
});

rateEUREl.addEventListener("input", (e) => {
  state.exchangeRatesToRUB.EUR = Math.max(0.0001, toNumber(e.target.value));
  renderAll();
});

rateEUREl.addEventListener("blur", (e) => {
  e.target.value = numberToInputValue(state.exchangeRatesToRUB.EUR);
});

newIncomeValueEl.addEventListener("blur", (e) => {
  e.target.value = normalizeAmountFieldValue(e.target.value);
});

newExpenseValueEl.addEventListener("blur", (e) => {
  e.target.value = normalizeAmountFieldValue(e.target.value);
});

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

goToCalculatorBtn.addEventListener("click", () => {
  appSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
});

exportBtn.addEventListener("click", () => {
  exportStateToFile();
});

importBtn.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  importStateFromFile(file);
  importFileInput.value = "";
});

addIncomeBtn.addEventListener("click", () => {
  const name = newIncomeNameEl.value.trim();
  const amount = toNumber(newIncomeValueEl.value);
  const currency = newIncomeCurrencyEl.value;

  if (!name) {
    alert("Введите название дохода.");
    return;
  }

  state.incomes.push({
    id: generateId(),
    name,
    amount,
    currency,
    custom: true
  });

  newIncomeNameEl.value = "";
  newIncomeValueEl.value = "";
  newIncomeCurrencyEl.value = "RUB";

  renderAll();
});

addExpenseBtn.addEventListener("click", () => {
  const name = newExpenseNameEl.value.trim();
  const amount = toNumber(newExpenseValueEl.value);
  const currency = newExpenseCurrencyEl.value;

  if (!name) {
    alert("Введите название расхода.");
    return;
  }

  state.expenses.push({
    id: generateId(),
    name,
    amount,
    currency,
    custom: true
  });

  newExpenseNameEl.value = "";
  newExpenseValueEl.value = "";
  newExpenseCurrencyEl.value = "RUB";

  renderAll();
});

resetBtn.addEventListener("click", () => {
  const ok = confirm("Сбросить все введённые данные?");
  if (!ok) return;

  state = getDefaultState();
  renderAll();
});
