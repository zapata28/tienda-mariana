import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabase.client';

type CategoriaSlug = 'maquillaje' | 'skincare' | 'capilar' | 'accesorios';

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria: CategoriaSlug;
  grupo?: string | null;
  subgrupo?: string | null;
  imagen?: string | null;
  es_nuevo?: boolean | null;
  en_oferta?: boolean | null;
  precio_antes?: number | null;
  created_at?: string | null;
};

type ProductoForm = {
  nombre: string;
  descripcion: string;
  precio: number | null;
  categoria: CategoriaSlug;
  grupo: string;
  subgrupo: string;
  imagen: string;
  es_nuevo: boolean;
  en_oferta: boolean;
  precio_antes: number | null;
};

type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: string; type: ToastType; title: string; message: string; timeout?: any };

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // 🔥 ESTE FALTABA
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})


export class Admin implements OnInit {
  loading = true;
  loadingMore = false;
  saving = false;
  uploadBusy = false;  // lo usamos también para optimización (para bloquear mientras procesa)

  productos: Producto[] = [];

  // =========================
  // Paginación (Cargar más)
  // =========================
  pageSize = 12;
  offset = 0;
  hasMore = true;


  constructor(private cdr: ChangeDetectorRef) {}

  // =========================
  // TOASTS
  // =========================
  toasts: ToastItem[] = [];

  private toast(type: ToastType, message: string, title?: string, ms: number = 2600) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const t: ToastItem = {
      id,
      type,
      title: title ?? (type === 'success' ? 'Listo' : type === 'error' ? 'Ups' : 'Info'),
      message,
    };

