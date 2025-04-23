'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

export default function MVPApp() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'upload', label: 'Enviar Arquivo' },
    { id: 'files', label: 'Meus Arquivos' },
    { id: 'chat', label: 'Perguntar à IA' },
  ];

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Rivo MVP – Upload & Ask</h1>
      <div className="flex space-x-2 mb-4">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={activeTab === t.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'upload' && <FileUpload onSuccess={() => setActiveTab('files')} />}
      {activeTab === 'files' && <FileList />}
      {activeTab === 'chat' && <ChatRAG />}
    </div>
  );
}

// … mantenha exatamente sua lógica de FileUpload e FileList,
// só troque o endpoint /api/... para `${API_BASE_URL}/upload` e `${API_BASE_URL}/files`

function FileUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('\u00A0');


  const handleUpload = async () => {
    if (!file) {
      setMsg('Selecione um arquivo.');
      return;
    }
  
    setLoading(true);
    setMsg('Enviando…');
  
    try {
      // 1) converte o File em string Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;        // ex: “data:application/pdf;base64,JVBERi0xLjc…”
          const [, payload] = result.split(',');         // pega só a parte após a vírgula
          resolve(payload);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
  
      // 2) monta o JSON
      const payload = {
        fileName: file.name,
        fileContentBase64: base64,
        // descricao,   // se quiser mandar a descrição também, basta descomentar
      };
  
      // 3) dispara o fetch para o API Gateway /main/uploadFile
      const res = await fetch(
        `${API_BASE_URL}/main/uploadFile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
  
      if (!res.ok) {
        throw new Error(`Upload falhou com status ${res.status}`);
      }
  
      setMsg('✅ Upload concluído');
      setFile(null);
      setDescricao('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      setMsg('Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
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
  useEffect(() => {
    fetch(`${API_BASE_URL}/files`)
      .then((r) => r.json())
      .then((js) => setFiles(js))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando…</p>;
  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              {['Nome', 'Descrição', 'Data', 'Tamanho (KB)', 'Ações'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.s3_key} className="odd:bg-gray-50">
                <td className="px-3 py-2">{f.nome}</td>
                <td className="px-3 py-2">{f.descricao || '-'}</td>
                <td className="px-3 py-2">
                  {new Date(f.dataUpload).toLocaleString()}
                </td>
                <td className="px-3 py-2">{(f.tamanho / 1024).toFixed(1)}</td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(
                        `${API_BASE_URL}/download?key=${encodeURIComponent(f.s3_key)}`,
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
  const [q, setQ] = useState('');
  const [ans, setAns] = useState('Pergunte algo e a IA responderá aqui…');
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setAns('Consultando KB…');
    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const js = await res.json();
      setAns(js.text);
    } catch {
      setAns('Erro ao consultar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Textarea
          placeholder="Digite sua pergunta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
