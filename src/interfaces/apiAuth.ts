export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export default {};
