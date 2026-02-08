const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

async function getRecentDocs() {
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });
  
  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
  
  const docs = new Map();
  let offset = null;
  
  do {
    const response = await client.scroll(collectionName, {
      limit: 100,
      offset: offset,
      with_payload: true,
      with_vector: false
    });
    
    for (const point of response.points) {
      const source = point.payload.metadata?.source || point.payload.source || 'Unknown';
      const processedAt = point.payload.metadata?.processedAt || null;
      
      if (!docs.has(source) || (processedAt && (!docs.get(source).date || processedAt > docs.get(source).date))) {
        docs.set(source, { source, date: processedAt });
      }
    }
    offset = response.next_page_offset;
  } while (offset);
  
  const sorted = [...docs.values()]
    .filter(d => d.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  console.log('📅 Last 10 uploaded documents (with timestamps):\n');
  sorted.forEach((doc, i) => {
    console.log(`${i+1}. ${doc.source}`);
    console.log(`   Uploaded: ${doc.date}\n`);
  });
  
  if (sorted.length === 0) {
    console.log('No documents have processedAt timestamps stored.');
    console.log('\nShowing last 5 documents by point ID (rough estimate):');
    
    const byId = [...docs.entries()].slice(-5);
    byId.forEach(([source], i) => {
      console.log(`${i+1}. ${source}`);
    });
  }
}

getRecentDocs().catch(console.error);
