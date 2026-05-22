export interface Purchase {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  amount_paid: number;
  purchased_at: string;
  screenshot_url?: string | null;
  admin_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  subjects?: {
    id: string;
    name: string;
    description?: string | null;
    categories?: {
      id: string;
      name: string;
      color?: string | null;
    } | null;
  } | null;
}

export interface LectureMini {
  id: string;
  title: string;
}

export default {};
