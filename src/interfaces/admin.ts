export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  is_active?: boolean;
  category_id?: string;
  created_at?: string;
  categories?: Category;
}

export interface Lecture {
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
  categories?: Category;
  subjects?: Subject;
}

export interface LectureSlide {
  id: string;
  slide_number: number;
  storage_path: string;
}

export interface AdminStats {
  totalUsers: number;
  totalLectures: number;
  totalCategories: number;
  totalViews: number;
  recentViews: {
    lecture_title: string;
    user_email: string;
    viewed_at: string;
  }[];
}

export default {};
