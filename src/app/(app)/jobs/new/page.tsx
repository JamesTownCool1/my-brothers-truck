'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  AddressAutocomplete,
  type AddressValue,
} from '@/components/map/AddressAutocomplete';
import { JobMap } from '@/components/map/JobMap';
import {
  estimatePriceCents,
  formatDistance,
  formatPrice,
  haversineMeters,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

type Size = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';

const SIZES: { key: Size; label: string; hint: string }[] = [
  { key: 'SMALL',  label: 'Small',  hint: 'Boxes, small bags' },
  { key: 'MEDIUM', label: 'Medium', hint: 'TV, desk, mattress' },
  { key: 'LARGE',  label: 'Large',  hint: 'Couch, fridge' },
  { key: 'XLARGE', label: 'Extra',  hint: 'Multiple big items' },
];

/**
 * Post-a-job form. Live distance + price estimate updates as soon as
 * both addresses are resolved to coordinates.
 *
 * Note: the server recomputes distance + price from scratch on submit —
 * the client-side numbers are purely a preview for UX, never trusted.
 */
export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState<Size>('MEDIUM');
  const [pickup, setPickup] = useState<AddressValue | undefined>();
  const [dropoff, setDropoff] = useState<AddressValue | undefined>();
  const [preferredTime, setPreferredTime] = useState(
    // default: 2 hours from now, rounded to the hour
    (() => {
      const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      return d.toISOString().slice(0, 16);
    })()
  );
  const [budget, setBudget] = useState(''); // optional dollars
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live estimate
  const estimate = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const d = haversineMeters(pickup, dropoff);
    return { distance: d, price: estimatePriceCents({ distanceMeters: d, size }) };
  }, [pickup, dropoff, size]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setImageUrl(url);
      toast.success('Image added');
    } catch {
      toast.error('Could not upload image');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) {
      toast.error('Please set both pickup and dropoff locations');
      return;
    }
    setLoading(true);

    const body = {
      title,
      description,
      size,
      pickupAddress: pickup.address,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffAddress: dropoff.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      preferredTime: new Date(preferredTime).toISOString(),
      imageUrl: imageUrl || undefined,
      budgetCents: budget ? Math.round(parseFloat(budget) * 100) : undefined,
    };

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Could not post job');
      return;
    }

    const { job } = await res.json();
    toast.success('Job posted! Nearby helpers are being notified.');
    router.push(`/jobs/${job.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-6"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div className="stamp text-ink-600">New Job</div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight">
        What needs moving?
      </h1>
      <p className="mt-2 text-ink-600">
        The more detail, the better the match.
      </p>

      <form onSubmit={onSubmit} className="mt-10 grid lg:grid-cols-3 gap-8">
        {/* Left: form fields */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 space-y-5">
            <Input
              label="Title"
              placeholder="e.g. 65-inch TV from Best Buy"
              required maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Description"
              placeholder="Describe the item(s): dimensions, weight, whether you'll help load, access notes (stairs, elevators)..."
              required maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Size chips */}
            <div>
              <label className="text-sm font-medium text-ink-800">Size</label>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SIZES.map((s) => {
                  const active = size === s.key;
                  return (
                    <button
                      type="button"
                      key={s.key}
                      onClick={() => setSize(s.key)}
                      className={cn(
                        'rounded-xl border-2 p-3 text-left transition-all',
                        active
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-ink-200 hover:border-ink-400'
                      )}
                    >
                      <Package size={18} className={active ? 'text-brand-600' : 'text-ink-500'} />
                      <div className="mt-2 text-sm font-semibold">{s.label}</div>
                      <div className="text-[11px] text-ink-500">{s.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="text-sm font-medium text-ink-800">
                Photo (optional)
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Job"
                      className="h-24 w-24 object-cover rounded-lg border-2 border-ink-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-2 -right-2 bg-ink-900 text-white rounded-full h-6 w-6 text-xs"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-24 w-24 rounded-lg border-2 border-dashed border-ink-300 cursor-pointer hover:bg-ink-50">
                    <span className="text-xs text-ink-500 text-center px-2">
                      {uploading ? 'Uploading...' : 'Add photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
                <p className="text-xs text-ink-500 max-w-xs">
                  Helps helpers estimate if it&rsquo;ll fit. Up to 5 MB.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="font-display text-lg font-bold">Locations</h3>
            <AddressAutocomplete
              label="Pickup address"
              placeholder="Where are we picking it up?"
              value={pickup}
              onChange={setPickup}
            />
            <AddressAutocomplete
              label="Dropoff address"
              placeholder="Where are we dropping it off?"
              value={dropoff}
              onChange={setDropoff}
            />

            {pickup && dropoff && (
              <JobMap pickup={pickup} dropoff={dropoff} height={240} />
            )}
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="font-display text-lg font-bold">Timing & Budget</h3>
            <Input
              label="Preferred time"
              type="datetime-local"
              required
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />
            <Input
              label="Your budget (optional)"
              type="number"
              min={5} step={1}
              placeholder="e.g. 50"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              hint="Leave blank to use our estimate. Your offer shouldn't be below our estimate."
            />
          </Card>
        </div>

        {/* Right: price summary (sticky) */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
                Estimate
              </div>
              {estimate ? (
                <>
                  <div className="mt-2 font-display text-5xl font-black text-brand-500">
                    {formatPrice(estimate.price)}
                  </div>
                  <div className="mt-1 text-sm text-ink-600">
                    {formatDistance(estimate.distance)} · {size.toLowerCase()} load
                  </div>
                  <div className="mt-4 text-xs text-ink-500 leading-relaxed">
                    Includes a $15 base fee + mileage, scaled for load size. The final
                    price is set by the helper when they accept.
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-ink-500">
                  Set pickup and dropoff to see your estimate.
                </div>
              )}
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={!pickup || !dropoff || !title || !description}
            >
              Post Job
            </Button>

            <p className="text-xs text-center text-ink-500">
              You&rsquo;ll be charged only after the job is completed.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
