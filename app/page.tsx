'use client'
import React, { useState, useEffect, ChangeEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * State types
 */
interface FileUploadProps {
  onSuccess?: () => void
}

interface FileMeta {
  s3_key: string
  nome: string
  descricao?: string
  dataUpload: string
  tamanho: number
}

interface AskResponse {
  text: string
}

/**
 * ------------------------------------------------------------------
 * MVP – File‑upload + RAG chat UI (React + Tailwind + shadcn/ui)
 * ------------------------------------------------------------------
 */
export default function MVPApp() {
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'chat'>('upload')

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Rivo MVP – Upload & Ask</h1>
      <div className="flex space-x-2 mb-4">
        {[
          { id: 'upload', label: 'Enviar Arquivo' },
          { id: 'files', label: 'Meus Arquivos' },
          { id: 'chat', label: 'Perguntar à IA' }
        ].map((t) => (
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
      {activeTab === 'files' && <FileList />}
      {activeTab === 'chat' && <ChatRAG />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
function FileUpload({ onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [descricao, setDescricao] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [msg, setMsg] = useState<string>('\u00A0')

  const handleUpload = async () => {
    if (!file) {
      setMsg('Selecione um arquivo.')
      return
    }
    setLoading(true)
    setMsg('Enviando…')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('descricao', descricao)

      await fetch('/api/upload', { method: 'POST', body: form })
      setMsg('✅ Upload concluído')
      setFile(null)
      setDescricao('')
      onSuccess?.()
    } catch (err) {
      console.error(err)
      setMsg('Erro ao enviar arquivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="space-y-4 p-6">
        <Input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFile(e.target.files?.[0] ?? null)
          }
        />
        <Textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setDescricao(e.target.value)
          }
          rows={3}
        />
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? 'Enviando…' : 'Enviar'}
        </Button>
        <p className="text-sm text-center text-gray-600">{msg}</p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
function FileList() {
  const [files, setFiles] = useState<FileMeta[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  async function fetchFiles() {
    setLoading(true)
    try {
      const res = await fetch('/api/files')
      const json: FileMeta[] = await res.json()
      setFiles(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  if (loading) return <p>Carregando…</p>
  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-0 overflow-x-auto">
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
                <td className="px-3 py-2">{f.descricao ?? '-'}</td>
                <td className="px-3 py-2">
                  {new Date(f.dataUpload).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {(f.tamanho / 1024).toFixed(1)}
                </td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/api/download?key=${encodeURIComponent(
                          f.s3_key
                        )}`,
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
  )
}

/* ------------------------------------------------------------------ */
function ChatRAG() {
  const [question, setQuestion] = useState<string>('')
  const [answer, setAnswer] = useState<string>(
    'Pergunte algo e a IA responderá aqui…'
  )
  const [loading, setLoading] = useState<boolean>(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer('Consultando KB…')
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const json: AskResponse = await res.json()
      setAnswer(json.text || JSON.stringify(json))
    } catch (err) {
      console.error(err)
      setAnswer('Erro ao consultar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <Textarea
          placeholder="Digite sua pergunta…"
          value={question}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setQuestion(e.target.value)
          }
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
  )
}
