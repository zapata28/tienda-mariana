import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin implements OnInit {
  loading = true;
  saving = false;
  uploadBusy = false;

  productos: Producto[] = [];

  // =========================
  // Catálogo (Categoría → Grupo → Subgrupo)
  // =========================
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

  // =========================
  // Crear (form superior)
  // =========================
  form: ProductoForm = this.nuevoForm();
  fileSeleccionado: File | null = null;
  imagenPreviewLocal: string | null = null;

  // Validaciones visuales (crear)
  submittedCrear = false;
  errorsCrear: Partial<Record<keyof ProductoForm, string>> = {};

  // =========================
  // Modal editar (pro)
  // =========================
  modalOpen = false;
  modalClosing = false; // para animación de cierre real
  editandoId: string | null = null;
  editForm: ProductoForm = this.nuevoForm();

  editFile: File | null = null;
  editPreviewLocal: string | null = null;

  // Validaciones visuales (editar)
  submittedEditar = false;
  errorsEditar: Partial<Record<keyof ProductoForm, string>> = {};

  // =========================
  // Filtros admin
  // =========================
  filtroCategoria: CategoriaSlug | 'todas' = 'todas';
  busqueda = '';

  ngOnInit(): void {
    this.cargarProductos();
    this.inicializarSelectsCrear();
  }

  // Modal visible mientras abre o cierra (para animación)
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

  // =========================
  // Form create
  // =========================
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
    this.form = this.nuevoForm();
    this.fileSeleccionado = null;
    this.imagenPreviewLocal = null;
    this.inicializarSelectsCrear();

    // reset validación visual
    this.submittedCrear = false;
    this.errorsCrear = {};
  }

  // =========================
  // Listar productos
  // =========================
  async cargarProductos() {
    this.loading = true;

    let query = supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (this.filtroCategoria !== 'todas') {
      query = query.eq('categoria', this.filtroCategoria);
    }

    if (this.busqueda.trim()) {
      query = query.ilike('nombre', `%${this.busqueda.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error cargando productos:', error);
      this.productos = [];
      this.loading = false;
      return;
    }

    this.productos = (data ?? []) as Producto[];
    this.loading = false;
  }

  async aplicarFiltro() {
    await this.cargarProductos();
  }

  // =========================
  // Imagen (create)
  // =========================
  onFileChangeCrear(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fileSeleccionado = file;
    this.imagenPreviewLocal = URL.createObjectURL(file);
  }

  // =========================
  // Imagen (edit)
  // =========================
  onFileChangeEditar(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.editFile = file;
    this.editPreviewLocal = URL.createObjectURL(file);
  }

  async subirImagenAStorage(file: File) {
    try {
      this.uploadBusy = true;

      const ext = file.name.split('.').pop() || 'png';
      const filePath = `imgs/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('productos')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || 'image/png',
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
  // Validación visual (errors por campo)
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
    // intenta enfocar el primer input/select/textarea marcado como invalid
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
      this.focusFirstInvalid();
      return;
    }

    this.saving = true;

    // subir imagen si hay archivo
    if (this.fileSeleccionado) {
      const url = await this.subirImagenAStorage(this.fileSeleccionado);
      if (!url) {
        this.saving = false;
        return alert('No se pudo subir la imagen.');
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
      return alert('❌ Error creando producto: ' + error.message);
    }

    this.saving = false;
    alert('✅ Producto creado');
    this.limpiarFormularioCrear();
    await this.cargarProductos();
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

    // acomodar al catálogo
    const grupos = this.getGrupos(this.editForm.categoria);
    if (!grupos.find(g => g.nombre === this.editForm.grupo)) {
      this.editForm.grupo = grupos[0]?.nombre ?? '';
    }
    const subs = this.getSubgrupos(this.editForm.categoria, this.editForm.grupo);
    if (!subs.includes(this.editForm.subgrupo)) {
      this.editForm.subgrupo = subs[0] ?? '';
    }

    this.editFile = null;
    this.editPreviewLocal = null;

    // reset validación
    this.submittedEditar = false;
    this.errorsEditar = {};
  }

  cerrarModal() {
    if (!this.modalOpen || this.modalClosing) return;

    // activa animación cierre
    this.modalClosing = true;

    // después de animación, realmente lo escondes
    setTimeout(() => {
      this.modalOpen = false;
      this.modalClosing = false;
      this.editandoId = null;
      this.editFile = null;
      this.editPreviewLocal = null;

      this.submittedEditar = false;
      this.errorsEditar = {};
    }, 160); // debe calzar con CSS popOut/fadeOut (0.16s)
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
      this.focusFirstInvalid();
      return;
    }

    this.saving = true;

    // subir imagen si cambió
    if (this.editFile) {
      const url = await this.subirImagenAStorage(this.editFile);
      if (!url) {
        this.saving = false;
        return alert('No se pudo subir la imagen.');
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
      return alert('❌ Error actualizando: ' + error.message);
    }

    this.saving = false;
    alert('✅ Producto actualizado');
    this.cerrarModal();
    await this.cargarProductos();
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
      return alert('❌ Error eliminando: ' + error.message);
    }

    alert('✅ Producto eliminado');
    await this.cargarProductos();
  }
}
