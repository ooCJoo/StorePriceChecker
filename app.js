// Improved app.js with better error handling and debugging

// Google Sheets API Configuration
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkKhU-Pp5L-nqiQej2xU611DDkvSP1fR1niTxe49bZarIw457jdRJ9spoaRjyBt2Pwmg/exec";

// Debug mode - set to true to see detailed logs
const DEBUG = true;

// Helper function for logging
function debug(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// Replace fetchProducts function with improved error handling
async function fetchProducts() {
  try {
    debug("Fetching products from:", SCRIPT_URL);
    
    const response = await fetch(SCRIPT_URL);
    debug("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    debug("API result:", result);
    
    if (result.status === "success" && result.data) {
      const [headers, ...rows] = result.data;
      
      // Transform rows into objects
      const products = rows.map(row => {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = row[index] || '';
        });
        return product;
      });
      
      debug("Processed products:", products);
      return products;
    } else {
      debug("API returned error or no data:", result);
      console.error("Error loading products: " + (result.message || "Unknown error"));
      return [];
    }
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
  // If not a Google Drive URL or empty, return as-is
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
    debug("Could not extract file ID from URL:", driveUrl);
    return driveUrl; // Could not extract ID, return original
  }
  
  // Return direct access URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Function to handle image input
function handleDriveImageInput() {
  const driveUrlInput = document.getElementById('driveImageUrl');
  const imagePreview = document.getElementById('imagePreview');
  
  if (!driveUrlInput || !driveUrlInput.value) {
    debug("No drive URL input or empty value");
    return;
  }
  
  const directUrl = convertDriveUrlToDirectImageUrl(driveUrlInput.value);
  debug("Converted URL:", directUrl);
  
  // Update preview with the image
  imagePreview.innerHTML = `
    <img src="${directUrl}" alt="Product Image" onerror="this.src='placeholder.jpg'">
    <input type="hidden" id="imageUrl" name="imageUrl" value="${directUrl}">
  `;
  
  // Store the raw URL in a hidden field for form submission
  driveUrlInput.setAttribute('data-processed-url', directUrl);
}

// Replace addProduct function with improved error handling
async function addProduct() {
  const form = document.getElementById('addProductForm');
  if (!form) {
    debug("Form not found");
    return;
  }
  
  try {
    // Collect form data
    const formData = new FormData(form);
    
    // Get the processed image URL from the hidden field or data attribute
    let imageUrl = '';
    const driveUrlInput = document.getElementById('driveImageUrl');
    
    if (driveUrlInput && driveUrlInput.value) {
      imageUrl = driveUrlInput.getAttribute('data-processed-url') || 
                convertDriveUrlToDirectImageUrl(driveUrlInput.value);
    }
    
    // Build product object
    const product = {
      name: formData.get('name'),
      price: formData.get('price'),
      quantity: formData.get('quantity'),
      code: formData.get('code'),
      category: formData.get('category'),
      popularName: formData.get('popularName') || "",
      image: imageUrl || 'placeholder.jpg'
    };
    
    debug("Sending product data:", product);
    
    // CORS workaround for Google Apps Script
    const scriptURL = SCRIPT_URL;
    
    // Send data to Google Apps Script with additional CORS handling
    const response = await fetch(scriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      body: JSON.stringify(product)
    });
    
    debug("Response status:", response.status);
    debug("Response headers:", [...response.headers.entries()]);
    
    // Parse the response
    const result = await response.json();
    debug("API result:", result);
    
    if (result.status === "success") {
      // Success! Display success message and reset form
      if (typeof showSuccess === 'function') {
        showSuccess(`Product "${product.name}" added successfully!`);
      } else {
        alert(`Product "${product.name}" added successfully!`);
      }
      
      form.reset();
      
      // Reset image preview
      const imagePreview = document.getElementById('imagePreview');
      if (imagePreview) {
        imagePreview.innerHTML = `
          <i class="fas fa-camera"></i>
          <p>IMAGE PREVIEW</p>
        `;
      }
    } else {
      // API returned an error
      if (typeof showError === 'function') {
        showError("Error adding product: " + (result.message || "Unknown error"));
      } else {
        alert("Error adding product: " + (result.message || "Unknown error"));
      }
    }
  } catch (error) {
    console.error("Error adding product:", error);
    
    if (typeof showError === 'function') {
      showError("Error connecting to database. Please check your connection and try again.");
    } else {
      alert("Error connecting to database. Please check your connection and try again.");
    }
  }
}

// Function to display products with images
function displayProducts(products) {
  const productsContainer = document.getElementById('productsContainer');
  if (!productsContainer) {
    debug("Products container not found");
    return;
  }
  
  if (!products || products.length === 0) {
    productsContainer.innerHTML = '<div class="no-products">No products found</div>';
    return;
  }
  
  productsContainer.innerHTML = '';
  
  products.forEach(product => {
    debug("Processing product for display:", product);
    
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