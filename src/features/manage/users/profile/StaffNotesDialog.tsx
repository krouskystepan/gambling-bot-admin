'use client'

import { Pencil, StickyNote, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Fragment, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  deleteUserStaffNote,
  updateUserStaffNote
} from '@/actions/database/userModeration.action'
import type { UserProfileStaffNote } from '@/actions/database/userProfile.action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { fieldControlVariants } from '@/components/ui/field-styles'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { formatModerationWhen } from './formatModerationWhen'

type StaffNotesDialogProps = {
  guildId: string
  userId: string
  managerId: string
  isGuildAdmin: boolean
  notes: UserProfileStaffNote[]
}

const noteTextareaClass = cn(
  fieldControlVariants(),
  'min-h-16 resize-y px-3 py-2'
)

const actionButtonClass =
  'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50'

const StaffNotesDialog = ({
  guildId,
  userId,
  managerId,
  isGuildAdmin,
  notes
}: StaffNotesDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const refresh = () => router.refresh()

  const canManage = (note: UserProfileStaffNote) =>
    isGuildAdmin || note.authorId === managerId

  const startEdit = (note: UserProfileStaffNote) => {
    setEditingId(note.noteId)
    setEditDraft(note.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleUpdate = async (noteId: string) => {
    if (!editDraft.trim()) return

    setPendingId(noteId)
    try {
      const result = await updateUserStaffNote(
        guildId,
        userId,
        noteId,
        editDraft
      )
      if (result.success) {
        toast.success(result.message)
        cancelEdit()
        refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to update note')
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setPendingId(deleteId)
    try {
      const result = await deleteUserStaffNote(guildId, userId, deleteId)
      if (result.success) {
        toast.success(result.message)
        if (editingId === deleteId) cancelEdit()
        refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setPendingId(null)
      setDeleteId(null)
    }
  }

  const countLabel =
    notes.length === 0
      ? 'No staff notes'
      : notes.length === 1
        ? '1 staff note'
        : `${notes.length} staff notes`

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative size-9 shrink-0"
                aria-label={countLabel}
              >
                <StickyNote className="size-4" />
                {notes.length > 0 ? (
                  <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                    {notes.length > 99 ? '99+' : notes.length}
                  </span>
                ) : null}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Staff notes</TooltipContent>
        </Tooltip>

        <DialogContent className="gap-4 sm:max-w-4xl">
          <DialogHeader className="gap-1">
            <DialogTitle>Staff notes</DialogTitle>
            <DialogDescription className="sr-only">
              Manual staff notes for this user.
            </DialogDescription>
          </DialogHeader>

          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff notes yet.</p>
          ) : (
            <div className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 w-44 px-3">When</TableHead>
                    <TableHead className="h-9 w-32 px-3">Staff</TableHead>
                    <TableHead className="h-9 px-3">Note</TableHead>
                    <TableHead className="h-9 w-20 px-2 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => {
                    const isEditing = editingId === note.noteId
                    const isPending = pendingId === note.noteId

                    return (
                      <Fragment key={note.noteId}>
                        <TableRow>
                          <TableCell className="px-3 py-2 align-middle text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatModerationWhen(note.createdAt)}
                          </TableCell>
                          <TableCell className="px-3 py-2 align-middle text-sm font-medium">
                            {note.authorUsername ?? note.authorId}
                          </TableCell>
                          <TableCell className="px-3 py-2 align-middle">
                            <p className="whitespace-pre-wrap text-sm leading-snug">
                              {note.text}
                            </p>
                          </TableCell>
                          <TableCell className="px-2 py-2 align-middle text-right">
                            {canManage(note) ? (
                              <div className="inline-flex items-center gap-0.5">
                                <button
                                  type="button"
                                  className={actionButtonClass}
                                  aria-label="Edit note"
                                  disabled={isPending}
                                  onClick={() =>
                                    isEditing ? cancelEdit() : startEdit(note)
                                  }
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className={cn(
                                    actionButtonClass,
                                    'text-destructive hover:text-destructive'
                                  )}
                                  aria-label="Delete note"
                                  disabled={isPending}
                                  onClick={() => setDeleteId(note.noteId)}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                        {isEditing ? (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={4} className="px-3 py-3">
                              <div className="space-y-2">
                                <textarea
                                  value={editDraft}
                                  onChange={(event) =>
                                    setEditDraft(event.target.value)
                                  }
                                  className={noteTextareaClass}
                                  maxLength={500}
                                  rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEdit}
                                    disabled={isPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleUpdate(note.noteId)}
                                    disabled={isPending || !editDraft.trim()}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be removed permanently for all staff.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default StaffNotesDialog
