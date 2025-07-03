const axios = require('axios');

async function testHaskoConsulting() {
  try {
    console.log('Testing Hasko Technology Consulting archive...');
    
    const response = await axios.post('http://localhost:3001/api/archive', {
      url: 'https://www.haskotechnologyconsulting.com/'
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('Archive response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Archive created successfully!');
      console.log(`Host: ${response.data.host}`);
      console.log(`Timestamp: ${response.data.timestamp}`);
      console.log(`Assets: ${response.data.assetCount || 0}`);
      console.log(`Pages: ${response.data.pageCount || 0}`);
      
      // Test getting archives
      const archivesResponse = await axios.get(`http://localhost:3001/api/archives/${response.data.host}`);
      console.log('Archives for host:', archivesResponse.data);
      
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Archive failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testHaskoConsulting(); 