const axios = require('axios');

async function testSimpleSite() {
  try {
    console.log('Testing simple website with internal links...');
    
    // Let's test with a simple website that has internal links
    const response = await axios.post('http://localhost:3001/api/archive', {
      url: 'https://info.cern.ch/hypertext/WWW/TheProject.html'
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('Archive response:', response.data);
    
    // Test getting archives
    const archivesResponse = await axios.get(`http://localhost:3001/api/archives/info.cern.ch`);
    console.log('Archives:', archivesResponse.data);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSimpleSite(); 