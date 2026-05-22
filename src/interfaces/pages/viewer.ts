export interface LectureViewerLecture {
  id: string;
  title: string;
  subjectId?: string | null;
  subject_id?: string | null;
  isFreePreview?: boolean;
  is_free_preview?: boolean;
  categories?: {
    id: string;
    name: string;
  } | null;
  subject?: {
    id: string;
    name?: string;
    category?: {
      id: string;
      name: string;
      color?: string | null;
    } | null;
  } | null;
}

export interface Slide {
  id: string;
  slide_number: number;
  storage_path: string;
}

export default {};
