import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type GoalActionsMenuProps = {
  goalName: string;
  /** Each action receives the menu button, to give focus back to it later. */
  onEdit: (actionsButton: HTMLButtonElement | null) => void;
  onDelete: (actionsButton: HTMLButtonElement | null) => void;
};

export function GoalActionsMenu({
  goalName,
  onEdit,
  onDelete,
}: GoalActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    // Non-modal, so a dialog opened from an item can take over focus.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon"
          aria-label={`Ações para "${goalName}"`}
          className="size-9 rounded-full hover:bg-secondary focus-visible:ring-ring aria-expanded:bg-secondary"
        >
          <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-xl border-2 border-foreground p-1.5 shadow-none ring-0"
      >
        <DropdownMenuItem
          onSelect={() => onEdit(buttonRef.current)}
          className="h-9 px-2.5 text-sm"
        >
          <PencilIcon aria-hidden="true" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(buttonRef.current)}
          className="h-9 px-2.5 text-sm"
        >
          <Trash2Icon aria-hidden="true" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
