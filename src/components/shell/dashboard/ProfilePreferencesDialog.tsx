'use client'

import { useTheme } from 'next-themes'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  LANDING_SECTION_OPTIONS,
  type LandingSectionId,
  type ProfilePreferences,
  type ProfileTheme,
  TOAST_POSITION_LABELS,
  TOAST_POSITION_OPTIONS,
  type ToastPosition,
  useProfilePreferences
} from '@/lib/preferences/profilePreferences'

type ProfilePreferencesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SwitchFieldProps = {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const SwitchField = ({
  id,
  label,
  description,
  checked,
  onCheckedChange
}: SwitchFieldProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="grid gap-0.5">
      <Label htmlFor={id}>{label}</Label>
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
)

const ProfilePreferencesDialog = ({
  open,
  onOpenChange
}: ProfilePreferencesDialogProps) => {
  const { setTheme } = useTheme()
  const { preferences, persist } = useProfilePreferences()
  const [draft, setDraft] = useState(preferences)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(preferences)
    }
  }

  const patchDraft = (patch: Partial<ProfilePreferences>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const handleSave = () => {
    persist(draft)
    setTheme(draft.theme)
    onOpenChange(false)
  }

  const isDirty =
    draft.theme !== preferences.theme ||
    draft.tableDensity !== preferences.tableDensity ||
    draft.landingSection !== preferences.landingSection ||
    draft.reduceMotion !== preferences.reduceMotion ||
    draft.richToasts !== preferences.richToasts ||
    draft.toastPosition !== preferences.toastPosition

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>
            Appearance, toasts, and guild landing. Saved on this device only.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          <div className="grid gap-2">
            <Label htmlFor="profile-pref-theme">Theme</Label>
            <Select
              value={draft.theme}
              onValueChange={(value) =>
                patchDraft({ theme: value as ProfileTheme })
              }
            >
              <SelectTrigger id="profile-pref-theme" variant="muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SwitchField
            id="profile-pref-compact"
            label="Compact tables"
            description="Tighter row padding on main data tables."
            checked={draft.tableDensity === 'compact'}
            onCheckedChange={(checked) =>
              patchDraft({
                tableDensity: checked ? 'compact' : 'comfortable'
              })
            }
          />

          <SwitchField
            id="profile-pref-motion"
            label="Reduce motion"
            description="Minimize animations and transitions."
            checked={draft.reduceMotion}
            onCheckedChange={(checked) => patchDraft({ reduceMotion: checked })}
          />

          <SwitchField
            id="profile-pref-rich-toasts"
            label="Rich toast colors"
            description="Colored success and error toasts."
            checked={draft.richToasts}
            onCheckedChange={(checked) => patchDraft({ richToasts: checked })}
          />

          <div className="grid gap-2">
            <Label htmlFor="profile-pref-toast-position">Toast position</Label>
            <Select
              value={draft.toastPosition}
              onValueChange={(value) =>
                patchDraft({ toastPosition: value as ToastPosition })
              }
            >
              <SelectTrigger id="profile-pref-toast-position" variant="muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOAST_POSITION_OPTIONS.map((position) => (
                  <SelectItem key={position} value={position}>
                    {TOAST_POSITION_LABELS[position]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-pref-landing">Guild landing</Label>
            <Select
              value={draft.landingSection}
              onValueChange={(value) =>
                patchDraft({ landingSection: value as LandingSectionId })
              }
            >
              <SelectTrigger id="profile-pref-landing" variant="muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANDING_SECTION_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isDirty}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProfilePreferencesDialog
