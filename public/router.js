/**
 * Simple Client-side Router for SPA
 */

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/", view: "home.html" },
        { path: "/equipment", view: "equipment.html" },
        { path: "/repair", view: "repair.html" },
        { path: "/available", view: "available.html" },
        { path: "/config", view: "config.html" },
    ];

    // Check if current path matches any route
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    if (!match) {
        match = {
            route: routes[0],
            isMatch: true
        };
    }

    // Load common UI changes
    updateNavbar(match.route.path);

    // Fetch and render the view
    try {
        const response = await fetch(match.route.view);
        const html = await response.text();
        
        // Parse the HTML to extract only <main> and <script>
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const mainContent = doc.querySelector("main");
        const modals = doc.querySelectorAll(".modal-overlay");
        const toastContainer = doc.querySelector(".toast-container");
        const scripts = doc.querySelectorAll("script");

        const appRoot = document.getElementById("app-root");
        
        // Cleanup old modals before transition
        document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
        document.querySelectorAll(".toast-container").forEach(t => t.remove());
        // Simple script cleanup to avoid memory leak or double execution issues (though imperfect)
        document.querySelectorAll("script[data-page-script]").forEach(s => s.remove());

        appRoot.innerHTML = "";
        
        if (mainContent) appRoot.appendChild(mainContent);
        modals.forEach(modal => document.body.appendChild(modal)); // Modals should be at body root
        if (toastContainer) document.body.appendChild(toastContainer);

        // Execute scripts
        scripts.forEach(script => {
            const newScript = document.createElement("script");
            newScript.setAttribute("data-page-script", "true");
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        });
        
    } catch (err) {
        console.error("Router error:", err);
        document.getElementById("app-root").innerHTML = "<h2>Trang này đang được bảo trì hoặc không tồn tại.</h2>";
    }
};

function updateNavbar(path) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === path) {
            link.classList.add("active");
        }
    });
}

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        } else if (e.target.parentElement && e.target.parentElement.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.parentElement.href);
        }
    });

    router();
});
