// Google Sheets API Configuration
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5dtqJE1maE4uY_waIWKbgiiYcPUudDO4iUJnoRSnZqRy0Bw7IuJ9gF2E3sgpwoGkCNA/exec";


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

// Replace addProduct function
async function addProduct() {
  const form = document.getElementById('addProductForm');
  if (!form) return;
  
  // Collect form data
  const formData = new FormData(form);
  const product = {
    name: formData.get('name'),
    price: formData.get('price'),
    quantity: formData.get('quantity'),
    code: formData.get('code'),
    category: formData.get('category'),
    popularName: ""
  };
  
  // Handle image upload (would need a separate image hosting solution)
  const imageFile = formData.get('image');
  if (imageFile && imageFile.name) {
    product.image = 'placeholder.jpg';
  }
  
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