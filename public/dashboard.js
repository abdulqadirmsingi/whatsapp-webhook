// Dashboard JavaScript
let allOrders = [];
let allProducts = [];

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function () {
  loadDashboard();
  setupEventListeners();
});

function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.getAttribute("data-section");
      showSection(section);
    });
  });

  // Status filter
  document
    .getElementById("status-filter")
    .addEventListener("change", function () {
      filterOrders(this.value);
    });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('[id$="-section"]').forEach((section) => {
    section.style.display = "none";
  });

  // Remove active class from all nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  // Show selected section
  document.getElementById(`${sectionName}-section`).style.display = "block";

  // Add active class to clicked nav link
  document
    .querySelector(`[data-section="${sectionName}"]`)
    .classList.add("active");

  // Update page title
  const titles = {
    dashboard: "Dashboard",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
  };
  document.getElementById("page-title").textContent = titles[sectionName];

  // Load section data
  switch (sectionName) {
    case "dashboard":
      loadDashboard();
      break;
    case "orders":
      loadOrders();
      break;
    case "products":
      loadProducts();
      break;
    case "customers":
      // Customer data loading can be implemented here
      break;
  }
}

async function loadDashboard() {
  try {
    const orders = await fetchOrders();
    updateDashboardStats(orders);
    displayRecentOrders(orders.slice(0, 10));
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showError("Failed to load dashboard data");
  }
}

async function loadOrders() {
  try {
    const orders = await fetchOrders();
    allOrders = orders;
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    showError("Failed to load orders");
  }
}

async function loadProducts() {
  try {
    const products = await fetchProducts();
    allProducts = products;
    displayProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
    showError("Failed to load products");
  }
}

async function fetchOrders() {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("Failed to fetch orders");
  return await response.json();
}

async function fetchProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("Failed to fetch products");
  return await response.json();
}

async function fetchOrderDetails(orderNumber) {
  const response = await fetch(`/api/orders/${orderNumber}`);
  if (!response.ok) throw new Error("Failed to fetch order details");
  return await response.json();
}

function updateDashboardStats(orders) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount),
    0
  );

  document.getElementById("total-orders").textContent = totalOrders;
  document.getElementById("pending-orders").textContent = pendingOrders;
  document.getElementById("confirmed-orders").textContent = confirmedOrders;
  document.getElementById(
    "total-revenue"
  ).textContent = `$${totalRevenue.toFixed(2)}`;
}

function displayRecentOrders(orders) {
  const container = document.getElementById("recent-orders");

  if (orders.length === 0) {
    container.innerHTML = '<p class="text-muted">No orders found.</p>';
    return;
  }

  const ordersList = orders
    .map(
      (order) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <strong>${order.order_number}</strong><br>
                <small class="text-muted">${order.customer_name} - ${
        order.customer_phone
      }</small>
            </div>
            <div class="text-end">
                <span class="badge ${getStatusBadgeClass(
                  order.status
                )} status-badge">${order.status.toUpperCase()}</span><br>
                <strong>$${parseFloat(order.total_amount).toFixed(2)}</strong>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ordersList;
}

