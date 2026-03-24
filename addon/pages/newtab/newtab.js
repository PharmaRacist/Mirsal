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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "صباح الخير";
  if (hour >= 12 && hour < 14) return "نهارك سعيد";
  if (hour >= 14 && hour < 18) return "مساء الخير";
  if (hour >= 18 && hour < 21) return "مساء النور";
  return "تصبح على خير";
}

browser.storage.local.get(CONFIG_DEFAULTS).then((result) => {
  const name = result["newtab.username"];
  const element = document.getElementById("greetings");
  if (element) {
    element.innerText = getGreeting();
  }
});
