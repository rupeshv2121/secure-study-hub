import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, Upload, Eye, EyeOff, Image, File, GripVertical, AlertTriangle } from 'lucide-react';
import { convertPdfToImages, getPdfPageCount, MAX_PDF_PAGES } from '@/utils/pdfToImages';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  category_id: string;
}

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  subject_id: string | null;
  is_published: boolean;
  is_free_preview: boolean;
  view_count: number;
  created_at: string;
  sort_order: number;
  categories?: Category;
  subjects?: Subject;
}

interface LectureSlide {
  id: string;
  slide_number: number;
  storage_path: string;
}

// Sortable Lecture Card Component
const SortableLectureCard = ({ 
  lecture, 
  onEdit, 
  onDelete, 
  onUpload, 
  onTogglePublish 
}: { 
  lecture: Lecture;
  onEdit: () => void;
  onDelete: () => void;
  onUpload: () => void;
  onTogglePublish: () => void;
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
                {lecture.categories?.name} {lecture.subjects ? `• ${lecture.subjects.name}` : ''} • {lecture.view_count} views
                {lecture.is_free_preview && ' • Free Preview'}
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
    const [lecturesRes, categoriesRes, subjectsRes] = await Promise.all([
      supabase
        .from('lectures')
        .select('*, categories(id, name), subjects(id, name, category_id)')
        .order('sort_order', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name')
        .order('name'),
      supabase
        .from('subjects')
        .select('id, name, category_id')
        .eq('is_active', true)
        .order('name'),
    ]);

    if (lecturesRes.error) {
      toast.error('Failed to load lectures');
    } else {
      setLectures(lecturesRes.data || []);
    }

    if (!categoriesRes.error) {
      setCategories(categoriesRes.data || []);
    }

    if (!subjectsRes.error) {
      setSubjects(subjectsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      const { error } = await supabase
        .from('lectures')
        .update({
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id,
          subject_id: formData.subject_id || null,
          is_published: formData.is_published,
          is_free_preview: formData.is_free_preview,
        })
        .eq('id', editingLecture.id);

      if (error) {
        toast.error('Failed to update lecture');
      } else {
        toast.success('Lecture updated');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      // Get max sort_order for this subject
      const subjectId = formData.subject_id || null;
      const { data: maxOrderData } = await supabase
        .from('lectures')
        .select('sort_order')
        .eq('subject_id', subjectId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      const nextOrder = (maxOrderData?.[0]?.sort_order || 0) + 1;

      const { error } = await supabase
        .from('lectures')
        .insert({
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id,
          subject_id: subjectId,
          is_published: formData.is_published,
          is_free_preview: formData.is_free_preview,
          sort_order: nextOrder,
        });

      if (error) {
        toast.error('Failed to create lecture');
      } else {
        toast.success('Lecture created');
        setDialogOpen(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the lecture and all its slides.')) return;

    // First delete slides from storage
    const { data: slides } = await supabase
      .from('lecture_slides')
      .select('storage_path')
      .eq('lecture_id', id);

    if (slides && slides.length > 0) {
      const paths = slides.map((s) => s.storage_path);
      await supabase.storage.from('lecture-slides').remove(paths);
    }

    // Delete slide records
    await supabase.from('lecture_slides').delete().eq('lecture_id', id);

    // Delete lecture
    const { error } = await supabase.from('lectures').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete lecture');
    } else {
      toast.success('Lecture deleted');
      fetchData();
    }
  };

  const togglePublish = async (lecture: Lecture) => {
    const { error } = await supabase
      .from('lectures')
      .update({ is_published: !lecture.is_published })
      .eq('id', lecture.id);

    if (error) {
      toast.error('Failed to update lecture');
    } else {
      toast.success(lecture.is_published ? 'Lecture unpublished' : 'Lecture published');
      fetchData();
    }
  };

  const handleOpenUploadDialog = async (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setPdfWarning(null);
    setPendingFiles(null);
    
    // Fetch existing slides
    const { data } = await supabase
      .from('lecture_slides')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('slide_number');
    
    setExistingSlides(data || []);
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

      const { error: uploadError } = await supabase.storage
        .from('lecture-slides')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) {
        toast.error(`Failed to upload ${name}`);
        continue;
      }

      const { error: dbError } = await supabase
        .from('lecture_slides')
        .insert({
          lecture_id: selectedLectureId,
          slide_number: slideNumber,
          storage_path: filePath,
        });

      if (dbError) {
        toast.error(`Failed to save slide record for ${name}`);
      }
    }

    toast.success(`Uploaded ${totalSlides} slides`);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0, stage: '' });
    setPendingFiles(null);
    
    // Refresh slides list
    const { data } = await supabase
      .from('lecture_slides')
      .select('*')
      .eq('lecture_id', selectedLectureId)
      .order('slide_number');
    
    setExistingSlides(data || []);
  };

  const handleDeleteSlide = async (slide: LectureSlide) => {
    await supabase.storage.from('lecture-slides').remove([slide.storage_path]);
    await supabase.from('lecture_slides').delete().eq('id', slide.id);
    
    setExistingSlides((prev) => prev.filter((s) => s.id !== slide.id));
    toast.success('Slide deleted');
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
              <Label htmlFor="free-preview">Free Preview (Chapter 1)</Label>
              <Switch
                id="free-preview"
                checked={formData.is_free_preview}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free_preview: checked })}
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

            {existingSlides.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Slides ({existingSlides.length})</Label>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {existingSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className="relative group aspect-video bg-muted rounded-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteSlide(slide)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                        #{slide.slide_number}
                      </span>
                    </div>
                  ))}
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