function displayOrders(orders) {
  const container = document.getElementById("orders-list");

  if (orders.length === 0) {
    container.innerHTML =
      '<div class="alert alert-info">No orders found.</div>';
    return;
  }

  const ordersGrid = orders
    .map(
      (order) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card order-card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="m-0">${order.order_number}</h6>
                    <span class="badge ${getStatusBadgeClass(
                      order.status
                    )}">${order.status.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">
                        <i class="fas fa-user"></i> ${order.customer_name}<br>
                        <i class="fas fa-phone"></i> ${order.customer_phone}<br>
                        <i class="fas fa-dollar-sign"></i> $${parseFloat(
                          order.total_amount
                        ).toFixed(2)}<br>
                        <i class="fas fa-credit-card"></i> ${
                          order.payment_method === "instant"
                            ? "Immediate"
                            : "30 Days"
                        }<br>
                        <i class="fas fa-calendar"></i> ${formatDate(
                          order.created_at
                        )}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" onclick="showOrderDetails('${
                      order.order_number
                    }')">
                        View Details
                    </button>
                    ${
                      order.status === "pending"
                        ? `
                        <button class="btn btn-success btn-sm" onclick="confirmOrder('${order.order_number}')">
                            Confirm
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = `<div class="row">${ordersGrid}</div>`;
}

function displayProducts(products) {
  const container = document.getElementById("products-list");

  if (products.length === 0) {
    container.innerHTML =
      '<div class="alert alert-info">No products found.</div>';
    return;
  }

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  let productsHtml = "";
  for (const [category, categoryProducts] of Object.entries(
    productsByCategory
  )) {
    productsHtml += `
            <h5 class="mt-4 mb-3">${category}</h5>
            <div class="row">
        `;

    categoryProducts.forEach((product) => {
      productsHtml += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${product.name}</h6>
                            <p class="card-text">${product.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <strong class="text-primary">$${parseFloat(
                                  product.price
                                ).toFixed(2)}</strong>
                                <span class="badge ${
                                  product.is_available
                                    ? "bg-success"
                                    : "bg-danger"
                                }">
                                    ${
                                      product.is_available
                                        ? "Available"
                                        : "Out of Stock"
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    });

    productsHtml += "</div>";
  }

  container.innerHTML = productsHtml;
}

async function showOrderDetails(orderNumber) {
  try {
    const order = await fetchOrderDetails(orderNumber);

    let orderDetailsHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Order Number:</strong> ${order.order_number}</p>
                    <p><strong>Status:</strong> <span class="badge ${getStatusBadgeClass(
                      order.status
                    )}">${order.status.toUpperCase()}</span></p>
                    <p><strong>Date:</strong> ${formatDate(
                      order.created_at
                    )}</p>
                </div>
                <div class="col-md-6">
                    <h6>Customer Information</h6>
                    <p><strong>Name:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.customer_phone}</p>
                    <p><strong>Payment Method:</strong> ${
                      order.payment_method === "instant"
                        ? "Immediate Payment"
                        : "Payment in 30 Days"
                    }</p>
                </div>
            </div>
            
            <h6>Order Items</h6>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    order.items.forEach((item) => {
      orderDetailsHtml += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td>$${parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
            `;
    });

    orderDetailsHtml += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3">Total Amount</th>
                            <th>$${parseFloat(order.total_amount).toFixed(
                              2
                            )}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    document.getElementById("order-details").innerHTML = orderDetailsHtml;

    // Show confirm button if order is pending
    const confirmBtn = document.getElementById("confirm-order-btn");
    if (order.status === "pending") {
      confirmBtn.style.display = "inline-block";
      confirmBtn.onclick = () => confirmOrder(order.order_number);
    } else {
      confirmBtn.style.display = "none";
    }

    // Show modal
    new bootstrap.Modal(document.getElementById("orderModal")).show();
  } catch (error) {
    console.error("Error loading order details:", error);
    showError("Failed to load order details");
  }
}

async function confirmOrder(orderNumber) {
  try {
    const response = await fetch(`/api/orders/${orderNumber}/confirm`, {
      method: "PUT",
    });

    if (response.ok) {
      showSuccess("Order confirmed successfully!");
      // Refresh current view
      const currentSection = document
        .querySelector(".nav-link.active")
        .getAttribute("data-section");
      showSection(currentSection);

      // Close modal if open
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("orderModal")
      );
      if (modal) modal.hide();
    } else {
      throw new Error("Failed to confirm order");
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    showError("Failed to confirm order");
  }
}

function filterOrders(status) {
  const filteredOrders = status
    ? allOrders.filter((order) => order.status === status)
    : allOrders;
  displayOrders(filteredOrders);
}

function refreshData() {
  const currentSection = document
    .querySelector(".nav-link.active")
    .getAttribute("data-section");
  showSection(currentSection);
  showSuccess("Data refreshed successfully!");
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    pending: "bg-warning",
    confirmed: "bg-success",
    processing: "bg-info",
    delivered: "bg-primary",
    cancelled: "bg-danger",
  };
  return statusClasses[status] || "bg-secondary";
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showError(message) {
  // You can implement a toast notification system here
  alert("Error: " + message);
}

function showSuccess(message) {
  // You can implement a toast notification system here
  alert("Success: " + message);
}
