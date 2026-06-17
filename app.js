const routes = {
  '/': 'home',
  '/index.html': 'home',
  '/tournaments': 'tournaments',
  '/leaderboard': 'leaderboard',
  '/tournament.html': 'tournament',
};

function setPage() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const pageId = routes[path] || 'home';
  document.querySelectorAll('.page').forEach((el) => {
    el.classList.toggle('active', el.id === pageId);
  });
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-nav') === pageId);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setPage();
});