    this.toasts = [t, ...this.toasts].slice(0, 4);
    t.timeout = setTimeout(() => this.dismissToast(id), ms);
  }

  dismissToast(id: string) {
    const t = this.toasts.find(x => x.id === id);
    if (t?.timeout) clearTimeout(t.timeout);
    this.toasts = this.toasts.filter(x => x.id !== id);
  }

  // Catálogo (Categoría → Grupo → Subgrupo)
  catalogo: Record<CategoriaSlug, { nombre: string; items: string[] }[]> = {
    maquillaje: [
      { nombre: 'Rostro', items: ['Bases', 'Bb cream', 'Correctores', 'Polvos', 'Primer', 'Contornos', 'Iluminadores', 'Rubores', 'Bronzer', 'Fijadores'] },
      { nombre: 'Ojos', items: ['Delineadores', 'Pestañinas', 'Sombras', 'Cejas', 'Pestañas postizas'] },
      { nombre: 'Labios', items: ['Bálsamo labial', 'Brillo labial', 'Labial', 'Tinta de labios', 'Delineador de labios'] },
      { nombre: 'Accesorios de maquillaje', items: ['Brochas', 'Cosmetiqueras', 'Encrespadores', 'Esponjas y aplicadores'] },
      { nombre: 'Otros', items: ['Kits de maquillaje', 'Complementos'] },
    ],
    skincare: [
      { nombre: 'Cuidado facial', items: ['Limpiadores y desmaquillantes', 'Aguas micelares y tónicos', 'Mascarillas', 'Hidratantes y tratamientos', 'Contorno de ojos', 'Exfoliantes faciales', 'Kits'] },
      { nombre: 'Protección solar', items: ['Protector solar', 'Bronceadores'] },
      { nombre: 'Otros cuidado', items: ['Depilación', 'Masajeadores'] },
    ],
    capilar: [
      { nombre: 'Limpieza y tratamientos', items: ['Shampoo', 'Acondicionador', 'Mascarillas y tratamientos', 'Serum y óleos'] },
      { nombre: 'Styling', items: ['Cremas de peinar y desenredantes', 'Fijadores y laca', 'Termoprotectores', 'Mousse y espumas', 'Shampoo seco'] },
      { nombre: 'Eléctricos', items: ['Cepillos eléctricos', 'Planchas', 'Rizadores', 'Secadores'] },
    ],
    accesorios: [
      { nombre: 'Accesorios', items: ['Collares', 'Aretes', 'Manillas'] },
    ],
  };

  // Crear
  form: ProductoForm = this.nuevoForm();
  fileSeleccionado: File | null = null;
  imagenPreviewLocal: string | null = null;
  submittedCrear = false;
  errorsCrear: Partial<Record<keyof ProductoForm, string>> = {};
  dragOverCrear = false;
  dragOverEditar = false;

  // Modal editar
  modalOpen = false;
  modalClosing = false;
  editandoId: string | null = null;
  editForm: ProductoForm = this.nuevoForm();

  // OJO: editFile será el optimizado
  editFile: File | null = null;
  editPreviewLocal: string | null = null;

  submittedEditar = false;
  errorsEditar: Partial<Record<keyof ProductoForm, string>> = {};

  // =========================
  // Filtros
  // =========================
  filtroCategoria: CategoriaSlug | 'todas' = 'todas';
  busqueda = '';

  ngOnInit(): void {
    this.cargarProductos(true);
    this.inicializarSelectsCrear();
  }

  get modalVisible() {
    return this.modalOpen || this.modalClosing;
  }

  // =========================
  // Helpers catálogo
  // =========================
  getGrupos(categoria: CategoriaSlug) {
    return this.catalogo[categoria] ?? [];
  }

  getSubgrupos(categoria: CategoriaSlug, grupo: string) {
    const g = this.getGrupos(categoria).find(x => x.nombre === grupo);
    return g?.items ?? [];
  }

  // Form
  nuevoForm(): ProductoForm {
    return {
      nombre: '',
      descripcion: '',
      precio: null,
      categoria: 'maquillaje',
      grupo: '',
      subgrupo: '',
      imagen: '',
      es_nuevo: true,
      en_oferta: false,
      precio_antes: null,
    };
  }

  inicializarSelectsCrear() {
    const grupos = this.getGrupos(this.form.categoria);
    this.form.grupo = grupos[0]?.nombre ?? '';
    const subs = this.getSubgrupos(this.form.categoria, this.form.grupo);
    this.form.subgrupo = subs[0] ?? '';
  }

  onCategoriaChangeCrear() {
    const grupos = this.getGrupos(this.form.categoria);
    this.form.grupo = grupos[0]?.nombre ?? '';
    const subs = this.getSubgrupos(this.form.categoria, this.form.grupo);
    this.form.subgrupo = subs[0] ?? '';
  }

  onGrupoChangeCrear() {
    const subs = this.getSubgrupos(this.form.categoria, this.form.grupo);
    this.form.subgrupo = subs[0] ?? '';
  }

  limpiarFormularioCrear() {
    if (this.imagenPreviewLocal) {
      try { URL.revokeObjectURL(this.imagenPreviewLocal); } catch {}
    }

    this.form = this.nuevoForm();
    this.fileSeleccionado = null;
    this.imagenPreviewLocal = null;
    this.inicializarSelectsCrear();

    this.submittedCrear = false;
    this.errorsCrear = {};
    this.toast('info', 'Formulario limpio.', 'Info');
  }

  // =========================
  // Cargar productos (paginado)
  // =========================
  async cargarProductos(reset: boolean) {
    if (reset) {
      this.loading = true;
      this.offset = 0;
      this.hasMore = true;
      this.productos = [];
    } else {
      if (!this.hasMore || this.loadingMore) return;
      this.loadingMore = true;
    }

 let query = supabase
  .from('productos')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false });


    if (this.filtroCategoria !== 'todas') {
      query = query.eq('categoria', this.filtroCategoria);
    }

    if (this.busqueda.trim()) {
      query = query.ilike('nombre', `%${this.busqueda.trim()}%`);
    }

    const from = this.offset;
    const to = this.offset + this.pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error cargando productos:', error);
      this.toast('error', 'No se pudieron cargar los productos.', 'Error');
      this.loading = false;
      this.loadingMore = false;
      this.cdr.detectChanges(); // 🔥
      return;
    }


const rows = (data ?? []) as Producto[];
this.productos = [...this.productos, ...rows];

const totalLoaded = this.offset + rows.length;

