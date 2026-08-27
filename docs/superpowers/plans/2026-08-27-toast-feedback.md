# Toast Feedback Semua Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap action di aplikasi Gapensi memberi feedback toast (sukses/error/warning) menggunakan Sonner, tanpa mengubah alur redirect atau struktur form yang ada.

**Architecture:** Tiga lapis. (1) Infrastruktur: `<Toaster />` Sonner di root layout + helper `src/lib/toast.ts`. (2) Form server action: state `useActionState` diberi flag `ok`, hook `useActionToast` mem-flip jadi toast; form yang lewat `ActionForm` dapat ini otomatis. (3) Action yang `redirect()` di server: target halaman membaca query param via komponen `QueryToast`. Action fetch (upload, sertifikat) memanggil toast eksplisit.

**Tech Stack:** Next.js 15 App Router, React 19 (`useActionState`), Tailwind v4, sonner.

**Deviasi dari spec (disengaja, beri tahu user):**
- Exam autosave (`saveAnswer`) tidak pakai toast sukses — tiap klik jawaban akan spam. Cukup error toast.
- Logout tidak diberi toast — full server redirect akan menghilangkan toast, dan layar login setelah keluar sudah merupakan feedback jelas.

---

### Task 1: Infrastruktur Sonner

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/lib/toast.ts`
- Create: `src/components/ui/ToasterHost.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install sonner**

```bash
npm install sonner
```

Expected: `"sonner": "^2.x"` muncul di `dependencies` `package.json`.

- [ ] **Step 2: Buat helper toast**

Create `src/lib/toast.ts`:

```ts
import { toast } from "sonner";

export const toastSuccess = (message: string) => toast.success(message);
export const toastError = (message: string) => toast.error(message);
export const toastWarning = (message: string) => toast.warning(message);
```

- [ ] **Step 3: Buat ToasterHost**

Create `src/components/ui/ToasterHost.tsx`:

```tsx
"use client";

import { Toaster } from "sonner";
import type { ComponentProps } from "react";

type ToasterHostProps = ComponentProps<typeof Toaster>;

/** Satu-satunya tempat <Toaster/> dipasang (root layout). */
export function ToasterHost(props: Partial<ToasterHostProps>) {
  return (
    <Toaster
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-hairline-strong !bg-surface !text-ink !shadow-lg",
          description: "!text-ink-secondary",
        },
      }}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Mount di root layout**

`src/app/layout.tsx` — tambah import dan render `<ToasterHost />` di body:

```tsx
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { ToasterHost } from "@/components/ui/ToasterHost";
```

```tsx
<body>
  <NavigationProgress />
  {children}
  <ToasterHost />
</body>
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/toast.ts src/components/ui/ToasterHost.tsx src/app/layout.tsx
git commit -m "feat: pasang sonner sebagai sistem toast global"
```

---

### Task 2: Hook useActionToast

**Files:**
- Create: `src/components/ui/useActionToast.ts`

- [ ] **Step 1: Buat hook**

Hook menonton object state dari `useActionState`. Ref guard mencegah toast saat mount awal. Selama `state.ok === true` → sukses; kalau ada `state.error` → error.

Create `src/components/ui/useActionToast.ts`:

```ts
"use client";

import { useEffect, useRef } from "react";
import { toastError, toastSuccess } from "@/lib/toast";

type ActionStateLike = { error?: string; ok?: boolean };

