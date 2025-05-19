// Debug version of app.js with networking fixes
// Last updated: May 19, 2025

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

// Test the API connection on page load and report status
async function testApiConnection() {
  try {
    debug("Testing API connection to:", SCRIPT_URL);
    const startTime = new Date().getTime();
    
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
    });
    
    const endTime = new Date().getTime();
    debug(`API response time: ${endTime - startTime}ms`);
    
    if (!response.ok) {
      debug(`API connection test failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    debug("API connection test successful:", data);
    return true;
  } catch (error) {
    debug("API connection test failed with error:", error);
    return false;
  }
}

// Call the test when page loads
document.addEventListener('DOMContentLoaded', () => {
  testApiConnection().then(isConnected => {
    debug(`API connection test result: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  });
});

// Replace fetchProducts function with improved debugging
async function fetchProducts() {
  try {
    debug("Fetching products from:", SCRIPT_URL);
    const startTime = new Date().getTime();
    
    // Using no-cors mode to handle CORS issues
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
    });
    
    const endTime = new Date().getTime();
    debug(`Fetch response time: ${endTime - startTime}ms`);
    debug("Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Try to parse the response as JSON
    let result;
    try {
      result = await response.json();
      debug("API result:", result);
    } catch (jsonError) {
      debug("Failed to parse JSON response:", jsonError);
      const textResponse = await response.text();
      debug("Raw response text:", textResponse);
      throw new Error("Invalid JSON response from server");
    }
    
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

// Completely rewritten addProduct function with extensive debugging
async function addProduct() {
  const form = document.getElementById('addProductForm');
  if (!form) {
    debug("Form not found");
    return;
  }
  
  debug("Starting addProduct function...");
  
  // Show loading/processing state if UI functions exist
  if (typeof showLoading === 'function') {
    showLoading();
  }
  
  try {
    // Collect form data
    const formData = new FormData(form);
    debug("Form data collected");
    
    // Get the processed image URL
    let imageUrl = '';
    const driveUrlInput = document.getElementById('driveImageUrl');
    
    if (driveUrlInput && driveUrlInput.value) {
      imageUrl = driveUrlInput.getAttribute('data-processed-url') || 
                convertDriveUrlToDirectImageUrl(driveUrlInput.value);
      debug("Image URL processed:", imageUrl);
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
    
    debug("Product object built:", product);
    debug("Preparing to send to:", SCRIPT_URL);
    
    // Convert object to JSON string for logging
    const jsonData = JSON.stringify(product);
    debug("Request payload:", jsonData);
    
    // Use XMLHttpRequest instead of fetch for better cross-browser compatibility
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', SCRIPT_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        debug("XHR response received:", xhr.status);
        debug("Response text:", xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            debug("Parsed response:", result);
            
            if (result.status === "success") {
              debug("Product added successfully!");
              
              // Show success message
              if (typeof showSuccess === 'function') {
                showSuccess(`Product "${product.name}" added successfully!`);
              } else {
                alert(`Product "${product.name}" added successfully!`);
              }
              
              // Reset form
              form.reset();
              
              // Reset image preview
              const imagePreview = document.getElementById('imagePreview');
              if (imagePreview) {
                imagePreview.innerHTML = `
                  <i class="fas fa-camera"></i>
                  <p>IMAGE PREVIEW</p>
                `;
              }
              
              resolve(result);
            } else {
              debug("API returned error:", result.message);
              
              if (typeof showError === 'function') {
                showError("Error: " + (result.message || "Unknown error"));
              } else {
                alert("Error: " + (result.message || "Unknown error"));
              }
              
              reject(new Error(result.message || "Unknown error"));
            }
          } catch (parseError) {
            debug("Failed to parse response as JSON:", parseError);
            
            if (typeof showError === 'function') {
              showError("Invalid response from server. Please try again.");
            } else {
              alert("Invalid response from server. Please try again.");
            }
            
            reject(parseError);
          }
        } else {
          debug("HTTP error:", xhr.status);
          
          if (typeof showError === 'function') {
            showError(`Server error (${xhr.status}). Please try again later.`);
          } else {
            alert(`Server error (${xhr.status}). Please try again later.`);
          }
          
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        debug("Network error occurred");
        
        if (typeof showError === 'function') {
          showError("Network error. Please check your connection.");
        } else {
          alert("Network error. Please check your connection.");
        }
        
        reject(new Error("Network error"));
      };
      
      xhr.timeout = 30000; // 30 seconds timeout
      xhr.ontimeout = function() {
        debug("Request timed out");
        
        if (typeof showError === 'function') {
          showError("Request timed out. Server might be busy.");
        } else {
          alert("Request timed out. Server might be busy.");
        }
        
        reject(new Error("Request timed out"));
      };
      
      debug("Sending XHR request...");
      xhr.send(jsonData);
    });
    
  } catch (error) {
    debug("Error in addProduct function:", error);
    console.error("Error adding product:", error);
    
    if (typeof showError === 'function') {
      showError("Error: " + error.message);
    } else {
      alert("Error: " + error.message);
    }
    
    throw error;
  } finally {
    // Hide loading state if UI function exists
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// Helper functions for loading state management
function showLoading() {
  const saveBtn = document.querySelector('.save-btn');
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
  }
}

function hideLoading() {
  const saveBtn = document.querySelector('.save-btn');
  if (saveBtn) {
    saveBtn.innerHTML = 'SAVE PRODUCT';
    saveBtn.disabled = false;
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