if (count !== null && totalLoaded >= count) {
  this.hasMore = false;
} else {
  this.offset += this.pageSize;
}


    this.loading = false;
    this.loadingMore = false;
  }

  async aplicarFiltro() {
    await this.cargarProductos(true);
  }

  async cargarMas() {
    await this.cargarProductos(false);
  }

  // =========================
  // 🖼️ OPTIMIZACIÓN (resize + compresión)
  // =========================
  private formatKB(bytes: number) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private async resizeAndCompressImage(
    file: File,
    opts: {
      maxW?: number;
      maxH?: number;
      quality?: number;
      mime?: 'image/webp' | 'image/jpeg';
    } = {}
  ): Promise<File> {
    if (!file.type.startsWith('image/')) return file;

    const maxW = opts.maxW ?? 1400;
    const maxH = opts.maxH ?? 1400;
    const quality = opts.quality ?? 0.82;
    const mime = opts.mime ?? 'image/webp';

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      i.src = URL.createObjectURL(file);
    });

    let w = img.width;
    let h = img.height;

    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    try { URL.revokeObjectURL(img.src); } catch {}

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });

    if (!blob) return file;

    const ext = mime === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newName = `${baseName}.${ext}`;

    return new File([blob], newName, { type: mime, lastModified: Date.now() });
  }

  // =========================
  // ✅ SELECCIÓN DE IMAGEN (AHORA: preview = optimizado)
  // =========================
  private async prepareOptimizedFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast('error', 'Solo se permiten imágenes.', 'Archivo inválido');
      return null;
    }

    // bloquea mientras optimiza
    this.uploadBusy = true;

    const beforeBytes = file.size;

    try {
      const optimized = await this.resizeAndCompressImage(file, {
        maxW: 1400,
        maxH: 1400,
        quality: 0.82,
        mime: 'image/webp',
      });

      const afterBytes = optimized.size;
      const saved = Math.max(0, beforeBytes - afterBytes);
      const pct = beforeBytes > 0 ? Math.round((saved / beforeBytes) * 100) : 0;

      this.toast(
        'info',
        `Optimizada: ${this.formatKB(beforeBytes)} → ${this.formatKB(afterBytes)} (${pct}% menos)`,
        'Imagen'
      );

      return optimized;
    } catch (e) {
      console.error(e);
      this.toast('error', 'No se pudo optimizar la imagen.', 'Error');
      return null;
    } finally {
      this.uploadBusy = false;
    }
  }

  private async setCrearFile(file: File) {
    const optimized = await this.prepareOptimizedFile(file);
    if (!optimized) return;

    // liberar preview anterior
    if (this.imagenPreviewLocal) {
      try { URL.revokeObjectURL(this.imagenPreviewLocal); } catch {}
    }

    // ✅ guardamos el optimizado
    this.fileSeleccionado = optimized;

    // ✅ preview del optimizado
    this.imagenPreviewLocal = URL.createObjectURL(optimized);
  }

  private async setEditarFile(file: File) {
    const optimized = await this.prepareOptimizedFile(file);
    if (!optimized) return;

    if (this.editPreviewLocal) {
      try { URL.revokeObjectURL(this.editPreviewLocal); } catch {}
    }

    // ✅ guardamos el optimizado
    this.editFile = optimized;

    // ✅ preview del optimizado
    this.editPreviewLocal = URL.createObjectURL(optimized);
  }

  // =========================
  // Imagen (create)
  // =========================
  async onFileChangeCrear(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.setCrearFile(input.files[0]);

    // permite volver a seleccionar el mismo archivo y que dispare change
    input.value = '';
  }

  // Drag & drop create
  onDragOverCrear(e: DragEvent) { e.preventDefault(); this.dragOverCrear = true; }
  onDragLeaveCrear() { this.dragOverCrear = false; }
  async onDropCrear(e: DragEvent) {
    e.preventDefault();
    this.dragOverCrear = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) await this.setCrearFile(file);
  }

  // =========================
  // Imagen (edit)
  // =========================
  async onFileChangeEditar(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.setEditarFile(input.files[0]);
    input.value = '';
  }

  // Drag & drop edit
  onDragOverEditar(e: DragEvent) { e.preventDefault(); this.dragOverEditar = true; }
  onDragLeaveEditar() { this.dragOverEditar = false; }
  async onDropEditar(e: DragEvent) {
    e.preventDefault();
    this.dragOverEditar = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) await this.setEditarFile(file);
  }

  // =========================
  // Subir imagen a Supabase Storage
  // (Ahora recibe ya OPTIMIZADA, así que aquí NO re-optimiza)
  // =========================
  async subirImagenAStorage(file: File) {
    try {
      this.uploadBusy = true;

      const ext = file.name.split('.').pop() || 'webp';
      const filePath = `imgs/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('productos')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || 'image/webp',
        });

      if (upErr) {
        console.error('Error subiendo imagen:', upErr);
        this.uploadBusy = false;
        return null;
      }

      const { data } = supabase.storage.from('productos').getPublicUrl(filePath);
      this.uploadBusy = false;
      return data.publicUrl;
    } catch (e) {
      console.error('Error inesperado subiendo imagen:', e);
      this.uploadBusy = false;
      return null;
    }
  }

  // =========================
  // Validación
  // =========================
  private buildErrors(f: ProductoForm): Partial<Record<keyof ProductoForm, string>> {
    const e: Partial<Record<keyof ProductoForm, string>> = {};

    if (!f.nombre?.trim()) e.nombre = 'El nombre es obligatorio.';
    if (f.precio == null || f.precio <= 0) e.precio = 'El precio debe ser mayor a 0.';
    if (!f.categoria) e.categoria = 'La categoría es obligatoria.';
    if (!f.grupo) e.grupo = 'El grupo es obligatorio.';
    if (!f.subgrupo) e.subgrupo = 'El subgrupo es obligatorio.';

    if (f.en_oferta) {
      if (f.precio_antes == null) e.precio_antes = 'El precio antes es obligatorio si está en oferta.';
      else if ((f.precio ?? 0) >= f.precio_antes) e.precio_antes = 'El precio anterior debe ser mayor al actual.';
    }

    return e;
  }

  private hasErrors(e: object) {
    return Object.keys(e).length > 0;
  }

  private focusFirstInvalid() {
    setTimeout(() => {
      const el = document.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea') as HTMLElement | null;
      if (el) el.focus();
    }, 0);
  }

  // =========================
  // CREATE
  // =========================
  async crearProducto() {
    this.submittedCrear = true;
    this.errorsCrear = this.buildErrors(this.form);

    if (this.hasErrors(this.errorsCrear)) {
      this.toast('error', 'Revisa los campos en rojo.', 'Validación');
      this.focusFirstInvalid();
      return;
    }

    this.saving = true;

    // subir imagen si hay archivo (YA optimizado)
    if (this.fileSeleccionado) {
      const url = await this.subirImagenAStorage(this.fileSeleccionado);
      if (!url) {
        this.saving = false;
        this.toast('error', 'No se pudo subir la imagen.', 'Error');
        return;
      }
      this.form.imagen = url;
    }

    const payload = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion?.trim() || null,
      precio: Number(this.form.precio),
      categoria: this.form.categoria,
      grupo: this.form.grupo,
      subgrupo: this.form.subgrupo,
      imagen: this.form.imagen || null,
      es_nuevo: this.form.es_nuevo,
      en_oferta: this.form.en_oferta,
      precio_antes: this.form.en_oferta ? (this.form.precio_antes ?? null) : null,
    };

    const { error } = await supabase.from('productos').insert(payload);

    if (error) {
      console.error('Error creando producto:', error);
      this.saving = false;
      this.toast('error', 'No se pudo crear el producto.', 'Error');
      return;
    }

    this.saving = false;
    this.toast('success', 'Producto creado correctamente.', 'Éxito');

    this.limpiarFormularioCrear();
    await this.cargarProductos(true);
  }

  // =========================
  // MODAL EDITAR
  // =========================
  abrirModalEditar(p: Producto) {
    this.editandoId = p.id;
    this.modalOpen = true;
    this.modalClosing = false;

    this.editForm = {
      nombre: p.nombre || '',
      descripcion: (p.descripcion ?? '') as string,
      precio: p.precio ?? null,
      categoria: p.categoria,
      grupo: (p.grupo ?? '') as string,
      subgrupo: (p.subgrupo ?? '') as string,
      imagen: (p.imagen ?? '') as string,
      es_nuevo: !!p.es_nuevo,
      en_oferta: !!p.en_oferta,
      precio_antes: p.precio_antes ?? null,
    };

    const grupos = this.getGrupos(this.editForm.categoria);
    if (!grupos.find(g => g.nombre === this.editForm.grupo)) {
      this.editForm.grupo = grupos[0]?.nombre ?? '';
    }
    const subs = this.getSubgrupos(this.editForm.categoria, this.editForm.grupo);
    if (!subs.includes(this.editForm.subgrupo)) {
      this.editForm.subgrupo = subs[0] ?? '';
    }

    // limpiar selección anterior
    this.editFile = null;
    if (this.editPreviewLocal) {
      try { URL.revokeObjectURL(this.editPreviewLocal); } catch {}
    }
    this.editPreviewLocal = null;

    this.submittedEditar = false;
    this.errorsEditar = {};
  }

  cerrarModal() {
    if (!this.modalOpen || this.modalClosing) return;

    this.modalClosing = true;

    setTimeout(() => {
      this.modalOpen = false;
      this.modalClosing = false;

      this.editandoId = null;
      this.editFile = null;

      if (this.editPreviewLocal) {
        try { URL.revokeObjectURL(this.editPreviewLocal); } catch {}
      }
      this.editPreviewLocal = null;

      this.submittedEditar = false;
      this.errorsEditar = {};
    }, 160);
  }

  onCategoriaChangeEditar() {
    const grupos = this.getGrupos(this.editForm.categoria);
    this.editForm.grupo = grupos[0]?.nombre ?? '';
    const subs = this.getSubgrupos(this.editForm.categoria, this.editForm.grupo);
    this.editForm.subgrupo = subs[0] ?? '';
  }

  onGrupoChangeEditar() {
    const subs = this.getSubgrupos(this.editForm.categoria, this.editForm.grupo);
    this.editForm.subgrupo = subs[0] ?? '';
  }

  async guardarEdicion() {
    if (!this.editandoId) return;

    this.submittedEditar = true;
    this.errorsEditar = this.buildErrors(this.editForm);

    if (this.hasErrors(this.errorsEditar)) {
      this.toast('error', 'Revisa los campos en rojo.', 'Validación');
      this.focusFirstInvalid();
      return;
    }

    this.saving = true;

    // subir imagen si cambió (YA optimizada)
    if (this.editFile) {
      const url = await this.subirImagenAStorage(this.editFile);
      if (!url) {
        this.saving = false;
        this.toast('error', 'No se pudo subir la imagen.', 'Error');
        return;
      }
      this.editForm.imagen = url;
    }

    const payload = {
      nombre: this.editForm.nombre.trim(),
      descripcion: this.editForm.descripcion?.trim() || null,
      precio: Number(this.editForm.precio),
      categoria: this.editForm.categoria,
      grupo: this.editForm.grupo,
      subgrupo: this.editForm.subgrupo,
      imagen: this.editForm.imagen || null,
      es_nuevo: this.editForm.es_nuevo,
      en_oferta: this.editForm.en_oferta,
      precio_antes: this.editForm.en_oferta ? (this.editForm.precio_antes ?? null) : null,
    };

    const { error } = await supabase.from('productos').update(payload).eq('id', this.editandoId);

    if (error) {
      console.error('Error actualizando producto:', error);
      this.saving = false;
      this.toast('error', 'No se pudo actualizar el producto.', 'Error');
      return;
    }

    this.saving = false;
    this.toast('success', 'Producto actualizado.', 'Éxito');
    this.cerrarModal();
    await this.cargarProductos(true);
  }

  // =========================
  // DELETE
  // =========================
  async eliminar(p: Producto) {
    const ok = confirm(`¿Eliminar "${p.nombre}"?`);
    if (!ok) return;

    const { error } = await supabase.from('productos').delete().eq('id', p.id);

    if (error) {
      console.error('Error eliminando producto:', error);
      this.toast('error', 'No se pudo eliminar el producto.', 'Error');
      return;
    }

    this.toast('success', 'Producto eliminado.', 'Éxito');
    await this.cargarProductos(true);
  }
}
