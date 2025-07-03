const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAsyncArchive() {
  try {
    console.log('🚀 Starting async archive test...\n');
    
    // Test URL (use a simple, fast website for testing)
    const testUrl = 'https://httpbin.org/html';
    const maxPages = 5; // Keep it small for testing
    
    console.log(`📝 Starting archive job for: ${testUrl}`);
    console.log(`📊 Max pages: ${maxPages}\n`);
    
    // Start archive job
    const startResponse = await axios.post(`${BASE_URL}/api/archive`, {
      url: testUrl,
      maxPages: maxPages
    });
    
    console.log('✅ Archive job started successfully!');
    console.log(`🆔 Job ID: ${startResponse.data.jobId}`);
    console.log(`📊 Status: ${startResponse.data.status}\n`);
    
    const jobId = startResponse.data.jobId;
    
    // Poll for job status
    console.log('🔍 Polling for job status...\n');
    
    let completed = false;
    let pollCount = 0;
    
    while (!completed && pollCount < 60) { // Max 2 minutes of polling
      try {
        const statusResponse = await axios.get(`${BASE_URL}/api/jobs/${jobId}`);
        const job = statusResponse.data;
        
        pollCount++;
        console.log(`[Poll ${pollCount}] Status: ${job.status}`);
        
        if (job.status === 'running' && job.progress) {
          console.log(`  📄 Pages processed: ${job.progress.pagesProcessed}`);
          console.log(`  📎 Assets downloaded: ${job.progress.assetsDownloaded}`);
          if (job.progress.currentPage) {
            console.log(`  🌐 Current page: ${job.progress.currentPage}`);
          }
        }
        
        if (job.status === 'completed') {
          console.log('\n🎉 Archive job completed successfully!');
          console.log(`📊 Final stats:`);
          console.log(`  📄 Pages crawled: ${job.result.pageCount}`);
          console.log(`  📎 Assets downloaded: ${job.result.assetCount}`);
          console.log(`  🏠 Host: ${job.result.host}`);
          console.log(`  🕐 Timestamp: ${job.result.timestamp}`);
          console.log(`  💾 Archive location: /archive/${job.result.host}/${job.result.timestamp}`);
          completed = true;
        } else if (job.status === 'failed') {
          console.log(`\n❌ Archive job failed: ${job.error}`);
          completed = true;
        }
        
        console.log(''); // Empty line for readability
        
        // Wait 2 seconds before next poll
        if (!completed) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (pollError) {
        console.error(`❌ Error polling job status: ${pollError.message}`);
        break;
      }
    }
    
    if (pollCount >= 60) {
      console.log('⏱️ Polling timeout reached (2 minutes)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testJobsEndpoint() {
  try {
    console.log('\n🔍 Testing jobs endpoint...');
    const response = await axios.get(`${BASE_URL}/api/jobs`);
    console.log(`📋 Active jobs: ${response.data.length}`);
    response.data.forEach((job, index) => {
      console.log(`  [${index + 1}] ${job.id} - ${job.status} - ${job.url}`);
    });
  } catch (error) {
    console.error('❌ Failed to get jobs:', error.message);
  }
}

// Run the test
async function main() {
  console.log('🧪 Async Archive Test Script');
  console.log('============================\n');
  
  // First check if server is running
  try {
    await axios.get(`${BASE_URL}/api/archives/health`);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.error('   Run: cd backend && npm start');
    process.exit(1);
  }
  
  await testJobsEndpoint();
  await testAsyncArchive();
  await testJobsEndpoint();
  
  console.log('\n🏁 Test completed!');
}

main().catch(console.error); 