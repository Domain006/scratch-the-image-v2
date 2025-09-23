const upload = document.getElementById("upload");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const scratchWrapper = document.getElementById("scratchWrapper");
const hiddenImage = document.getElementById("hiddenImage");
const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");

const linkDialog = document.getElementById("linkDialog");
const generatedLinkInput = document.getElementById("generatedLink");
const copyBtn = document.getElementById("copyLinkBtn");
const viewBtn = document.getElementById("viewLinkBtn");

const imgbbApiKey = "fd2bf32aa543cd678d7e51ad5121774c";

let isDrawing = false;
let shareLink = "";

// Load shared image if ?img=
const params = new URLSearchParams(window.location.search);
const sharedImg = params.get("img");
if (sharedImg) loadImage(sharedImg, { showScratch: true });

// Upload image to ImgBB
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  loading.style.display = "flex";
  loadingText.textContent = "Uploading image...";

  const formData = new FormData();
  formData.append("image", file);

  fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        loading.style.display = "none";
        alert("Upload failed!");
        return;
      }

      const url = data.data.display_url; 
      shareLink = `${window.location.origin}${window.location.pathname}?img=${encodeURIComponent(url)}`;

      loading.style.display = "none";
      generatedLinkInput.value = shareLink;
      linkDialog.style.display = "block";

      loadImage(url, { showScratch: true });
    })
    .catch(err => {
      loading.style.display = "none";
      console.error("Upload error:", err);
      alert("Upload failed!");
    });
});

// Load image into scratch canvas with auto scale & center
function loadImage(url, opts = { showScratch: false }) {
  loading.style.display = "flex";
  loadingText.textContent = "Loading image...";
  scratchWrapper.style.display = "none";
  hiddenImage.src = url;

  hiddenImage.onload = () => {
    loading.style.display = "none";

    // Calculate scale to fit viewport
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.8;
    const scale = Math.min(maxWidth / hiddenImage.width, maxHeight / hiddenImage.height);

    canvas.width = hiddenImage.width * scale;
    canvas.height = hiddenImage.height * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image onto canvas
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(hiddenImage, 0, 0, canvas.width, canvas.height);

    if (opts.showScratch) {
      // Overlay black cover
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Show scratch wrapper
      scratchWrapper.style.display = "flex";

      // Center canvas inside wrapper
      canvas.style.position = "relative";
      canvas.style.margin = "auto";
    }
  };

  hiddenImage.onerror = () => {
    loading.style.display = "none";
    alert("Failed to load image. The URL may be invalid or blocked by CORS.");
  };
}


  hiddenImage.onerror = () => {
    loading.style.display = "none";
    alert('Failed to load image. The URL may be invalid or blocked by CORS.');
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
      const decoded = decodeURIComponent(imgParam);
      shareLink = val;
      loadImage(decoded, { showScratch: true });
      linkDialog.style.display = 'block';
      return;
    }
    shareLink = val;
    loadImage(val, { showScratch: true });
    linkDialog.style.display = 'block';
  } catch (err) {
    shareLink = val;
    loadImage(val, { showScratch: true });
    linkDialog.style.display = 'block';
  }
});