export function useActionToast(
  state: ActionStateLike,
  options?: { success?: string }
) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error) {
      toastError(state.error);
    } else if (state.ok) {
      toastSuccess(options?.success ?? "Berhasil disimpan");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/useActionToast.ts
git commit -m "feat: hook useActionToast buat flip action state jadi toast"
```

---

### Task 3: Komponen QueryToast

**Files:**
- Create: `src/components/ui/QueryToast.tsx`

- [ ] **Step 1: Buat komponen**

Untuk flow yang berhasilnya di-`redirect()` dari server action: page tujuan me-render `QueryToast`, dia baca param sekali lalu hapus param dari URL biar refresh tidak munculkan lagi.

Create `src/components/ui/QueryToast.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Fire toast berdasarkan query param (misal ?created=1 / ?error=1),
 * lalu bersihkan param dari URL supaya tidak muncul lagi saat refresh.
 */
export function QueryToast({
  success,
  error,
}: {
  success?: Record<string, string>;
  error?: Record<string, string>;
}) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let dirty = false;

    if (success) {
      for (const [key, message] of Object.entries(success)) {
        if (params.get(key)) {
          toastSuccess(message);
          params.delete(key);
          dirty = true;
        }
      }
    }
    if (error) {
      for (const [key, message] of Object.entries(error)) {
        if (params.get(key)) {
          toastError(message);
          params.delete(key);
          dirty = true;
        }
      }
    }

    if (dirty) {
      const qs = params.toString();
      router.replace(window.location.pathname + (qs ? `?${qs}` : ""), {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/QueryToast.tsx
git commit -m "feat: QueryToast buat feedback hasil redirect server action"
```

---

### Task 4: Upgrade ActionForm + tandai sukses di server actions

Form yang suksesnya tetap di halaman (tanpa redirect) selama ini balik `{}` — tidak bisa dibedakan dari state awal. Semua sekarang balik `{ ok: true }`. `ActionForm` otomatis toast.

**Files:**
- Modify: `src/components/ui/ActionForm.tsx`
- Modify: `src/app/admin/modules/actions.ts` (updateQuestion :137, updateExplanation :156, deleteQuestion :173, moveQuestion :206, addOption :249, setCorrectOption :271, deleteOption :303, createMaterial :325, updateMaterial :363, deleteMaterial :393)
- Modify: `src/app/admin/activities/[id]/certificate-actions.ts:55` (generateCertificate)
- Modify: `src/app/t/[token]/actions.ts:51` (startPosttestRetry)

- [ ] **Step 1: Extend ActionFormState + auto-toast di ActionForm**

Replace isi `src/components/ui/ActionForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useActionToast } from "./useActionToast";

export type ActionFormState = { error?: string; ok?: boolean };

export function ActionForm({
  action,
  inputs,
  className,
  children,
  successMessage,
}: {
  action: (
    prev: ActionFormState,
    formData: FormData
  ) => Promise<ActionFormState>;
  inputs?: Record<string, string>;
  className?: string;
  children: ReactNode;
  /** Teks toast saat action sukses. Kosongkan untuk flow yang redirect (sukses dikirim via QueryToast). */
  successMessage?: string;
}) {
  const [state, formAction] = useActionState<ActionFormState, FormData>(
    action,
    {}
  );

  useActionToast(state, successMessage ? { success: successMessage } : undefined);

  return (
    <form action={formAction} className={className}>
      {inputs
        ? Object.entries(inputs).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      {children}
      {state.error ? (
        <span role="alert" className="mt-1 block text-sm font-medium text-flag">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
```

Catatan penting: jika `successMessage` tidak diberi dan action sukses (`ok: true`), toast default "Berhasil disimpan" tetap muncul. Flow redirect `deleteActivity` tidak pernah return karena `redirect()` melempar exception — aman.

- [ ] **Step 2: Return `{ ok: true }` di semua action non-redirect**

Di `src/app/admin/modules/actions.ts`, ubah setiap `return {};` jadi `return { ok: true };` pada fungsi berikut (semua sudah terlihat di file):

- `updateQuestion` (setelah `prisma.question.update`)
- `updateExplanation`
- `deleteQuestion` (di dalam try, setelah reorder)
- `moveQuestion` (JANGAN ubah early-return `{}` pada kondisi `swapWith` di luar batas — itu no-op diam; ubah hanya return setelah reorder loop)
- `addOption`
- `setCorrectOption`
- `deleteOption`
- `createMaterial`
- `updateMaterial`
- `deleteMaterial`

Contoh satu fungsi, sisanya pola sama persis:

```ts
export async function updateQuestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 3) return { error: "Soal minimal 3 karakter" };

  await prisma.question.update({
    where: { id: questionId },
    data: { text },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return { ok: true };
}
```

Catatan: `FormState` di file itu sudah `{ error?: string; ok?: boolean; questionId?: string }` — tidak perlu ubah tipenya.

- [ ] **Step 3: generateCertificate & startPosttestRetry**

`src/app/admin/activities/[id]/certificate-actions.ts` — akhir try:

```ts
    revalidatePath(`/admin/activities/${participant.activity.id}`);
    return { ok: true };
```

`src/app/t/[token]/actions.ts` — setelah attempt create:

```ts
    revalidatePath(`/t/${token}`);
    return { ok: true };
```

Tipenya juga diubah agar konsisten (opsional tapi rapi):

```ts
export type PosttestFormState = { error?: string; ok?: boolean };
```

- [ ] **Step 4: Verifikasi tipe**

```bash
npx tsc --noEmit
```

Expected: tanpa error. Kalau ada error type mismatch (action lama yang return `{}`), betulkan dengan menambah `ok: true` sesuai konteks.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ActionForm.tsx src/app/admin/modules/actions.ts src/app/admin/activities/%5Bid%5D/certificate-actions.ts "src/app/admin/activities/[id]/certificate-actions.ts" src/app/t/%5Btoken%5D/actions.ts "src/app/t/[token]/actions.ts"
git commit -m "feat: ActionForm bikin toast otomatis + action CRUD tandai sukses"
```

(Cukup add path aslinya tanpa escaping: `git add src/components/ui/ActionForm.tsx src/app/admin/modules/actions.ts "src/app/admin/activities/[id]/certificate-actions.ts" "src/app/t/[token]/actions.ts"`)

---

### Task 5: Wiring QuestionSection

**Files:**
- Modify: `src/app/admin/modules/[id]/QuestionSection.tsx`

- [ ] **Step 1: Import hook**

Tambahkan di bagian import:

```tsx
import { useActionToast } from "@/components/ui/useActionToast";
```

- [ ] **Step 2: EditQuestionForm, ExplanationForm, AddOptionForm, DeleteOptionButton**

Di dalam tiap komponen ini tambahkan baris hook setelah `useActionState`:

```tsx
// EditQuestionForm
const [state, formAction] = useActionState(updateQuestion, {});
useActionToast(state, { success: "Soal tersimpan" });

// ExplanationForm
const [state, formAction] = useActionState(updateExplanation, {});
useActionToast(state, { success: "Penjelasan tersimpan" });

// AddOptionForm
const [state, formAction] = useActionState(addOption, {});
useActionToast(state, { success: "Opsi ditambahkan" });

// DeleteOptionButton
const [state, formAction] = useActionState(deleteOption, {});
useActionToast(state, { success: "Opsi dihapus" });
```

- [ ] **Step 3: CreateQuestionModal**

Setelah `useActionState(createQuestion, {})`, ekstensi effect yang sudah ada memanggil `onCreated`; tambahkan toast di situ:

```tsx
  useEffect(() => {
    if (state.ok && state.questionId) {
      toastSuccess("Soal baru ditambahkan");
      onCreated(state.questionId);
    }
  }, [state, onCreated]);
```

Import tambahan di atas file:

```tsx
import { toastSuccess } from "@/lib/toast";
```

- [ ] **Step 4: Tombol move/delete/setCorrect pakai ActionForm props**

Tambahkan prop `successMessage` di pemakaian `ActionForm` dalam `QuestionSection` (satu-satunya perubahan pada JSX):

```tsx
<ActionForm
  action={moveQuestion}
  inputs={{ questionId: q.id, moduleId, direction: "up" }}
  successMessage="Urutan soal diubah"
>
```

(dua tombol ↑ ↓ sama-sama `"Urutan soal diubah"`)

```tsx
<ActionForm
  action={deleteQuestion}
  inputs={{ questionId: q.id, moduleId }}
  successMessage="Soal dihapus"
>
  <ConfirmButton label="Hapus" />
</ActionForm>
```

```tsx
<ActionForm
  action={setCorrectOption}
  inputs={{ optionId: opt.id, moduleId }}
  successMessage="Jawaban benar diperbarui"
>
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/modules/[id]/QuestionSection.tsx"
git commit -m "feat: toast CRUD soal & opsi di QuestionSection"
```

---

### Task 6: Wiring MaterialSection + Upload Fields

**Files:**
- Modify: `src/app/admin/modules/[id]/MaterialSection.tsx`
- Modify: `src/app/admin/modules/[id]/PdfField.tsx`
- Modify: `src/app/admin/modules/[id]/VideoField.tsx`

- [ ] **Step 1: MaterialSection**

Tambah import:

```tsx
import { useActionToast } from "@/components/ui/useActionToast";
```

Lalu:

```tsx
// EditMaterialForm
const [state, formAction] = useActionState(updateMaterial, {});
useActionToast(state, { success: "Materi disimpan" });

// CreateMaterialForm
const [state, formAction] = useActionState(createMaterial, {});
useActionToast(state, { success: "Materi ditambahkan" });
```

Delete materi via `ActionForm` di render list — tambah prop:

```tsx
<ActionForm
  action={deleteMaterial}
  inputs={{ materialId: m.id, moduleId }}
  successMessage="Materi dihapus"
>
  <ConfirmButton label="Hapus" />
</ActionForm>
```

- [ ] **Step 2: PdfField toast**

Tambah import:

```tsx
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
```

Ubah `handleFile` — validasi pakai warning, upload gagal pakai error, sukses pakai success (inline error tetap ada untuk error upload, jangan dihapus):

```tsx
    if (file.type !== "application/pdf") {
      setError("File harus berupa PDF (.pdf).");
      toastWarning("File harus berupa PDF (.pdf)");
      setBusy(false);
      return;
    }
    if (file.size > PDF_MAX_SIZE) {
      const msg = `Ukuran PDF terlalu besar. Maksimal ${PDF_SIZE_LABEL}.`;
      setError(msg);
      toastWarning(msg);
      setBusy(false);
      return;
    }

    const res = await uploadWithProgress("/api/admin/upload-pdf", file, setProgress);
    if (res.ok) {
      setUploadedUrl(res.url);
      setRemoved(false);
      toastSuccess("PDF berhasil diunggah");
    } else {
      setError(res.error);
      toastError(res.error);
    }
```

- [ ] **Step 3: VideoField toast**

Import yang sama (`toastError, toastSuccess, toastWarning` dari `@/lib/toast`). Di `handleFile` tambahkan toastWarning pada tiap cabang validasi gagal (sebelah `setError(...)` yang sudah ada):

```tsx
    if (file.type === "video/x-matroska") {
      setError(MKV_HINT);
      toastWarning(MKV_HINT);
      setBusy(false);
      return;
    }
    if (!file.type.startsWith("video/")) {
      setError("File harus berupa video.");
      toastWarning("File harus berupa video");
      setBusy(false);
      return;
    }
    if (file.type && !VIDEO_MIMES.has(file.type)) {
      const msg = `Format video tidak didukung. Gunakan ${VIDEO_FORMAT_LABEL}.`;
      setError(msg);
      toastWarning(msg);
      setBusy(false);
      return;
    }
```

Lalu cari blok `uploadWithProgress("/api/admin/upload-video", ...)` yang serupa pola PdfField (ada di sekitar line 72–90):

```tsx
    const res = await uploadWithProgress("/api/admin/upload-video", file, setProgress);
    if (res.ok) {
      setUploadedUrl(res.url || "");
      setRemoved(false);
      setMode("upload");
      toastSuccess("Video berhasil diunggah");
    } else {
      setError(res.error);
      toastError(res.error);
    }
```

Ikuti bentuk kode sukses/gagal yang sudah ada di file — jangan menduplikasi setter, cukup tambahkan panggilan `toastSuccess(...)` di branch sukses dan `toastError(res.error)` di branch gagal.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/modules/[id]/MaterialSection.tsx" "src/app/admin/modules/[id]/PdfField.tsx" "src/app/admin/modules/[id]/VideoField.tsx"
git commit -m "feat: toast materi + upload PDF/video kasih feedback"
```

---

### Task 7: ScheduleForm & SettingsForm (flash → toast)

Flash teks "Tersimpan ✓" diganti toast biar konsisten.

**Files:**
- Modify: `src/app/admin/activities/[id]/ScheduleForm.tsx`
- Modify: `src/app/admin/modules/[id]/SettingsForm.tsx`

- [ ] **Step 1: ScheduleForm**

Ganti import `useState` (tidak dipakai lagi) dan tambah hook. Bagian atas komponen jadi:

```tsx
import { useActionState } from "react";
```

(Di dalam `ScheduleForm`:) hapus `const [flash, setFlash] = useState(false);` dan effect `if (state.ok) ... setFlash(true) ...` sepenuhnya. Ganti dengan:

```tsx
  const [state, formAction, pending] = useActionState<
    { ok?: boolean; error?: string },
    FormData
  >(updateActivitySchedule, {});
  useActionToast(state, { success: "Jadwal tersimpan" });
```

Import: `import { useActionToast } from "@/components/ui/useActionToast";`

Hapus JSX flash:

```tsx
        {flash ? (
          <p role="status" className="text-sm font-medium text-accent">
            Tersimpan ✓
          </p>
        ) : null}
```

Inline error `role="alert"` tetap dipertahankan.

- [ ] **Step 2: SettingsForm**

Pola sama. Hapus `flash` state + effect + JSX `{flash ? ...}`, ganti dengan:

```tsx
  const [state, formAction, pending] = useActionState<
    { ok?: boolean; error?: string },
    FormData
  >(updateModuleSettings, {});
  useActionToast(state, { success: "Pengaturan tersimpan" });
```

Import `useActionToast` seperti di atas. Inline error tetap.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: pass (pastikan import `useState` sisa tidak menyebabkan unused-var lint).

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/activities/[id]/ScheduleForm.tsx" "src/app/admin/modules/[id]/SettingsForm.tsx"
git commit -m "feat: jadwal & pengaturan modul pindah feedback ke toast"
```

---

### Task 8: Flow redirect — create/delete aktivitas & modul

Sukses create/delete adalah `redirect()`, jadi toast dikirim oleh page tujuan via `QueryToast`.

**Files:**
- Modify: `src/app/admin/activities/actions.ts:91,127` (createActivity, deleteActivity)
- Modify: `src/app/admin/modules/actions.ts:68` (createModule)
- Modify: `src/app/admin/activities/[id]/page.tsx` (render QueryToast)
- Modify: `src/app/admin/modules/[id]/page.tsx` (render QueryToast)
- Modify: `src/app/admin/activities/page.tsx` (render QueryToast)

- [ ] **Step 1: Ubah redirect URL memberi param**

`src/app/admin/activities/actions.ts`:

```ts
// createActivity, ujung fungsi:
  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}?created=1`);

// deleteActivity, ujung fungsi:
  revalidatePath("/admin/activities");
  redirect("/admin/activities?deleted=1");
```

`src/app/admin/modules/actions.ts` (`createModule` ujung fungsi):

```ts
  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${mod.id}?created=1`);
```

- [ ] **Step 2: Render QueryToast di page tujuan**

`src/app/admin/activities/page.tsx` (server component) — di dalam return utama, tinggal tambahkan:

```tsx
      <QueryToast success={{ deleted: "Kegiatan berhasil dihapus" }} />
```

`src/app/admin/activities/[id]/page.tsx`:

```tsx
      <QueryToast success={{ created: "Kegiatan berhasil dibuat" }} />
```

`src/app/admin/modules/[id]/page.tsx`:

```tsx
      <QueryToast success={{ created: "Modul berhasil dibuat" }} />
```

Import di ketiga file:

```tsx
import { QueryToast } from "@/components/ui/QueryToast";
```

Letakkan `<QueryToast>` sebagai anak pertama container terluar tiap page — tidak punya UI.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/activities/actions.ts src/app/admin/modules/actions.ts "src/app/admin/activities/page.tsx" "src/app/admin/activities/[id]/page.tsx" "src/app/admin/modules/[id]/page.tsx"
git commit -m "feat: toast sukses create/hapus kegiatan & modul via query param"
```

---

### Task 9: Flow peserta — JoinForm, p dashboard, login

**Files:**
- Modify: `src/app/j/[activityId]/JoinForm.tsx` (error toast)
- Modify: `src/app/j/[activityId]/actions.ts:54,75` (redirect param `joined=1`)
- Modify: `src/app/p/page.tsx` (QueryToast joined)
- Modify: `src/app/login/page.tsx` (QueryToast error)
- Modify: `src/app/admin/login/page.tsx` (QueryToast error)

- [ ] **Step 1: registerParticipant redirect param**

`src/app/j/[activityId]/actions.ts` — dua titik redirect ke `/p` (existing login dan peserta baru):

```ts
      await createParticipantSession(existing.token);
      redirect("/p?joined=1");
```

```ts
  await createParticipantSession(participant.token);
  redirect("/p?joined=1");
```

- [ ] **Step 2: JoinForm error toast**

Baca `src/app/j/[activityId]/JoinForm.tsx` terlebih dahulu — komponennya memakai `useActionState(registerParticipant, {})`. Tambahkan:

```tsx
import { useActionToast } from "@/components/ui/useActionToast";
```

dan tepat setelah deklarasi `useActionState`:

```tsx
  useActionToast(state);
```

(Hook menampilkan toastError dengan teks sama seperti inline error; inline error tetap dirender supaya yang salah field tetap kelihatan.) Sesuaikan nama variabel `state` bila beda di file aslinya.

- [ ] **Step 3: p dashboard — welcome toast**

`src/app/p/page.tsx` — tambah:

```tsx
import { QueryToast } from "@/components/ui/QueryToast";
```

```tsx
      <QueryToast success={{ joined: "Pendaftaran berhasil. Selamat datang!" }} />
```

- [ ] **Step 4: Login pages**

`src/app/login/page.tsx` — tambah import:

```tsx
import { QueryToast } from "@/components/ui/QueryToast";
```

Render segera setelah tag pembuka `<div className="min-h-screen">`:

```tsx
      <QueryToast error={{ error: "Email atau nomor WA tidak ditemukan." }} />
```

`src/app/admin/login/page.tsx` — sama, dengan pesan sesuai inline yang ada:

```tsx
      <QueryToast error={{ error: "Password salah." }} />
```

Inline `role="alert"` di kedua page TIDAK dihapus.

- [ ] **Step 5: Commit**

```bash
git add "src/app/j/[activityId]/JoinForm.tsx" "src/app/j/[activityId]/actions.ts" src/app/p/page.tsx src/app/login/page.tsx src/app/admin/login/page.tsx
git commit -m "feat: toast daftar sukses & login gagal buat flow peserta"
```

---

### Task 10: ExamRunner (error-only)

Deviasi spec: autosave jawaban tidak pakai toast sukses (tiap klik opsi bakal spam). Error saja.

**Files:**
- Modify: `src/app/exam/ExamRunner.tsx`

- [ ] **Step 1: Import**

```tsx
import { toastError } from "@/lib/toast";
```

- [ ] **Step 2: select() gagal simpan**

Fungsi `select` (sekitar line 76–85), catch-branch:

```tsx
    try {
      await saveAnswer(attemptId, questionId, optionId);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      toastError("Jawaban gagal tersimpan. Cek koneksi internetmu.");
    }
```

- [ ] **Step 3: doSubmit() gagal kirim**

Catch-branch `doSubmit` (sekitar line 45–60), tambahan satu baris setelah `setSubmitError(...)`:

```tsx
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(
        "Gagal mengirim jawaban. Cek koneksi, lalu coba kirim lagi."
      );
      toastError("Gagal mengirim jawaban. Coba kirim lagi.");
    }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/exam/ExamRunner.tsx
git commit -m "feat: toast error pas simpan/kirim jawaban ujian gagal"
```

---

### Task 11: Simpan konfigurasi sertifikat

**Files:**
- Modify: `src/app/admin/certificate-preview/page.tsx`

- [ ] **Step 1: handleSave toast**

Tambah import:

```tsx
import { toastError, toastSuccess } from "@/lib/toast";
```

Ubah `handleSave` (sekitar line 193–205):

```tsx
  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/admin/certificate-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: toFields(texts) }),
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) toastSuccess("Konfigurasi sertifikat tersimpan");
      else toastError("Gagal menyimpan konfigurasi.");
    } catch {
      setSaveState("error");
      toastError("Gagal menyimpan konfigurasi.");
    }
  };
```

Label inline "Tersimpan"/"Gagal simpan" tetap ada.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/certificate-preview/page.tsx
git commit -m "feat: toast simpan konfigurasi layout sertifikat"
```

---

### Task 12: Verifikasi manual + pengecekan

**Files:** tidak ada perubahan kode.

- [ ] **Step 1: Lint & type check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: dua-duanya bersih. Perhatian: JANGAN jalankan `npm run build` tanpa diminta — user melarang build otomatis.

- [ ] **Step 2: Mintakan izin lalu test manual di browser (dev server)**

Konfirmasi dulu ke user sebelum menjalankan `npm run dev`. Checklist skenario:

1. Admin login salah password → toast merah "Password salah."
2. Buat modul (FAB) → redirect ke detail + toast hijau "Modul berhasil dibuat"
3. Ganti judul modul (SettingsForm) → toast "Pengaturan tersimpan"; inline "Tersimpan ✓" tidak ada lagi
4. Tambah soal → modal tutup + "Soal baru ditambahkan"; edit soal → "Soal tersimpan"; tambah opsi, jadikan benar, hapus opsi, hapus soal, urutan ↑↓ — semuanya toast
5. Tambah materi → "Materi ditambahkan"; edit materi → "Materi disimpan"; hapus → "Materi dihapus"
6. Upload PDF salah jenis → toast kuning; upload benar → hijau "PDF berhasil diunggah"
7. Buat kegiatan → detail + "Kegiatan berhasil dibuat"; hapus kegiatan → list + "Kegiatan berhasil dihapus"
8. Simpan jadwal → "Jadwal tersimpan"
9. Terbitkan sertifikat → "Berhasil disimpan" (default dari ActionForm); coba terbitkan ulang → toast merah
10. Daftar peserta → dashboard + "Pendaftaran berhasil. Selamat datang!"
11. Peserta login salah → toast merah; posttest retry saat fase belum mulai → toast merah
12. Ujian: matikan koneksi (devtools offline), klik opsi → toast merah "Jawaban gagal tersimpan…"
13. Refresh halaman setelah sukses create → toast tidak muncul lagi (param sudah dibersihkan)

- [ ] **Step 3: Laporkan hasil**

Kalau ada skenario yang meleset, perbaiki dengan commit kecil `fix:` sebelum lanjut.

---

## Self-review result

- Spec coverage: infra (Task 1-3), form server action (4-7), redirect flow (8-9), fetch-based (10-11), kategori warna via richColors+warning (6), teks bahasa Indonesia (semua task). Deviasi terdokumentasi di header plan.
- Placeholder scan: Task 9 Step 2 menyuruh membaca JoinForm dulu — itu karena file belum dibaca, tetapi instruksi konkret (tambah import + `useActionToast(state)` setelah useActionState) bukan placeholder.
- Type consistency: `ok?: boolean` konsisten di `ActionFormState`, `FormState` modules, `PosttestFormState`. Helper `toastSuccess/toastError/toastWarning` dipakai konsisten dari `@/lib/toast`.
