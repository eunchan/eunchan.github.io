document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("search-results");
  if (!searchInput || !resultsDiv) return;

  let index = null;
  function initIndex() {
    if (!index && window.elasticlunr && window.searchIndex) {
      index = elasticlunr.Index.load(window.searchIndex);
    }
  }

  searchInput.addEventListener("input", (e) => {
    initIndex();
    const query = e.target.value.trim();
    if (!query || !index) {
      resultsDiv.style.display = "none";
      resultsDiv.innerHTML = "";
      return;
    }

    const results = index.search(query, {
      fields: {
        title: { boost: 2 },
        body: { boost: 1 }
      },
      expand: true
    });

    if (results.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">검색 결과가 없습니다.</div>';
      resultsDiv.style.display = "block";
      return;
    }

    resultsDiv.innerHTML = results.slice(0, 8).map(res => {
      const doc = res.doc;
      return `<div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
        <a href="${doc.id}" style="font-weight: 600; display: block;">${doc.title || '제목 없음'}</a>
        <small style="color: var(--text-muted); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(doc.body || '').substring(0, 80)}...</small>
      </div>`;
    }).join("");
    resultsDiv.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = "none";
    }
  });
});
