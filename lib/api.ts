// lib/api.ts
const api = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function uploadFile(file: File) {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${api}/files/upload`, {
    method: 'POST',
    body
  });
  return res.json();
}

export async function listFiles() {
  const res = await fetch(`${api}/files`, { method: 'GET' });
  return res.json();
}

export async function askRag(question: string) {
  const res = await fetch(`${api}/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  return res.json();
}
