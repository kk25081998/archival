const axios = require('axios');

async function testArchive() {
  try {
    console.log('Testing web archiving functionality...');
    
    // Test with a simpler website first to isolate issues
    const testUrl = 'https://example.com';
    
    console.log(`Archiving: ${testUrl}`);
    
    const response = await axios.post('http://localhost:3001/api/archive', {
      url: testUrl
    });
    
    console.log('Archive response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Archive created successfully!');
      console.log(`Host: ${response.data.host}`);
      console.log(`Timestamp: ${response.data.timestamp}`);
      console.log(`Assets: ${response.data.assetCount}`);
      console.log(`Pages: ${response.data.pageCount}`);
      
      // Test retrieving archives
      const archivesResponse = await axios.get(`http://localhost:3001/api/archives/${response.data.host}`);
      console.log('Archives for host:', archivesResponse.data);
      
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Archive failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testArchive(); 