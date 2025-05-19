## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Customization

### Changing the Logo

1. Replace "CJ" with your own store initials in the HTML files
2. Customize the colors in the CSS file to match your brand

### Adding More Categories

Edit the categories in the add.html file:

```html
<select id="category" name="category" required>
    <option value="">CHOOSE</option>
    <option value="Drinks">Drinks</option>
    <option value="Food">Food</option>
    <!-- Add more categories here -->
</select>
```

### Background Image

1. Add your own background image to the project folder
2. Update the CSS reference in style.css:

```css
.main {
    /* ... */
    background: url('your-background-image.jpg') center center/cover;
    /* ... */
}
```

## Using Google Apps Script for Better Security

Instead of directly using the Google Sheets API in your frontend code (which exposes your API key), you can create a Google Apps Script to act as a secure backend:

1. Open your Google Sheet
2. Click on Extensions > Apps Script
3. Replace the code with:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  const data = sheet.getDataRange().getValues();
  
  // CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Return the data
  output.setContent(JSON.stringify({
    status: "success",
    data: data
  }));
  
  return output;
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  
  // Add the new product
  sheet.appendRow([
    new Date().getTime(), // Generate ID as timestamp
    params.name,
    params.price,
    params.category,
    params.code,
    params.quantity,
    params.image || "",
    params.popularName || ""
  ]);
  
  // CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Return success
  output.setContent(JSON.stringify({
    status: "success",
    message: "Product added successfully"
  }));
  
  return output;
}
```

4. Deploy as web app:
   - Click "Deploy" > "New deployment"
   - Select "Web app"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the web app URL

5. Update your app.js to use this URL instead of the direct Google Sheets API:

```javascript
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL";

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
```

## Troubleshooting

### CORS Issues
If you encounter CORS issues when fetching data from Google Sheets API or Google Apps Script:

1. Make sure your Google Apps Script has the proper CORS headers
2. Consider using a CORS proxy for development purposes
3. Ensure your API key restrictions are set correctly

### Images Not Showing
Since GitHub Pages doesn't allow file uploads, you'll need to:

1. Use an external image hosting service
2. Update the code to use image URLs instead of file uploads
3. Consider using services like Imgur, Cloudinary, or Firebase Storage

### Changes Not Showing on GitHub Pages
If your changes aren't showing up on GitHub Pages:

1. Make sure you've pushed your changes to the GitHub repository
2. Check if you're using the correct branch for GitHub Pages
3. It may take a few minutes for changes to propagate

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)

## About Sari-Sari Store Inventory Systems

A Sari-Sari store is a small neighborhood convenience store commonly found in the Philippines. This inventory system is designed to help manage products, monitor stock levels, and track prices for such small businesses.

Key benefits:
- Low-cost solution using free services (GitHub Pages, Google Sheets)
- Easy to set up and maintain
- Mobile-friendly for use on smartphones
- Simple interface for non-technical users
