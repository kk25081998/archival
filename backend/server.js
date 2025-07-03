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
      
      // Progress logging
      console.log(`[${pageCount}/${maxPages}] Crawling: ${pageUrl}`);
      console.log(`Assets downloaded so far: ${assetCount}`);
      
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
            // Skip heavy assets that commonly timeout
            const skipPatterns = [
              /\.mp4$/i, /\.webm$/i, /\.pdf$/i, /\.zip$/i,  // Large files
              /fonts\.googleapis\.com/i,                    // Often slow
              /analytics/i, /tracking/i, /gtag/i,           // Analytics scripts
              /\.svg\?/i,                                   // SVG with query params (often dynamic)
              /data:image/i                                 // Data URLs (already embedded)
            ];
            
            const shouldSkip = skipPatterns.some(pattern => pattern.test(src));
            if (shouldSkip) {
              console.log(`Skipping potentially problematic asset: ${src}`);
              continue;
            }
            
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
            // Skip heavy assets that commonly timeout
            const skipPatterns = [
              /fonts\.googleapis\.com/i,                    // Often slow
              /analytics/i, /tracking/i, /gtag/i,           // Analytics scripts
              /\.css\?v=\d+/i,                             // Versioned CSS (often dynamic)
              /cdn\.jsdelivr\.net.*bootstrap/i             // Large CSS frameworks
            ];
            
            const shouldSkip = skipPatterns.some(pattern => pattern.test(href));
            if (shouldSkip) {
              console.log(`Skipping potentially problematic stylesheet: ${href}`);
              continue;
            }
            
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
            // Skip heavy assets that commonly timeout
            const skipPatterns = [
              /analytics/i, /tracking/i, /gtag/i, /gtm/i,   // Analytics scripts
              /facebook\.net/i, /twitter\.com/i,            // Social media scripts
              /googleapis\.com.*analytics/i,                // Google Analytics
              /\.js\?v=\d+/i,                              // Versioned JS (often dynamic)
              /recaptcha/i, /captcha/i,                    // Captcha scripts
              /ads/i, /doubleclick/i                       // Ad scripts
            ];
            
            const shouldSkip = skipPatterns.some(pattern => pattern.test(src));
            if (shouldSkip) {
              console.log(`Skipping potentially problematic script: ${src}`);
              continue;
            }
            
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
        console.log(`✅ Saved page: ${relPath} (${$.html().length} bytes)`);
        
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

// Health check endpoint for Docker
app.get('/api/archives/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all archived websites (hosts) with their latest archive info
app.get('/api/archives', async (req, res) => {
  try {
    console.log('Getting all archived websites...');
    console.log(`DATA_DIR: ${DATA_DIR}`);
    
    // Check if data directory exists
    if (!await fs.pathExists(DATA_DIR)) {
      console.log('Data directory does not exist, returning empty array');
      return res.json([]);
    }
    
    const hosts = [];
    const items = await fs.readdir(DATA_DIR);
    
    for (const item of items) {
      const hostPath = path.join(DATA_DIR, item);
      const stats = await fs.stat(hostPath);
      
      if (stats.isDirectory()) {
        const metadataPath = path.join(hostPath, 'metadata.json');
        
        if (await fs.pathExists(metadataPath)) {
          try {
            const metadata = await fs.readJson(metadataPath);
            if (metadata && metadata.length > 0) {
              // Get the latest archive for this host
              const latestArchive = metadata.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
              
              hosts.push({
                host: item,
                latestArchive: latestArchive,
                totalArchives: metadata.length,
                firstArchived: metadata.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0].createdAt,
                lastArchived: latestArchive.createdAt
              });
            }
          } catch (error) {
            console.error(`Error reading metadata for host ${item}:`, error);
          }
        }
      }
    }
    
    // Sort by last archived date (most recent first)
    hosts.sort((a, b) => new Date(b.lastArchived) - new Date(a.lastArchived));
    
    console.log(`Found ${hosts.length} archived websites`);
    res.json(hosts);
    
  } catch (error) {
    console.error('Get all archives error:', error);
    res.status(500).json({ error: 'Failed to get archived websites', details: error.message });
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

// Get sitemap for an archived snapshot
app.get('/api/sitemap/:host/:timestamp', async (req, res) => {
  try {
    const { host, timestamp } = req.params;
    const archiveDir = path.join(DATA_DIR, host, timestamp);
    
    if (!await fs.pathExists(archiveDir)) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    // Find all HTML files in the archive
    const sitemap = [];
    
    async function scanDirectory(dir, relativePath = '') {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory() && item !== 'assets') {
          await scanDirectory(fullPath, path.join(relativePath, item));
        } else if (stats.isFile() && item.endsWith('.html')) {
          const pagePath = path.join(relativePath, item);
          const displayPath = pagePath === 'index.html' ? '/' : `/${pagePath.replace('.html', '')}`;
          
          sitemap.push({
            path: pagePath,
            displayPath: displayPath,
            url: displayPath,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    }
    
    await scanDirectory(archiveDir);
    
    // Sort by path
    sitemap.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
    
    res.json(sitemap);
    
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Get HTML content for a specific page in an archive
app.get('/api/sitemap/:host/:timestamp/:page(*)', async (req, res) => {
  try {
    const { host, timestamp, page } = req.params;
    const archiveDir = path.join(DATA_DIR, host, timestamp);
    
    if (!await fs.pathExists(archiveDir)) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    // Construct the file path
    let filePath;
    if (page === '' || page === '/') {
      filePath = path.join(archiveDir, 'index.html');
    } else {
      // Remove leading slash and add .html if needed
      const cleanPage = page.replace(/^\//, '');
      filePath = path.join(archiveDir, cleanPage.endsWith('.html') ? cleanPage : `${cleanPage}.html`);
    }
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const htmlContent = await fs.readFile(filePath, 'utf8');
    
    // Parse with Cheerio to extract metadata
    const $ = cheerio.load(htmlContent);
    const title = $('title').text() || 'Untitled';
    const links = [];
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        links.push({ href, text });
      }
    });
    
    res.json({
      path: page,
      title,
      content: htmlContent,
      links: links.slice(0, 50), // Limit to first 50 links
      size: htmlContent.length
    });
    
  } catch (error) {
    console.error('Get page content error:', error);
    res.status(500).json({ error: 'Failed to get page content' });
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
      timeout: 30000,  // Increased from 10s to 30s for slow assets
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