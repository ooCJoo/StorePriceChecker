// Google Sheets API Configuration
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzTInACChkoJTqHNykEe-9aWOWTW1rIY7KwV2qE7CCEpzKunlyfBIzvZJNjYI4MqrJNA/exec";

// Replace fetchProducts function
async function fetchProducts() {
  try {
    const response = await fetch(SCRIPT_URL);
    const result = await response.json();
    
    if (result.status === "success" && result.data) {
      const [headers, ...rows] = result.data;
      
      // Transform rows into objects
      return rows.map(row => {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = row[index] || '';
        });
        return product;
      });
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Convert a Google Drive sharing URL to a direct image URL
 * Works with links in the format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 */
function convertDriveUrlToDirectImageUrl(driveUrl) {
  // If not a Google Drive URL, return as-is
  if (!driveUrl || !driveUrl.includes('drive.google.com')) {
    return driveUrl;
  }
  
  // Extract file ID from the Drive URL
  let fileId = '';
  
  if (driveUrl.includes('/file/d/')) {
    // Standard file link format
    fileId = driveUrl.split('/file/d/')[1].split('/')[0];
  } else if (driveUrl.includes('id=')) {
    // Alternate format with query parameter
    fileId = driveUrl.split('id=')[1].split('&')[0];
  }
  
  if (!fileId) {
    return driveUrl; // Could not extract ID, return original
  }
  
  // Return direct access URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Function to handle image input
function handleDriveImageInput() {
  const driveUrlInput = document.getElementById('driveImageUrl');
  const imagePreview = document.getElementById('imagePreview');
  
  if (!driveUrlInput || !driveUrlInput.value) return;
  
  const directUrl = convertDriveUrlToDirectImageUrl(driveUrlInput.value);
  
  // Update preview with the image
  imagePreview.innerHTML = `
    <img src="${directUrl}" alt="Product Image" onerror="this.src='placeholder.jpg'">
    <input type="hidden" id="imageUrl" name="imageUrl" value="${directUrl}">
  `;
  
  // Store the raw URL in a hidden field for form submission
  document.getElementById('driveImageUrl').setAttribute('data-processed-url', directUrl);
}

// Replace addProduct function
async function addProduct() {
  const form = document.getElementById('addProductForm');
  if (!form) return;
  
  // Collect form data
  const formData = new FormData(form);
  
  // Get the processed image URL from the hidden field or data attribute
  let imageUrl = '';
  const driveUrlInput = document.getElementById('driveImageUrl');
  
  if (driveUrlInput && driveUrlInput.value) {
    imageUrl = driveUrlInput.getAttribute('data-processed-url') || 
              convertDriveUrlToDirectImageUrl(driveUrlInput.value);
  }
  
  const product = {
    name: formData.get('name'),
    price: formData.get('price'),
    quantity: formData.get('quantity'),
    code: formData.get('code'),
    category: formData.get('category'),
    popularName: formData.get('popularName') || "",
    image: imageUrl || 'placeholder.jpg'
  };
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(product)
    });
    
    const result = await response.json();
    
    if (result.status === "success") {
      alert(`Product "${product.name}" added successfully!`);
      form.reset();
      
      // Reset image preview
      const imagePreview = document.getElementById('imagePreview');
      if (imagePreview) {
        imagePreview.innerHTML = `
          <i class="fas fa-camera"></i>
          <p>UPLOAD IMAGE</p>
        `;
      }
    } else {
      alert("Error adding product. Please try again.");
    }
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Error adding product. Please try again.");
  }
}

// Function to display products with images
function displayProducts(products) {
  const productsContainer = document.getElementById('productsContainer');
  if (!productsContainer) return;
  
  productsContainer.innerHTML = '';
  
  products.forEach(product => {
    // Make sure image URLs are in direct format
    const imageUrl = product.image ? 
                    convertDriveUrlToDirectImageUrl(product.image) : 
                    'placeholder.jpg';
                    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.name}" onerror="this.src='placeholder.jpg'">
      </div>
      <div class="product-details">
        <h3>${product.name}</h3>
        <p class="product-price">$${product.price}</p>
        <p class="product-qty">QTY: ${product.quantity}</p>
        <p class="product-code">Code: ${product.code}</p>
        <p class="product-category">Category: ${product.category}</p>
      </div>
    `;
    
    productsContainer.appendChild(productCard);
  });
}