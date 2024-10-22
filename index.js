const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

let latestImageName = ''; // This will hold the latest image name for fire danger

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static files (like images)
app.use(express.static('public'));

// Function to fetch and update the fire danger rating
const fetchFireDangerRating = async () => {
  try {
    // Fetch the RSS feed
    const response = await axios.get('https://api.emergency.wa.gov.au/v1/rss/fire-danger-ratings');
    const rssData = response.data;

    // Parse the RSS feed
    const parser = new xml2js.Parser();
    parser.parseString(rssData, (err, result) => {
      if (err) {
        console.error('Error parsing RSS feed:', err);
        return;
      }

      // Extract the first description part
      const description = result.rss.channel[0].item[0].description[0];

      // Simplify description text for easier parsing
      const lowerDescription = description.toLowerCase();

      // Find the index positions of different ratings and Midwest Inland
      const indexMidwest = lowerDescription.indexOf('midwest inland');
      const indexExtreme = lowerDescription.lastIndexOf('extreme fire danger ratings', indexMidwest);
      const indexHigh = lowerDescription.lastIndexOf('high fire danger ratings', indexMidwest);
      const indexModerate = lowerDescription.lastIndexOf('moderate fire danger ratings', indexMidwest);
      const indexNoRating = lowerDescription.lastIndexOf('no fire danger ratings', indexMidwest);

      // Determine the last rating before Midwest Inland
      if (indexExtreme > -1 && indexExtreme < indexMidwest) {
        latestImageName = 'extreme.png';
      }
      if (indexHigh > -1 && indexHigh < indexMidwest && indexHigh > indexExtreme) {
        latestImageName = 'high.png';
      }
      if (indexModerate > -1 && indexModerate < indexMidwest && indexModerate > indexHigh) {
        latestImageName = 'moderate.png';
      }
      if (indexNoRating > -1 && indexNoRating < indexMidwest && indexNoRating > indexModerate) {
        latestImageName = 'no-rating.png';
      }

      console.log('Updated fire danger rating:', latestImageName);
    });
  } catch (error) {
    console.error('Error fetching the RSS feed:', error);
  }
};

// Fetch the fire danger rating every 10 seconds
setInterval(fetchFireDangerRating, 10000);

// Route to render the page with the latest fire danger rating
app.get('/', (req, res) => {
  res.render('index', { imageName: latestImageName });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  fetchFireDangerRating(); // Fetch the rating immediately when the server starts
});
