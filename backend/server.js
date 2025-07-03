const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');
const URLParse = require('url-parse');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Archive endpoint
app.post('/api/archive', async (req, res) => {
  try {
    console.log('Archive request received:', req.body);
    const { url } = req.body;
    
    if (!url) {
      console.log('No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Processing URL:', url);

    // Validate and parse URL
    const parsedUrl = new URLParse(url);
    if (!parsedUrl.protocol || !parsedUrl.hostname) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const hostname = parsedUrl.hostname;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(DATA_DIR, hostname, timestamp);
    const assetsDir = path.join(archiveDir, 'assets');

    // Create directories
    await fs.ensureDir(archiveDir);
    await fs.ensureDir(assetsDir);

    // Recursive crawl setup
    const visited = new Set();
    let assetCount = 0;
    let pageCount = 0;
    const maxPages = 20;
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

    async function crawlPage(pageUrl, relPath = 'index.html') {
      if (visited.size >= maxPages) return;
      const normalizedUrl = pageUrl.split('#')[0].replace(/\/$/, '');
      if (visited.has(normalizedUrl)) return;
      visited.add(normalizedUrl);
      pageCount++;
      try {
        const response = await axios.get(pageUrl, {
          timeout: 60000, // Increased timeout for larger pages
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Download and rewrite assets sequentially to avoid ENOBUFS
        const downloadedAssets = new Set();
        
        // Process images sequentially
        for (let i = 0; i < $('img').length; i++) {
          const elem = $('img').eq(i);
          const src = elem.attr('src');
          if (src && !downloadedAssets.has(src)) {
            downloadedAssets.add(src);
            assetCount++;
            await downloadAsset(src, assetsDir, baseUrl, elem, 'src');
            // Small delay to prevent overwhelming system
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Process stylesheets sequentially
        for (let i = 0; i < $('link[rel="stylesheet"]').length; i++) {
          const elem = $('link[rel="stylesheet"]').eq(i);
          const href = elem.attr('href');
          if (href && !downloadedAssets.has(href)) {
            downloadedAssets.add(href);
            assetCount++;
            await downloadAsset(href, assetsDir, baseUrl, elem, 'href');
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Process scripts sequentially
        for (let i = 0; i < $('script[src]').length; i++) {
          const elem = $('script[src]').eq(i);
          const src = elem.attr('src');
          if (src && !downloadedAssets.has(src)) {
            downloadedAssets.add(src);
            assetCount++;
            await downloadAsset(src, assetsDir, baseUrl, elem, 'src');
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Save HTML
        const savePath = path.join(archiveDir, relPath);
        await fs.ensureDir(path.dirname(savePath));
        await fs.writeFile(savePath, $.html());
        
        // Find and crawl same-domain links
        const links = new Set();
        $('a[href]').each((i, elem) => {
          let href = $(elem).attr('href');
          if (!href) return;
          // Ignore mailto, tel, javascript, etc.
          if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
          // Normalize
          if (href.startsWith('//')) {
            href = `${parsedUrl.protocol}${href}`;
          } else if (href.startsWith('/')) {
            href = `${baseUrl}${href}`;
          } else if (!href.startsWith('http')) {
            href = `${baseUrl}/${href}`;
          }
          const linkUrl = new URLParse(href);
          if (linkUrl.hostname === hostname) {
            // Compute relative path for saving
            let linkRelPath = linkUrl.pathname.replace(/^\//, '');
            if (!linkRelPath || linkRelPath.endsWith('/')) linkRelPath += 'index.html';
            else if (!linkRelPath.endsWith('.html')) linkRelPath += '.html';
            links.add([linkUrl.toString(), linkRelPath]);
          }
        });
        
        // Crawl links with delay to prevent overwhelming
        for (const [nextUrl, nextRelPath] of links) {
          if (visited.size >= maxPages) break;
          await crawlPage(nextUrl, nextRelPath);
          // Delay between page crawls
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        // Improved error logging
        console.error(`Failed to crawl ${pageUrl}:`, err);
      }
    }

    await crawlPage(url, 'index.html');

    // Update metadata
    const metadataPath = path.join(DATA_DIR, hostname, 'metadata.json');
    let metadata = [];
    if (await fs.pathExists(metadataPath)) {
      metadata = await fs.readJson(metadataPath);
    }
    metadata.push({
      timestamp,
      url: url,
      assetCount,
      pageCount,
      createdAt: new Date().toISOString()
    });
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });

    res.json({
      success: true,
      host: hostname,
      timestamp,
      assetCount,
      pageCount
    });

  } catch (error) {
    // Improved error logging
    console.error('Archive error:', error);
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Failed to archive URL' });
  }
});

// Get archives for a host
app.get('/api/archives/:host', async (req, res) => {
  try {
    const { host } = req.params;
    console.log(`Getting archives for host: ${host}`);
    console.log(`DATA_DIR: ${DATA_DIR}`);
    
    const metadataPath = path.join(DATA_DIR, host, 'metadata.json');
    console.log(`Metadata path: ${metadataPath}`);
    
    // Check if host directory exists first
    const hostDir = path.join(DATA_DIR, host);
    console.log(`Host directory: ${hostDir}`);
    console.log(`Host directory exists: ${await fs.pathExists(hostDir)}`);
    
    if (await fs.pathExists(metadataPath)) {
      console.log('Metadata file exists, reading...');
      const metadata = await fs.readJson(metadataPath);
      console.log(`Found ${metadata.length} archives`);
      res.json(metadata);
    } else {
      console.log('Metadata file does not exist, returning empty array');
      res.json([]);
    }
  } catch (error) {
    console.error('Get archives error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor.name);
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Failed to get archives', details: error.message });
  }
});

// Serve archived snapshots
app.use('/archive/:host/:timestamp', (req, res, next) => {
  const { host, timestamp } = req.params;
  const archiveDir = path.join(DATA_DIR, host, timestamp);
  
  if (fs.existsSync(archiveDir)) {
    express.static(archiveDir)(req, res, next);
  } else {
    res.status(404).json({ error: 'Archive not found' });
  }
});

// Helper function to download assets
async function downloadAsset(assetUrl, assetsDir, baseUrl, element, attr) {
  try {
    let fullUrl = assetUrl;
    
    // Handle relative URLs
    if (!assetUrl.startsWith('http')) {
      if (assetUrl.startsWith('//')) {
        fullUrl = `https:${assetUrl}`;
      } else if (assetUrl.startsWith('/')) {
        fullUrl = `${baseUrl}${assetUrl}`;
      } else {
        fullUrl = `${baseUrl}/${assetUrl}`;
      }
    }

    const response = await axios.get(fullUrl, {
      timeout: 10000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Generate filename
    const urlParts = new URLParse(fullUrl);
    const filename = path.basename(urlParts.pathname) || 'asset';
    const ext = path.extname(filename) || getExtensionFromContentType(response.headers['content-type']);
    const finalFilename = `${filename}${ext}`;
    
    // Save file
    const filePath = path.join(assetsDir, finalFilename);
    await fs.writeFile(filePath, response.data);
    
    // Update HTML to point to local asset
    element.attr(attr, `./assets/${finalFilename}`);
    
  } catch (error) {
    console.error(`Failed to download asset ${assetUrl}:`, error.message);
  }
}

// Helper function to get file extension from content type
function getExtensionFromContentType(contentType) {
  if (!contentType) return '';
  
  const type = contentType.split(';')[0];
  const extensions = {
    'text/css': '.css',
    'application/javascript': '.js',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp'
  };
  
  return extensions[type] || '';
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
}); 