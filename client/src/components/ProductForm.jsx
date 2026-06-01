import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import Modal from './Modal.jsx';
import Select from './Select.jsx';
import { resolveImageUrl } from '../utils/format.js';
import { createProduct, updateProduct } from '../services/productService.js';

const STATUSES = ['active', 'inactive', 'discontinued'];

const emptyForm = {
  productName: '',
  sku: '',
  category: '',
  description: '',
  price: '',
  stockQuantity: '',
  reorderLevel: '',
  supplierName: '',
  status: 'active',
};

const toFormState = (product) => {
  if (!product) return { ...emptyForm };
  return {
    productName: product.productName ?? '',
    sku: product.sku ?? '',
    category: product.category ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    stockQuantity: product.stockQuantity ?? 0,
    reorderLevel: product.reorderLevel ?? 0,
    supplierName: product.supplierName ?? '',
    status: product.status ?? 'active',
  };
};

export default function ProductForm({
  open,
  onClose,
  onSaved,
  product,
  categoriesHint = [],
}) {
  const isEdit = !!product;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(product));
    setErrors({});
    setFile(null);
    setRemoveImage(false);
    setPreview(product?.productImage ? resolveImageUrl(product.productImage) : '');
  }, [open, product]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onField = (k) => (ev) => {
    const value = ev?.target ? ev.target.value : ev;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const onSelectFile = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      toast.error('Please choose an image file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(f);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(f));
  };

  const onClearImage = () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = 'Product name is required';
    else if (form.productName.trim().length < 2) e.productName = 'Must be at least 2 characters';

    if (!form.sku.trim()) e.sku = 'SKU is required';
    else if (!/^[A-Z0-9_-]+$/i.test(form.sku.trim()))
      e.sku = 'Only letters, numbers, dashes and underscores';

    if (!form.category.trim()) e.category = 'Category is required';

    const price = Number(form.price);
    if (form.price === '' || form.price === null) e.price = 'Price is required';
    else if (!Number.isFinite(price) || price < 0) e.price = 'Must be a non-negative number';

    const stock = Number(form.stockQuantity);
    if (form.stockQuantity === '' || form.stockQuantity === null) {
      // ok — defaults to 0 server-side
    } else if (!Number.isFinite(stock) || stock < 0) {
      e.stockQuantity = 'Must be 0 or greater';
    }

    const reorder = Number(form.reorderLevel);
    if (form.reorderLevel !== '' && form.reorderLevel !== null) {
      if (!Number.isFinite(reorder) || reorder < 0) e.reorderLevel = 'Must be 0 or greater';
    }

    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    const payload = {
      productName: form.productName.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stockQuantity: form.stockQuantity === '' ? 0 : Number(form.stockQuantity),
      reorderLevel: form.reorderLevel === '' ? 0 : Number(form.reorderLevel),
      supplierName: form.supplierName.trim(),
      status: form.status,
    };
    if (isEdit && removeImage && !file) payload.removeImage = 'true';

    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateProduct(product._id, { payload, file })
        : await createProduct({ payload, file });
      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const datalistId = useMemo(() => `categories-${Math.random().toString(36).slice(2)}`, []);

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      closeOnBackdrop={!submitting}
      title={isEdit ? 'Edit product' : 'Add new product'}
      description={
        isEdit
          ? `Updating ${product?.productName || 'product'}`
          : 'Add a product to your catalog. Fields marked with * are required.'
      }
      size="xl"
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="modal-body">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Image */}
          <div className="lg:col-span-1">
            <label className="label">Product image</label>
            <div className="overflow-hidden rounded-xl border border-dashed border-white/15 bg-surface-elevated/60 p-3">
              <div className="mx-auto flex aspect-square max-h-36 w-full max-w-[9rem] items-center justify-center overflow-hidden rounded-lg bg-surface-base sm:max-h-44 lg:mx-0 lg:max-h-none lg:max-w-none">
                {preview ? (
                  <img src={preview} alt="Product preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-secondary flex-1 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <ImagePlus className="h-4 w-4" />
                  {preview ? 'Replace' : 'Upload'}
                </button>
                {preview && (
                  <button
                    type="button"
                    className="btn-secondary text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                    onClick={onClearImage}
                    disabled={submitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={onSelectFile}
                disabled={submitting}
              />
              <p className="mt-2 text-[11px] text-slate-500">
                JPG, PNG, WEBP or GIF · max 5 MB
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            <div className="sm:col-span-2">
              <label htmlFor="pf-name" className="label">Product name *</label>
              <input
                id="pf-name"
                type="text"
                className="input"
                value={form.productName}
                onChange={onField('productName')}
                disabled={submitting}
                placeholder="e.g. Wireless Mouse"
              />
              {errors.productName && <p className="mt-1 text-xs text-rose-600">{errors.productName}</p>}
            </div>

            <div>
              <label htmlFor="pf-sku" className="label">SKU *</label>
              <input
                id="pf-sku"
                type="text"
                className="input uppercase"
                value={form.sku}
                onChange={onField('sku')}
                disabled={submitting}
                placeholder="e.g. WM-001"
              />
              {errors.sku && <p className="mt-1 text-xs text-rose-600">{errors.sku}</p>}
            </div>

            <div>
              <label htmlFor="pf-category" className="label">Category *</label>
              <input
                id="pf-category"
                type="text"
                list={datalistId}
                className="input"
                value={form.category}
                onChange={onField('category')}
                disabled={submitting}
                placeholder="e.g. Electronics"
              />
              <datalist id={datalistId}>
                {categoriesHint.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="pf-price" className="label">Price (₹) *</label>
              <input
                id="pf-price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={onField('price')}
                disabled={submitting}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="pf-status" className="label">Status</label>
              <Select
                id="pf-status"
                className="capitalize"
                value={form.status}
                onChange={onField('status')}
                disabled={submitting}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="pf-stock" className="label">Stock quantity</label>
              <input
                id="pf-stock"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.stockQuantity}
                onChange={onField('stockQuantity')}
                disabled={submitting}
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-xs text-rose-600">{errors.stockQuantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="pf-reorder" className="label">Reorder level</label>
              <input
                id="pf-reorder"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.reorderLevel}
                onChange={onField('reorderLevel')}
                disabled={submitting}
                placeholder="0"
              />
              {errors.reorderLevel && (
                <p className="mt-1 text-xs text-rose-600">{errors.reorderLevel}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                Low-stock alert triggers when stock falls below this level.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pf-supplier" className="label">Supplier name</label>
              <input
                id="pf-supplier"
                type="text"
                className="input"
                value={form.supplierName}
                onChange={onField('supplierName')}
                disabled={submitting}
                placeholder="Optional"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pf-desc" className="label">Description</label>
              <textarea
                id="pf-desc"
                rows={3}
                className="input resize-y"
                value={form.description}
                onChange={onField('description')}
                disabled={submitting}
                placeholder="Optional product details"
              />
            </div>
          </div>
        </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create product
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
