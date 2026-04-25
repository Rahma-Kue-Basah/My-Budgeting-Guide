<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Frontend Next

Frontend ini memakai Next.js App Router dengan workspace UI bergaya Cupertino yang sudah dipindahkan ke token semantik dan komponen shared. README ini fokus ke aturan implementasi visual supaya perubahan berikutnya tetap konsisten di light mode dan dark mode.

## Getting Started

Jalankan development server:

```bash
npm run dev
```

Build produksi:

```bash
npm run build
```

## Styling System

Semua styling baru harus mengutamakan token semantik, bukan warna hardcode langsung di feature file.

Sumber utama:

- [app/globals.css](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/app/globals.css)
- [components/ui/cupertino-action-button.tsx](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/components/ui/cupertino-action-button.tsx)
- [components/ui/workspace-top-bar.tsx](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/components/ui/workspace-top-bar.tsx)
- [components/ui/workspace-top-bar-action-button.tsx](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/components/ui/workspace-top-bar-action-button.tsx)
- [components/ui/workspace-primary-button.tsx](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/components/ui/workspace-primary-button.tsx)

## Theme Tokens

Token inti yang harus dipakai:

- `bg-app`: background halaman utama
- `bg-surface`: background panel/card utama
- `bg-surface-muted`: background input, filter, muted panel
- `bg-surface-raised`: selected state / raised surface di dark mode
- `text-primary`: teks utama
- `text-secondary`: teks pendukung yang masih penting
- `text-tertiary`: helper text / label ringan
- `border-subtle`: border tipis default
- `border-strong`: border control / button / input
- `text-accent`: aksen brand
- `text-success`, `text-warning`, `text-danger`: status dan semantic highlight

Jangan pakai literal seperti:

- `text-[#1c1c1e]`
- `text-[#636366]`
- `bg-white dark:bg-[#1c1c1e]`
- `border-black/10 dark:border-white/10`

Kecuali benar-benar untuk data visualization atau warna domain yang memang spesifik.

## Light And Dark Mode

Light mode dan dark mode dikontrol lewat CSS variables di `app/globals.css`.

Aturan yang harus diikuti:

- Jangan tulis kombinasi manual `text-dark + dark:text-light` kalau token semantik sudah ada.
- Gunakan `text-primary`, `text-secondary`, `text-tertiary` untuk teks.
- Gunakan `bg-app`, `bg-surface`, `bg-surface-muted`, `bg-surface-raised` untuk permukaan.
- Gunakan `border-subtle` dan `border-strong` untuk border.
- Jika membuat komponen baru, pastikan ia tetap terbaca di kedua mode tanpa perlu override di setiap page.

Preferensi tema user dikelola lewat:

- [hooks/use-app-settings.ts](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/hooks/use-app-settings.ts)
- [components/shell/app-settings-sync.tsx](/Users/selunaa/Projects/My-Budgeting-Guide/frontend-next/components/shell/app-settings-sync.tsx)

## Shared Components

Gunakan komponen shared berikut sebelum menulis class manual.

### Top Bar

Untuk header workspace, gunakan `WorkspaceTopBar`.

Contoh:

```tsx
<WorkspaceTopBar title="Transactions" />
```

Jika ada action di kanan atas:

```tsx
<WorkspaceTopBar
  title="Rules"
  actions={
    <>
      <WorkspaceTopBarActionButton tone="secondary" href="/transactions">
        Transactions
      </WorkspaceTopBarActionButton>
      <WorkspaceTopBarActionButton onClick={openCreateDialog}>
        <CupertinoIcon name="plus" className="size-3.5" />
        Add rule
      </WorkspaceTopBarActionButton>
    </>
  }
/>
```

Jangan buat top bar manual dengan:

```tsx
<section className="sticky top-[58px] ...">
```

Kecuali memang ada kebutuhan layout yang belum bisa diwakili oleh `WorkspaceTopBar`.

### Action Buttons

Untuk CTA di top bar, gunakan `WorkspaceTopBarActionButton`.

Untuk primary CTA di panel, dialog, atau modal, gunakan `WorkspacePrimaryButton`.

Untuk tombol aksi Cupertino generik, gunakan `CupertinoActionButton`.

Pilihan umum:

- `tone="primary"`: aksi utama
- `tone="secondary"` atau `tone="white"`: aksi sekunder
- `tone="destructive"`: aksi hapus / reset / irreversible

### Surfaces

Untuk panel workspace standar, pakai `WorkspaceSection` jika cocok. Jangan ulang terus pola:

```tsx
rounded-[13px] bg-surface shadow-[...]
```

Kalau butuh panel custom, tetap gunakan token yang sama.

### Tables

Untuk tabel workspace, gunakan `CupertinoTable`.

Aturan:

- Header tabel tidak perlu styling warna manual.
- Row text default harus inherit dari komponen atau pakai token semantik.
- Nominal utama pakai `text-primary` atau semantic text seperti `text-success`.
- Secondary metadata pakai `text-secondary` atau `text-tertiary`.

### Inputs And Filters

Gunakan pola ini:

- input/filter surface: `bg-surface-muted`
- border: `border-subtle` atau `border-strong`
- active/selected state: `bg-surface-raised`
- helper label: `text-tertiary`

## Rules For New UI

Setiap perubahan UI baru harus mengikuti aturan ini:

1. Gunakan token semantik dulu, bukan hex hardcode.
2. Gunakan komponen shared dulu, bukan copy-paste class dari page lain.
3. Pastikan hasilnya terbaca di light mode dan dark mode.
4. Jika sebuah pola dipakai minimal di dua tempat, ekstrak ke shared component.
5. Hardcode warna hanya boleh untuk:
   - chart/data visualization
   - category color
   - semantic status yang memang spesifik
   - brand/accent yang sudah didefinisikan

## Things To Avoid

- Menambahkan lagi `text-[#1c1c1e]`, `text-[#636366]`, `bg-white`, `dark:bg-[#1c1c1e]` di feature files
- Membuat top bar manual per halaman
- Membuat primary CTA dengan class inline baru kalau `WorkspacePrimaryButton` atau `CupertinoActionButton` sudah cukup
- Membuat secondary CTA dengan class inline baru kalau `WorkspaceTopBarActionButton tone="secondary"` sudah cukup
- Menulis dark mode override per halaman untuk warna netral yang sebenarnya sudah ada tokennya

## Verification Checklist

Sebelum selesai, cek:

```bash
npx eslint features components
npm run build
```

Audit cepat untuk hardcode netral:

```bash
rg --pcre2 "text-\\[#|bg-\\[#|border-\\[#|text-black|bg-white" frontend-next/features frontend-next/components
```

Untuk review visual, cek minimal halaman ini di light dan dark mode:

- `/dashboard`
- `/transactions`
- `/file`
- `/analytics`
- `/reports`
- `/settings`

Fokus review:

- top bar
- action button
- primary CTA
- segmented control selected state
- table values
- helper text
- modal/dialog content

## Current Direction

Refactor styling saat ini bergerak ke arah:

- token semantik di `globals.css`
- top bar shared
- top bar action button shared
- primary CTA shared
- pengurangan hardcoded neutral colors di feature files

Kalau menambah UI baru, ikut arah itu. Jangan kembali ke styling literal per halaman.
