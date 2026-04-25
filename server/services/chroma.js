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
  // Fallback to default if URL parsing fails
}

const client = new ChromaClient({ 
  host: `${chromaSsl ? 'https' : 'http'}://${chromaHost}`,
  port: chromaPort
});
const COLLECTION_NAME = 'studyos_knowledge';

export const getCollection = async () => {
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { "hnsw:space": "cosine" } // Use cosine similarity
  });
};

export const addChunks = async (chunks, embeddings, metadatas, ids) => {
  const collection = await getCollection();
  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents: chunks
  });
};

export const queryChunks = async (queryEmbedding, nResults = 5) => {
  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    include: ['documents', 'metadatas', 'distances']
  });
  return results;
};
