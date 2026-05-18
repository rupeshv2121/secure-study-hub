export interface LecturePageItem {
  id: string;
  title: string;
  description?: string | null;
  category_id?: string;
  subject_id?: string | null;
  is_published?: boolean;
  is_free_preview?: boolean;
  view_count?: number;
  created_at?: string;
  sort_order?: number;
  categories?: { id: string; name: string };
  subjects?: { id: string; name: string };
}

export interface CategoryPageItem {
  id: string;
  name: string;
}

export interface SubjectPageItem {
  id: string;
  name: string;
}

export default {};
