export interface SubjectPageItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  is_active?: boolean;
  category_id?: string;
  created_at?: string;
  lectureCount?: number;
}

export interface CategoryPageItem {
  id: string;
  name: string;
}

export default {};
