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
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, IndianRupee } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  category_id: string;
  created_at: string;
  categories?: Category;
}

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_active: true,
  });

  const fetchData = async () => {
    const [subjectsRes, categoriesRes] = await Promise.all([
      supabase
        .from('subjects')
        .select('*, categories(id, name)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
    ]);

    if (subjectsRes.error) {
      toast.error('Failed to load subjects');
    } else {
      setSubjects(subjectsRes.data || []);
    }

    if (!categoriesRes.error) {
      setCategories(categoriesRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, category_id: '', is_active: true });
    setEditingSubject(null);
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        description: subject.description || '',
        price: subject.price,
        category_id: subject.category_id,
        is_active: subject.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id) {
      toast.error('Name and category are required');
      return;
    }

    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category_id: formData.category_id,
          is_active: formData.is_active,
        })
        .eq('id', editingSubject.id);

      if (error) {
        toast.error('Failed to update subject');
      } else {
        toast.success('Subject updated');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('subjects').insert({
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        category_id: formData.category_id,
        is_active: formData.is_active,
      });

      if (error) {
        toast.error('Failed to create subject');
      } else {
        toast.success('Subject created');
        setDialogOpen(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will affect all lectures under this subject.')) return;

    const { error } = await supabase.from('subjects').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete subject');
    } else {
      toast.success('Subject deleted');
      fetchData();
    }
  };

  const toggleActive = async (subject: Subject) => {
    const { error } = await supabase
      .from('subjects')
      .update({ is_active: !subject.is_active })
      .eq('id', subject.id);

    if (error) {
      toast.error('Failed to update subject');
    } else {
      toast.success(subject.is_active ? 'Subject deactivated' : 'Subject activated');
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Subjects</h2>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      {categories.length === 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4">
            <p className="text-warning-foreground text-sm">
              Please create at least one category before adding subjects.
            </p>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No subjects yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <Card key={subject.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg truncate">{subject.name}</CardTitle>
                      <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {subject.price}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subject.categories?.name || 'No category'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(subject)}
                      title={subject.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <BookOpen className={`w-4 h-4 ${subject.is_active ? 'text-primary' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(subject)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subject.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {subject.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Subject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'New Subject'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Operating Systems"
              />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 499"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this subject"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={categories.length === 0}>
                {editingSubject ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubjects;
