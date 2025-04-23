'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/**
 * EXEMPLO de valor de NEXT_PUBLIC_API_BASE_URL
 *   https://jf6r2nxjse.execute-api.us-east-1.amazonaws.com/prod
 * (já inclui o “stage” /prod – NÃO coloque barra no final)
 */
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

type Tab = 'upload' | 'files' | 'chat';

interface FileMeta {
  s3_key: string;
  nome: string;
  descricao?: string;
  dataUpload: string;
  tamanho: number;
}

/* -------------------------------------------------- */
/*  Raiz                                              */
/* -------------------------------------------------- */
export default function MVPApp() {
  const [tab, setTab] = useState<Tab>('upload');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upload', label: 'Enviar arquivo' },
    { id: 'files',  label: 'Meus arquivos' },
    { id: 'chat',   label: 'Perguntar à IA' }
  ];

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Rivo MVP – Upload & Ask</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'upload' && <FileUpload  onSuccess={() => setTab('files')} />}
      {tab === 'files'  && <FileList   />}
      {tab === 'chat'   && <ChatRAG    />}
    </main>
  );
}

/* -------------------------------------------------- */
/*  Upload                                            */
/* -------------------------------------------------- */
function FileUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file,       setFile]       = useState<File | null>(null);
  const [descricao,  setDescricao]  = useState('');
  const [msg,        setMsg]        = useState('\u00A0');
  const [loading,    setLoading]    = useState(false);

  async function handleUpload() {
    if (!file) { setMsg('Selecione um arquivo.'); return; }

    setLoading(true);
    setMsg('Enviando…');

    try {
      /* ---- converte para Base-64 ---- */
      const fileContentBase64 = await new Promise<string>((ok, err) => {
        const r = new FileReader();
        r.onload  = () => ok((r.result as string).split(',')[1]);
        r.onerror = err;
        r.readAsDataURL(file);
      });

      const payload = {
        fileName: file.name,
        fileContentBase64,
        descricao: descricao || undefined
      };

      const res = await fetch(`${API}/upload`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`status ${res.status}`);

      setMsg('✅ Upload concluído');
      setFile(null);
      setDescricao('');
      onSuccess?.();
    } catch (e) {
      console.error(e);
      setMsg('Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          rows={3}
        />
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? 'Enviando…' : 'Enviar'}
        </Button>
        <p className="text-center text-sm text-gray-600">{msg}</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------- */
/*  Lista de arquivos                                 */
/* -------------------------------------------------- */
function FileList() {
  const [files,   setFiles]   = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/files`)
      .then(r => r.json())
      .then(setFiles)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando…</p>;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              {['Nome','Descrição','Data','Tamanho (KB)','Ações'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.s3_key} className="odd:bg-gray-50">
                <td className="px-3 py-2">{f.nome}</td>
                <td className="px-3 py-2">{f.descricao ?? '-'}</td>
                <td className="px-3 py-2">{new Date(f.dataUpload).toLocaleString()}</td>
                <td className="px-3 py-2">{(f.tamanho/1024).toFixed(1)}</td>
                <td className="px-3 py-2">
                  <Button size="sm" onClick={() =>
                    window.open(`${API}/download?key=${encodeURIComponent(f.s3_key)}`, '_blank')
                  }>
                    Baixar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------- */
/*  Chat com RAG                                      */
/* -------------------------------------------------- */
function ChatRAG() {
  const [q,   setQ]   = useState('');
  const [ans, setAns] = useState('Pergunte algo e a IA responderá aqui…');
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim()) return;

    setLoading(true);
    setAns('Consultando KB…');

    try {
      const res = await fetch(`${API}/ask`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ question: q })
      });
      const { text } = await res.json() as { text: string };
      setAns(text);
    } catch {
      setAns('Erro ao consultar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Textarea
          placeholder="Digite sua pergunta…"
          value={q}
          onChange={e => setQ(e.target.value)}
          rows={3}
        />
        <Button onClick={ask} disabled={loading} className="w-full">
          {loading ? 'Consultando…' : 'Perguntar'}
        </Button>
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-xl shadow-inner text-sm">
          {ans}
        </div>
      </CardContent>
    </Card>
  );
}