import { ChromaClient } from 'chromadb';
import { config } from '../config.js';

const chromaUrlStr = config.chromaUrl;
let chromaHost = 'localhost';
let chromaPort = 8000;
let chromaSsl = false;

try {
  const url = new URL(chromaUrlStr);
  chromaHost = url.hostname;
  chromaPort = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
  chromaSsl = url.protocol === 'https:';
} catch (e) {
  // If not a valid URL, try using as hostname
  chromaHost = chromaUrlStr;
}

const client = new ChromaClient({ 
  host: chromaHost,
  port: chromaPort,
  ssl: chromaSsl
});
const COLLECTION_NAME = 'studyos_knowledge';

export const getCollection = async () => {
  try {
    return await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { "hnsw:space": "cosine" } // Use cosine similarity
    });
  } catch (error) {
    console.warn('⚠️ Could not connect to ChromaDB. AI will function without context retrieval.');
    return null;
  }
};

export const addChunks = async (chunks, embeddings, metadatas, ids) => {
  const collection = await getCollection();
  if (!collection) return;
  
  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents: chunks
  });
};

export const queryChunks = async (queryEmbedding, nResults = 5) => {
  try {
    const collection = await getCollection();
    if (!collection) throw new Error('No collection');
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      include: ['documents', 'metadatas', 'distances']
    });
    return results;
  } catch (error) {
    // Return empty results structure to prevent crashes in calling services
    return {
      documents: [[]],
      metadatas: [[]],
      distances: [[]]
    };
  }
};
