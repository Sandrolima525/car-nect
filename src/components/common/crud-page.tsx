import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/services/company";

type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "date";
  required?: boolean;
};

type CrudPageProps = {
  table: string;
  title: string;
  description: string;
  singular: string;
  fields: Field[];
  columns: { key: string; label: string }[];
  searchKeys?: string[];
  renderExpandedRow?: (row: Record<string, unknown>) => React.ReactNode;
};

export function CrudPage({ table, title, description, singular, fields, columns, searchKeys, renderExpandedRow }: CrudPageProps) {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [companyId, setCompanyId] = useState<string>();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const id = companyId ?? (await getCurrentCompanyId());
      setCompanyId(id);
      const { data, error: queryError } = await (supabase as any).from(table).select("*").eq("company_id", id).order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setRecords((data ?? []) as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [table]);

  const filtered = useMemo(() => {
    const keys = searchKeys ?? fields.map((field) => field.key);
    const term = search.toLowerCase();
    return records.filter((record) => keys.some((key) => String(record[key] ?? "").toLowerCase().includes(term)));
  }, [records, search, fields, searchKeys]);

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((field) => [field.key, ""])));
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditing(record);
    setExpandedId(null);
    setForm(Object.fromEntries(fields.map((field) => [field.key, String(record[field.key] ?? "")] )));
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const missing = fields.filter((field) => field.required && !String(form[field.key] ?? "").trim());
      if (missing.length) {
        throw new Error(`Preencha: ${missing.map((field) => field.label).join(", ")}.`);
      }
      if (!companyId) throw new Error("Empresa não identificada. Atualize a página e tente novamente.");
      const payload: Record<string, unknown> = { ...form, company_id: companyId };
      fields.forEach((field) => {
        if (field.type === "number") payload[field.key] = form[field.key] ? Number(form[field.key]) : null;
      });
      const query = editing
        ? (supabase as any).from(table).update(payload).eq("id", editing["id"]).eq("company_id", companyId)
        : (supabase as any).from(table).insert(payload);
      const { error: mutationError } = await query;
      if (mutationError) throw mutationError;
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: unknown) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    const { error: mutationError } = await (supabase as any).from(table).delete().eq("id", id).eq("company_id", companyId);
    if (mutationError) setError(mutationError.message);
    else await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2><p className="text-muted-foreground">{description}</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Novo {singular}</Button>
      </div>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {editing !== null || Object.keys(form).length > 0 ? (
        <Card>
          <CardHeader><h3 className="font-semibold">{editing ? `Editar ${singular}` : `Novo ${singular}`}</h3></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => <div key={field.key} className="space-y-2"><Label htmlFor={`${table}-${field.key}`}>{field.label}</Label><Input id={`${table}-${field.key}`} type={field.type ?? "text"} value={form[field.key] ?? ""} required={field.required} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} /></div>)}
            <div className="flex gap-2 sm:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => { setEditing(null); setForm({}); }}>Cancelar</Button></div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><div className="relative max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} className="pl-8" /></div></CardHeader>
        <CardContent className="p-0"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column.key} className="first:pl-4 sm:first:pl-6">{column.label}</TableHead>)}<TableHead className="w-[60px]" /></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow> : filtered.map((record) => <TableRow key={String(record["id"])}>{columns.map((column) => <TableCell key={column.key} className="first:pl-4 sm:first:pl-6">{String(record[column.key] ?? "—")}</TableCell>)}<TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(record)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => renderExpandedRow && setExpandedId(expandedId === String(record["id"]) ? null : String(record["id"]))}>Histórico</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => void remove(record["id"])}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>{renderExpandedRow && expandedId === String(record["id"]) && <TableRow><TableCell colSpan={columns.length + 1} className="p-0">{renderExpandedRow(record)}</TableCell></TableRow>}</TableBody></Table></CardContent>
      </Card>
    </div>
  );
}
