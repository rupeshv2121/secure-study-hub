export interface Purchase {
  id: string;
  user_id: string;
  subject_id: string;
  amount: number;
  created_at: string;
  subject?: {
    id: string;
    name: string;
  };
}

export interface LectureMini {
  id: string;
  title: string;
}

export default {};
