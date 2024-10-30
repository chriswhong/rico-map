const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csvParser = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Replace with your Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoiY2hyaXN3aG9uZ21hcGJveCIsImEiOiJjbDl6bzJ6N3EwMGczM3BudjZmbm5yOXFnIn0.lPhc5Z5H3byF_gf_Jz48Ug';

// CSV file paths
const inputFilePath = path.join(__dirname, 'raw.csv');
const outputFilePath = path.join(__dirname, 'output.csv');

// Function to geocode an address using the Mapbox Geocoding API
const geocodeAddress = async (address) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxAccessToken}&limit=1`;
  try {
    const response = await axios.get(url);
    if (response.data.features && response.data.features.length > 0) {
      const [longitude, latitude] = response.data.features[0].center;
      return { latitude, longitude };
    }
  } catch (error) {
    console.error(`Error geocoding address "${address}":`, error.message);
  }
  return { latitude: null, longitude: null };
};

// Read CSV, geocode addresses, and write output
const processCSV = async () => {
  const results = [];

  // Parse input CSV
  fs.createReadStream(inputFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
      results.push(row); // Collect each row
    })
    .on('end', async () => {
      console.log('CSV file successfully processed');

      // For each row, geocode the address
      for (const row of results) {
        const address = row['Staging Location Address']; // Replace 'Address' with your column name
        const geocodeResult = await geocodeAddress(address);
        row['Latitude'] = geocodeResult.latitude;
        row['Longitude'] = geocodeResult.longitude;
      }

      // Write the updated CSV with latitude and longitude columns
      const csvWriter = createObjectCsvWriter({
        path: outputFilePath,
        header: [
          ...Object.keys(results[0]).map((key) => ({ id: key, title: key })),
          { id: 'Latitude', title: 'Latitude' },
          { id: 'Longitude', title: 'Longitude' },
        ],
      });

      await csvWriter.writeRecords(results);
      console.log(`Output CSV written to ${outputFilePath}`);
    });
};

// Run the CSV processing
processCSV();
