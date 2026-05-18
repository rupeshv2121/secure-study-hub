import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import * as React from "react";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export type ActionType = typeof import("@/hooks/use-toast").reducer; // placeholder type

export type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: ToasterToast["id"] }
  | { type: "REMOVE_TOAST"; toastId?: ToasterToast["id"] };

export interface State {
  toasts: ToasterToast[];
}

export type Toast = Omit<ToasterToast, "id">;

export default {};
