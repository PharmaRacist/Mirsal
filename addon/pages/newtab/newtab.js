document.getElementById("search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const val = e.target.value.trim();
  if (!val) return;
  const isUrl = /^(https?:\/\/|[\w-]+\.[\w]{2,})/.test(val);
  window.location.href = isUrl
    ? val.startsWith("http")
      ? val
      : "https://" + val
    : `https://search.brave.com/search?q=${encodeURIComponent(val)}`;
});
