
let currentUser = null
let isLibrarian = false


const API_BASE_URL = "http://localhost:9090/api"


document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
})

function showSection(sectionName) {
  document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"))
  const target = document.getElementById(sectionName + "Section")
  if (target) target.classList.add("active")
  document.getElementById("welcomeMessage").style.display = sectionName === "welcome" ? "block" : "none"
}

function toggleAuthForm() {
  const login = document.getElementById("loginForm")
  const register = document.getElementById("registerForm")
  login.style.display = login.style.display === "none" ? "block" : "none"
  register.style.display = register.style.display === "none" ? "block" : "none"
}

async function handleRegister(event) {
  event.preventDefault()

  const userData = {
    fullName: document.getElementById("registerFullName").value.trim(),
    email: document.getElementById("registerEmail").value.trim(),
    phoneNumber: document.getElementById("registerPhone").value.trim(),
    password: document.getElementById("registerPassword").value,
    role: document.getElementById("registerRole").value || "USER",
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    const data = await res.json()
    if (res.ok) {
      showMessage(`Welcome ${userData.fullName}! ${data.data?.message || "Registered"}`, "success")
      event.target.reset()
      toggleAuthForm()
    } else {
      showMessage(data.data || "Registration failed", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
    console.error(e)
  } finally {
    hideLoading(event.target)
  }
}

async function handleLogin(event) {
  event.preventDefault()

  const loginData = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value,
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    })
    const data = await res.json()
    if (res.ok) {
      const info = data.data
      currentUser = { fullName: info.fullName || "User", role: info.role }
      isLibrarian = info.role === "LIBRARIAN"
      updateUIForLoggedInUser()
      showMessage(`Welcome back, ${currentUser.fullName}!`, "success")
      event.target.reset()
    } else {
      showMessage(data.data || "Login failed", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
    console.error(e)
  } finally {
    hideLoading(event.target)
  }
}

function logout() {
  currentUser = null
  isLibrarian = false
  updateUIForLoggedOutUser()
  showMessage("Logged out successfully", "info")
}

function updateUIForLoggedInUser() {
  document.getElementById("userName").textContent = currentUser.fullName
  document.getElementById("welcomeMessage").style.display = "block"
  document.getElementById("logoutBtn").style.display = "inline-block"
  document.querySelectorAll(".librarian-only").forEach((e) => (e.style.display = isLibrarian ? "inline-block" : "none"))
  showSection("welcome")
}

function updateUIForLoggedOutUser() {
  document.getElementById("welcomeMessage").style.display = "none"
  document.getElementById("logoutBtn").style.display = "none"
  document.querySelectorAll(".librarian-only").forEach((e) => (e.style.display = "none"))
  showSection("auth")
}

function checkAuthStatus() {
  updateUIForLoggedOutUser()
}

async function handleAddBook(event) {
  event.preventDefault()

  const bookData = {
    title: document.getElementById("addTitle").value,
    author: document.getElementById("addAuthor").value,
    category: document.getElementById("addCategory").value,
    availableCopies: Number.parseInt(document.getElementById("addCopies").value),
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/books/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    })
    const data = await res.json()
    if (res.ok) {
      showMessage(`Book added! ${data.data?.message || ""}`, "success")
      event.target.reset()
    } else {
      showMessage(data.data || "Failed to add book", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
  } finally {
    hideLoading(event.target)
  }
}

async function handleUpdateBook(event) {
  event.preventDefault()

  const bookData = {
    bookId: document.getElementById("updateBookId").value,
    title: document.getElementById("updateTitle").value,
    author: document.getElementById("updateAuthor").value,
    category: document.getElementById("updateCategory").value,
    availableCopies: Number.parseInt(document.getElementById("updateCopies").value),
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/books/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    })
    const data = await res.json()
    if (res.ok) {
      showMessage(data.data?.message || "Book updated successfully", "success")
      event.target.reset()
    } else {
      showMessage(data.data || "Failed to update book", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
  } finally {
    hideLoading(event.target)
  }
}


let searchTimeout = null

async function searchBooksForSuggestions(query, suggestionsContainer) {
  if (!query || query.length < 2) {
    suggestionsContainer.classList.remove("show")
    return
  }

 
  if (searchTimeout) clearTimeout(searchTimeout)

  
  searchTimeout = setTimeout(async () => {
    try {
      suggestionsContainer.innerHTML = '<div class="suggestions-loading">Searching...</div>'
      suggestionsContainer.classList.add("show")

      const res = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(query)}`)
      const books = await res.json()

      if (res.ok && books && books.length > 0) {
        displayBookSuggestions(books.slice(0, 5), suggestionsContainer)
      } else {
        suggestionsContainer.innerHTML = '<div class="suggestions-loading">No books found</div>'
      }
    } catch (e) {
      suggestionsContainer.innerHTML = '<div class="suggestions-loading">Search error</div>'
    }
  }, 300)
}

function displayBookSuggestions(books, container) {
  container.innerHTML = books
    .map(
      (book) => `
    <div class="suggestion-item" onclick="selectBook('${escapeHtml(book.title)}', '${container.id}')">
      <div class="book-title">${escapeHtml(book.title)}</div>
      <div class="book-author">by ${escapeHtml(book.author)}</div>
      <div class="book-copies">${book.availableCopies || 0} copies available</div>
    </div>
  `,
    )
    .join("")
}

function selectBook(title, containerId) {
 
  let inputId
  if (containerId.includes("borrow")) {
    inputId = "borrowBookTitle"
  } else if (containerId.includes("return")) {
    inputId = "returnBookTitle"
  }

  if (inputId) {
    document.getElementById(inputId).value = title
    document.getElementById(containerId).classList.remove("show")
  }
}

async function handleBorrowBook(event) {
  event.preventDefault()

  const borrowData = {
    bookTitle: document.getElementById("borrowBookTitle").value.trim(),
    userEmail: document.getElementById("borrowUserEmail").value.trim(),
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/books/borrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(borrowData),
    })
    const data = await res.json()
    if (res.ok) {
      showMessage(`Book "${borrowData.bookTitle}" borrowed successfully! ${data.data?.message || ""}`, "success")
      event.target.reset()
    } else {
      showMessage(data.data || "Failed to borrow book", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
  } finally {
    hideLoading(event.target)
  }
}


async function handleReturnBook(event) {
  event.preventDefault()

  const returnData = {
    bookTitle: document.getElementById("returnBookTitle").value.trim(),
    userEmail: document.getElementById("returnUserEmail").value.trim(),
  }

  try {
    showLoading(event.target)
    const res = await fetch(`${API_BASE_URL}/books/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(returnData),
    })
    const data = await res.json()
    if (res.ok) {
      showMessage(`Book "${returnData.bookTitle}" returned successfully! ${data.data?.message || ""}`, "success")
      event.target.reset()
    } else {
      showMessage(data.data || "Failed to return book", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
  } finally {
    hideLoading(event.target)
  }
}

async function searchBooks() {
  const query = document.getElementById("searchQuery").value.trim()
  if (!query) return showMessage("Enter search text", "info")

  try {
    const res = await fetch(`${API_BASE_URL}/books/search?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (res.ok) {
      displaySearchResults(data)
    } else {
      showMessage(data.message || "Search failed", "error")
    }
  } catch (e) {
    showMessage("Network error", "error")
  }
}

function displaySearchResults(books) {
  const results = document.getElementById("searchResults")
  if (!books || books.length === 0) {
    results.innerHTML = "<p>No books found</p>"
    return
  }
  results.innerHTML = books
    .map(
      (book) => `
    <div class="book-item">
      <h3>${escapeHtml(book.title)}</h3>
      <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
      <p><strong>Category:</strong> ${escapeHtml(book.category)}</p>
      <p><strong>Available:</strong> ${book.availableCopies || 0}</p>
      ${book.bookId ? `<p><strong>ID:</strong> ${book.bookId}</p>` : ""}
    </div>
  `,
    )
    .join("")
}

function showMessage(message, type = "info") {
  const container = document.getElementById("messageContainer")
  const msg = document.createElement("div")
  msg.className = `message ${type}`
  msg.textContent = message
  container.appendChild(msg)
  setTimeout(() => msg.remove(), 5000)
}

function showLoading(form) {
  const btn = form.querySelector('button[type="submit"]')
  if (btn) {
    btn.classList.add("loading")
    btn.disabled = true
  }
}

function hideLoading(form) {
  const btn = form.querySelector('button[type="submit"]')
  if (btn) {
    btn.classList.remove("loading")
    btn.disabled = false
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}


document.addEventListener("DOMContentLoaded", () => {
 
  const searchInput = document.getElementById("searchQuery")
  if (searchInput) {
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        searchBooks()
      }

    })
  }

  
  const borrowBookInput = document.getElementById("borrowBookTitle")
  if (borrowBookInput) {
    borrowBookInput.addEventListener("input", (e) => {
      const suggestionsContainer = document.getElementById("borrowBookSuggestions")
      searchBooksForSuggestions(e.target.value, suggestionsContainer)
    })

    
    borrowBookInput.addEventListener("blur", () => {
      setTimeout(() => {
        document.getElementById("borrowBookSuggestions").classList.remove("show")
      }, 200)
    })
  }

  const returnBookInput = document.getElementById("returnBookTitle")
  if (returnBookInput) {
    returnBookInput.addEventListener("input", (e) => {
      const suggestionsContainer = document.getElementById("returnBookSuggestions")
      searchBooksForSuggestions(e.target.value, suggestionsContainer)
    })

    returnBookInput.addEventListener("blur", () => {
      setTimeout(() => {
        document.getElementById("returnBookSuggestions").classList.remove("show")
      }, 200)
    })
  }
})
