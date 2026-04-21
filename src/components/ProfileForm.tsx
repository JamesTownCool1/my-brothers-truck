'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { Avatar, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { AddressAutocomplete, type AddressValue } from '@/components/map/AddressAutocomplete';
import type { UserRole } from '@prisma/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  bio: string | null;
  image: string | null;
  role: UserRole;
  isHelperActive: boolean;
  baseLat: number | null;
  baseLng: number | null;
  baseAddress: string | null;
  avgRating: number;
  ratingCount: number;
}

/**
 * ProfileForm — editable profile.
 *
 * Notable: role is editable here. Flipping from CUSTOMER to HELPER calls
 * `session.update()` so the JWT picks up the new role and unlocks
 * helper-only pages immediately — no need to sign out and back in.
 */
export function ProfileForm({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { update } = useSession();

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? '',
    bio: user.bio ?? '',
    image: user.image ?? '',
    role: user.role,
  });
  const [base, setBase] = useState<AddressValue | undefined>(
    user.baseLat != null && user.baseLng != null
      ? { lat: user.baseLat, lng: user.baseLng, address: user.baseAddress ?? '' }
      : undefined
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setForm((f) => ({ ...f, image: url }));
      toast.success('Photo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          bio: form.bio || undefined,
          image: form.image || undefined,
          role: form.role,
          baseLat: base?.lat,
          baseLng: base?.lng,
          baseAddress: base?.address,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Save failed');
      }
      // Refresh the JWT so the client picks up any role/name change
      await update({ role: form.role, name: form.name });
      toast.success('Profile saved');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6">
      {/* Avatar + stats */}
      <Card className="p-6 flex flex-wrap items-center gap-6">
        <div className="relative">
          <Avatar src={form.image} name={form.name} size={96} />
          <label className="absolute -bottom-1 -right-1 grid place-items-center h-9 w-9 rounded-full bg-ink-900 text-white cursor-pointer hover:bg-ink-800">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhoto}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            {user.email}
          </div>
          <div className="font-display text-2xl font-bold">{form.name || 'Unnamed'}</div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {user.ratingCount > 0 ? (
              <>
                <StarRating value={user.avgRating} size={14} readOnly />
                <span className="text-ink-600">
                  {user.avgRating.toFixed(1)} · {user.ratingCount} reviews
                </span>
              </>
            ) : (
              <span className="text-ink-500">No reviews yet</span>
            )}
          </div>
        </div>
      </Card>

      {/* Basics */}
      <Card className="p-6 space-y-5">
        <h2 className="font-display text-xl font-bold">Basics</h2>
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required maxLength={80}
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1 555 123 4567"
          hint="Only shown to the other party on an active job."
        />
        <Textarea
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="A sentence or two about you — what you drive, when you're usually free, anything you won't haul."
          maxLength={500}
        />
      </Card>

      {/* Role */}
      <Card className="p-6 space-y-5">
        <h2 className="font-display text-xl font-bold">Role</h2>
        <p className="text-sm text-ink-600">
          Switch to helper mode to see the job board and start earning. You can switch back anytime.
        </p>
        <Select
          label="I am a..."
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
        >
          <option value="CUSTOMER">Customer (I need things moved)</option>
          <option value="HELPER">Helper (I have a truck)</option>
          {user.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
        </Select>
      </Card>

      {/* Base location (helpers) */}
      {form.role === 'HELPER' && (
        <Card className="p-6 space-y-5">
          <h2 className="font-display text-xl font-bold">Base location</h2>
          <p className="text-sm text-ink-600">
            Where you usually start from. Jobs near this spot will be shown first
            and we&rsquo;ll ping you about new ones.
          </p>
          <AddressAutocomplete
            label="Home base address"
            placeholder="123 Main St, Your City"
            value={base}
            onChange={setBase}
          />
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
