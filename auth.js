
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  if (sessionStorage.getItem("koleksikuLogin") === "true") {
    window.location.href = "index.html";
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    if (username === "admin" && password === "koleksiku123") {
      sessionStorage.setItem("koleksikuLogin", "true");
      window.location.href = "index.html";
    } else {
      message.textContent = "Username atau password salah!";
    }
  });
}

function logout() {
  sessionStorage.removeItem("koleksikuLogin");
  window.location.href = "login.html";
}
