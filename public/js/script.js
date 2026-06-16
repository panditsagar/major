// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()

const searchForm = document.querySelector(".global-search-form");
const searchInput = document.querySelector(".global-search-input");
const listingsGrid = document.querySelector("#listings-grid");

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN");
}

function createListingCard(listing) {
  const link = document.createElement("a");
  link.href = `/listings/${listing._id}`;
  link.className = "listing-link";

  const card = document.createElement("div");
  card.className = "card col listing-card";

  const image = document.createElement("img");
  image.src = listing.image;
  image.alt = "listing-image";
  image.className = "card-img-top";
  image.style.height = "20rem";

  const overlay = document.createElement("div");
  overlay.className = "card-img-overlay";

  const body = document.createElement("div");
  body.className = "card-body";

  const text = document.createElement("p");
  text.className = "card-text";

  const title = document.createElement("b");
  title.textContent = listing.title;

  const tax = document.createElement("i");
  tax.className = "tex-info";
  tax.textContent = "    +18% GST";

  text.append(title, document.createElement("br"), `₹ ${formatPrice(listing.price)} / night`, tax);
  body.append(text);
  card.append(image, overlay, body);
  link.append(card);

  return link;
}

function renderListings(listings) {
  if (!listingsGrid) return;
  listingsGrid.innerHTML = "";

  if (!listings.length) {
    const message = document.createElement("div");
    message.className = "alert alert-info mt-4";
    message.role = "alert";
    message.textContent = "No listings found.";
    listingsGrid.append(message);
    return;
  }

  listings.forEach((listing) => listingsGrid.append(createListingCard(listing)));
}

let searchTimer;
if (searchInput && listingsGrid) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const query = searchInput.value.trim();
      const response = await fetch(`/listings/search?q=${encodeURIComponent(query)}&format=json`);
      const data = await response.json();
      renderListings(data.listings);
    }, 250);
  });
}

if (searchForm && listingsGrid) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}
