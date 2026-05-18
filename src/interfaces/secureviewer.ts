export interface Slide {
  id: string;
  slide_number: number;
  storage_path: string;
}

export interface SecureViewerProps {
  lectureId: string;
  slides: Slide[];
}

export default {};
