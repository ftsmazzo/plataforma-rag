import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface EditMetadataDialogProps {
  documentId: number;
  currentTags?: string;
  currentDescription?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EditMetadataDialog({
  documentId,
  currentTags = "",
  currentDescription = "",
  trigger,
  onSuccess,
}: EditMetadataDialogProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(currentTags);
  const [description, setDescription] = useState(currentDescription);
  const [tagInput, setTagInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const utils = trpc.useUtils();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTags(currentTags);
      setDescription(currentDescription);
      setTagInput("");
      setIsGenerating(false);
    }
  }, [open, currentTags, currentDescription]);

  const generateTagsMutation = trpc.documents.generateTags.useMutation({
    onSuccess: (data) => {
      const generatedTags = data.tags.join(",");
      setTags(generatedTags);
      setIsGenerating(false);
      toast.success(`${data.tags.length} tags geradas automaticamente!`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Erro ao gerar tags: ${error.message}`);
    },
  });

  const updateMutation = trpc.documents.updateMetadata.useMutation({
    onSuccess: () => {
      toast.success("Metadados atualizados com sucesso!");
      utils.documents.list.invalidate();
      utils.documents.get.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: documentId,
      tags,
      description,
    });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const currentTagsList = tags ? tags.split(",").map(t => t.trim()) : [];
    if (currentTagsList.includes(tagInput.trim())) {
      toast.error("Tag já existe");
      return;
    }
    
    const newTags = [...currentTagsList, tagInput.trim()].join(",");
    setTags(newTags);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTagsList = tags.split(",").map(t => t.trim());
    const newTags = currentTagsList.filter(t => t !== tagToRemove).join(",");
    setTags(newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleGenerateTags = () => {
    setIsGenerating(true);
    generateTagsMutation.mutate({ documentId });
  };

  const tagsList = tags ? tags.split(",").map(t => t.trim()).filter(t => t) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar Metadados
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Metadados</DialogTitle>
            <DialogDescription>
              Adicione tags e descrição para organizar melhor seus documentos
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="tags">Tags</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTags}
                  disabled={isGenerating || generateTagsMutation.isPending}
                >
                  {isGenerating || generateTagsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3 w-3" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Digite uma tag e pressione Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Adicionar
                </Button>
              </div>
              
              {tagsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagsList.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Adicione uma descrição para este documento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
