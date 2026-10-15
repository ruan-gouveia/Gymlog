import { create } from "zustand";

type TipoToast = "sucesso" | "erro";
type ToastState = {
  mensagem: string | null;
  tipo: TipoToast;
  mostrar: (mensagem: string, tipo?: TipoToast) => void;
  esconder: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  mensagem: null,
  tipo: "sucesso",
  mostrar: (mensagem, tipo = "sucesso") => set({ mensagem, tipo }),
  esconder: () => set({ mensagem: null }),
}));

export const showToast = (mensagem: string, tipo: TipoToast = "sucesso") =>
  useToastStore.getState().mostrar(mensagem, tipo);
