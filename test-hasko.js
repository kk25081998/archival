const axios = require('axios');

async function testHaskoArchive() {
  try {
    console.log('Testing Hasko Technology Consulting archive...');
    
    const response = await axios.post('http://localhost:3001/api/archive', {
      url: 'https://hasko.ca'
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('Archive response:', response.data);
    
    // Test getting archives
    const archivesResponse = await axios.get(`http://localhost:3001/api/archives/hasko.ca`);
    console.log('Archives:', archivesResponse.data);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testHaskoArchive(); 