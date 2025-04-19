'use client';
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;
if (!API) {
  throw new Error(
    'Defina NEXT_PUBLIC_API_BASE_URL no .env (ex: https://<api>.execute-api…).'
  );
}

type Tab = 'upload' | 'files' | 'chat';

interface FileMeta {
  s3_key: string;
  nome: string;
  descricao?: string;
  dataUpload: string;
  tamanho: number;
}

interface AskResponse {
  text: string;
}

interface FileUploadProps {
  onSuccess?: () => void;
}

export default function MVPApp() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'upload', label: 'Enviar Arquivo' },
    { id: 'files',  label: 'Meus Arquivos' },
    { id: 'chat',   label: 'Perguntar à IA' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Rivo MVP – Upload &amp; Ask</h1>
      <div className="flex space-x-2 mb-4">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant={activeTab === t.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(t.id)}
            className="rounded-2xl"
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'upload' && <FileUpload onSuccess={() => setActiveTab('files')} />}
      {activeTab === 'files'  && <FileList />}
      {activeTab === 'chat'   && <ChatRAG />}
    </div>
  );
}

function FileUpload({ onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('\u00A0');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };
  const handleDescChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescricao(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      setMsg('Selecione um arquivo.');
      return;
    }
    setLoading(true);
    setMsg('Enviando…');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('descricao', descricao);

      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setMsg('✅ Upload concluído');
      setFile(null);
      setDescricao('');
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMsg('Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="space-y-4 p-6">
        {/* input nativo para file */}
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm file:py-2 file:px-4 file:rounded file:border file:border-gray-300"
        />
        <Textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={handleDescChange}
          rows={3}
        />
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? 'Enviando…' : 'Enviar'}
        </Button>
        <p className="text-sm text-center text-gray-600">{msg}</p>
      </CardContent>
    </Card>
  );
}

function FileList() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/files`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setFiles(await res.json());
      } catch (err: any) {
        console.error(err);
        setError('Falha ao carregar arquivos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Carregando…</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

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
                <td className="px-3 py-2">{f.descricao || '-'}</td>
                <td className="px-3 py-2">
                  {new Date(f.dataUpload).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {(f.tamanho/1024).toFixed(1)}
                </td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(
                        // endpoint de download que deve devolver URL pré‑assinada
                        `${API}/download?key=${encodeURIComponent(f.s3_key)}`,
                        '_blank'
                      )
                    }
                  >
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

function ChatRAG() {
  const [question, setQuestion] = useState('');
  const [answer,   setAnswer]   = useState('Pergunte algo e a IA responderá aqui…');
  const [loading,  setLoading]  = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('Consultando KB…');
    try {
      const res = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as AskResponse;
      setAnswer(json.text);
    } catch (err) {
      console.error(err);
      setAnswer('Erro ao consultar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Textarea
          placeholder="Digite sua pergunta…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
        />
        <Button onClick={ask} disabled={loading} className="w-full">
          {loading ? 'Consultando…' : 'Perguntar'}
        </Button>
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-xl shadow-inner text-sm">
          {answer}
        </div>
      </CardContent>
    </Card>
  );
}
