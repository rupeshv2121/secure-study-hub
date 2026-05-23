export interface CategoryCardProps {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  subject_count?: number;
}

export interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export interface LectureCardProps {
  id: string;
  title: string;
  description: string | null;
  categoryName: string;
  categoryColor: string | null;
  viewCount: number;
  createdAt: string;
  isLocked?: boolean;
  isFreePreview?: boolean;
}

export interface SubjectCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryName: string;
  categoryColor: string | null;
  purchaseState: "available" | "pending" | "approved";
  lectureCount: number;
  onPurchase: (subjectId: string, price: number) => void;
  onView: (subjectId: string) => void;
}

export default {};
