"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2 } from "lucide-react";

import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_COLOR_STYLES,
  matchTransactionCategory,
} from "@/lib/categories";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import type { CategoryColor, WorkspaceCategory } from "@/types/transaction";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CategoryFormState = {
  name: string;
  color: CategoryColor;
  keywords: string;
};

const defaultFormState: CategoryFormState = {
  name: "",
  color: "indigo",
  keywords: "",
};

export function RulesWorkspace() {
  const {
    state,
    isHydrated,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategoryPriority,
  } = useFileWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceCategory | null>(
    null,
  );
  const [editingCategory, setEditingCategory] =
    useState<WorkspaceCategory | null>(null);
  const [formState, setFormState] =
    useState<CategoryFormState>(defaultFormState);

  const matchedCounts = useMemo(() => {
    return new Map(
      state.categories.map((category) => {
        const count = state.transactions.filter(
          (transaction) =>
            matchTransactionCategory(
              transaction,
              state.categories,
              state.merchantMappings,
            )?.id ===
            category.id,
        ).length;
        return [category.id, count];
      }),
    );
  }, [state.categories, state.merchantMappings, state.transactions]);

  function openCreateDialog() {
    setEditingCategory(null);
    setFormState(defaultFormState);
    setDialogOpen(true);
  }

  function openEditDialog(category: WorkspaceCategory) {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      color: category.color,
      keywords: category.keywords.join(", "),
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    const payload = {
      name: formState.name.trim(),
      color: formState.color,
      keywords: formState.keywords.split(","),
    };

    if (!payload.name) {
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, payload);
    } else {
      addCategory(payload);
    }

    setDialogOpen(false);
    setEditingCategory(null);
    setFormState(defaultFormState);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Rules</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Rules
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Tempat khusus untuk mengelola keyword auto-classification per
                kategori.
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="size-4" />
              Add rule
            </Button>
          </div>
        </section>

        <Separator />

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tags className="size-4 text-muted-foreground" />
              <CardTitle>Keyword rules</CardTitle>
            </div>
            <CardDescription>
              Setiap kategori menggunakan keyword untuk mencocokkan deskripsi
              transaksi secara otomatis. Prioritas lebih tinggi akan dipilih
              lebih dulu saat satu transaksi cocok ke banyak rule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Matched</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || state.categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat rules workspace..."
                        : "Belum ada rules di workspace."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {state.categories.map((category) => {
                  const style = CATEGORY_COLOR_STYLES[category.color];

                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Badge variant="outline" className={style.badge}>
                          {category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Naikkan prioritas ${category.name}`}
                            onClick={() =>
                              moveCategoryPriority(category.id, "up")
                            }
                          >
                            <ArrowUp className="size-4 text-slate-600" />
                          </Button>
                          <span className="min-w-8 text-center text-sm font-medium text-foreground">
                            {category.priority}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Turunkan prioritas ${category.name}`}
                            onClick={() =>
                              moveCategoryPriority(category.id, "down")
                            }
                          >
                            <ArrowDown className="size-4 text-slate-600" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[460px] flex-wrap gap-1.5">
                          {category.keywords.map((keyword) => (
                            <Badge
                              key={`${category.id}-${keyword}`}
                              variant="secondary"
                              className="bg-muted text-foreground"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{matchedCounts.get(category.id) ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${category.name}`}
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="size-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className="size-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit rule" : "Add rule"}
            </DialogTitle>
            <DialogDescription>
              Atur nama kategori, warna, dan keyword untuk auto-classification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Category name
              </label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Misalnya: Transport"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_COLOR_OPTIONS.map((option) => {
                  const style = CATEGORY_COLOR_STYLES[option.value];
                  const isActive = formState.color === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          color: option.value,
                        }))
                      }
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${style.card} ${isActive ? "ring-2 ring-foreground/10" : ""}`}
                    >
                      <span className={`size-2.5 rounded-full ${style.dot}`} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Keywords
              </label>
              <Input
                value={formState.keywords}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    keywords: event.target.value,
                  }))
                }
                placeholder="Pisahkan dengan koma, misalnya: gojek, grab, transport"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formState.name.trim()}>
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.name} akan dihapus dari workspace.`
                : "Rule ini akan dihapus dari workspace."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteCategory(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
