import apiFetch from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { convertPdfToImages, getPdfPageCount, MAX_PDF_PAGES } from '@/utils/pdfToImages';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, Edit, Eye, EyeOff, File, FileText, GripVertical, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Category, Lecture, LectureSlide, Subject } from '@/interfaces/admin';

// Sortable Lecture Card Component
const SortableLectureCard = ({ 
  lecture, 
  onEdit, 
  onDelete, 
  onUpload, 
  onTogglePublish,
  categories,
  subjects,
}: { 
  lecture: Lecture;
  onEdit: () => void;
  onDelete: () => void;
  onUpload: () => void;
  onTogglePublish: () => void;
  categories: Category[];
  subjects: Subject[];
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lecture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="group hover:border-primary/50 transition-colors"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">#{lecture.sort_order}</Badge>
                <CardTitle className="text-lg truncate">{lecture.title}</CardTitle>
                <Badge variant={lecture.is_published ? 'default' : 'secondary'}>
                  {lecture.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const cat = categories.find(c => c.id === lecture.category_id)?.name || '';
                  const sub = subjects.find(s => s.id === lecture.subject_id)?.name || '';
                  return (
                    <>{cat} {sub ? `• ${sub}` : ''} • {lecture.view_count} views</>
                  );
                })()}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onUpload}
              title="Upload slides"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePublish}
              title={lecture.is_published ? 'Unpublish' : 'Publish'}
            >
              {lecture.is_published ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {lecture.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {lecture.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

const AdminLectures = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, stage: '' });
  const [existingSlides, setExistingSlides] = useState<LectureSlide[]>([]);
  const [slidePreviewUrls, setSlidePreviewUrls] = useState<Record<string, string>>({});
  const [driveFileId, setDriveFileId] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [pdfWarning, setPdfWarning] = useState<{ show: boolean; totalPages: number; willProcess: number } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    subject_id: '',
    is_published: false,
    is_free_preview: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = async () => {
    try {
      const [lecturesRes, categoriesRes, subjectsRes] = await Promise.all([
        apiFetch('/lectures'),
        apiFetch('/categories'),
        apiFetch('/subjects'),
      ]);

      const lbody = await lecturesRes.json();
      const cbody = await categoriesRes.json();
      const sbody = await subjectsRes.json();

      const rawLectures = lbody?.data || [];
      const cats = cbody?.data || [];
      const subs = sbody?.data || [];

      // Normalize backend camelCase to frontend expected snake_case fields
      const mapped = rawLectures.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category_id: l.categoryId ?? l.category_id,
        subject_id: l.subjectId ?? l.subject_id ?? null,
        is_published: l.published ?? l.is_published ?? false,
        is_free_preview: l.isFreePreview ?? l.is_free_preview ?? false,
        view_count: l.viewCount ?? l.view_count ?? 0,
        created_at: l.createdAt ?? l.created_at,
        sort_order: l.order ?? l.sort_order ?? 0,
      }));

      setLectures(mapped);
      setCategories(cats.map((c: any) => ({ ...c })));
      // normalize subject.title -> name
      setSubjects(subs.map((s: any) => ({ ...s, id: s.id, name: s.title || s.name, category_id: s.categoryId ?? s.category_id })));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load lectures data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPreviewUrls = async () => {
      if (existingSlides.length === 0) {
        setSlidePreviewUrls({});
        return;
      }

      const entries = await Promise.all(
        existingSlides.map(async (slide) => {
          try {
            // Support Drive references stored as "drive:<id>"
            if (slide.storage_path?.startsWith('drive:')) {
              const fileId = slide.storage_path.split(':', 2)[1];
              const res = await apiFetch(`/external/drive/${encodeURIComponent(fileId)}/stream`);
              if (!res.ok) return [slide.id, ''] as const;
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              return [slide.id, objectUrl] as const;
            }

            const res = await apiFetch(`/storage/lecture-slides/signed-url?path=${encodeURIComponent(slide.storage_path)}`);
            const body = await res.json();

            if (!res.ok || !body?.success || !body?.data?.signedUrl) {
              return [slide.id, ''] as const;
            }

            return [slide.id, body.data.signedUrl as string] as const;
          } catch {
            return [slide.id, ''] as const;
          }
        }),
      );

      if (!cancelled) {
        setSlidePreviewUrls(Object.fromEntries(entries.filter(([, url]) => url)));
      }
    };

    loadPreviewUrls();

    return () => {
      cancelled = true;
    };
  }, [existingSlides]);

  const resetForm = () => {
    setFormData({ title: '', description: '', category_id: '', subject_id: '', is_published: false, is_free_preview: false });
    setEditingLecture(null);
  };

  const handleOpenDialog = (lecture?: Lecture) => {
    if (lecture) {
      setEditingLecture(lecture);
      setFormData({
        title: lecture.title,
        description: lecture.description || '',
        category_id: lecture.category_id,
        subject_id: lecture.subject_id || '',
        is_published: lecture.is_published,
        is_free_preview: lecture.is_free_preview,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.category_id) {
      toast.error('Title and category are required');
      return;
    }

    if (editingLecture) {
      try {
        const payload: any = {
          title: formData.title,
          description: formData.description || undefined,
          published: formData.is_published,
          // backend expects subjectId; pass through if provided
          subjectId: formData.subject_id || undefined,
          order: editingLecture?.sort_order ?? undefined,
        };
        const res = await apiFetch(`/lectures/${editingLecture.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) {
          toast.error('Failed to update lecture');
        } else {
          toast.success('Lecture updated');
          setDialogOpen(false);
          fetchData();
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to update lecture');
      }
    } else {
      // Get max sort_order for this subject
      try {
        // determine next order (use local max)
        const currentMax = lectures.reduce((acc, l) => Math.max(acc, l.sort_order || 0), 0);
        const nextOrder = currentMax + 1;
        const payload: any = {
          title: formData.title,
          description: formData.description || undefined,
          published: formData.is_published,
          subjectId: formData.subject_id || undefined,
          order: nextOrder,
        };
        const res = await apiFetch('/lectures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) {
          toast.error('Failed to create lecture');
        } else {
          toast.success('Lecture created');
          setDialogOpen(false);
          fetchData();
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to create lecture');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the lecture and all its slides.')) return;
    try {
      // fetch slides for lecture
      const slidesRes = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(id)}`);
      const slidesBody = await slidesRes.json();
      const slides = slidesBody?.data || [];

      if (slides.length > 0) {
        const paths = slides.map((s: any) => s.storagePath || s.storage_path);
        // remove from storage
        await apiFetch(`/storage/${encodeURIComponent('lecture-slides')}/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
        // delete slide records
        for (const s of slides) {
          await apiFetch(`/lecture-slides/${s.id}`, { method: 'DELETE' });
        }
      }

      // delete lecture
      const delRes = await apiFetch(`/lectures/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const delBody = await delRes.json();
      if (!delBody?.success) {
        toast.error('Failed to delete lecture');
      } else {
        toast.success('Lecture deleted');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete lecture');
    }
  };

  const togglePublish = async (lecture: Lecture) => {
    try {
      const res = await apiFetch(`/lectures/${encodeURIComponent(lecture.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !lecture.is_published }),
      });
      const body = await res.json();
      if (!body?.success) {
        toast.error('Failed to update lecture');
      } else {
        toast.success(lecture.is_published ? 'Lecture unpublished' : 'Lecture published');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update lecture');
    }
  };

  const handleOpenUploadDialog = async (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setPdfWarning(null);
    setPendingFiles(null);
    
    // Fetch existing slides
    try {
      const res = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(lectureId)}`);
      const body = await res.json();
      const slides = (body?.data || []).map((s: any) => ({ id: s.id, slide_number: s.slideNumber ?? s.slide_number, storage_path: s.storagePath ?? s.storage_path }));
      setExistingSlides(slides);
    } catch (e) {
      console.error(e);
      setExistingSlides([]);
    }
    setUploadDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedLectureId) return;

    // Check for large PDFs
    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        try {
          const info = await getPdfPageCount(file);
          if (info.isLimited) {
            setPdfWarning({
              show: true,
              totalPages: info.totalPages,
              willProcess: info.willProcess,
            });
            setPendingFiles(files);
            return;
          }
        } catch (error) {
          console.error('Failed to read PDF:', error);
        }
      }
    }

    // No large PDFs, proceed directly
    await processFileUpload(files);
    e.target.value = '';
  };

  const processFileUpload = async (files: FileList) => {
    if (!selectedLectureId) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: 0, stage: 'Preparing...' });
    setPdfWarning(null);
    
    const fileArray = Array.from(files);
    fileArray.sort((a, b) => a.name.localeCompare(b.name));

    let slideNumber = existingSlides.length;
    let totalSlides = 0;
    const imagesToUpload: { blob: Blob; name: string }[] = [];

    // Process files - convert PDFs to images
    for (const file of fileArray) {
      if (file.type === 'application/pdf') {
        setUploadProgress({ current: 0, total: 0, stage: `Converting PDF: ${file.name}` });
        
        try {
          const pages = await convertPdfToImages(file, (current, total) => {
            setUploadProgress({ current, total, stage: `Converting page ${current}/${total}` });
          });
          
          for (const page of pages) {
            imagesToUpload.push({ 
              blob: page.blob, 
              name: `${file.name.replace('.pdf', '')}_page${page.pageNumber}.png` 
            });
          }
          totalSlides += pages.length;
        } catch (error) {
          console.error('PDF conversion error:', error);
          toast.error(`Failed to convert PDF: ${file.name}`);
        }
      } else {
        imagesToUpload.push({ blob: file, name: file.name });
        totalSlides++;
      }
    }

    // Upload all images
    setUploadProgress({ current: 0, total: totalSlides, stage: 'Uploading slides...' });
    
    for (let i = 0; i < imagesToUpload.length; i++) {
      const { blob, name } = imagesToUpload[i];
      slideNumber++;
      setUploadProgress({ current: i + 1, total: totalSlides, stage: `Uploading ${i + 1}/${totalSlides}` });
      
      const filePath = `${selectedLectureId}/${slideNumber}.png`;

      // upload to backend storage
      try {
        const form = new FormData();
        // set original filename to include folder so server stores under that path
        form.append('file', blob as any, filePath);
        const upRes = await apiFetch(`/storage/${encodeURIComponent('lecture-slides')}/upload`, {
          method: 'POST',
          body: form as any,
        } as any);
        const upBody = await upRes.json();
        if (!upBody?.success) {
          toast.error(`Failed to upload ${name}`);
          continue;
        }

        const storagePath = upBody.data?.path || filePath;

        // insert slide record
        const dbRes = await apiFetch('/lecture-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lectureId: selectedLectureId, slideNumber: slideNumber, storagePath }),
        });
        const dbBody = await dbRes.json();
        if (!dbBody?.success) {
          toast.error(`Failed to save slide record for ${name}`);
        }
      } catch (e) {
        console.error(e);
        toast.error(`Failed to upload ${name}`);
      }
    }

    toast.success(`Uploaded ${totalSlides} slides`);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0, stage: '' });
    setPendingFiles(null);
    
    // Refresh slides list
    try {
      const res = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(selectedLectureId)}`);
      const body = await res.json();
      const slides = (body?.data || []).map((s: any) => ({ id: s.id, slide_number: s.slideNumber ?? s.slide_number, storage_path: s.storagePath ?? s.storage_path }));
      setExistingSlides(slides);
    } catch (e) {
      console.error(e);
      setExistingSlides([]);
    }
  };

  const handleAddDriveSlide = async () => {
    if (!selectedLectureId || !driveFileId) return;
    try {
      const slideNumber = existingSlides.length + 1;
      const res = await apiFetch('/lecture-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: selectedLectureId, slideNumber, storagePath: `drive:${driveFileId}` }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        toast.error('Failed to add Drive slide');
        return;
      }
      // refresh slides
      const listRes = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(selectedLectureId)}`);
      const listBody = await listRes.json();
      const slides = (listBody?.data || []).map((s: any) => ({ id: s.id, slide_number: s.slideNumber ?? s.slide_number, storage_path: s.storagePath ?? s.storage_path }));
      setExistingSlides(slides);
      setDriveFileId('');
      toast.success('Drive slide added');
    } catch (e) {
      console.error(e);
      toast.error('Failed to add Drive slide');
    }
  };

  const handleDeleteSlide = async (slide: LectureSlide) => {
    try {
      await apiFetch(`/storage/${encodeURIComponent('lecture-slides')}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [slide.storage_path] }),
      });
      await apiFetch(`/lecture-slides/${encodeURIComponent(slide.id)}`, { method: 'DELETE' });
      setExistingSlides((prev) => prev.filter((s) => s.id !== slide.id));
      toast.success('Slide deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete slide');
    }
  };

  // Get filtered lectures based on subject filter
  const filteredLectures = selectedSubjectFilter === 'all' 
    ? lectures 
    : selectedSubjectFilter === 'none'
      ? lectures.filter(l => !l.subject_id)
      : lectures.filter(l => l.subject_id === selectedSubjectFilter);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = filteredLectures.findIndex((l) => l.id === active.id);
    const newIndex = filteredLectures.findIndex((l) => l.id === over.id);

    const reorderedLectures = arrayMove(filteredLectures, oldIndex, newIndex);
    
    // Update local state immediately for smooth UX
    setLectures(prev => {
      const otherLectures = prev.filter(l => !filteredLectures.some(fl => fl.id === l.id));
      return [...otherLectures, ...reorderedLectures].sort((a, b) => a.sort_order - b.sort_order);
    });

    // Update sort_order in database
    const updates = reorderedLectures.map((lecture, index) => ({
      id: lecture.id,
      sort_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('lectures')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    toast.success('Lecture order updated');
    fetchData(); // Refresh to ensure consistency
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading lectures...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-foreground">Lectures</h2>
        <div className="flex items-center gap-3">
          <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lectures</SelectItem>
              <SelectItem value="none">No Subject</SelectItem>
              {subjects.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lecture
          </Button>
        </div>
      </div>

      {selectedSubjectFilter !== 'all' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Drag and drop to reorder lectures within this subject. Order determines how students see content.
            </p>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4">
            <p className="text-warning-foreground text-sm">
              Please create at least one category before adding lectures.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredLectures.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedSubjectFilter === 'all' 
                ? 'No lectures yet. Create your first one!' 
                : 'No lectures in this subject.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredLectures.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {filteredLectures.map((lecture) => (
                <SortableLectureCard
                  key={lecture.id}
                  lecture={lecture}
                  onEdit={() => handleOpenDialog(lecture)}
                  onDelete={() => handleDelete(lecture.id)}
                  onUpload={() => handleOpenUploadDialog(lecture.id)}
                  onTogglePublish={() => togglePublish(lecture)}
                  categories={categories}
                  subjects={subjects}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create/Edit Lecture Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLecture ? 'Edit Lecture' : 'New Lecture'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Chapter 1 - Lecture 1: Introduction"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (required for paid access)</Label>
              <Select
                value={formData.subject_id || "none"}
                onValueChange={(value) => {
                  const actualValue = value === "none" ? "" : value;
                  const selectedSubject = subjects.find(s => s.id === actualValue);
                  setFormData({ 
                    ...formData, 
                    subject_id: actualValue,
                    category_id: selectedSubject?.category_id || formData.category_id
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject (free lecture)</SelectItem>
                  {subjects.map((sub) => {
                    const cat = categories.find(c => c.id === sub.category_id);
                    return (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} {cat ? `(${cat.name})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Content uploaded to this lecture will be accessible under this subject after purchase
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.subject_id ? 'Auto-filled from subject' : 'Required for free lectures'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this lecture"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="published">Publish immediately</Label>
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={categories.length === 0}>
                {editingLecture ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Slides Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Slides</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* PDF Warning */}
            {pdfWarning?.show && (
              <Card className="border-warning bg-warning/10">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning-foreground shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-warning-foreground">
                        Large PDF Detected ({pdfWarning.totalPages} pages)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due to browser memory limits, only the first {pdfWarning.willProcess} pages will be processed. 
                        For large chapters, we recommend uploading lecture-wise (e.g., Ch-01 Lec-01, Lec-02, etc.)
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPdfWarning(null);
                            setPendingFiles(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (pendingFiles) {
                              processFileUpload(pendingFiles);
                            }
                          }}
                        >
                          Continue with {pdfWarning.willProcess} pages
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {uploading ? (
                <div className="space-y-3">
                  <File className="w-10 h-10 text-primary mx-auto animate-pulse" />
                  <p className="text-sm font-medium text-foreground">{uploadProgress.stage}</p>
                  {uploadProgress.total > 0 && (
                    <>
                      <Progress value={(uploadProgress.current / uploadProgress.total) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploadProgress.current} of {uploadProgress.total}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Upload PDFs or images for your lecture slides
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    PDFs will be converted to secure images (max {MAX_PDF_PAGES} pages per file)
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="slide-upload"
                  />
                  <label htmlFor="slide-upload">
                    <Button asChild disabled={uploading}>
                      <span>Select Files</span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            {/* Import from Google Drive */}
            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="Google Drive file ID (e.g. 1a2B3cD...)"
                value={driveFileId}
                onChange={(e) => setDriveFileId(e.target.value)}
                disabled={uploading}
              />
              <Button onClick={handleAddDriveSlide} disabled={uploading || !driveFileId}>Add from Drive</Button>
            </div>

            {existingSlides.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Slides ({existingSlides.length})</Label>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {existingSlides.map((slide) => {
                    const url = slidePreviewUrls[slide.id];
                    return (
                      <div
                        key={slide.id}
                        className="relative group aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center"
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={`Slide ${slide.slide_number}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).style.background = '#f3f4f6';
                              (e.target as HTMLImageElement).style.objectFit = 'contain';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Loading preview
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                            disabled={!url}
                          >
                            Open
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSlide(slide)}
                          >
                            Delete
                          </Button>
                        </div>

                        <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                          #{slide.slide_number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLectures;