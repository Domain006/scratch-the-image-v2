const upload = document.getElementById("upload");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const scratchWrapper = document.getElementById("scratchWrapper");
const hiddenImage = document.getElementById("hiddenImage");
const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");

const linkDialog = document.getElementById("linkDialog");
const generatedLinkInput = document.getElementById("generatedLink");
const expirationInfo = document.getElementById("expirationInfo");
const copyBtn = document.getElementById("copyLinkBtn");
const viewBtn = document.getElementById("viewLinkBtn");

const imgbbApiKey = "fd2bf32aa543cd678d7e51ad5121774c"; // replace with your key

let isDrawing = false;
let shareLink = "";
let expirationTimer = null;

// Load shared image if ?img=
const params = new URLSearchParams(window.location.search);
const sharedImg = params.get("img");
if (sharedImg) loadImage(sharedImg, {showScratch: true});

// Upload image to ImgBB
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  loading.style.display = "flex";
  loadingText.textContent = "Uploading image...";

  const expiration = document.getElementById("expiration").value; // in seconds
  const formData = new FormData();
  formData.append("image", file);

  const url = `https://api.imgbb.com/1/upload?key=${imgbbApiKey}` + (expiration ? `&expiration=${expiration}` : "");

  fetch(url, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        loading.style.display = "none";
        alert("Upload failed!");
        return;
      }

      const imgUrl = data.data.url;
      shareLink = `${window.location.origin}${window.location.pathname}?img=${encodeURIComponent(imgUrl)}`;

      loading.style.display = "none";
      generatedLinkInput.value = shareLink;
      linkDialog.style.display = "block";

      // Show expiration info
      let expireText = "No expiration";
      let expireSeconds = parseInt(expiration) || 0;
      switch(expiration) {
        case "60": expireText = "Expires in 1 minute"; break;
        case "300": expireText = "Expires in 5 minutes"; break;
        case "1800": expireText = "Expires in 30 minutes"; break;
        case "3600": expireText = "Expires in 1 hour"; break;
        case "21600": expireText = "Expires in 6 hours"; break;
        case "43200": expireText = "Expires in 12 hours"; break;
        case "86400": expireText = "Expires in 24 hours"; break;
      }
      expirationInfo.textContent = expireText;

      // Load scratch image
      loadImage(imgUrl, {showScratch: true});

      // Clear previous timer
      if (expirationTimer) clearTimeout(expirationTimer);

      // Start front-end expiration timer if set
      if (expireSeconds > 0) {
        expirationTimer = setTimeout(() => {
          // Hide scratch area and show expired message
          scratchWrapper.style.display = "none";
          expirationInfo.textContent = "This image has expired.";
          alert("The image has expired and is no longer viewable.");
        }, expireSeconds * 1000);
      }
    })
    .catch(err => {
      loading.style.display = "none";
      console.error("Upload error:", err);
      alert("Upload failed!");
    });
});

// Load image into scratch canvas
function loadImage(url, opts = {showScratch: false}) {
  loading.style.display = "flex";
  loadingText.textContent = "Loading image...";
  scratchWrapper.style.display = "none";
  hiddenImage.src = url;

  hiddenImage.onload = () => {
    loading.style.display = "none";
    canvas.width = hiddenImage.width;
    canvas.height = hiddenImage.height;

    if (opts.showScratch) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      scratchWrapper.style.display = "inline-block";
    }
  };

  hiddenImage.onerror = () => {
    loading.style.display = "none";
    alert('Failed to load image. The URL may be invalid, blocked by CORS, or expired.');
  };
}

// Scratch effect
canvas.addEventListener("mousedown", () => (isDrawing = true));
canvas.addEventListener("mouseup", () => (isDrawing = false));
canvas.addEventListener("mousemove", scratch);
canvas.addEventListener("touchstart", () => (isDrawing = true));
canvas.addEventListener("touchend", () => (isDrawing = false));
canvas.addEventListener("touchmove", scratch);

function scratch(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  let x, y;

  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
}

// Copy/View buttons
copyBtn.addEventListener("click", () => {
  if (!shareLink) return;
  navigator.clipboard.writeText(shareLink)
    .then(() => alert("Share link copied!"))
    .catch(() => alert("Failed to copy link."));
});

viewBtn.addEventListener("click", () => {
  const val = generatedLinkInput.value || shareLink;
  if (!val) return;

  try {
    const u = new URL(val, window.location.origin);
    const imgParam = u.searchParams.get('img');
    if (imgParam) {
      shareLink = val;
      loadImage(decodeURIComponent(imgParam), {showScratch: true});
      linkDialog.style.display = 'block';
      return;
    }
    shareLink = val;
    loadImage(val, {showScratch: true});
    linkDialog.style.display = 'block';
  } catch (err) {
    shareLink = val;
    loadImage(val, {showScratch: true});
    linkDialog.style.display = 'block';
  }
});
